const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getStock } = require("../services/marketData");
const { getCompanyNews } = require("../services/news");
const { generateExplanation } = require("../services/explain");
const { recordDailyCheckIn, awardXpForTrade, checkTradeBadges, getUserStats } = require("../services/gamification");
const { getOrComputeRadarScore } = require("../services/radar");
const { getCompanyProfile } = require("../services/fundamentals");

const router = express.Router();

async function getSimulatedPortfolio(userId) {
  return prisma.portfolio.findFirst({
    where: { userId, tip: "simulat" },
    include: { holdings: true, transactions: { orderBy: { data: "desc" }, take: 200 } },
  });
}

router.get("/", requireAuth, async (req, res) => {
  await recordDailyCheckIn(req.userId);

  const portfolio = await getSimulatedPortfolio(req.userId);
  if (!portfolio) {
    return res.status(404).json({ error: "Portofoliu inexistent" });
  }

  const user = await getUserStats(req.userId);
  res.json({ portfolio, user });
});

router.get("/explain", requireAuth, async (req, res) => {
  const portfolio = await getSimulatedPortfolio(req.userId);

  if (!portfolio || portfolio.holdings.length === 0) {
    return res.json({
      explicatie:
        "Nu ai încă acțiuni cumpărate — cumpără una din piață ca să vezi aici o explicație despre mișcările ei zilnice.",
    });
  }

  const quotes = await Promise.all(portfolio.holdings.map((h) => getStock(h.simbol)));
  const cuMiscare = portfolio.holdings.map((h, i) => ({
    simbol: h.simbol,
    variatieProcent: quotes[i]?.variatieProcent ?? 0,
  }));

  const top = cuMiscare.reduce((a, b) => (Math.abs(b.variatieProcent) > Math.abs(a.variatieProcent) ? b : a));

  const news = await getCompanyNews(top.simbol);
  const explicatie = await generateExplanation({
    simbol: top.simbol,
    variatieProcent: top.variatieProcent,
    headlines: news,
  });

  res.json({ simbol: top.simbol, variatieProcent: top.variatieProcent, explicatie });
});

router.get("/health", requireAuth, async (req, res) => {
  const portfolio = await getSimulatedPortfolio(req.userId);

  if (!portfolio || portfolio.holdings.length === 0) {
    return res.json({
      health: null,
      mesaj: "Cumpără cel puțin o acțiune ca să vezi sănătatea portofoliului.",
    });
  }

  const holdingsData = await Promise.all(
    portfolio.holdings.map(async (h) => {
      const [stock, radar, profile] = await Promise.all([
        getStock(h.simbol),
        getOrComputeRadarScore(h.simbol),
        getCompanyProfile(h.simbol),
      ]);
      const valoare = h.cantitate * (stock?.pret || h.pretMediuAchizitie);
      return {
        simbol: h.simbol,
        valoare,
        scorCompozit: radar.scorCompozit,
        verdict: radar.verdict,
        industrie: profile?.finnhubIndustry || "Necunoscută",
      };
    })
  );

  const valoareTotala = holdingsData.reduce((s, h) => s + h.valoare, 0);
  const scorSanatate =
    valoareTotala > 0
      ? Math.round(holdingsData.reduce((s, h) => s + h.scorCompozit * (h.valoare / valoareTotala), 0))
      : 0;

  const avertismente = [];

  if (valoareTotala > 0) {
    const maxHolding = holdingsData.reduce((a, b) => (b.valoare > a.valoare ? b : a));
    if (maxHolding.valoare / valoareTotala > 0.4) {
      avertismente.push(
        `Concentrare ridicată: ${maxHolding.simbol} reprezintă ${Math.round((maxHolding.valoare / valoareTotala) * 100)}% din portofoliu.`
      );
    }

    const industrii = {};
    holdingsData.forEach((h) => {
      industrii[h.industrie] = (industrii[h.industrie] || 0) + h.valoare;
    });
    const [topIndustrie, valoareIndustrie] = Object.entries(industrii).sort((a, b) => b[1] - a[1])[0];
    if (topIndustrie !== "Necunoscută" && valoareIndustrie / valoareTotala > 0.6) {
      avertismente.push(
        `Expunere mare pe sectorul ${topIndustrie} (${Math.round((valoareIndustrie / valoareTotala) * 100)}% din portofoliu).`
      );
    }
  }

  res.json({ health: { scorSanatate, avertismente, holdings: holdingsData } });
});

router.post("/buy", requireAuth, async (req, res) => {
  const { simbol, cantitate } = req.body;

  if (!simbol || !cantitate || cantitate <= 0) {
    return res.status(400).json({ error: "Simbol și cantitate valide sunt obligatorii" });
  }

  const stock = await getStock(simbol);
  if (!stock) {
    return res.status(404).json({ error: "Simbol inexistent" });
  }

  const portfolio = await getSimulatedPortfolio(req.userId);
  const cost = stock.pret * cantitate;

  if (portfolio.cashBalance < cost) {
    return res.status(400).json({ error: "Fonduri insuficiente" });
  }

  const existing = portfolio.holdings.find((h) => h.simbol === stock.simbol);

  await prisma.$transaction(async (tx) => {
    if (existing) {
      const newCantitate = existing.cantitate + cantitate;
      const newPretMediu =
        (existing.cantitate * existing.pretMediuAchizitie + cantitate * stock.pret) /
        newCantitate;

      await tx.holding.update({
        where: { id: existing.id },
        data: { cantitate: newCantitate, pretMediuAchizitie: newPretMediu },
      });
    } else {
      await tx.holding.create({
        data: {
          portfolioId: portfolio.id,
          simbol: stock.simbol,
          cantitate,
          pretMediuAchizitie: stock.pret,
        },
      });
    }

    await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        simbol: stock.simbol,
        tip: "cumparare",
        cantitate,
        pret: stock.pret,
      },
    });

    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: portfolio.cashBalance - cost },
    });
  });

  const updated = await getSimulatedPortfolio(req.userId);
  await awardXpForTrade(req.userId);
  await checkTradeBadges(req.userId, updated);
  const user = await getUserStats(req.userId);
  res.json({ portfolio: updated, user });
});

router.post("/sell", requireAuth, async (req, res) => {
  const { simbol, cantitate } = req.body;

  if (!simbol || !cantitate || cantitate <= 0) {
    return res.status(400).json({ error: "Simbol și cantitate valide sunt obligatorii" });
  }

  const stock = await getStock(simbol);
  if (!stock) {
    return res.status(404).json({ error: "Simbol inexistent" });
  }

  const portfolio = await getSimulatedPortfolio(req.userId);
  const holding = portfolio.holdings.find((h) => h.simbol === stock.simbol);

  if (!holding || holding.cantitate < cantitate) {
    return res.status(400).json({ error: "Nu ai suficiente acțiuni pentru această vânzare" });
  }

  const proceeds = stock.pret * cantitate;
  const remaining = holding.cantitate - cantitate;

  await prisma.$transaction(async (tx) => {
    if (remaining === 0) {
      await tx.holding.delete({ where: { id: holding.id } });
    } else {
      await tx.holding.update({
        where: { id: holding.id },
        data: { cantitate: remaining },
      });
    }

    await tx.transaction.create({
      data: {
        portfolioId: portfolio.id,
        simbol: stock.simbol,
        tip: "vanzare",
        cantitate,
        pret: stock.pret,
      },
    });

    await tx.portfolio.update({
      where: { id: portfolio.id },
      data: { cashBalance: portfolio.cashBalance + proceeds },
    });
  });

  const updated = await getSimulatedPortfolio(req.userId);
  await awardXpForTrade(req.userId);
  await checkTradeBadges(req.userId, updated);
  const user = await getUserStats(req.userId);
  res.json({ portfolio: updated, user });
});

module.exports = router;

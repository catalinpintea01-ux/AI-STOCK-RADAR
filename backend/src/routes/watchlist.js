const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getStock } = require("../services/marketData");
const { getScoreChange } = require("../services/radar");
const { getMockStocks, getMockStock } = require("../mockData/stocks");
const { isPremium, PREMIUM_WATCHLIST_LIMIT } = require("../services/stripe");
const { getEarningsCalendar } = require("../services/fundamentals");
const { getDailyPicks, getOnboardingPicks } = require("../services/discovery");

const router = express.Router();

async function checkWatchlistLimit(userId, adaugate) {
  const subscription = await prisma.subscription.findUnique({ where: { userId } });
  if (isPremium(subscription)) return null;

  const curente = await prisma.watchlist.count({ where: { userId } });
  if (curente + adaugate > PREMIUM_WATCHLIST_LIMIT) {
    return `Planul gratuit permite maximum ${PREMIUM_WATCHLIST_LIMIT} acțiuni urmărite. Treci la Premium pentru nelimitat.`;
  }
  return null;
}

router.get("/", requireAuth, async (req, res) => {
  const items = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });

  const simboluri = items.map((i) => i.simbol);
  const scoruri = simboluri.length
    ? await prisma.radarScore.findMany({ where: { simbol: { in: simboluri } } })
    : [];
  const scorMap = new Map(scoruri.map((s) => [s.simbol, s]));

  // Doar citiri din istoricul deja calculat — nu declanșăm niciun calcul nou aici.
  const schimbari = await Promise.all(simboluri.map((s) => getScoreChange(s)));
  const schimbareMap = new Map(simboluri.map((s, i) => [s, schimbari[i]]));

  // Preț live per simbol — secvențial, ca să nu depășim rate-limit-ul Finnhub
  // dacă mai multe simboluri sunt reci (fără cache) în același moment.
  const quoteMap = new Map();
  for (const simbol of simboluri) {
    const stock = await getStock(simbol);
    if (stock) quoteMap.set(simbol, { pret: stock.pret, variatieProcent: stock.variatieProcent });
  }

  // Sparkline: un singur query grupat (nu unul per simbol) — istoricul zilnic
  // deja acumulat din cotațiile live cerute mai sus.
  const de = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const istoricRows = simboluri.length
    ? await prisma.priceHistory.findMany({
        where: { simbol: { in: simboluri }, ziua: { gte: de } },
        orderBy: { ziua: "asc" },
      })
    : [];
  const istoricMap = new Map();
  for (const row of istoricRows) {
    if (!istoricMap.has(row.simbol)) istoricMap.set(row.simbol, []);
    istoricMap.get(row.simbol).push(row.pret);
  }

  res.json({
    items: items.map((i) => ({
      simbol: i.simbol,
      radar: scorMap.get(i.simbol) || null,
      schimbare: schimbareMap.get(i.simbol) || null,
      pret: quoteMap.get(i.simbol)?.pret ?? null,
      variatieProcent: quoteMap.get(i.simbol)?.variatieProcent ?? null,
      istoricPret: istoricMap.get(i.simbol) || [],
      sector: getMockStock(i.simbol)?.sector || "Altele",
    })),
  });
});

// Doar raportările viitoare pentru simbolurile urmărite de acest utilizator —
// calendarul complet Finnhub e partajat/cache-uit global în fundamentals.js,
// aici doar îl filtrăm, nu facem alt apel extern.
router.get("/earnings", requireAuth, async (req, res) => {
  const items = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    select: { simbol: true },
  });
  const simboluri = new Set(items.map((i) => i.simbol));

  const calendar = await getEarningsCalendar();
  const urmatoarele = calendar
    .filter((e) => simboluri.has(e.symbol))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => ({
      simbol: e.symbol,
      data: e.date,
      moment: e.hour || null,
      epsEstimat: typeof e.epsEstimate === "number" ? e.epsEstimate : null,
    }));

  res.json({ earnings: urmatoarele });
});

// 10 acțiuni "merită urmărite azi", calculate o singură dată global (cache
// 30 min în discovery.js) și filtrate aici per utilizator — excludem ce
// urmărește deja, ca secțiunea să rămână despre descoperire, nu duplicare.
router.get("/daily-picks", requireAuth, async (req, res) => {
  const picks = await getDailyPicks();

  const existente = await prisma.watchlist.findMany({
    where: { userId: req.userId },
    select: { simbol: true },
  });
  const existenteSet = new Set(existente.map((i) => i.simbol));

  res.json({ picks: picks.filter((p) => !existenteSet.has(p.simbol)) });
});

// Onboarding: userul alege interese, Claude selectează N acțiuni din
// universul curat și le adaugă direct în watchlist (fără cotații live,
// analiza AI pornește separat din frontend, câte una, ca la orice adăugare).
router.post("/onboard", requireAuth, async (req, res) => {
  const interese = Array.isArray(req.body.interese) ? req.body.interese : [];

  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  const count = isPremium(subscription) ? 10 : PREMIUM_WATCHLIST_LIMIT;

  const picks = await getOnboardingPicks(interese, count);

  const adaugate = [];
  for (const p of picks) {
    await prisma.watchlist.upsert({
      where: { userId_simbol: { userId: req.userId, simbol: p.simbol } },
      update: {},
      create: { userId: req.userId, simbol: p.simbol },
    });
    adaugate.push(p);
  }

  res.status(201).json({ adaugate });
});

router.post("/", requireAuth, async (req, res) => {
  const { simbol } = req.body;
  if (!simbol) {
    return res.status(400).json({ error: "Simbol obligatoriu" });
  }

  const stock = await getStock(simbol);
  if (!stock) {
    return res.status(404).json({ error: "Simbol inexistent" });
  }

  const existent = await prisma.watchlist.findUnique({
    where: { userId_simbol: { userId: req.userId, simbol: stock.simbol } },
  });

  if (!existent) {
    const eroareLimita = await checkWatchlistLimit(req.userId, 1);
    if (eroareLimita) {
      return res.status(402).json({ error: eroareLimita, limitaAtinsa: true });
    }
  }

  await prisma.watchlist.upsert({
    where: { userId_simbol: { userId: req.userId, simbol: stock.simbol } },
    update: {},
    create: { userId: req.userId, simbol: stock.simbol },
  });

  res.status(201).json({ ok: true });
});

// Adaugă dintr-o dată toate cele 50 de acțiuni populare (aceeași listă
// curată folosită și pe Piață în Portofoliu) — alternativă la adăugarea
// manuală, una câte una. Nu cere cotații live (doar simbolurile), deci e
// o operație rapidă și ieftină, indiferent de rate-limit-ul Finnhub.
router.post("/bulk-top50", requireAuth, async (req, res) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (!isPremium(subscription)) {
    return res.status(402).json({
      error: "Adăugarea automată a top 50 de acțiuni este disponibilă doar cu abonamentul Premium.",
      limitaAtinsa: true,
    });
  }

  const simboluri = getMockStocks().map((s) => s.simbol);

  for (const simbol of simboluri) {
    await prisma.watchlist.upsert({
      where: { userId_simbol: { userId: req.userId, simbol } },
      update: {},
      create: { userId: req.userId, simbol },
    });
  }

  res.status(201).json({ adaugate: simboluri.length });
});

router.delete("/:simbol", requireAuth, async (req, res) => {
  await prisma.watchlist.deleteMany({
    where: { userId: req.userId, simbol: req.params.simbol.toUpperCase() },
  });
  res.json({ ok: true });
});

module.exports = router;

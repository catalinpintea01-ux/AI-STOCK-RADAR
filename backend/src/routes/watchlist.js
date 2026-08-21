const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getStock, getStockList, getTickerTape } = require("../services/marketData");
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
  const laForma = (e) => ({
    simbol: e.symbol,
    data: e.date,
    moment: e.hour || null,
    epsEstimat: typeof e.epsEstimate === "number" ? e.epsEstimate : null,
  });
  const dupaData = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

  const urmatoarele = calendar.filter((e) => simboluri.has(e.symbol)).sort(dupaData).map(laForma);

  // Când lista userului nu are nicio raportare apropiată (sau e goală),
  // propunem raportările iminente din universul curat — un motiv concret
  // să adauge ceva în watchlist, în loc de un panou pur și simplu gol.
  let recomandate = [];
  if (urmatoarele.length === 0) {
    const univers = new Set(getMockStocks().map((s) => s.simbol));
    recomandate = calendar
      .filter((e) => univers.has(e.symbol) && !simboluri.has(e.symbol))
      .sort(dupaData)
      .slice(0, 5)
      .map(laForma);
  }

  res.json({ earnings: urmatoarele, recomandate });
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

  const ramase = picks.filter((p) => !existenteSet.has(p.simbol));

  // Graficul din frontend are două grupuri (creșteri | scăderi). Pe o zi în
  // care piața e într-o singură direcție, "cele mai mari mișcări" cad toate
  // pe aceeași parte — așa că garantăm minim 3 pe fiecare parte (dacă există
  // în univers), din cotațiile deja cache-uite, fără apeluri externe noi.
  const MIN_PE_PARTE = 3;
  const univers = await getStockList();
  const laForma = (s) => ({
    simbol: s.simbol,
    nume: s.nume,
    pret: s.pret,
    variatieProcent: s.variatieProcent,
    motiv:
      s.variatieProcent >= 0
        ? "Printre cele mai mari creșteri de preț de azi."
        : "Printre cele mai mari scăderi de preț de azi.",
  });

  for (const semn of [1, -1]) {
    const peParte = ramase.filter((p) => (semn > 0 ? p.variatieProcent >= 0 : p.variatieProcent < 0));
    if (peParte.length >= MIN_PE_PARTE) continue;

    const dejaAfisate = new Set(ramase.map((p) => p.simbol));
    const completare = univers
      .filter(
        (s) =>
          !existenteSet.has(s.simbol) &&
          !dejaAfisate.has(s.simbol) &&
          (semn > 0 ? s.variatieProcent > 0 : s.variatieProcent < 0)
      )
      .sort((a, b) => Math.abs(b.variatieProcent) - Math.abs(a.variatieProcent))
      .slice(0, MIN_PE_PARTE - peParte.length)
      .map(laForma);
    ramase.push(...completare);
  }

  // Empty state fără fundătură: dacă nu rămâne nimic de recomandat, oferim
  // măcar cel mai mare mover al zilei din banda ticker (cotații deja
  // cache-uite acolo — zero apeluri Finnhub suplimentare).
  let mover = null;
  if (ramase.length === 0) {
    const ticker = await getTickerTape();
    const actiuni = ticker.filter(
      (t) => !["SPY", "DIA", "QQQ"].includes(t.simbol) && !existenteSet.has(t.simbol)
    );
    if (actiuni.length > 0) {
      mover = actiuni.reduce((max, t) =>
        Math.abs(t.variatieProcent) > Math.abs(max.variatieProcent) ? t : max
      );
    }
  }

  res.json({ picks: ramase, mover });
});

// Onboarding: userul alege interese, Claude selectează N acțiuni din
// universul curat și le adaugă direct în watchlist (fără cotații live,
// analiza AI pornește separat din frontend, câte una, ca la orice adăugare).
router.post("/onboard", requireAuth, async (req, res) => {
  const interese = Array.isArray(req.body.interese) ? req.body.interese : [];

  // Respectă aceeași limită free-tier ca POST /: pentru un cont gratuit cu
  // acțiuni deja adăugate, onboarding-ul completează doar locurile rămase —
  // altfel ar ocoli plafonul pe care adăugarea manuală îl impune corect.
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  let count;
  if (isPremium(subscription)) {
    count = 10;
  } else {
    const curente = await prisma.watchlist.count({ where: { userId: req.userId } });
    count = PREMIUM_WATCHLIST_LIMIT - curente;
    if (count <= 0) {
      return res.status(402).json({
        error: `Planul gratuit permite maximum ${PREMIUM_WATCHLIST_LIMIT} acțiuni urmărite. Treci la Premium pentru nelimitat.`,
        limitaAtinsa: true,
      });
    }
  }

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

// Ruta "bulk-top50" a fost eliminată intenționat: un watchlist de 50+
// acțiuni nu mai e personal și îneacă utilizatorul în alerte — produsul
// împinge spre liste mici, alese manual sau prin onboarding-ul pe interese.

router.delete("/:simbol", requireAuth, async (req, res) => {
  await prisma.watchlist.deleteMany({
    where: { userId: req.userId, simbol: req.params.simbol.toUpperCase() },
  });
  res.json({ ok: true });
});

module.exports = router;

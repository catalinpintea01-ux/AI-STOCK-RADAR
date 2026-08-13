const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { getStock } = require("../services/marketData");
const { getScoreChange } = require("../services/radar");
const { getMockStocks } = require("../mockData/stocks");

const router = express.Router();

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

  res.json({
    items: items.map((i) => ({
      simbol: i.simbol,
      radar: scorMap.get(i.simbol) || null,
      schimbare: schimbareMap.get(i.simbol) || null,
      pret: quoteMap.get(i.simbol)?.pret ?? null,
      variatieProcent: quoteMap.get(i.simbol)?.variatieProcent ?? null,
    })),
  });
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

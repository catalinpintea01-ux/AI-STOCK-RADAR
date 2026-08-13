const express = require("express");
const { getStock, getStockList, getTickerTape, searchStocks } = require("../services/marketData");
const { getCompanyProfile, getInsiderTransactions } = require("../services/fundamentals");
const { getOrComputeRadarScore, getScoreChange } = require("../services/radar");
const { getCompanyNews } = require("../services/news");

const router = express.Router();

router.get("/search", async (req, res) => {
  const results = await searchStocks(req.query.q || "");
  res.json({ results });
});

router.get("/", async (req, res) => {
  const stocks = await getStockList();
  res.json({ stocks });
});

router.get("/ticker", async (req, res) => {
  const ticker = await getTickerTape();
  res.json({ ticker });
});

router.get("/:simbol", async (req, res) => {
  const stock = await getStock(req.params.simbol);
  if (!stock) {
    return res.status(404).json({ error: "Simbol indisponibil" });
  }
  res.json({ stock });
});

router.get("/:simbol/profile", async (req, res) => {
  const profile = await getCompanyProfile(req.params.simbol.toUpperCase());
  res.json({ profile });
});

router.get("/:simbol/news", async (req, res) => {
  const news = await getCompanyNews(req.params.simbol.toUpperCase());
  res.json({ news });
});

// Datele fundamentale (analiști, earnings, metrici) sunt deja culese pentru
// scor și salvate în sursaDate — le expunem aici ca să nu mai cerem încă o
// dată de la Finnhub doar ca să le afișăm. Doar tranzacțiile insiderilor se
// mai cer o dată (fresh, cache 1h) — nu le păstrăm integral în DB.
async function buildDetalii(simbol, sursaDateJson) {
  const sursa = JSON.parse(sursaDateJson);
  const m = sursa.metric || {};

  const insiderTx = await getInsiderTransactions(simbol);
  const tranzactiiRecente = insiderTx
    .filter((t) => ["P", "S"].includes(t.transactionCode))
    .slice(0, 8)
    .map((t) => ({
      nume: t.name,
      tip: t.transactionCode === "P" ? "cumparare" : "vanzare",
      actiuni: Math.abs(t.change || 0),
      pret: t.transactionPrice,
      data: t.transactionDate,
    }));

  return {
    metrici: {
      pe: m.peTTM ?? null,
      capitalizarePiata: m.marketCapitalization ?? null,
      beta: m.beta ?? null,
      randamentDividend: m.currentDividendYieldTTM ?? null,
      eps: m.epsTTM ?? null,
      high52Sapt: m["52WeekHigh"] ?? null,
      low52Sapt: m["52WeekLow"] ?? null,
      cresterVenituri: m.revenueGrowthTTMYoy ?? null,
      marjaProfit: m.netProfitMarginTTM ?? null,
    },
    analisti: sursa.recommendation,
    earnings: sursa.earningsRecent || [],
    tranzactiiInsideri: tranzactiiRecente,
  };
}

router.get("/:simbol/radar", async (req, res) => {
  const radar = await getOrComputeRadarScore(req.params.simbol);
  const schimbare = await getScoreChange(req.params.simbol);
  const detalii = await buildDetalii(req.params.simbol, radar.sursaDate);
  res.json({
    radar: {
      ...radar,
      riscuri: JSON.parse(radar.riscuri),
      invalidare: JSON.parse(radar.invalidare),
    },
    schimbare,
    detalii,
  });
});

module.exports = router;

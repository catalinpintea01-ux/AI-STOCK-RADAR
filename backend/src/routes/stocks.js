const express = require("express");
const { getStock, getStockList, getTickerTape, searchStocks } = require("../services/marketData");
const { getCompanyProfile, getInsiderTransactions } = require("../services/fundamentals");
const { getOrComputeRadarScore, getScoreChange } = require("../services/radar");
const { getCompanyNews } = require("../services/news");
const { getAnalyzedMarketNews, getMarketNewsById } = require("../services/marketNewsAnalysis");
const { localizeazaRadar } = require("../services/i18nContent");
const { requireAuth } = require("../middleware/auth");
const prisma = require("../db");
const { isPremium } = require("../services/stripe");
const { getDailyHistory } = require("../services/history");
const { getEarningsCalendar } = require("../services/fundamentals");

const router = express.Router();

const FREE_NEWS_LIMIT = 3; // planul gratuit vede primele 3 (cele mai relevante); Premium — toate 7

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

router.get("/market-news", requireAuth, async (req, res) => {
  const news = await getAnalyzedMarketNews(req.limba);

  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (isPremium(subscription)) {
    return res.json({ news, total: news.length });
  }
  // total > lungimea listei îi spune frontend-ului câte știri există în plus
  // pentru Premium — diferența e vizibilă, nu ascunsă.
  res.json({ news: news.slice(0, FREE_NEWS_LIMIT), total: news.length });
});

router.get("/market-news/:id", async (req, res) => {
  const item = await getMarketNewsById(req.params.id, req.limba);
  if (!item) {
    return res.status(404).json({ error: "Știrea nu mai este disponibilă" });
  }
  res.json({ news: item });
});

// Indicele VIX ("indicele fricii") — volatilitatea implicită la 30 de zile a
// S&P 500, de la Yahoo (^VIX; Finnhub free nu servește indici). Cache 15 min.
let vixCache = { data: null, expiresAt: 0 };

router.get("/vix", requireAuth, async (req, res) => {
  if (vixCache.data && vixCache.expiresAt > Date.now()) return res.json(vixCache.data);

  try {
    const r = await fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?range=5d&interval=1d", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!r.ok) throw new Error(`Yahoo VIX status ${r.status}`);
    const json = await r.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const valoare = meta?.regularMarketPrice;
    const anterior = meta?.chartPreviousClose;
    if (typeof valoare !== "number") throw new Error("VIX fără valoare");

    const data = {
      valoare,
      variatie: typeof anterior === "number" && anterior > 0 ? ((valoare - anterior) / anterior) * 100 : null,
    };
    vixCache = { data, expiresAt: Date.now() + 15 * 60 * 1000 };
    res.json(data);
  } catch (err) {
    console.error(`[stocks] VIX indisponibil: ${err.message}`);
    res.status(503).json({ error: "VIX indisponibil momentan" });
  }
});

// Agregatul unei teme de investiții: cotații + scoruri AI din cache + indice
// tematic normalizat (media coșului, bază 100) + raportările viitoare.
// IMPORTANT: definit înainte de /:simbol, altfel "tema" ar fi tratat ca simbol.
router.get("/tema", requireAuth, async (req, res) => {
  const simboluri = String(req.query.simboluri || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 10);
  if (simboluri.length === 0) return res.status(400).json({ error: "Lipsesc simbolurile temei" });

  // Cotații — secvențial, pe cache-ul existent, ca să nu lovim rate-limitul.
  const companii = [];
  for (const simbol of simboluri) {
    const stock = await getStock(simbol);
    if (stock) companii.push(stock);
  }

  const scoruri = await prisma.radarScore.findMany({ where: { simbol: { in: simboluri } } });
  const scorMap = new Map(scoruri.map((s) => [s.simbol, { scorCompozit: s.scorCompozit, verdict: s.verdict }]));
  for (const c of companii) c.radar = scorMap.get(c.simbol) || null;

  // Indicele tematic: fiecare serie normalizată la 100 în prima zi, apoi media
  // pe zilele comune — o singură linie care arată "cum a mers tema" pe 30 zile.
  const deLa = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const serii = [];
  for (const simbol of simboluri) {
    try {
      const istoric = (await getDailyHistory(simbol)).filter((p) => p.t >= deLa);
      if (istoric.length >= 2) {
        const baza = istoric[0].pret;
        serii.push(new Map(istoric.map((p) => [p.t, (p.pret / baza) * 100])));
      }
    } catch {
      // simbol fără istoric — nu blocăm indicele
    }
  }
  let indice = [];
  if (serii.length > 0) {
    const zile = [...serii[0].keys()];
    indice = zile
      .map((t) => {
        const valori = serii.map((m) => m.get(t)).filter((v) => v !== undefined);
        return valori.length ? { t, pret: valori.reduce((a, b) => a + b, 0) / valori.length } : null;
      })
      .filter(Boolean);
  }

  const calendar = await getEarningsCalendar();
  const setSimboluri = new Set(simboluri);
  const raportari = calendar
    .filter((e) => setSimboluri.has(e.symbol))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 5)
    .map((e) => ({ simbol: e.symbol, data: e.date, moment: e.hour || null }));

  res.json({ companii, indice, raportari });
});

// Serie zilnică pentru graficul de preț: ?zile=7|30|180|365 (implicit 30).
router.get("/:simbol/history", async (req, res) => {
  const zile = Math.min(365, Math.max(5, Number(req.query.zile) || 30));
  const tot = await getDailyHistory(req.params.simbol);
  const deLa = new Date(Date.now() - zile * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  res.json({ istoric: tot.filter((p) => p.t >= deLa) });
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
  const news = await getCompanyNews(req.params.simbol.toUpperCase(), req.limba);
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
      // Sănătatea dividendului: cât din profit se duce pe dividend + ritmul
      // de creștere pe 5 ani — fapte publice, evaluate determinist în UI.
      payoutRatio: m.payoutRatioTTM ?? m.payoutRatioAnnual ?? null,
      divCrestere5a: m.dividendGrowthRate5Y ?? null,
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
  // Narativa (rezumat/riscuri/invalidare) în limba interfeței — scorurile și
  // verdictul rămân identice indiferent de limbă (sunt calcule, nu texte).
  const localizat = await localizeazaRadar(radar, req.limba);
  res.json({
    radar: {
      ...localizat,
      riscuri: JSON.parse(localizat.riscuri),
      invalidare: JSON.parse(localizat.invalidare),
    },
    schimbare,
    detalii,
  });
});

module.exports = router;

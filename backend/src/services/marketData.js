const { getMockStocks, getMockStock } = require("../mockData/stocks");

const FINNHUB_BASE = "https://finnhub.io/api/v1";
const QUOTE_CACHE_TTL_MS = 30_000;
const quoteCache = new Map(); // simbol -> { data, expiresAt }
const nameCache = new Map(); // simbol -> nume (nu expiră, numele companiei nu se schimbă)

function isConfigured() {
  return Boolean(process.env.FINNHUB_API_KEY);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isFreshlyCached(simbol) {
  const cached = quoteCache.get(simbol);
  return Boolean(cached && cached.expiresAt > Date.now());
}

async function fetchLiveQuote(simbol) {
  const url = `${FINNHUB_BASE}/quote?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Finnhub a răspuns cu status ${res.status} pentru ${simbol}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Răspuns neașteptat (non-JSON) de la Finnhub pentru ${simbol}`);
  }

  const data = await res.json();
  if (!data || typeof data.c !== "number" || data.c === 0) {
    throw new Error(`Preț indisponibil pentru ${simbol}`);
  }

  return { pret: data.c, variatieProcent: data.dp ?? 0 };
}

async function getCachedLiveQuote(simbol) {
  const cached = quoteCache.get(simbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const quote = await fetchLiveQuote(simbol);
  quoteCache.set(simbol, { data: quote, expiresAt: Date.now() + QUOTE_CACHE_TTL_MS });
  return quote;
}

async function getCompanyName(simbol) {
  const mock = getMockStock(simbol);
  if (mock) return mock.nume;

  if (nameCache.has(simbol)) return nameCache.get(simbol);
  if (!isConfigured()) return simbol;

  try {
    const url = `${FINNHUB_BASE}/stock/profile2?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const nume = data && data.name ? data.name : simbol;
    nameCache.set(simbol, nume);
    return nume;
  } catch {
    return simbol;
  }
}

// Returnează un preț live de la Finnhub pentru orice simbol valid, cu fallback
// pe datele mock (doar pentru cele 50 de acțiuni din lista curată).
async function getStock(simbol) {
  const upper = simbol.toUpperCase();
  const mock = getMockStock(upper);

  if (!isConfigured()) {
    return mock ? { ...mock, sursa: "mock" } : null;
  }

  try {
    const quote = await getCachedLiveQuote(upper);
    const nume = await getCompanyName(upper);
    return { simbol: upper, nume, pret: quote.pret, variatieProcent: quote.variatieProcent, sursa: "finnhub" };
  } catch (err) {
    console.error(`[marketData] fallback pentru ${upper}: ${err.message}`);
    return mock ? { ...mock, sursa: "mock" } : null;
  }
}

// Cererile se fac secvențial (nu în paralel) ca să nu depășim limita de
// rate a planului gratuit Finnhub. Pauza se aplică doar când chiar facem
// o cerere reală de rețea — rezultatele deja în cache nu o declanșează.
async function getStockList() {
  const symbols = getMockStocks().map((s) => s.simbol);
  const results = [];

  for (const simbol of symbols) {
    const willFetch = isConfigured() && !isFreshlyCached(simbol);
    results.push(await getStock(simbol));
    if (willFetch) await sleep(120);
  }

  return results;
}

// Indici majori (via ETF-uri care îi urmăresc — Finnhub nu oferă gratuit
// simboluri de index brute precum ^GSPC) + câteva acțiuni foarte cunoscute,
// pentru banda derulantă de tip Bloomberg de sub titlul AI Stock Radar.
const TICKER_TAPE_SYMBOLS = [
  { simbol: "SPY", nume: "S&P 500" },
  { simbol: "DIA", nume: "Dow Jones" },
  { simbol: "QQQ", nume: "Nasdaq 100" },
  { simbol: "AAPL", nume: "Apple" },
  { simbol: "MSFT", nume: "Microsoft" },
  { simbol: "GOOGL", nume: "Alphabet" },
  { simbol: "AMZN", nume: "Amazon" },
  { simbol: "TSLA", nume: "Tesla" },
  { simbol: "NVDA", nume: "Nvidia" },
  { simbol: "META", nume: "Meta" },
];

async function getTickerTape() {
  if (!isConfigured()) return [];

  const results = [];
  for (const { simbol, nume } of TICKER_TAPE_SYMBOLS) {
    const willFetch = !isFreshlyCached(simbol);
    try {
      const quote = await getCachedLiveQuote(simbol);
      results.push({ simbol, nume, pret: quote.pret, variatieProcent: quote.variatieProcent });
    } catch (err) {
      console.error(`[marketData] ticker tape omite ${simbol}: ${err.message}`);
    }
    if (willFetch) await sleep(120);
  }
  return results;
}

async function searchStocks(query) {
  if (!isConfigured() || !query || query.trim().length === 0) {
    return [];
  }

  try {
    const url = `${FINNHUB_BASE}/search?q=${encodeURIComponent(query)}&token=${process.env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.result || [])
      .filter((r) => r.type === "Common Stock" && !r.symbol.includes(".") && !r.symbol.includes(":"))
      .slice(0, 10)
      .map((r) => ({ simbol: r.symbol, nume: r.description }));
  } catch {
    return [];
  }
}

module.exports = { getStock, getStockList, getTickerTape, searchStocks, isConfigured };

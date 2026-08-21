// Istoric zilnic de preț pentru graficul de pe pagina acțiunii — de la Yahoo
// Finance (endpoint public de chart, fără cheie; Finnhub free nu oferă candle).
// Un singur fetch pe simbol (1 an, zilnic), cache 6h, feliere pe intervale în
// rută. Fallback silențios la snapshot-urile proprii din PriceHistory.
const prisma = require("../db");

const cache = new Map(); // simbol -> { istoric, expiresAt }
const TTL_MS = 6 * 60 * 60 * 1000;

async function fetchYahooDaily(simbol) {
  const yahooSymbol = simbol.toUpperCase().replace(".", "-");
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=1y&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
  });
  if (!res.ok) throw new Error(`Yahoo chart a răspuns cu status ${res.status}`);

  const data = await res.json();
  const rezultat = data?.chart?.result?.[0];
  const timestamps = rezultat?.timestamp || [];
  const inchideri = rezultat?.indicators?.quote?.[0]?.close || [];

  const istoric = [];
  for (let i = 0; i < timestamps.length; i++) {
    const pret = inchideri[i];
    if (typeof pret !== "number") continue; // zile fără tranzacționare / goluri
    istoric.push({ t: new Date(timestamps[i] * 1000).toISOString().slice(0, 10), pret });
  }
  if (istoric.length === 0) throw new Error("Yahoo a întors o serie goală");
  return istoric;
}

async function fallbackDinSnapshots(simbol) {
  const rows = await prisma.priceHistory.findMany({
    where: { simbol: simbol.toUpperCase() },
    orderBy: { ziua: "asc" },
  });
  return rows.map((r) => ({ t: r.ziua.toISOString().slice(0, 10), pret: r.pret }));
}

async function getDailyHistory(simbol) {
  const key = simbol.toUpperCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.istoric;

  let istoric;
  try {
    istoric = await fetchYahooDaily(key);
  } catch (err) {
    console.error(`[history] fallback la snapshots pentru ${key}: ${err.message}`);
    istoric = await fallbackDinSnapshots(key);
  }

  cache.set(key, { istoric, expiresAt: Date.now() + TTL_MS });
  return istoric;
}

module.exports = { getDailyHistory };

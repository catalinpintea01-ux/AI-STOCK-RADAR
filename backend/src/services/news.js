const NEWS_CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map(); // simbol -> { data, expiresAt }

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const TRANSLATE_MODEL = "claude-haiku-4-5-20251001";

function isConfigured() {
  return Boolean(process.env.FINNHUB_API_KEY);
}

function isTranslateConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

// Traduce titlurile + rezumatele într-un singur apel Claude (nu unul per știre,
// ca să nu multiplicăm costul). Fără cheie Claude, rămân în engleză (funcțional,
// doar netradus) — consistent cu restul aplicației.
async function translateNews(items) {
  if (!isTranslateConfigured() || items.length === 0) return items;

  const deTradus = items.map((n) => ({ headline: n.headline, rezumat: n.rezumat }));
  const prompt = `Traduce în limba română următoarele titluri și rezumate de știri financiare. Păstrează sensul exact și tonul jurnalistic. Nu traduce numele companiilor, simbolurile bursiere (ex: NVDA, AAPL) sau denumirile proprii.

Răspunde STRICT cu un array JSON de aceeași lungime și în aceeași ordine, fără text în afara lui, format:
[{"headline": "...", "rezumat": "..."}, ...]

Știri de tradus:
${JSON.stringify(deTradus)}`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: TRANSLATE_MODEL,
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Răspunsul Claude nu conține un array JSON");

    const traduse = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(traduse) || traduse.length !== items.length) {
      throw new Error("Traducere incompletă sau cu lungime greșită");
    }

    return items.map((n, i) => ({
      ...n,
      headline: traduse[i]?.headline || n.headline,
      rezumat: traduse[i]?.rezumat || n.rezumat,
    }));
  } catch (err) {
    console.error(`[news] traducere eșuată, rămân în engleză: ${err.message}`);
    return items;
  }
}

const MARKET_NEWS_RAW_CACHE_TTL_MS = 10 * 60 * 1000;
let marketNewsRawCache = null; // { data, expiresAt }

// Top 3 știri generale de piață, brute (engleză) — punctul de plecare pentru
// analiza AI proprie din marketNewsAnalysis.js. Nu traducem aici — traducerea
// e parte din analiza AI, ca să nu facem două apeluri Claude separate.
async function getMarketNewsRaw() {
  if (!isConfigured()) return [];

  if (marketNewsRawCache && marketNewsRawCache.expiresAt > Date.now()) {
    return marketNewsRawCache.data;
  }

  const url = `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const news = (Array.isArray(data) ? data : [])
      .filter((n) => n.headline && n.url)
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 3)
      .map((n) => ({
        headline: n.headline,
        rezumat: n.summary || "",
        url: n.url,
        sursa: n.source,
        data: new Date(n.datetime * 1000).toISOString(),
      }));

    marketNewsRawCache = { data: news, expiresAt: Date.now() + MARKET_NEWS_RAW_CACHE_TTL_MS };
    return news;
  } catch (err) {
    console.error(`[news] fallback pentru piață generală: ${err.message}`);
    return [];
  }
}

// Finnhub oferă gratuit știri per companie (matching pe simbol e deja făcut de API).
async function getCompanyNews(simbol) {
  if (!isConfigured()) return [];

  const cached = cache.get(simbol);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const to = new Date();
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  const url = `https://finnhub.io/api/v1/company-news?symbol=${simbol}&from=${formatDate(from)}&to=${formatDate(to)}&token=${process.env.FINNHUB_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const news = (Array.isArray(data) ? data : [])
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 10)
      .map((n) => ({
        headline: n.headline,
        rezumat: n.summary || "",
        url: n.url,
        sursa: n.source,
        data: new Date(n.datetime * 1000).toISOString(),
      }));

    const traduse = await translateNews(news);

    cache.set(simbol, { data: traduse, expiresAt: Date.now() + NEWS_CACHE_TTL_MS });
    return traduse;
  } catch (err) {
    console.error(`[news] fallback pentru ${simbol}: ${err.message}`);
    return [];
  }
}

module.exports = { getCompanyNews, getMarketNewsRaw };

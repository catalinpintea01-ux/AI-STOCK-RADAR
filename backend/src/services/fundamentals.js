const FINNHUB_BASE = "https://finnhub.io/api/v1";

const PROFILE_TTL_MS = 24 * 60 * 60 * 1000; // profilul companiei se schimbă rar
const DATA_TTL_MS = 60 * 60 * 1000; // 1 oră — suficient pentru date fundamentale

const EARNINGS_CALENDAR_TTL_MS = 12 * 60 * 60 * 1000; // se schimbă rar în cursul unei zile

const profileCache = new Map();
const recommendationCache = new Map();
const insiderCache = new Map();
const earningsCache = new Map();
const metricCache = new Map();
let earningsCalendarCache = null; // { data, expiresAt } — un singur cache global, nu per simbol

function isConfigured() {
  return Boolean(process.env.FINNHUB_API_KEY);
}

function fromCache(cache, key) {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.data;
  return undefined;
}

function toCache(cache, key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`status ${res.status}`);
  return res.json();
}

// Toate funcțiile de mai jos returnează un fallback gol (nu aruncă) la orice
// eroare — datele fundamentale sunt un plus, nu trebuie să blocheze scorul.

async function getCompanyProfile(simbol) {
  const cached = fromCache(profileCache, simbol);
  if (cached !== undefined) return cached;
  if (!isConfigured()) return null;

  try {
    const data = await fetchJson(`${FINNHUB_BASE}/stock/profile2?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`);
    const profile = data && data.name ? data : null;
    toCache(profileCache, simbol, profile, PROFILE_TTL_MS);
    return profile;
  } catch (err) {
    console.error(`[fundamentals] profile ${simbol}: ${err.message}`);
    return null;
  }
}

async function getRecommendationTrends(simbol) {
  const cached = fromCache(recommendationCache, simbol);
  if (cached !== undefined) return cached;
  if (!isConfigured()) return [];

  try {
    const data = await fetchJson(`${FINNHUB_BASE}/stock/recommendation?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`);
    const list = Array.isArray(data) ? data : [];
    toCache(recommendationCache, simbol, list, DATA_TTL_MS);
    return list;
  } catch (err) {
    console.error(`[fundamentals] recommendation ${simbol}: ${err.message}`);
    return [];
  }
}

async function getInsiderTransactions(simbol) {
  const cached = fromCache(insiderCache, simbol);
  if (cached !== undefined) return cached;
  if (!isConfigured()) return [];

  try {
    const data = await fetchJson(`${FINNHUB_BASE}/stock/insider-transactions?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`);
    const list = Array.isArray(data?.data) ? data.data : [];
    toCache(insiderCache, simbol, list, DATA_TTL_MS);
    return list;
  } catch (err) {
    console.error(`[fundamentals] insider ${simbol}: ${err.message}`);
    return [];
  }
}

async function getEarningsSurprises(simbol) {
  const cached = fromCache(earningsCache, simbol);
  if (cached !== undefined) return cached;
  if (!isConfigured()) return [];

  try {
    const data = await fetchJson(`${FINNHUB_BASE}/stock/earnings?symbol=${simbol}&token=${process.env.FINNHUB_API_KEY}`);
    const list = Array.isArray(data) ? data : [];
    toCache(earningsCache, simbol, list, DATA_TTL_MS);
    return list;
  } catch (err) {
    console.error(`[fundamentals] earnings ${simbol}: ${err.message}`);
    return [];
  }
}

async function getMetrics(simbol) {
  const cached = fromCache(metricCache, simbol);
  if (cached !== undefined) return cached;
  if (!isConfigured()) return null;

  try {
    const data = await fetchJson(`${FINNHUB_BASE}/stock/metric?symbol=${simbol}&metric=all&token=${process.env.FINNHUB_API_KEY}`);
    const metric = data && data.metric ? data.metric : null;
    toCache(metricCache, simbol, metric, DATA_TTL_MS);
    return metric;
  } catch (err) {
    console.error(`[fundamentals] metric ${simbol}: ${err.message}`);
    return null;
  }
}

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

// Un singur apel Finnhub pentru TOATE companiile care raportează în
// următoarele ~45 de zile (nu per simbol, ca restul funcțiilor de mai sus) —
// filtrarea la watchlist-ul fiecărui utilizator se face în ruta care
// consumă acest rezultat, ca acest apel/cache să fie partajat de toți.
async function getEarningsCalendar() {
  if (earningsCalendarCache && earningsCalendarCache.expiresAt > Date.now()) {
    return earningsCalendarCache.data;
  }
  if (!isConfigured()) return [];

  const from = new Date();
  const to = new Date(from.getTime() + 45 * 24 * 60 * 60 * 1000);

  try {
    const data = await fetchJson(
      `${FINNHUB_BASE}/calendar/earnings?from=${formatDate(from)}&to=${formatDate(to)}&token=${process.env.FINNHUB_API_KEY}`
    );
    const list = Array.isArray(data?.earningsCalendar) ? data.earningsCalendar : [];
    earningsCalendarCache = { data: list, expiresAt: Date.now() + EARNINGS_CALENDAR_TTL_MS };
    return list;
  } catch (err) {
    console.error(`[fundamentals] calendar earnings: ${err.message}`);
    return [];
  }
}

module.exports = {
  getCompanyProfile,
  getRecommendationTrends,
  getInsiderTransactions,
  getEarningsSurprises,
  getMetrics,
  getEarningsCalendar,
};

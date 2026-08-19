const crypto = require("crypto");
const { getMarketNewsRaw } = require("./news");
const { contineLimbajDeConsiliere } = require("./radarNarrative");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const CACHE_TTL_MS = 30 * 60 * 1000;

let cache = null; // { items, byId, expiresAt }

function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function isUnsplashConfigured() {
  return Boolean(process.env.UNSPLASH_ACCESS_KEY);
}

function makeId(url) {
  return crypto.createHash("sha1").update(url).digest("hex").slice(0, 12);
}

// Poză de stock sugestivă (nu generată, ci selectată automat din Unsplash pe
// baza unui cuvânt cheie în engleză produs de Claude) — fallback silențios la
// null (frontend arată un gradient) dacă lipsește cheia sau căutarea eșuează.
async function fetchStockImage(cuvantCheie) {
  if (!isUnsplashConfigured() || !cuvantCheie) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(cuvantCheie)}&per_page=1&orientation=landscape&content_filter=high`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return data.results?.[0]?.urls?.regular || null;
  } catch (err) {
    console.error(`[marketNewsAnalysis] căutare Unsplash eșuată: ${err.message}`);
    return null;
  }
}

function fallbackAnalysis(item) {
  return {
    titluAI: item.headline,
    analiza: item.rezumat || item.headline,
    cuvantCheie: null,
  };
}

// Un singur apel Claude pentru toate cele 3 știri (nu unul per știre), ca să
// nu multiplicăm costul — același principiu ca translateNews().
async function analyzeWithClaude(items) {
  if (!isAiConfigured() || items.length === 0) return items.map(fallbackAnalysis);

  const prompt = `Ești un analist financiar care scrie pentru un public român de începători în investiții, pe un site educativ (nu oferă consultanță de investiții).

Pentru fiecare din cele ${items.length} știri de piață de mai jos, produci:
1. "titluAI": un titlu propriu, atractiv, în limba română (nu traducere literală a celui original, ci un titlu jurnalistic nou, scris de tine)
2. "analiza": un text de context de 3-5 propoziții (aproximativ 100-150 cuvinte) în limba română, care explică de ce această știre contează pentru piețele financiare, ce sectoare sau companii ar putea fi afectate, și ce ar merita urmărit în continuare
3. "cuvantCheie": 1-3 cuvinte în limba engleză, potrivite pentru căutarea unei fotografii de stock sugestive pentru subiectul știrii (ex: "oil pipeline", "stock exchange trading floor", "semiconductor factory")

Reguli obligatorii:
- NU folosi niciodată cuvintele "cumpără", "vinde", "recomand", "ar trebui să", sau orice formă de sfat personal de investiții.
- Limbaj exclusiv descriptiv și educativ — context, nu consultanță.

Știri:
${items.map((n, i) => `${i + 1}. Titlu original: ${n.headline}\nRezumat: ${n.rezumat || "(fără rezumat)"}\nSursă: ${n.sursa}`).join("\n\n")}

Răspunde STRICT cu un array JSON de exact ${items.length} elemente, în aceeași ordine, fără text în afara lui:
[{"titluAI": "...", "analiza": "...", "cuvantCheie": "..."}, ...]`;

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Răspunsul Claude nu conține un array JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length !== items.length) {
      throw new Error("Analiză incompletă sau cu lungime greșită");
    }

    return parsed.map((p, i) => {
      const valid = typeof p.titluAI === "string" && typeof p.analiza === "string";
      if (!valid || contineLimbajDeConsiliere(`${p.titluAI} ${p.analiza}`)) {
        console.error(`[marketNewsAnalysis] fallback pentru știrea ${i + 1} — limbaj nepermis sau răspuns incomplet`);
        return fallbackAnalysis(items[i]);
      }
      return {
        titluAI: p.titluAI,
        analiza: p.analiza,
        cuvantCheie: typeof p.cuvantCheie === "string" ? p.cuvantCheie : null,
      };
    });
  } catch (err) {
    console.error(`[marketNewsAnalysis] fallback complet: ${err.message}`);
    return items.map(fallbackAnalysis);
  }
}

async function getAnalyzedMarketNews() {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.items;
  }

  const raw = await getMarketNewsRaw();
  if (raw.length === 0) return [];

  const analize = await analyzeWithClaude(raw);

  const items = await Promise.all(
    raw.map(async (n, i) => ({
      id: makeId(n.url),
      titluAI: analize[i].titluAI,
      analiza: analize[i].analiza,
      sursa: n.sursa,
      url: n.url,
      data: n.data,
      imagine: await fetchStockImage(analize[i].cuvantCheie || n.headline),
    }))
  );

  const byId = new Map(items.map((it) => [it.id, it]));
  cache = { items, byId, expiresAt: Date.now() + CACHE_TTL_MS };
  return items;
}

async function getMarketNewsById(id) {
  if (!cache || cache.expiresAt <= Date.now()) {
    await getAnalyzedMarketNews();
  }
  return cache?.byId.get(id) || null;
}

module.exports = { getAnalyzedMarketNews, getMarketNewsById };

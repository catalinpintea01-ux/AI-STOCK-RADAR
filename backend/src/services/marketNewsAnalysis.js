const crypto = require("crypto");
const { getMarketNewsRaw } = require("./news");
const { contineLimbajDeConsiliere } = require("./radarNarrative");
const { traduceTexte } = require("./i18nContent");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

let cache = null; // { items, byId, expiresAt } — sursa de adevăr (română)
const cachePeLimba = new Map(); // limba -> { items, byId, expiresAt } — traduceri, rotite odată cu sursa

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

const SELECTED_COUNT = 7;

function fallbackSelection(candidates) {
  // Fără AI, nu putem judeca relevanța pentru bursă — luăm primele N (deja
  // sortate cronologic) ca să tot afișăm ceva, dar netraduse/neanalizate.
  return candidates.slice(0, SELECTED_COUNT).map((item) => ({
    index: candidates.indexOf(item),
    titluAI: item.headline,
    analiza: item.rezumat || item.headline,
    cuvantCheie: null,
  }));
}

// Un singur apel Claude care alege ȘI analizează (nu doar analizează primele
// N cronologic) — din bazinul de candidați, Claude selectează cele mai
// relevante pentru piețele bursiere/investiții (nu geopolitică sau știri
// generale fără legătură clară cu companii, sectoare sau active financiare).
async function selectAndAnalyzeWithClaude(candidates) {
  if (!isAiConfigured() || candidates.length === 0) return fallbackSelection(candidates);

  const prompt = `Ești un analist financiar care scrie pentru un public român de începători în investiții, pe un site educativ (nu oferă consultanță de investiții).

Mai jos ai o listă de ${candidates.length} știri generale de pe fluxul de agenție. Alege EXACT ${SELECTED_COUNT} dintre ele — cele mai relevante pentru PIAȚA DE ACȚIUNI în mod specific, nu economia în general. Prioritizează, în această ordine:

1. Mișcări semnificative de preț ale unor acțiuni/companii cotate, numite explicit (ex: "Nvidia scade cu X%", "Apple anunță...")
2. Rezultate financiare (earnings), fuziuni/achiziții, IPO-uri, ghidaj de la companii cotate
3. Evenimente sectoriale cu impact direct asupra unor companii/indici bursieri numiți (ex: reglementare care lovește un sector întreg, un lanț de aprovizionare pentru producători de cipuri)
4. DOAR dacă nu există destule știri de tip 1-3 în listă: politică monetară/bănci centrale, dar numai cu impact bursier direct și imediat menționat explicit (nu doar cifre macro izolate)

Evită sau tratează ca ultimă opțiune: indicatori macroeconomici generali fără nicio companie sau sector bursier nominalizat (inflație, șomaj, PIB, piața imobiliară generică, producție industrială generică), mărfuri/energie fără o legătură explicită cu o companie cotată, și orice știre pur geopolitică, sportivă, culturală sau fără legătură clară cu piețele bursiere — alege-le doar dacă lista chiar nu conține alternative mai bune.

Pentru fiecare din cele ${SELECTED_COUNT} știri alese, produci:
1. "index": numărul original al știrii din lista de mai jos (1-${candidates.length})
2. "titluAI": un titlu propriu, atractiv, în limba română (nu traducere literală a celui original, ci un titlu jurnalistic nou, scris de tine)
3. "analiza": un text de context de 3-5 propoziții (aproximativ 100-150 cuvinte) în limba română, care explică de ce această știre contează pentru piețele financiare, ce sectoare sau companii ar putea fi afectate, și ce ar merita urmărit în continuare
4. "cuvantCheie": 1-3 cuvinte în limba engleză, potrivite pentru căutarea unei fotografii de stock sugestive pentru subiectul știrii (ex: "oil pipeline", "stock exchange trading floor", "semiconductor factory")
5. "sentiment": exact una dintre valorile "optimist", "neutru" sau "rezervat" — tonul de piață al știrii, descriptiv
6. "simbol": ticker-ul principal al companiei/indicelui afectat (ex: "NVDA", "SPY"), sau null dacă știrea nu vizează clar unul

Reguli obligatorii:
- NU folosi niciodată cuvintele "cumpără", "vinde", "recomand", "ar trebui să", sau orice formă de sfat personal de investiții.
- Limbaj exclusiv descriptiv și educativ — context, nu consultanță.

Știri:
${candidates.map((n, i) => `${i + 1}. Titlu original: ${n.headline}\nRezumat: ${n.rezumat || "(fără rezumat)"}\nSursă: ${n.sursa}`).join("\n\n")}

Răspunde STRICT cu un array JSON de exact ${SELECTED_COUNT} elemente, ordonate de la cea mai relevantă la cea mai puțin relevantă, fără text în afara lui:
[{"index": 1, "titluAI": "...", "analiza": "...", "cuvantCheie": "...", "sentiment": "...", "simbol": "..."}, ...]`;

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
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const corpErorii = await res.text().catch(() => "");
      throw new Error(`Claude API a răspuns cu status ${res.status}: ${corpErorii.slice(0, 300)}`);
    }

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Răspunsul Claude nu conține un array JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Selecție goală sau invalidă");
    }

    // Acceptăm și selecții parțiale (ex: 6 din 7) — mai bine câteva știri
    // analizate decât fallback-ul complet netradus pentru un element lipsă.
    const rezultat = [];
    for (const p of parsed.slice(0, SELECTED_COUNT)) {
      const idx = Number(p.index) - 1;
      const candidat = candidates[idx];
      const valid =
        candidat && typeof p.titluAI === "string" && typeof p.analiza === "string";

      if (!valid || contineLimbajDeConsiliere(`${p.titluAI} ${p.analiza}`)) {
        console.error(`[marketNewsAnalysis] element de selecție invalid sau limbaj nepermis — îl sar`);
        continue;
      }
      rezultat.push({
        index: idx,
        titluAI: p.titluAI,
        analiza: p.analiza,
        cuvantCheie: typeof p.cuvantCheie === "string" ? p.cuvantCheie : null,
        sentiment: ["optimist", "neutru", "rezervat"].includes(p.sentiment) ? p.sentiment : null,
        simbol:
          typeof p.simbol === "string" && /^[A-Z.]{1,6}$/.test(p.simbol.trim().toUpperCase())
            ? p.simbol.trim().toUpperCase()
            : null,
      });
    }

    if (rezultat.length === 0) throw new Error("Toate elementele selectate au fost respinse");
    return rezultat;
  } catch (err) {
    console.error(`[marketNewsAnalysis] fallback complet: ${err.message}`);
    return fallbackSelection(candidates);
  }
}

async function ensureBaseCache() {
  if (cache && cache.expiresAt > Date.now()) return;

  const candidates = await getMarketNewsRaw();
  if (candidates.length === 0) {
    cache = { items: [], byId: new Map(), expiresAt: Date.now() + 5 * 60 * 1000 };
    cachePeLimba.clear();
    return;
  }

  const selectate = await selectAndAnalyzeWithClaude(candidates);

  const items = await Promise.all(
    selectate.map(async (s) => {
      const n = candidates[s.index];
      return {
        id: makeId(n.url),
        titluAI: s.titluAI,
        analiza: s.analiza,
        sentiment: s.sentiment || null,
        simbol: s.simbol || null,
        sursa: n.sursa,
        url: n.url,
        data: n.data,
        imagine: await fetchStockImage(s.cuvantCheie || n.headline),
      };
    })
  );

  const byId = new Map(items.map((it) => [it.id, it]));
  cache = { items, byId, expiresAt: Date.now() + CACHE_TTL_MS };
  cachePeLimba.clear(); // selecție nouă → traducerile vechi nu mai corespund
}

// Aceleași știri (aceleași id-uri, imagini, surse) în limba cerută — doar
// titluAI și analiza sunt traduse, cu o singură cerere Claude per limbă per
// fereastră de cache. La eșec servim versiunea română, niciodată eroare.
async function getAnalyzedMarketNews(limba = "ro") {
  await ensureBaseCache();
  if (limba === "ro" || cache.items.length === 0) return cache.items;

  const cached = cachePeLimba.get(limba);
  if (cached && cached.expiresAt === cache.expiresAt) return cached.items;

  const texte = cache.items.flatMap((it) => [it.titluAI, it.analiza]);
  const traduse = await traduceTexte(texte, limba);
  if (!traduse) return cache.items;

  const items = cache.items.map((it, i) => ({
    ...it,
    titluAI: traduse[i * 2],
    analiza: traduse[i * 2 + 1],
  }));
  const byId = new Map(items.map((it) => [it.id, it]));
  cachePeLimba.set(limba, { items, byId, expiresAt: cache.expiresAt });
  return items;
}

async function getMarketNewsById(id, limba = "ro") {
  await getAnalyzedMarketNews(limba);
  if (limba !== "ro") {
    const inLimba = cachePeLimba.get(limba)?.byId.get(id);
    if (inLimba) return inLimba;
  }
  return cache?.byId.get(id) || null;
}

module.exports = { getAnalyzedMarketNews, getMarketNewsById };

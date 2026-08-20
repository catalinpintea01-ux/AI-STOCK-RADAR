const { getStockList } = require("./marketData");
const { contineLimbajDeConsiliere } = require("./radarNarrative");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const DAILY_PICKS_TTL_MS = 30 * 60 * 1000;
const DAILY_PICKS_COUNT = 10;

let dailyCache = null; // { items, expiresAt } — un singur calcul global, partajat de toți userii

function isAiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

async function callClaudeForArray(prompt, maxTokens) {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
  });

  if (!res.ok) {
    const corpErorii = await res.text().catch(() => "");
    throw new Error(`Claude API a răspuns cu status ${res.status}: ${corpErorii.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data.content?.[0]?.text?.trim() || "";
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Răspunsul Claude nu conține un array JSON");
  return JSON.parse(jsonMatch[0]);
}

// --- Research zilnic: 10 acțiuni "merită urmărite azi", din universul curat de 50 ---

function fallbackDailyPicks(universe) {
  // Motivul nu repetă procentul — acela e deja afișat pe rând, în dreapta.
  return [...universe]
    .sort((a, b) => Math.abs(b.variatieProcent) - Math.abs(a.variatieProcent))
    .slice(0, DAILY_PICKS_COUNT)
    .map((s) => ({
      simbol: s.simbol,
      motiv:
        s.variatieProcent >= 0
          ? "Printre cele mai mari creșteri de preț de azi."
          : "Printre cele mai mari scăderi de preț de azi.",
    }));
}

async function getDailyPicks() {
  if (dailyCache && dailyCache.expiresAt > Date.now()) return dailyCache.items;

  const universe = await getStockList();
  if (universe.length === 0) return [];

  let picks;
  if (!isAiConfigured()) {
    picks = fallbackDailyPicks(universe);
  } else {
    const prompt = `Ești un analist financiar care scrie pentru un public român de începători în investiții, pe un site educativ (nu oferă consultanță de investiții).

Mai jos ai ${universe.length} acțiuni cunoscute, cu variația de preț din ziua curentă. Alege EXACT ${DAILY_PICKS_COUNT} care merită urmărite azi — prioritizează variații de preț notabile (pozitive sau negative), dar poți include și acțiuni stabile dacă ai un motiv relevant.

Pentru fiecare, scrie un motiv de maxim o propoziție (15-20 cuvinte), în română, limbaj exclusiv descriptiv.

Reguli obligatorii:
- NU folosi niciodată cuvintele "cumpără", "vinde", "recomand", "ar trebui să", sau orice formă de sfat personal de investiții.

Acțiuni:
${universe.map((s, i) => `${i + 1}. ${s.simbol} (${s.nume}): ${s.variatieProcent >= 0 ? "+" : ""}${s.variatieProcent.toFixed(1)}% azi`).join("\n")}

Răspunde STRICT cu un array JSON de exact ${DAILY_PICKS_COUNT} elemente, fără text în afara lui:
[{"simbol": "...", "motiv": "..."}, ...]`;

    try {
      const parsed = await callClaudeForArray(prompt, 1200);
      const universeSet = new Set(universe.map((s) => s.simbol));
      picks = (Array.isArray(parsed) ? parsed : [])
        .filter((p) => universeSet.has(p.simbol) && typeof p.motiv === "string" && !contineLimbajDeConsiliere(p.motiv))
        .slice(0, DAILY_PICKS_COUNT)
        .map((p) => ({ simbol: p.simbol, motiv: p.motiv }));
      if (picks.length === 0) throw new Error("Toate elementele au fost respinse");
    } catch (err) {
      console.error(`[discovery] fallback pentru research zilnic: ${err.message}`);
      picks = fallbackDailyPicks(universe);
    }
  }

  const universeMap = new Map(universe.map((s) => [s.simbol, s]));
  const items = picks
    .map((p) => {
      const s = universeMap.get(p.simbol);
      if (!s) return null;
      return { simbol: s.simbol, nume: s.nume, pret: s.pret, variatieProcent: s.variatieProcent, motiv: p.motiv };
    })
    .filter(Boolean);

  dailyCache = { items, expiresAt: Date.now() + DAILY_PICKS_TTL_MS };
  return items;
}

// --- Onboarding: selectează N acțiuni din universul curat, pe baza intereselor alese ---

const INTEREST_LABELS = {
  tehnologie: "Tehnologie",
  energie: "Energie",
  financiar: "Financiar / Bănci",
  sanatate: "Sănătate",
  consum: "Consum / Retail",
  dividende: "Dividende stabile",
};

function fallbackOnboardingPicks(universe, count) {
  return universe.slice(0, count).map((s) => ({
    simbol: s.simbol,
    motiv: "Acțiune populară, printre cele mai tranzacționate.",
  }));
}

async function getOnboardingPicks(interese, count) {
  const universe = await getStockList();
  if (universe.length === 0) return [];

  const etichete = (Array.isArray(interese) ? interese : []).map((i) => INTEREST_LABELS[i]).filter(Boolean);
  if (etichete.length === 0 || !isAiConfigured()) {
    return fallbackOnboardingPicks(universe, count);
  }

  const prompt = `Ești un asistent care ajută un utilizator nou dintr-o aplicație educativă de investiții din România să-și construiască o primă listă de acțiuni de urmărit.

Utilizatorul a ales aceste interese: ${etichete.join(", ")}.

Din lista de mai jos, alege EXACT ${count} acțiuni care se potrivesc cel mai bine cu interesele alese. Pentru fiecare, scrie un motiv de maxim o propoziție (15-20 cuvinte) în română, care explică de ce se potrivește — limbaj exclusiv descriptiv.

Reguli obligatorii:
- NU folosi niciodată cuvintele "cumpără", "vinde", "recomand", "ar trebui să", sau orice formă de sfat personal de investiții.

Acțiuni disponibile:
${universe.map((s, i) => `${i + 1}. ${s.simbol} (${s.nume})`).join("\n")}

Răspunde STRICT cu un array JSON de exact ${count} elemente, fără text în afara lui:
[{"simbol": "...", "motiv": "..."}, ...]`;

  try {
    const parsed = await callClaudeForArray(prompt, 1500);
    const universeSet = new Set(universe.map((s) => s.simbol));
    const picks = (Array.isArray(parsed) ? parsed : [])
      .filter((p) => universeSet.has(p.simbol) && typeof p.motiv === "string" && !contineLimbajDeConsiliere(p.motiv))
      .slice(0, count)
      .map((p) => ({ simbol: p.simbol, motiv: p.motiv }));
    if (picks.length === 0) throw new Error("Toate elementele au fost respinse");
    return picks;
  } catch (err) {
    console.error(`[discovery] fallback pentru onboarding: ${err.message}`);
    return fallbackOnboardingPicks(universe, count);
  }
}

module.exports = { getDailyPicks, getOnboardingPicks, INTEREST_LABELS };

// AI Daily Brief — rezumatul de dimineață al pieței, în 3-4 propoziții, pe
// înțelesul unui începător. Un singur apel Claude pe zi (baza, în română);
// celelalte limbi trec prin traduceTexte, care are deja cache persistent în
// DB, deci costul marginal per limbă tinde spre zero. Strict descriptiv —
// aceleași reguli ASF/MiFID II ca narativele radar, cu același filtru.
const prisma = require("../db");
const { contineLimbajDeConsiliere } = require("./radarNarrative");
const { getAnalyzedMarketNews } = require("./marketNewsAnalysis");
const { traduceTexte } = require("./i18nContent");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_TRADUCERE_MS = 24 * 60 * 60 * 1000;

// O singură intrare: brieful zilei curente (cheia = data). Se pierde la
// redeploy — acceptabil, costul e un apel Claude.
let cacheZi = null; // { zi, textRo, generatAi, fapte }
let inFlight = null;

function ziCurenta() {
  return new Date().toISOString().slice(0, 10);
}

// Faptele zilei, adunate exclusiv din ce există deja în cache/DB — zero
// apeluri externe noi: știrile analizate (cu sentiment) + extremele dintre
// scorurile AI deja calculate.
async function adunaFapte() {
  const [stiri, scoruri] = await Promise.all([
    getAnalyzedMarketNews("ro").catch(() => []),
    prisma.radarScore.findMany({
      orderBy: { scorCompozit: "desc" },
      select: { simbol: true, scorCompozit: true, verdict: true },
    }),
  ]);

  const sentimente = { optimist: 0, neutru: 0, rezervat: 0 };
  for (const s of stiri) {
    if (sentimente[s.sentiment] !== undefined) sentimente[s.sentiment] += 1;
  }

  return {
    stiri: stiri.slice(0, 3).map((s) => ({ titlu: s.titluAI, sentiment: s.sentiment, simbol: s.simbol || null })),
    sentimente,
    totalStiri: stiri.length,
    topScoruri: scoruri.slice(0, 3),
    scoruriJoase: scoruri.slice(-2).reverse(),
    totalAnalizate: scoruri.length,
  };
}

function fallbackBrief(fapte) {
  const { sentimente, topScoruri, totalAnalizate } = fapte;
  const fraze = [];
  if (fapte.totalStiri > 0) {
    fraze.push(
      `Tonul știrilor de azi: ${sentimente.optimist} pozitive, ${sentimente.neutru} neutre și ${sentimente.rezervat} negative dintre subiectele analizate de AI.`
    );
  }
  if (topScoruri.length > 0) {
    const top = topScoruri.map((s) => `${s.simbol} (${s.scorCompozit}/100)`).join(", ");
    fraze.push(`Cele mai ridicate scoruri AI din cele ${totalAnalizate} de acțiuni analizate: ${top}.`);
  }
  fraze.push("Context educațional generat automat — nu constituie recomandări de investiții.");
  return fraze.join(" ");
}

function buildPrompt(fapte) {
  const stiriText =
    fapte.stiri.length > 0
      ? fapte.stiri.map((s) => `- [${s.sentiment}] ${s.titlu}`).join("\n")
      : "Nu există știri analizate azi.";
  const topText = fapte.topScoruri.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";
  const josText = fapte.scoruriJoase.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";

  return `Ești un asistent care scrie un scurt briefing de dimineață despre bursa americană pentru începători din România. NICIODATĂ consultanță de investiții personală.

Datele zilei:
- Știri de piață analizate de AI (cu sentimentul lor):
${stiriText}
- Distribuția sentimentului pe ${fapte.totalStiri} știri: ${fapte.sentimente.optimist} pozitive, ${fapte.sentimente.neutru} neutre, ${fapte.sentimente.rezervat} negative
- Cele mai ridicate scoruri AI dintre cele ${fapte.totalAnalizate} de acțiuni analizate: ${topText}
- Cele mai scăzute scoruri: ${josText}

Scrie un singur paragraf de 3-4 propoziții în română: tonul general al pieței azi (dedus din știri), un fapt concret din știri și ce arată extremele scorurilor AI. Limbaj simplu, descriptiv.

Reguli obligatorii:
- NU folosi niciodată "cumpără", "vinde", "recomand", "ar trebui să", "oportunitate de investiție" sau orice formă de îndemn.
- Doar descriere: "sentimentul e", "scorurile arată", "știrile vorbesc despre".
- Fără liste, fără markdown — doar paragraful.`;
}

async function genereazaTextRo(fapte) {
  if (!process.env.ANTHROPIC_API_KEY) return { text: fallbackBrief(fapte), generatAi: false };

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
        max_tokens: 400,
        messages: [{ role: "user", content: buildPrompt(fapte) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);

    const data = await res.json();
    // Promptul interzice markdown, dar modelul mai strecoară câte un titlu
    // "# ..." — îl eliminăm determinist și aplatizăm totul într-un paragraf.
    const text = (data.content?.[0]?.text?.trim() || "")
      .split("\n")
      .filter((linie) => !/^#{1,6}\s/.test(linie.trim()))
      .join("\n")
      .replace(/\*\*/g, "")
      .replace(/\s*\n+\s*/g, " ")
      .trim();
    if (text.length < 80) throw new Error("Răspuns prea scurt");
    if (contineLimbajDeConsiliere(text)) {
      console.error("[brief] limbaj de consiliere detectat — folosesc fallback-ul determinist");
      return { text: fallbackBrief(fapte), generatAi: false };
    }
    return { text, generatAi: true };
  } catch (err) {
    console.error(`[brief] fallback: ${err.message}`);
    return { text: fallbackBrief(fapte), generatAi: false };
  }
}

async function getDailyBrief(limba = "ro") {
  const zi = ziCurenta();

  if (!cacheZi || cacheZi.zi !== zi) {
    if (!inFlight) {
      inFlight = (async () => {
        const fapte = await adunaFapte();
        const { text, generatAi } = await genereazaTextRo(fapte);
        cacheZi = { zi, textRo: text, generatAi, fapte };
      })().finally(() => {
        inFlight = null;
      });
    }
    await inFlight;
  }

  let text = cacheZi.textRo;
  if (limba !== "ro") {
    const traduse = await traduceTexte([cacheZi.textRo], limba, TTL_TRADUCERE_MS);
    if (traduse && traduse[0]) text = traduse[0];
  }

  return {
    zi: cacheZi.zi,
    text,
    generatAi: cacheZi.generatAi,
    simboluri: cacheZi.fapte.topScoruri.map((s) => s.simbol),
  };
}

module.exports = { getDailyBrief };

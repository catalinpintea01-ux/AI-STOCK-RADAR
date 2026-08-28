const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const VERDICT_LABELS = {
  optimist: "optimist (sentiment AI pozitiv)",
  neutru: "neutru (sentiment AI mixt)",
  rezervat: "rezervat (sentiment AI negativ)",
};

// Interzicem explicit formulări de consiliere personală de investiții —
// produsul oferă context descriptiv, nu recomandări (cerință ASF/MiFID II).
// Notă: "vinde"/"cumpără" ca verbe descriptive normale (ex: "compania vinde
// produse X") NU trebuie blocate — doar formulările de sfat direct către
// utilizator, legate de acțiune/tranzacție.
const BANNED_PATTERNS = [
  /\bcump[ăa]r[ăa]?\s+(acț|acest|aceast)/i,
  /\bvinde(-ți)?\s+(acț|acest|aceast)/i,
  /\bar trebui s[ăa]\s+(cump[ăa]r|vin|investe)/i,
  // "recomand", "recomandăm", "recomandare/recomandat" = sfat direct → blocat.
  // "recomandările analiștilor" / "recomandări (de rating)" = substantiv
  // descriptiv despre date publice → permis (lookahead-ul exclude "ăr...").
  /\brecomand(?!ăr)/i,
  /\bsfat(uri)? de investi/i,
  /\binvestește acum\b/i,
  /\bbuy\b.{0,15}\b(stock|shares?)\b/i,
  /\bsell\b.{0,15}\b(stock|shares?)\b/i,
];

function contineLimbajDeConsiliere(text) {
  return BANNED_PATTERNS.some((pattern) => pattern.test(text));
}

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function fallbackNarrative(simbol, scoruri, verdict) {
  const eticheta = VERDICT_LABELS[verdict] || "neutru";
  return {
    rezumat: `Scorul AI compozit pentru ${simbol} este ${scoruri.compozit}/100, sentiment ${eticheta}. Analiza combină tendința analiștilor (${scoruri.analyst}/100), momentumul de preț (${scoruri.momentum}/100), semnalele fundamentale (${scoruri.fundamental}/100) și nivelul de risc (${scoruri.risc}/100).`,
    riscuri: ["Datele disponibile sunt limitate — tratează acest scor ca punct de plecare, nu ca o concluzie completă."],
    invalidare: ["O schimbare semnificativă în oricare dintre cei 4 factori de mai sus ar putea modifica acest scor."],
    generatAi: false,
  };
}

function buildPrompt({ simbol, scoruri, verdict, fapte, headlines }) {
  const stiriText =
    headlines.length > 0
      ? headlines.slice(0, 3).map((h) => `- ${h.headline}`).join("\n")
      : "Nu există știri recente relevante.";

  const analistText = fapte.recommendation
    ? `strongBuy=${fapte.recommendation.strongBuy}, buy=${fapte.recommendation.buy}, hold=${fapte.recommendation.hold}, sell=${fapte.recommendation.sell}, strongSell=${fapte.recommendation.strongSell}`
    : "fără acoperire de analiști";

  const earningsText =
    fapte.earnings.length > 0
      ? fapte.earnings.map((e) => `${e.period}: surpriză ${e.surprisePercent?.toFixed(1) ?? "N/A"}%`).join("; ")
      : "fără date de earnings";

  const insiderCount = (fapte.insiderTx || []).length;

  return `Ești un asistent care oferă context educativ despre acțiuni bursiere unor începători din România, NICIODATĂ consultanță de investiții personală.

Date despre acțiunea ${simbol}:
- Scor compozit AI: ${scoruri.compozit}/100 — sentiment ${VERDICT_LABELS[verdict]}
- Sub-scoruri: analiști ${scoruri.analyst}/100, momentum preț ${scoruri.momentum}/100, fundamental ${scoruri.fundamental}/100, risc ${scoruri.risc}/100
- Recomandări analiști recente: ${analistText}
- Rezultate financiare recente: ${earningsText}
- Tranzacții insideri (SEC) în ultimele luni: ${insiderCount} înregistrări
- Știri recente:
${stiriText}

Scrie STRICT JSON valid, fără text în afara lui, cu exact această formă:
{"rezumat": "2-3 propoziții descriptive despre acțiune, pe înțelesul unui începător", "riscuri": ["risc scurt 1", "risc scurt 2"], "invalidare": ["ce eveniment/informație ar schimba această perspectivă"]}

Reguli obligatorii:
- NU folosi niciodată cuvintele "cumpără", "vinde", "recomand", "ar trebui să", sau orice formă de sfat personal de investiții.
- Folosește exclusiv limbaj descriptiv: "sentiment AI", "factori", "riscuri", "scenariu posibil".
- Menționează verdictul (${verdict}) ca literă descriptivă a sentimentului AI, nu ca instrucțiune de acțiune.
- Răspunde DOAR cu obiectul JSON, fără markdown, fără text introductiv.`;
}

async function generateRadarNarrative({ simbol, scoruri, verdict, fapte, headlines }) {
  if (!isConfigured()) {
    return fallbackNarrative(simbol, scoruri, verdict);
  }

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
        max_tokens: 500,
        messages: [{ role: "user", content: buildPrompt({ simbol, scoruri, verdict, fapte, headlines }) }],
      }),
    });

    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Răspunsul Claude nu conține JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    if (
      typeof parsed.rezumat !== "string" ||
      !Array.isArray(parsed.riscuri) ||
      !Array.isArray(parsed.invalidare)
    ) {
      throw new Error("JSON incomplet din răspunsul Claude");
    }

    const textComplet = [parsed.rezumat, ...parsed.riscuri, ...parsed.invalidare].join(" ");
    if (contineLimbajDeConsiliere(textComplet)) {
      console.error(`[radarNarrative] limbaj de consiliere detectat pentru ${simbol} — folosesc fallback`);
      return fallbackNarrative(simbol, scoruri, verdict);
    }

    return {
      rezumat: parsed.rezumat,
      riscuri: parsed.riscuri,
      invalidare: parsed.invalidare,
      generatAi: true,
    };
  } catch (err) {
    console.error(`[radarNarrative] fallback pentru ${simbol}: ${err.message}`);
    return fallbackNarrative(simbol, scoruri, verdict);
  }
}

module.exports = { generateRadarNarrative, contineLimbajDeConsiliere };

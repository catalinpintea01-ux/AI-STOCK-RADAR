const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function fallbackExplanation(simbol, variatieProcent, headline) {
  const directie = variatieProcent >= 0 ? "a crescut" : "a scăzut";
  const baza = `${simbol} ${directie} cu ${Math.abs(variatieProcent).toFixed(1)}% azi.`;
  return headline
    ? `${baza} O posibilă cauză, din știrile recente: „${headline}”.`
    : `${baza} Nu am găsit o știre clară asociată momentan — mișcarea poate ține de condițiile generale de piață.`;
}

// Combină mișcarea de preț + știri recente într-o explicație simplă, educativă,
// pe înțelesul unui începător. Fără cheie Claude configurată, folosim un
// rezumat pe bază de reguli (fără AI), ca funcționalitatea să rămână utilă.
async function generateExplanation({ simbol, variatieProcent, headlines }) {
  if (!isConfigured()) {
    return fallbackExplanation(simbol, variatieProcent, headlines[0]?.headline);
  }

  const directie = variatieProcent >= 0 ? "a crescut" : "a scăzut";
  const stiriText =
    headlines.length > 0
      ? headlines.slice(0, 3).map((h) => `- ${h.headline}`).join("\n")
      : "Nu există știri recente disponibile pentru această companie.";

  const prompt = `Ești un asistent care explică mișcări bursiere unor începători complet, în română, simplu, fără termeni tehnici de piață.
Acțiunea ${simbol} ${directie} cu ${Math.abs(variatieProcent).toFixed(1)}% azi.
Știri recente despre companie:
${stiriText}

Scrie o explicație de maxim 2 propoziții, pe înțelesul unui începător complet, despre o posibilă cauză a acestei mișcări. Nu da sfaturi de investiții — doar context educativ. Dacă știrile nu par relevante pentru mișcarea prețului, spune clar că mișcarea pare să țină de condițiile generale de piață.

Răspunde STRICT cu cele 1-2 propoziții, ca text simplu. Nu adăuga titlu, nu folosi markdown (fără #, fără **), nu adăuga nimic altceva înainte sau după.`;

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
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      throw new Error(`Claude API a răspuns cu status ${res.status}`);
    }

    const data = await res.json();
    const text = data.content?.[0]?.text?.trim().replace(/^#+\s*.*\n+/, "").replace(/\*\*/g, "");
    return text || fallbackExplanation(simbol, variatieProcent, headlines[0]?.headline);
  } catch (err) {
    console.error(`[explain] fallback: ${err.message}`);
    return fallbackExplanation(simbol, variatieProcent, headlines[0]?.headline);
  }
}

module.exports = { generateExplanation, isConfigured };

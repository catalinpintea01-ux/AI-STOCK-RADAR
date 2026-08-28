// Localizarea conținutului generat (narative radar, știri analizate, motive
// de research) în cele 10 limbi ale interfeței. Două mecanisme:
//   1. Șabloane deterministe per limbă — pentru textele construite din cifre
//     (fallback-ul narativei radar, motivele generice) — funcționează și FĂRĂ
//     credit Anthropic.
//   2. Traducere Claude cu cache în memorie — pentru textele generate de AI
//     în română (rezumat radar, titluri+analize de știri, motive research);
//     dacă traducerea nu e posibilă, cădem pe șablonul determinist (radar)
//     sau pe textul original (motive/știri) — niciodată eroare.
const crypto = require("crypto");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";

const LIMBI_SUPORTATE = new Set(["ro", "en", "es", "fr", "de", "it", "pt", "nl", "pl", "hu"]);

const NUME_LIMBA = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "European Portuguese",
  nl: "Dutch",
  pl: "Polish",
  hu: "Hungarian",
};

function normalizeazaLimba(raw) {
  const l = String(raw || "ro").toLowerCase().slice(0, 2);
  return LIMBI_SUPORTATE.has(l) ? l : "ro";
}

// ---------------------------------------------------------------------------
// Șabloane deterministe per limbă (fără AI). Aceeași structură ca
// fallbackNarrative din radarNarrative.js, dar în toate limbile.
// ---------------------------------------------------------------------------

const SABLOANE = {
  ro: {
    verdicte: {
      optimist: "optimist (sentiment AI pozitiv)",
      neutru: "neutru (sentiment AI mixt)",
      rezervat: "rezervat (sentiment AI negativ)",
    },
    rezumat: (s, sc, e) =>
      `Scorul AI compozit pentru ${s} este ${sc.compozit}/100, sentiment ${e}. Analiza combină tendința analiștilor (${sc.analyst}/100), momentumul de preț (${sc.momentum}/100), semnalele fundamentale (${sc.fundamental}/100) și nivelul de risc (${sc.risc}/100).`,
    riscuri: ["Datele disponibile sunt limitate — tratează acest scor ca punct de plecare, nu ca o concluzie completă."],
    invalidare: ["O schimbare semnificativă în oricare dintre cei 4 factori de mai sus ar putea modifica acest scor."],
    motivCrestere: "Printre cele mai mari creșteri de preț de azi.",
    motivScadere: "Printre cele mai mari scăderi de preț de azi.",
    motivPopular: "Acțiune populară, printre cele mai tranzacționate.",
  },
  en: {
    verdicte: {
      optimist: "optimistic (positive AI sentiment)",
      neutru: "neutral (mixed AI sentiment)",
      rezervat: "cautious (negative AI sentiment)",
    },
    rezumat: (s, sc, e) =>
      `The composite AI score for ${s} is ${sc.compozit}/100, sentiment ${e}. The analysis combines the analyst trend (${sc.analyst}/100), price momentum (${sc.momentum}/100), fundamental signals (${sc.fundamental}/100) and the risk level (${sc.risc}/100).`,
    riscuri: ["Available data is limited — treat this score as a starting point, not a complete conclusion."],
    invalidare: ["A significant change in any of the 4 factors above could alter this score."],
    motivCrestere: "Among today's biggest price gainers.",
    motivScadere: "Among today's biggest price decliners.",
    motivPopular: "A popular stock, among the most traded.",
  },
  es: {
    verdicte: {
      optimist: "optimista (sentimiento IA positivo)",
      neutru: "neutral (sentimiento IA mixto)",
      rezervat: "cauteloso (sentimiento IA negativo)",
    },
    rezumat: (s, sc, e) =>
      `La puntuación IA compuesta de ${s} es ${sc.compozit}/100, sentimiento ${e}. El análisis combina la tendencia de los analistas (${sc.analyst}/100), el momentum del precio (${sc.momentum}/100), las señales fundamentales (${sc.fundamental}/100) y el nivel de riesgo (${sc.risc}/100).`,
    riscuri: ["Los datos disponibles son limitados — trata esta puntuación como un punto de partida, no como una conclusión completa."],
    invalidare: ["Un cambio significativo en cualquiera de los 4 factores anteriores podría modificar esta puntuación."],
    motivCrestere: "Entre las mayores subidas de precio de hoy.",
    motivScadere: "Entre las mayores bajadas de precio de hoy.",
    motivPopular: "Una acción popular, entre las más negociadas.",
  },
  fr: {
    verdicte: {
      optimist: "optimiste (sentiment IA positif)",
      neutru: "neutre (sentiment IA mitigé)",
      rezervat: "prudent (sentiment IA négatif)",
    },
    rezumat: (s, sc, e) =>
      `Le score IA composite de ${s} est de ${sc.compozit}/100, sentiment ${e}. L'analyse combine la tendance des analystes (${sc.analyst}/100), le momentum du prix (${sc.momentum}/100), les signaux fondamentaux (${sc.fundamental}/100) et le niveau de risque (${sc.risc}/100).`,
    riscuri: ["Les données disponibles sont limitées — considérez ce score comme un point de départ, pas comme une conclusion complète."],
    invalidare: ["Un changement significatif dans l'un des 4 facteurs ci-dessus pourrait modifier ce score."],
    motivCrestere: "Parmi les plus fortes hausses de prix du jour.",
    motivScadere: "Parmi les plus fortes baisses de prix du jour.",
    motivPopular: "Une action populaire, parmi les plus échangées.",
  },
  de: {
    verdicte: {
      optimist: "optimistisch (positives KI-Sentiment)",
      neutru: "neutral (gemischtes KI-Sentiment)",
      rezervat: "zurückhaltend (negatives KI-Sentiment)",
    },
    rezumat: (s, sc, e) =>
      `Der zusammengesetzte KI-Score für ${s} beträgt ${sc.compozit}/100, Sentiment ${e}. Die Analyse kombiniert den Analystentrend (${sc.analyst}/100), das Kursmomentum (${sc.momentum}/100), fundamentale Signale (${sc.fundamental}/100) und das Risikoniveau (${sc.risc}/100).`,
    riscuri: ["Die verfügbaren Daten sind begrenzt — betrachte diesen Score als Ausgangspunkt, nicht als vollständige Schlussfolgerung."],
    invalidare: ["Eine deutliche Änderung bei einem der 4 obigen Faktoren könnte diesen Score verändern."],
    motivCrestere: "Unter den größten Kursgewinnern von heute.",
    motivScadere: "Unter den größten Kursverlierern von heute.",
    motivPopular: "Eine beliebte Aktie, unter den meistgehandelten.",
  },
  it: {
    verdicte: {
      optimist: "ottimista (sentiment IA positivo)",
      neutru: "neutrale (sentiment IA misto)",
      rezervat: "cauto (sentiment IA negativo)",
    },
    rezumat: (s, sc, e) =>
      `Il punteggio IA composito di ${s} è ${sc.compozit}/100, sentiment ${e}. L'analisi combina la tendenza degli analisti (${sc.analyst}/100), il momentum del prezzo (${sc.momentum}/100), i segnali fondamentali (${sc.fundamental}/100) e il livello di rischio (${sc.risc}/100).`,
    riscuri: ["I dati disponibili sono limitati — considera questo punteggio un punto di partenza, non una conclusione completa."],
    invalidare: ["Un cambiamento significativo in uno dei 4 fattori sopra potrebbe modificare questo punteggio."],
    motivCrestere: "Tra i maggiori rialzi di prezzo di oggi.",
    motivScadere: "Tra i maggiori ribassi di prezzo di oggi.",
    motivPopular: "Un'azione popolare, tra le più scambiate.",
  },
  pt: {
    verdicte: {
      optimist: "otimista (sentimento IA positivo)",
      neutru: "neutro (sentimento IA misto)",
      rezervat: "cauteloso (sentimento IA negativo)",
    },
    rezumat: (s, sc, e) =>
      `A pontuação IA composta de ${s} é ${sc.compozit}/100, sentimento ${e}. A análise combina a tendência dos analistas (${sc.analyst}/100), o momentum do preço (${sc.momentum}/100), os sinais fundamentais (${sc.fundamental}/100) e o nível de risco (${sc.risc}/100).`,
    riscuri: ["Os dados disponíveis são limitados — trata esta pontuação como um ponto de partida, não como uma conclusão completa."],
    invalidare: ["Uma mudança significativa em qualquer um dos 4 fatores acima poderia alterar esta pontuação."],
    motivCrestere: "Entre as maiores subidas de preço de hoje.",
    motivScadere: "Entre as maiores descidas de preço de hoje.",
    motivPopular: "Uma ação popular, entre as mais negociadas.",
  },
  nl: {
    verdicte: {
      optimist: "optimistisch (positief AI-sentiment)",
      neutru: "neutraal (gemengd AI-sentiment)",
      rezervat: "terughoudend (negatief AI-sentiment)",
    },
    rezumat: (s, sc, e) =>
      `De samengestelde AI-score voor ${s} is ${sc.compozit}/100, sentiment ${e}. De analyse combineert de analistentrend (${sc.analyst}/100), het koersmomentum (${sc.momentum}/100), fundamentele signalen (${sc.fundamental}/100) en het risiconiveau (${sc.risc}/100).`,
    riscuri: ["De beschikbare data is beperkt — beschouw deze score als een startpunt, niet als een volledige conclusie."],
    invalidare: ["Een significante verandering in een van de 4 bovenstaande factoren kan deze score wijzigen."],
    motivCrestere: "Bij de grootste koersstijgers van vandaag.",
    motivScadere: "Bij de grootste koersdalers van vandaag.",
    motivPopular: "Een populair aandeel, bij de meest verhandelde.",
  },
  pl: {
    verdicte: {
      optimist: "optymistyczny (pozytywny sentyment AI)",
      neutru: "neutralny (mieszany sentyment AI)",
      rezervat: "ostrożny (negatywny sentyment AI)",
    },
    rezumat: (s, sc, e) =>
      `Złożona ocena AI dla ${s} wynosi ${sc.compozit}/100, sentyment ${e}. Analiza łączy trend analityków (${sc.analyst}/100), momentum ceny (${sc.momentum}/100), sygnały fundamentalne (${sc.fundamental}/100) i poziom ryzyka (${sc.risc}/100).`,
    riscuri: ["Dostępne dane są ograniczone — traktuj tę ocenę jako punkt wyjścia, a nie pełny wniosek."],
    invalidare: ["Istotna zmiana któregokolwiek z 4 powyższych czynników mogłaby zmienić tę ocenę."],
    motivCrestere: "Wśród największych dzisiejszych wzrostów cen.",
    motivScadere: "Wśród największych dzisiejszych spadków cen.",
    motivPopular: "Popularna akcja, wśród najczęściej handlowanych.",
  },
  hu: {
    verdicte: {
      optimist: "optimista (pozitív MI-hangulat)",
      neutru: "semleges (vegyes MI-hangulat)",
      rezervat: "óvatos (negatív MI-hangulat)",
    },
    rezumat: (s, sc, e) =>
      `A(z) ${s} összesített MI-pontszáma ${sc.compozit}/100, hangulat: ${e}. Az elemzés az elemzői trendet (${sc.analyst}/100), az ármomentumot (${sc.momentum}/100), a fundamentális jeleket (${sc.fundamental}/100) és a kockázati szintet (${sc.risc}/100) kombinálja.`,
    riscuri: ["A rendelkezésre álló adatok korlátozottak — kezeld ezt a pontszámot kiindulópontként, nem teljes következtetésként."],
    invalidare: ["A fenti 4 tényező bármelyikének jelentős változása módosíthatja ezt a pontszámot."],
    motivCrestere: "A mai legnagyobb áremelkedők között.",
    motivScadere: "A mai legnagyobb árcsökkenők között.",
    motivPopular: "Népszerű részvény, a legforgalmasabbak között.",
  },
};

function narativaDeterminista(simbol, scoruri, verdict, limba) {
  const sab = SABLOANE[limba] || SABLOANE.ro;
  const eticheta = sab.verdicte[verdict] || sab.verdicte.neutru;
  return {
    rezumat: sab.rezumat(simbol, scoruri, eticheta),
    riscuri: sab.riscuri,
    invalidare: sab.invalidare,
  };
}

function motivFallback(tip, limba) {
  const sab = SABLOANE[limba] || SABLOANE.ro;
  if (tip === "crestere") return sab.motivCrestere;
  if (tip === "scadere") return sab.motivScadere;
  return sab.motivPopular;
}

// ---------------------------------------------------------------------------
// Traducere Claude cu cache în memorie. Cheia de cache include limba și
// hash-ul textelor sursă — un rezumat radar recalculat (text nou) primește
// automat o traducere nouă, fără TTL-uri sincronizate manual.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cacheTraduceri = new Map(); // hash -> { out, expiresAt }

function cheieCache(texte, limba) {
  return crypto.createHash("sha1").update(limba + " " + JSON.stringify(texte)).digest("hex");
}

// Traduce un array de texte românești în limba țintă. Returnează array-ul
// tradus sau null dacă traducerea nu e posibilă (fără cheie API, eroare,
// răspuns invalid) — apelantul decide fallback-ul.
async function traduceTexte(texte, limba) {
  if (limba === "ro" || !LIMBI_SUPORTATE.has(limba)) return null;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!Array.isArray(texte) || texte.length === 0) return null;

  const cheie = cheieCache(texte, limba);
  const cached = cacheTraduceri.get(cheie);
  if (cached && cached.expiresAt > Date.now()) return cached.out;

  const totalChars = texte.reduce((s, t) => s + t.length, 0);
  const maxTokens = Math.min(4000, Math.ceil(totalChars / 2) + 400);

  const prompt = `Translate the following Romanian texts about stock markets into ${NUME_LIMBA[limba]}. They come from an educational app that never gives investment advice — keep the descriptive, educational tone and NEVER introduce advice wording (imperatives like "buy this stock", "sell", "you should invest"). Keep tickers, numbers and company names unchanged.

Respond STRICTLY with a JSON array of exactly ${texte.length} translated strings, in the same order, with no text outside the JSON.

Texts:
${JSON.stringify(texte)}`;

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
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);

    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("Răspunsul nu conține un array JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length !== texte.length || parsed.some((t) => typeof t !== "string")) {
      throw new Error("Array de traduceri invalid");
    }

    if (cacheTraduceri.size >= CACHE_MAX) {
      // Evacuare simplă: ștergem cea mai veche intrare (prima din Map).
      cacheTraduceri.delete(cacheTraduceri.keys().next().value);
    }
    cacheTraduceri.set(cheie, { out: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
    return parsed;
  } catch (err) {
    console.error(`[i18nContent] traducere ${limba} eșuată: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Localizări pe forme concrete de răspuns
// ---------------------------------------------------------------------------

// radarRow: rândul RadarScore din DB (riscuri/invalidare ca string JSON).
// Returnează o copie cu textele în limba cerută, păstrând același contract
// (riscuri/invalidare rămân string-uri JSON — rutele fac JSON.parse ca acum).
async function localizeazaRadar(radarRow, limba) {
  if (!radarRow || limba === "ro") return radarRow;

  const scoruri = {
    analyst: radarRow.scorAnalist,
    momentum: radarRow.scorMomentum,
    fundamental: radarRow.scorFundamental,
    risc: radarRow.scorRisc,
    compozit: radarRow.scorCompozit,
  };

  // Text determinist (fără AI la generare) → îl reconstruim direct în limba
  // cerută din cifre; nu are rost să traducem un șablon.
  if (!radarRow.generatAi) {
    const det = narativaDeterminista(radarRow.simbol, scoruri, radarRow.verdict, limba);
    return {
      ...radarRow,
      rezumat: det.rezumat,
      riscuri: JSON.stringify(det.riscuri),
      invalidare: JSON.stringify(det.invalidare),
    };
  }

  let riscuri = [];
  let invalidare = [];
  try {
    riscuri = JSON.parse(radarRow.riscuri);
    invalidare = JSON.parse(radarRow.invalidare);
  } catch {
    riscuri = [];
    invalidare = [];
  }

  const texte = [radarRow.rezumat, ...riscuri, ...invalidare];
  const traduse = await traduceTexte(texte, limba);
  if (!traduse) {
    // Traducerea nu e disponibilă → mai util un text determinist în limba
    // utilizatorului decât un text AI în română pe care nu îl înțelege.
    const det = narativaDeterminista(radarRow.simbol, scoruri, radarRow.verdict, limba);
    return {
      ...radarRow,
      rezumat: det.rezumat,
      riscuri: JSON.stringify(det.riscuri),
      invalidare: JSON.stringify(det.invalidare),
      generatAi: false,
    };
  }

  return {
    ...radarRow,
    rezumat: traduse[0],
    riscuri: JSON.stringify(traduse.slice(1, 1 + riscuri.length)),
    invalidare: JSON.stringify(traduse.slice(1 + riscuri.length)),
  };
}

// picks: [{ ..., motiv }] — traduce doar câmpul motiv. Motivele-șablon
// cunoscute (fallback-urile fără AI) se înlocuiesc direct din șabloanele
// per limbă — merg și fără credit Anthropic; restul trec prin traducere,
// iar la eșec rămâne textul original (română), niciodată eroare.
const MOTIVE_SABLON = {
  [SABLOANE.ro.motivCrestere]: "crestere",
  [SABLOANE.ro.motivScadere]: "scadere",
  [SABLOANE.ro.motivPopular]: "popular",
};

async function localizeazaMotive(picks, limba) {
  if (limba === "ro" || !Array.isArray(picks) || picks.length === 0) return picks;

  const rezultat = picks.map((p) =>
    MOTIVE_SABLON[p.motiv] ? { ...p, motiv: motivFallback(MOTIVE_SABLON[p.motiv], limba) } : { ...p }
  );

  const deTradus = rezultat.filter((p, i) => !MOTIVE_SABLON[picks[i].motiv]);
  if (deTradus.length > 0) {
    const traduse = await traduceTexte(deTradus.map((p) => p.motiv), limba);
    if (traduse) {
      deTradus.forEach((p, i) => {
        p.motiv = traduse[i];
      });
    }
  }
  return rezultat;
}

module.exports = {
  LIMBI_SUPORTATE,
  NUME_LIMBA,
  normalizeazaLimba,
  narativaDeterminista,
  motivFallback,
  traduceTexte,
  localizeazaRadar,
  localizeazaMotive,
};

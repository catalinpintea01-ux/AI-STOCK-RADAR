// Brieful personal al watchlist-ului — "ce e nou în LISTA TA azi", în 3-4
// propoziții. Frâna de cost e cache-ul din DB (un rând per user+zi):
//  - Premium: max 1 apel Claude Haiku per utilizator pe zi (a doua deschidere
//    în aceeași zi = citire din DB); fallback-ul se reîncearcă după 30 min.
//  - Gratuit: sinteza deterministă (zero AI) — utilă, dar și un motiv real
//    de upgrade. Aceleași reguli stricte ASF/MiFID II + filtrul de limbaj.
const prisma = require("../db");
const { contineLimbajDeConsiliere } = require("./radarNarrative");
const { traduceTexte } = require("./i18nContent");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_TRADUCERE_MS = 24 * 60 * 60 * 1000;
const REINCEARCA_FALLBACK_MS = 30 * 60 * 1000;

function ziCurenta() {
  return new Date().toISOString().slice(0, 10);
}

// Faptele listei — exclusiv din DB (scoruri + istoricul lor), zero apeluri
// externe. Delta = ultimele două calcule per simbol din ultimele 3 zile.
async function adunaFapte(userId) {
  const randuri = await prisma.watchlist.findMany({ where: { userId }, select: { simbol: true } });
  const simboluri = randuri.map((r) => r.simbol);
  if (simboluri.length === 0) return null;

  const [scoruri, istoric] = await Promise.all([
    prisma.radarScore.findMany({
      where: { simbol: { in: simboluri } },
      select: { simbol: true, scorCompozit: true, verdict: true },
      orderBy: { scorCompozit: "desc" },
    }),
    prisma.radarScoreHistory.findMany({
      where: { simbol: { in: simboluri }, computedAt: { gte: new Date(Date.now() - 3 * 86400000) } },
      orderBy: { computedAt: "desc" },
      select: { simbol: true, scorCompozit: true },
    }),
  ]);
  if (scoruri.length === 0) return null;

  const perSimbol = {};
  for (const h of istoric) {
    (perSimbol[h.simbol] = perSimbol[h.simbol] || []).push(h.scorCompozit);
  }
  let urcat = 0;
  let coborat = 0;
  let salt = null; // { simbol, delta }
  for (const [simbol, lista] of Object.entries(perSimbol)) {
    if (lista.length < 2) continue;
    const delta = lista[0] - lista[1];
    if (delta > 0) urcat += 1;
    else if (delta < 0) coborat += 1;
    if (delta !== 0 && (!salt || Math.abs(delta) > Math.abs(salt.delta))) salt = { simbol, delta };
  }

  const verdicte = { optimist: 0, neutru: 0, rezervat: 0 };
  for (const s of scoruri) if (verdicte[s.verdict] !== undefined) verdicte[s.verdict] += 1;

  return {
    total: simboluri.length,
    analizate: scoruri.length,
    scorMediu: Math.round(scoruri.reduce((s, x) => s + x.scorCompozit, 0) / scoruri.length),
    top: scoruri.slice(0, 2),
    jos: scoruri.slice(-1),
    verdicte,
    urcat,
    coborat,
    salt,
  };
}

// Sinteza deterministă — răspunsul complet pentru planul gratuit și plasa de
// siguranță pentru Premium (credit AI lipsă / limbaj neconform).
function fallbackPersonal(f) {
  const fraze = [];
  fraze.push(
    `Watchlist-ul tău are ${f.analizate} acțiuni analizate (din ${f.total}), cu un scor AI mediu de ${f.scorMediu}/100 — ${f.verdicte.optimist} optimiste, ${f.verdicte.neutru} neutre, ${f.verdicte.rezervat} rezervate.`
  );
  if (f.top.length > 0) {
    const top = f.top.map((s) => `${s.simbol} (${s.scorCompozit})`).join(" și ");
    const jos = f.jos.length ? `, iar cel mai scăzut e ${f.jos[0].simbol} (${f.jos[0].scorCompozit})` : "";
    fraze.push(`Cele mai ridicate scoruri din listă sunt ${top}${jos}.`);
  }
  if (f.urcat + f.coborat > 0) {
    const saltText = f.salt
      ? `, cea mai mare mișcare fiind ${f.salt.simbol} (${f.salt.delta > 0 ? "+" : ""}${f.salt.delta} puncte)`
      : "";
    fraze.push(`De la calculul anterior, ${f.urcat} scoruri au urcat și ${f.coborat} au coborât${saltText}.`);
  }
  fraze.push("Sinteză educațională automată — nu constituie recomandări de investiții.");
  return fraze.join(" ");
}

function buildPrompt(f) {
  const top = f.top.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";
  const jos = f.jos.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";
  const salt = f.salt ? `${f.salt.simbol} cu ${f.salt.delta > 0 ? "+" : ""}${f.salt.delta} puncte` : "niciuna notabilă";

  return `Ești un asistent care scrie un scurt briefing de dimineață despre WATCHLIST-UL unui utilizator (lista lui de acțiuni urmărite), pentru un începător din România. NICIODATĂ consultanță de investiții personală.

Datele listei lui:
- ${f.analizate} acțiuni analizate din ${f.total} urmărite; scor AI mediu ${f.scorMediu}/100
- Verdictele: ${f.verdicte.optimist} optimiste, ${f.verdicte.neutru} neutre, ${f.verdicte.rezervat} rezervate
- Scorurile cele mai ridicate: ${top}
- Scorul cel mai scăzut: ${jos}
- De la calculul anterior: ${f.urcat} scoruri au urcat, ${f.coborat} au coborât; cea mai mare mișcare: ${salt}

Scrie un singur paragraf de 3-4 propoziții în română, adresat direct ("lista ta", "watchlist-ul tău"): forma generală a listei azi, extremele ei și ce s-a mișcat. Limbaj simplu, descriptiv.

Reguli obligatorii:
- NU folosi niciodată "cumpără", "vinde", "recomand", "ar trebui să", "oportunitate de investiție" sau orice formă de îndemn.
- Doar descriere: "lista ta arată", "scorurile s-au mișcat", "verdictele sunt".
- Fără liste, fără markdown — doar paragraful.`;
}

async function genereazaTextRo(f) {
  if (!process.env.ANTHROPIC_API_KEY) return { text: fallbackPersonal(f), generatAi: false };
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
        messages: [{ role: "user", content: buildPrompt(f) }],
      }),
    });
    if (!res.ok) throw new Error(`Claude API a răspuns cu status ${res.status}`);
    const data = await res.json();
    const text = (data.content?.[0]?.text?.trim() || "")
      .split("\n")
      .filter((linie) => !/^#{1,6}\s/.test(linie.trim()))
      .join("\n")
      .replace(/\*\*/g, "")
      .replace(/\s*\n+\s*/g, " ")
      .trim();
    if (text.length < 80) throw new Error("Răspuns prea scurt");
    if (contineLimbajDeConsiliere(text)) {
      console.error("[brief-personal] limbaj de consiliere detectat — fallback determinist");
      return { text: fallbackPersonal(f), generatAi: false };
    }
    return { text, generatAi: true };
  } catch (err) {
    console.error(`[brief-personal] fallback: ${err.message}`);
    return { text: fallbackPersonal(f), generatAi: false };
  }
}

async function getBriefPersonal(userId, limba = "ro", premium = false) {
  const zi = ziCurenta();

  let rand = await prisma.briefPersonal.findUnique({ where: { userId_zi: { userId, zi } } });

  // Regenerăm doar dacă: nu există; sau userul e Premium dar rândul e
  // determinist (ex. abia a făcut upgrade, sau AI-ul căzuse) și a trecut
  // fereastra de reîncercare — niciodată mai des de atât.
  const regenereaza =
    !rand ||
    (premium && !rand.generatAi && Date.now() - new Date(rand.creatLa).getTime() > REINCEARCA_FALLBACK_MS);

  if (regenereaza) {
    const fapte = await adunaFapte(userId);
    if (!fapte) return { gol: true };

    const { text, generatAi } = premium
      ? await genereazaTextRo(fapte)
      : { text: fallbackPersonal(fapte), generatAi: false };

    rand = await prisma.briefPersonal.upsert({
      where: { userId_zi: { userId, zi } },
      update: { textRo: text, generatAi, creatLa: new Date() },
      create: { userId, zi, textRo: text, generatAi },
    });
  }

  let text = rand.textRo;
  if (limba !== "ro") {
    const traduse = await traduceTexte([rand.textRo], limba, TTL_TRADUCERE_MS);
    if (traduse && traduse[0]) text = traduse[0];
  }

  return { zi, text, generatAi: rand.generatAi, premium };
}

module.exports = { getBriefPersonal };

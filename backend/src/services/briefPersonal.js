// Brieful personal al watchlist-ului — "ce e nou în LISTA TA azi", în 3-4
// propoziții. Frâna de cost e cache-ul din DB (un rând per user+zi):
//  - Premium: max 1 apel Claude Haiku per utilizator pe zi (a doua deschidere
//    în aceeași zi = citire din DB); fallback-ul se reîncearcă după 30 min.
//  - Gratuit: sinteza deterministă (zero AI) — utilă, dar și un motiv real
//    de upgrade. Aceleași reguli stricte ASF/MiFID II + filtrul de limbaj.
const prisma = require("../db");
const { contineLimbajDeConsiliere } = require("./radarNarrative");
const { traduceTexte } = require("./i18nContent");
const { getAnalyzedMarketNews } = require("./marketNewsAnalysis");
const { getCompanyNews } = require("./news");
const { getStockList } = require("./marketData");
const { getEarningsCalendar } = require("./fundamentals");

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const TTL_TRADUCERE_MS = 24 * 60 * 60 * 1000;
const REINCEARCA_FALLBACK_MS = 30 * 60 * 1000;

function ziCurenta() {
  return new Date().toISOString().slice(0, 10);
}

// Faptele listei — din DB + cache-urile deja calde ale aplicației (lista de
// prețuri SWR, știrile analizate, calendarul de raportări). Singurele apeluri
// potențial noi: titlurile companiilor pentru cei 2 cei mai mișcați (EN, deci
// fără traducere, și cu cache propriu per simbol).
async function adunaFapte(userId) {
  const randuri = await prisma.watchlist.findMany({ where: { userId }, select: { simbol: true } });
  const simboluri = randuri.map((r) => r.simbol);
  if (simboluri.length === 0) return null;
  const setSimboluri = new Set(simboluri);

  const [scoruri, istoric, listaPiata, stiriPiata, calendar] = await Promise.all([
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
    getStockList().catch(() => []),
    getAnalyzedMarketNews("ro").catch(() => []),
    getEarningsCalendar().catch(() => []),
  ]);
  if (scoruri.length === 0) return null;

  // Variația de AZI a fiecărei acțiuni din listă (din cache-ul SWR al pieței).
  const variatii = {};
  for (const a of listaPiata) {
    if (setSimboluri.has(a.simbol) && typeof a.variatieProcent === "number") {
      variatii[a.simbol] = a.variatieProcent;
    }
  }
  const miscatori = Object.entries(variatii)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 3)
    .map(([simbol, variatie]) => ({ simbol, variatie }));

  // Știrile de piață analizate de AI care privesc DIRECT acțiuni din listă.
  const stiriLista = stiriPiata
    .filter((s) => s.simbol && setSimboluri.has(s.simbol))
    .slice(0, 3)
    .map((s) => ({ simbol: s.simbol, titlu: s.titluAI || s.titlu, sentiment: s.sentiment }));

  // Titluri de companie pentru cei mai mișcați 2 (EN — zero traduceri; AI-ul
  // scrie oricum în română). Cache per simbol în news.js.
  const stiriCompanii = [];
  for (const m of miscatori.slice(0, 2)) {
    try {
      const stiri = await getCompanyNews(m.simbol, "en");
      if (stiri && stiri[0]?.headline) {
        stiriCompanii.push({ simbol: m.simbol, titlu: stiri[0].headline });
      }
    } catch {
      // fără știri pentru simbolul ăsta — nu blocăm brieful
    }
  }

  // Raportările din listă din următoarele 14 zile.
  const acum = Date.now();
  const raportari = (calendar || [])
    .filter((e) => e.symbol && setSimboluri.has(e.symbol))
    .map((e) => ({ simbol: e.symbol, data: e.date, zile: Math.ceil((new Date(e.date) - acum) / 86400000) }))
    .filter((e) => e.zile >= 0 && e.zile <= 14)
    .sort((a, b) => a.zile - b.zile)
    .slice(0, 3);

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
    miscatori,
    stiriLista,
    stiriCompanii,
    raportari,
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
  if (f.miscatori.length > 0) {
    const m = f.miscatori
      .map((x) => `${x.simbol} ${x.variatie >= 0 ? "+" : ""}${x.variatie.toFixed(1)}%`)
      .join(", ");
    fraze.push(`Azi, cele mai mișcate din listă: ${m}.`);
  }
  if (f.urcat + f.coborat > 0) {
    const saltText = f.salt
      ? `, cea mai mare mișcare fiind ${f.salt.simbol} (${f.salt.delta > 0 ? "+" : ""}${f.salt.delta} puncte)`
      : "";
    fraze.push(`De la calculul anterior, ${f.urcat} scoruri au urcat și ${f.coborat} au coborât${saltText}.`);
  }
  if (f.raportari.length > 0) {
    const r = f.raportari
      .map((e) => `${e.simbol} ${e.zile === 0 ? "azi" : `în ${e.zile} ${e.zile === 1 ? "zi" : "zile"}`}`)
      .join(", ");
    fraze.push(`Raportări care vin din lista ta: ${r}.`);
  }
  fraze.push("Sinteză educațională automată — nu constituie recomandări de investiții.");
  return fraze.join(" ");
}

function buildPrompt(f) {
  const top = f.top.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";
  const jos = f.jos.map((s) => `${s.simbol} ${s.scorCompozit}/100 (${s.verdict})`).join(", ") || "—";
  const salt = f.salt ? `${f.salt.simbol} cu ${f.salt.delta > 0 ? "+" : ""}${f.salt.delta} puncte` : "niciuna notabilă";
  const miscatori =
    f.miscatori.map((m) => `${m.simbol} ${m.variatie >= 0 ? "+" : ""}${m.variatie.toFixed(1)}% azi`).join(", ") || "—";
  const stiriLista =
    f.stiriLista.length > 0
      ? f.stiriLista.map((s) => `- [${s.simbol}, sentiment ${s.sentiment}] ${s.titlu}`).join("\n")
      : "Nicio știre de piață analizată azi nu privește direct lista.";
  const stiriCompanii =
    f.stiriCompanii.length > 0
      ? f.stiriCompanii.map((s) => `- [${s.simbol}] ${s.titlu}`).join("\n")
      : "—";
  const raportari =
    f.raportari.length > 0
      ? f.raportari.map((e) => `${e.simbol} ${e.zile === 0 ? "azi" : `în ${e.zile} zile`} (${e.data})`).join(", ")
      : "niciuna în următoarele 14 zile";

  return `Ești un asistent care scrie briefingul de dimineață al WATCHLIST-ULUI unui utilizator (lista lui de acțiuni urmărite), pentru un începător din România. NICIODATĂ consultanță de investiții personală.

Datele listei lui:
- ${f.analizate} acțiuni analizate din ${f.total} urmărite; scor AI mediu ${f.scorMediu}/100; verdictele: ${f.verdicte.optimist} optimiste, ${f.verdicte.neutru} neutre, ${f.verdicte.rezervat} rezervate
- Scoruri: cele mai ridicate ${top}; cel mai scăzut ${jos}
- Mișcările de PREȚ de azi din listă: ${miscatori}
- Știri de piață analizate de AI care privesc acțiuni din listă:
${stiriLista}
- Cele mai recente titluri de presă ale companiilor care s-au mișcat cel mai mult (în engleză — tu relatezi în română):
${stiriCompanii}
- Raportări de rezultate (earnings) care vin din listă: ${raportari}
- Scorurile AI de la calculul anterior: ${f.urcat} au urcat, ${f.coborat} au coborât; cea mai mare mișcare: ${salt}

Scrie un paragraf de 5-7 propoziții în română, adresat direct ("lista ta", "watchlist-ul tău"), în această ordine aproximativă: (1) forma generală a listei azi, (2) cine s-a mișcat cel mai mult și — DOAR dacă titlurile de presă furnizate sugerează un motiv — relatează acel motiv, citând ideea știrii; dacă nu, spune doar cât s-a mișcat, fără să inventezi cauze, (3) o știre importantă din listă cu sentimentul ei, (4) raportările care vin și când, (5) mișcarea scorurilor AI. Limbaj simplu, descriptiv, concret.

Reguli obligatorii:
- NU folosi niciodată "cumpără", "vinde", "recomand", "ar trebui să", "oportunitate de investiție" sau orice formă de îndemn.
- NU inventa cauze pentru mișcări de preț — leagă mișcarea de o știre DOAR dacă știrea furnizată chiar o sugerează.
- Doar descriere: "lista ta arată", "acțiunea a urcat", "presa relatează", "compania raportează".
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
        max_tokens: 700,
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

  // Formatul îmbogățit (știri + variații + earnings) a intrat pe 1 sept 2026
  // ~12:20 UTC — rândurile din ziua respectivă generate ÎNAINTE se refac o
  // singură dată; constanta devine inofensivă începând de a doua zi.
  const FORMAT_NOU_DIN = new Date("2026-09-01T12:20:00Z").getTime();

  // Regenerăm doar dacă: nu există; userul e Premium dar rândul e determinist
  // (ex. abia a făcut upgrade, sau AI-ul căzuse) și a trecut fereastra de
  // reîncercare; sau rândul e din formatul vechi. Niciodată mai des de atât.
  const regenereaza =
    !rand ||
    new Date(rand.creatLa).getTime() < FORMAT_NOU_DIN ||
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

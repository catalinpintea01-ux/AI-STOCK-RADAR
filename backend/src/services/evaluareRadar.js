const prisma = require("../db");

// Evaluarea zilnică a radarului + ajustarea ponderilor ("radarul învață").
//
// Principiu: nu promitem nimic despre viitor — doar măsurăm, descriptiv, cât
// de des s-au potrivit verdictele din urmă cu 5 zile de tranzacționare cu
// variația reală a prețului. Din aceleași evaluări, pilonii direcționali
// (momentum / analiști / fundamente) primesc zilnic cel mult ±1 punct de
// pondere, în limite fixe — transparent și reversibil, nu o "cutie neagră".

const PONDERI_IMPLICITE = { momentum: 30, analist: 30, fundamental: 20, risc: 20 };
const PONDERE_MIN = 15;
const PONDERE_MAX = 40;
const MIN_EVALUARI_PILON = 10; // sub atât, ziua nu e considerată concludentă
const PRAG_DIFERENTA_RATE = 0.05; // best vs worst trebuie să difere cu ≥5pp

const PONDERI_TTL_MS = 10 * 60 * 1000;
let ponderiCache = { data: null, expiresAt: 0 };

const ACURATETE_TTL_MS = 10 * 60 * 1000;
let acurateteCache = { data: null, expiresAt: 0 };

function aziUTC() {
  return new Date().toISOString().slice(0, 10);
}

// Regula de potrivire, publică și simplă:
//  - optimist  → variația pe 5 zile ≥ +0.5%
//  - rezervat  → variația pe 5 zile ≤ −0.5%
//  - neutru    → variația rămâne în banda ±2.5%
function ePotrivire(verdict, variatiePct) {
  if (verdict === "optimist") return variatiePct >= 0.5;
  if (verdict === "rezervat") return variatiePct <= -0.5;
  return Math.abs(variatiePct) <= 2.5;
}

async function getPonderiRow() {
  return prisma.ponderiRadar.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, ...{ wMomentum: 30, wAnalist: 30, wFundamental: 20, wRisc: 20 } },
  });
}

// Ponderile curente, cache-uite 10 min — citite de radar.js la fiecare calcul.
async function getPonderi() {
  if (ponderiCache.data && Date.now() < ponderiCache.expiresAt) return ponderiCache.data;
  try {
    const row = await getPonderiRow();
    const data = {
      momentum: row.wMomentum,
      analist: row.wAnalist,
      fundamental: row.wFundamental,
      risc: row.wRisc,
      actualizatLa: row.actualizatLa,
    };
    ponderiCache = { data, expiresAt: Date.now() + PONDERI_TTL_MS };
    return data;
  } catch {
    return { ...PONDERI_IMPLICITE, actualizatLa: null };
  }
}

function directiePilon(scor) {
  return scor >= 55 ? 1 : scor <= 45 ? -1 : 0;
}

// Cel mult o ajustare pe zi: pilonul direcțional cu cea mai bună rată de
// potrivire câștigă 1 punct de la cel cu cea mai slabă, dacă diferența e
// reală (≥5pp) și fiecare a avut destule predicții tranșante în ziua evaluată.
async function ajusteazaPonderi(zi, evaluari) {
  const row = await getPonderiRow();
  if (row.ziUltimaAjustare === zi) return { ajustat: false, motiv: "deja ajustat azi" };

  const piloni = {
    momentum: "scorMomentumAtunci",
    analist: "scorAnalistAtunci",
    fundamental: "scorFundamentalAtunci",
  };

  const rate = {};
  for (const [nume, camp] of Object.entries(piloni)) {
    let ok = 0;
    let total = 0;
    for (const e of evaluari) {
      const dir = directiePilon(e[camp]);
      if (dir === 0 || Math.abs(e.variatiePct) < 0.5) continue; // fără semnal clar de ambele părți
      total += 1;
      if (dir > 0 === e.variatiePct > 0) ok += 1;
    }
    rate[nume] = total >= MIN_EVALUARI_PILON ? ok / total : null;
  }

  const valide = Object.entries(rate).filter(([, v]) => v !== null);
  const marcheaza = () =>
    prisma.ponderiRadar.update({ where: { id: 1 }, data: { ziUltimaAjustare: zi, actualizatLa: new Date() } });

  if (valide.length < 2) {
    await marcheaza();
    return { ajustat: false, motiv: "prea puține evaluări concludente", rate };
  }

  valide.sort((a, b) => b[1] - a[1]);
  const [numeBest, rataBest] = valide[0];
  const [numeWorst, rataWorst] = valide[valide.length - 1];

  const w = { momentum: row.wMomentum, analist: row.wAnalist, fundamental: row.wFundamental };
  if (rataBest - rataWorst < PRAG_DIFERENTA_RATE || w[numeBest] >= PONDERE_MAX || w[numeWorst] <= PONDERE_MIN) {
    await marcheaza();
    return { ajustat: false, motiv: "diferență mică sau limite atinse", rate };
  }

  w[numeBest] += 1;
  w[numeWorst] -= 1;

  await prisma.ponderiRadar.update({
    where: { id: 1 },
    data: {
      wMomentum: w.momentum,
      wAnalist: w.analist,
      wFundamental: w.fundamental,
      ziUltimaAjustare: zi,
      actualizatLa: new Date(),
    },
  });
  ponderiCache = { data: null, expiresAt: 0 };
  console.log(
    `[evaluare] ponderi ajustate (${zi}): +1 ${numeBest} (${(rataBest * 100).toFixed(0)}%), -1 ${numeWorst} (${(rataWorst * 100).toFixed(0)}%)`
  );
  return { ajustat: true, best: numeBest, worst: numeWorst, rate };
}

// Rulează evaluarea pentru ziua curentă (idempotent — a doua chemare în
// aceeași zi nu face nimic). Nu face niciun apel extern: folosește verdictele
// din jurnalul RadarScoreHistory și variația pe 5 zile deja prezentă în
// metricile stocate la ultimul calcul de scor.
async function evalueazaZi() {
  const zi = aziUTC();

  const dejaExistente = await prisma.evaluareRadar.count({ where: { zi } });
  if (dejaExistente > 0) return { zi, evaluate: 0, dejaFacut: true };

  const scoruri = await prisma.radarScore.findMany({
    select: { simbol: true, sursaDate: true },
  });

  const acum = Date.now();
  const fereastraStart = new Date(acum - 9 * 24 * 60 * 60 * 1000); // ~5 zile de tranzacționare
  const fereastraEnd = new Date(acum - 4 * 24 * 60 * 60 * 1000);

  const randuri = [];
  for (const s of scoruri) {
    let variatie = null;
    try {
      const metric = JSON.parse(s.sursaDate)?.metric;
      const v = metric?.["5DayPriceReturnDaily"];
      if (typeof v === "number" && Number.isFinite(v)) variatie = v;
    } catch {
      // sursaDate coruptă — sărim simbolul
    }
    if (variatie === null) continue;

    const istoric = await prisma.radarScoreHistory.findFirst({
      where: { simbol: s.simbol, computedAt: { gte: fereastraStart, lte: fereastraEnd } },
      orderBy: { computedAt: "desc" },
    });
    if (!istoric) continue;

    randuri.push({
      zi,
      simbol: s.simbol,
      verdict: istoric.verdict,
      scorAtunci: istoric.scorCompozit,
      scorMomentumAtunci: istoric.scorMomentum,
      scorAnalistAtunci: istoric.scorAnalist,
      scorFundamentalAtunci: istoric.scorFundamental,
      variatiePct: variatie,
      potrivire: ePotrivire(istoric.verdict, variatie),
    });
  }

  if (randuri.length > 0) {
    await prisma.evaluareRadar.createMany({ data: randuri, skipDuplicates: true });
    await ajusteazaPonderi(zi, randuri);
    acurateteCache = { data: null, expiresAt: 0 };
  }

  console.log(`[evaluare] ${zi}: ${randuri.length} simboluri evaluate`);
  return { zi, evaluate: randuri.length };
}

// Statistica publică (landing + metodologie): ultimele 30 de zile agregat,
// pe verdicte, seria zilnică și ponderile curente. Cache 10 min.
async function getAcuratete() {
  if (acurateteCache.data && Date.now() < acurateteCache.expiresAt) return acurateteCache.data;

  const din = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [randuri, ponderi] = await Promise.all([
    prisma.evaluareRadar.findMany({
      where: { createdAt: { gte: din } },
      select: { zi: true, verdict: true, potrivire: true },
    }),
    getPonderi(),
  ]);

  const total = randuri.length;
  const potriviri = randuri.filter((r) => r.potrivire).length;

  const perVerdict = {};
  for (const v of ["optimist", "neutru", "rezervat"]) {
    const ale = randuri.filter((r) => r.verdict === v);
    perVerdict[v] = {
      total: ale.length,
      potriviri: ale.filter((r) => r.potrivire).length,
    };
  }

  const peZile = {};
  for (const r of randuri) {
    peZile[r.zi] = peZile[r.zi] || { zi: r.zi, total: 0, potriviri: 0 };
    peZile[r.zi].total += 1;
    if (r.potrivire) peZile[r.zi].potriviri += 1;
  }
  const zile = Object.values(peZile)
    .sort((a, b) => (a.zi < b.zi ? 1 : -1))
    .slice(0, 14);

  const data = {
    fereastraZile: 30,
    total,
    potriviri,
    procent: total > 0 ? Math.round((potriviri / total) * 100) : null,
    perVerdict,
    zile,
    ponderi: {
      momentum: ponderi.momentum,
      analist: ponderi.analist,
      fundamental: ponderi.fundamental,
      risc: ponderi.risc,
    },
    ponderiActualizateLa: ponderi.actualizatLa,
    regula: {
      optimist: "variatie 5 zile >= +0.5%",
      rezervat: "variatie 5 zile <= -0.5%",
      neutru: "variatie 5 zile in banda +/-2.5%",
    },
  };
  acurateteCache = { data, expiresAt: Date.now() + ACURATETE_TTL_MS };
  return data;
}

module.exports = { evalueazaZi, getAcuratete, getPonderi, ePotrivire, PONDERI_IMPLICITE };

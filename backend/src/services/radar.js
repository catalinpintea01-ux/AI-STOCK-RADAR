const prisma = require("../db");
const { getRecommendationTrends, getInsiderTransactions, getEarningsSurprises, getMetrics } = require("./fundamentals");
const { getCompanyNews } = require("./news");
const { generateRadarNarrative } = require("./radarNarrative");

const RADAR_TTL_MS = 6 * 60 * 60 * 1000; // 6 ore
const inFlight = new Map(); // simbol -> Promise, evită calcule duplicate simultane

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// --- Sub-scoruri deterministe (0-100), fiecare cu semnal hasData ---

function scoreAnalyst(recommendation) {
  if (!recommendation || recommendation.length === 0) {
    return { score: 50, hasData: false };
  }

  const latest = [...recommendation].sort((a, b) => new Date(b.period) - new Date(a.period))[0];
  const { strongBuy = 0, buy = 0, hold = 0, sell = 0, strongSell = 0 } = latest;
  const total = strongBuy + buy + hold + sell + strongSell;
  if (total === 0) return { score: 50, hasData: false };

  const net = strongBuy * 2 + buy - sell - strongSell * 2;
  const maxAbs = total * 2;
  const normalized = ((net / maxAbs) + 1) / 2 * 100;
  return { score: clamp(Math.round(normalized), 0, 100), hasData: true };
}

function scoreMomentum(metric) {
  if (!metric) return { score: 50, hasData: false };

  const parts = [
    [metric["5DayPriceReturnDaily"], 0.2],
    [metric["13WeekPriceReturnDaily"], 0.4],
    [metric["26WeekPriceReturnDaily"], 0.4],
  ].filter(([v]) => typeof v === "number");

  if (parts.length === 0) return { score: 50, hasData: false };

  const totalWeight = parts.reduce((s, [, w]) => s + w, 0);
  const blended = parts.reduce((s, [v, w]) => s + v * w, 0) / totalWeight;
  return { score: clamp(Math.round(50 + blended * 2), 0, 100), hasData: true };
}

function scoreFundamental(earnings, insiderTx) {
  if (!earnings || earnings.length === 0) return { score: 50, hasData: false };

  const sorted = [...earnings].sort((a, b) => new Date(b.period) - new Date(a.period)).slice(0, 4);
  const weights = [0.4, 0.3, 0.2, 0.1];
  let weightedSum = 0;
  let weightUsed = 0;

  sorted.forEach((e, i) => {
    if (typeof e.surprisePercent === "number") {
      weightedSum += e.surprisePercent * weights[i];
      weightUsed += weights[i];
    }
  });

  if (weightUsed === 0) return { score: 50, hasData: false };

  let score = 50 + (weightedSum / weightUsed) * 3;

  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const tranzactiiPiataDeschisa = (insiderTx || []).filter(
    (t) => ["P", "S"].includes(t.transactionCode) && new Date(t.transactionDate).getTime() >= cutoff
  );
  if (tranzactiiPiataDeschisa.length > 0) {
    const netShares = tranzactiiPiataDeschisa.reduce((sum, t) => sum + (t.change || 0), 0);
    score += netShares > 0 ? 5 : netShares < 0 ? -5 : 0;
  }

  return { score: clamp(Math.round(score), 0, 100), hasData: true };
}

function scoreRisc(metric) {
  if (!metric) return { score: 50, hasData: false };

  const beta = typeof metric.beta === "number" ? clamp((metric.beta - 0.5) * 40, 0, 100) : null;

  const returns = [metric["5DayPriceReturnDaily"], metric["13WeekPriceReturnDaily"], metric["26WeekPriceReturnDaily"]].filter(
    (v) => typeof v === "number"
  );
  const spread = returns.length >= 2 ? clamp((Math.max(...returns) - Math.min(...returns)) * 2, 0, 100) : null;

  const parts = [beta, spread].filter((v) => v !== null);
  if (parts.length === 0) return { score: 50, hasData: false };

  return { score: clamp(Math.round(parts.reduce((a, b) => a + b, 0) / parts.length), 0, 100), hasData: true };
}

function computeComposite({ momentum, analyst, fundamental, risc }) {
  const compozit = Math.round(
    0.3 * momentum.score + 0.3 * analyst.score + 0.2 * fundamental.score + 0.2 * (100 - risc.score)
  );

  let verdict = "neutru";
  if (compozit >= 60) verdict = "optimist";
  else if (compozit <= 40) verdict = "rezervat";

  const realCount = [momentum, analyst, fundamental, risc].filter((s) => s.hasData).length;
  const incredere = realCount === 4 ? "ridicata" : realCount >= 2 ? "medie" : "scazuta";

  return { compozit, verdict, incredere };
}

async function computeAndStore(simbol) {
  const [recommendation, insiderTx, earnings, metric] = await Promise.all([
    getRecommendationTrends(simbol),
    getInsiderTransactions(simbol),
    getEarningsSurprises(simbol),
    getMetrics(simbol),
  ]);

  const analyst = scoreAnalyst(recommendation);
  const momentum = scoreMomentum(metric);
  const fundamental = scoreFundamental(earnings, insiderTx);
  const risc = scoreRisc(metric);
  const { compozit, verdict, incredere } = computeComposite({ momentum, analyst, fundamental, risc });

  // Scorul anterior: baza pentru refolosirea narativei ȘI pentru alertele de
  // scor de după upsert.
  const anterior = await prisma.radarScore.findUnique({ where: { simbol } });

  // Economie majoră de apeluri Claude: dacă scorul abia s-a mișcat (< 5
  // puncte) și verdictul e neschimbat, textul existent rămâne valabil — îl
  // refolosim și actualizăm doar cifrele. Fără asta, robotul de fundal
  // regenera ~240 de narative/zi pentru scoruri practic identice.
  const PRAG_NARATIVA_NOUA = 5;
  let narrative = null;
  if (
    anterior &&
    anterior.generatAi &&
    anterior.verdict === verdict &&
    Math.abs(compozit - anterior.scorCompozit) < PRAG_NARATIVA_NOUA
  ) {
    try {
      narrative = {
        rezumat: anterior.rezumat,
        riscuri: JSON.parse(anterior.riscuri),
        invalidare: JSON.parse(anterior.invalidare),
        generatAi: true,
      };
    } catch {
      narrative = null; // date vechi corupte — generăm normal
    }
  }

  if (!narrative) {
    const headlines = await getCompanyNews(simbol);
    narrative = await generateRadarNarrative({
      simbol,
      scoruri: { analyst: analyst.score, momentum: momentum.score, fundamental: fundamental.score, risc: risc.score, compozit },
      verdict,
      fapte: { recommendation: recommendation[0] || null, insiderTx, earnings: earnings.slice(0, 4), metric },
      headlines,
    });
  }

  // Agregatele insiderilor pe 90 de zile alimentează și "Radarul insiderilor"
  // din Tool-urile Pro (change > 0 = achiziție, < 0 = vânzare, per SEC).
  const tx90 = (insiderTx || []).filter(
    (t) => new Date(t.transactionDate).getTime() >= Date.now() - 90 * 24 * 60 * 60 * 1000
  );
  const sursaDate = JSON.stringify({
    recommendation: recommendation[0] || null,
    earningsRecent: earnings.slice(0, 4),
    metric,
    insiderCount90d: tx90.length,
    insiderCumparari90d: tx90.filter((t) => (t.change ?? 0) > 0).length,
    insiderVanzari90d: tx90.filter((t) => (t.change ?? 0) < 0).length,
    insiderNet90d: tx90.reduce((s, t) => s + (t.change ?? 0), 0),
  });

  const data = {
    computedAt: new Date(),
    scorAnalist: analyst.score,
    scorMomentum: momentum.score,
    scorFundamental: fundamental.score,
    scorRisc: risc.score,
    scorCompozit: compozit,
    verdict, // mereu verdictul determinist calculat mai sus — nu cel eventual repetat de AI, ca să nu existe contradicție între scor și text
    rezumat: narrative.rezumat,
    riscuri: JSON.stringify(narrative.riscuri),
    invalidare: JSON.stringify(narrative.invalidare),
    incredere,
    sursaDate,
    generatAi: narrative.generatAi,
  };

  const saved = await prisma.radarScore.upsert({
    where: { simbol },
    update: data,
    create: { simbol, ...data },
  });

  // Alerte pentru cei care urmăresc simbolul, doar la schimbări notabile
  // (verdict schimbat sau salt ≥10 puncte). Best-effort: o eroare aici nu are
  // voie să strice calculul de scor în sine.
  if (anterior) {
    try {
      const { creeazaAlerteScor } = require("./alerts");
      await creeazaAlerteScor(simbol, anterior, data);
    } catch (err) {
      console.error(`[radar] alerte de scor eșuate pentru ${simbol}: ${err.message}`);
    }
  }

  // Jurnal append-only pentru "Ce s-a schimbat" — o înregistrare per calcul,
  // separată de RadarScore (care e doar cache-ul "cel mai recent").
  await prisma.radarScoreHistory.create({
    data: {
      simbol,
      computedAt: data.computedAt,
      scorAnalist: data.scorAnalist,
      scorMomentum: data.scorMomentum,
      scorFundamental: data.scorFundamental,
      scorRisc: data.scorRisc,
      scorCompozit: data.scorCompozit,
      verdict: data.verdict,
    },
  });

  return saved;
}

// Compară ultimele două calcule salvate pentru un simbol. Returnează null dacă
// există mai puțin de 2 înregistrări (încă nu avem ce compara).
async function getScoreChange(simbol) {
  const ultimele = await prisma.radarScoreHistory.findMany({
    where: { simbol: simbol.toUpperCase() },
    orderBy: { computedAt: "desc" },
    take: 2,
  });

  if (ultimele.length < 2) return null;

  const [actual, anterior] = ultimele;
  return {
    dataAnterioara: anterior.computedAt,
    deltaCompozit: actual.scorCompozit - anterior.scorCompozit,
    deltaAnalist: actual.scorAnalist - anterior.scorAnalist,
    deltaMomentum: actual.scorMomentum - anterior.scorMomentum,
    deltaFundamental: actual.scorFundamental - anterior.scorFundamental,
    deltaRisc: actual.scorRisc - anterior.scorRisc,
    verdictAnterior: anterior.verdict,
    scorAnterior: anterior.scorCompozit,
  };
}

async function getOrComputeRadarScore(simbol) {
  const upper = simbol.toUpperCase();

  const existing = await prisma.radarScore.findUnique({ where: { simbol: upper } });
  const isFresh = existing && Date.now() - new Date(existing.computedAt).getTime() < RADAR_TTL_MS;
  if (isFresh) return existing;

  if (inFlight.has(upper)) return inFlight.get(upper);

  const promise = computeAndStore(upper).finally(() => inFlight.delete(upper));
  inFlight.set(upper, promise);
  return promise;
}

module.exports = {
  getOrComputeRadarScore,
  getScoreChange,
  scoreAnalyst,
  scoreMomentum,
  scoreFundamental,
  scoreRisc,
  computeComposite,
};

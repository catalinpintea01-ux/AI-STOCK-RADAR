const prisma = require("../db");
const { getOrComputeRadarScore } = require("./radar");

const FILL_INTERVAL_MS = 6 * 60 * 60 * 1000; // aliniat cu RADAR_TTL_MS din radar.js
const FIRST_RUN_DELAY_MS = 30_000; // lasă serverul să se stabilizeze după boot
const DELAY_BETWEEN_MS = 1500; // pauză între simboluri, ca să nu lovim rate-limit-ul Finnhub/Claude

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Completează scorurile lipsă/expirate pentru toate simbolurile urmărite de
// cineva, oricine ar fi userul — rulează în fundal, fără cerere HTTP în
// spate. getOrComputeRadarScore respectă deja TTL-ul de 6h, deci a chema
// asta des pentru simboluri deja proaspete costă doar un query, nu recalcul.
async function runFillPass() {
  let simboluri;
  try {
    const rows = await prisma.watchlist.findMany({ distinct: ["simbol"], select: { simbol: true } });
    simboluri = rows.map((r) => r.simbol);
  } catch (err) {
    console.error(`[scheduler] citire watchlist eșuată: ${err.message}`);
    return;
  }

  if (simboluri.length === 0) return;

  console.log(`[scheduler] pas de completare pornit — ${simboluri.length} simboluri urmărite`);
  let procesate = 0;
  for (const simbol of simboluri) {
    try {
      await getOrComputeRadarScore(simbol);
    } catch (err) {
      console.error(`[scheduler] eroare la ${simbol}: ${err.message}`);
    }
    procesate += 1;
    await sleep(DELAY_BETWEEN_MS);
  }
  console.log(`[scheduler] pas de completare terminat — ${procesate}/${simboluri.length} simboluri verificate`);
}

function start() {
  setTimeout(runFillPass, FIRST_RUN_DELAY_MS);
  setInterval(runFillPass, FILL_INTERVAL_MS);
}

module.exports = { start };

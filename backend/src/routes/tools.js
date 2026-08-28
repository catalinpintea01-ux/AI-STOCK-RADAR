const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isPremium } = require("../services/stripe");
const { getMockStock } = require("../mockData/stocks");
const { getOrComputeRadarScore } = require("../services/radar");
const { getStock } = require("../services/marketData");

const router = express.Router();

// Tool-urile Pro sunt exclusiv Premium — verificarea stă pe server, nu doar
// în UI, ca gating-ul să nu poată fi ocolit apelând API-ul direct.
async function requirePremium(req, res, next) {
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (!isPremium(subscription)) {
    return res.status(402).json({
      error: "Tool disponibil doar cu abonamentul Premium.",
      limitaAtinsa: true,
    });
  }
  next();
}

// Top-ul e vizibil și pe planul gratuit — teaser real (citire pură din cache,
// cost zero); screener-ul și comparatorul rămân exclusiv Premium, per-rută.
router.use(requireAuth);

function imbogateste(s) {
  const mock = getMockStock(s.simbol);
  return {
    simbol: s.simbol,
    nume: mock?.nume || s.simbol,
    sector: mock?.sector || "Altele",
    scorCompozit: s.scorCompozit,
    verdict: s.verdict,
    incredere: s.incredere,
    scorAnalist: s.scorAnalist,
    scorMomentum: s.scorMomentum,
    scorFundamental: s.scorFundamental,
    scorRisc: s.scorRisc,
  };
}

// Top 5 scoruri AI din tot ce e deja analizat — citire pură din cache-ul de
// scoruri, zero apeluri externe. Ranking descriptiv, nu listă de cumpărat.
router.get("/top", async (req, res) => {
  const scoruri = await prisma.radarScore.findMany({
    orderBy: { scorCompozit: "desc" },
    take: 5,
  });
  res.json({ top: scoruri.map(imbogateste) });
});

// Screener pe scorurile deja calculate: verdict + sector + scor minim +
// criteriu de sortare. Filtrarea/sortarea se fac în memorie (sectorul vine
// din universul curat, nu din DB) — la <100 de scoruri e neglijabil.
const SORT_KEYS = {
  compozit: (s) => -s.scorCompozit,
  analist: (s) => -s.scorAnalist,
  momentum: (s) => -s.scorMomentum,
  fundamental: (s) => -s.scorFundamental,
  risc: (s) => s.scorRisc, // crescător: risc mic primul
};

router.get("/screener", requirePremium, async (req, res) => {
  const { verdict, sector, minScor, sort } = req.query;
  const scoruri = await prisma.radarScore.findMany();

  const cheie = SORT_KEYS[sort] || SORT_KEYS.compozit;
  const rezultate = scoruri
    .map(imbogateste)
    .filter((s) => {
      if (verdict && s.verdict !== verdict) return false;
      if (sector && s.sector !== sector) return false;
      if (minScor && s.scorCompozit < Number(minScor)) return false;
      return true;
    })
    .sort((a, b) => cheie(a) - cheie(b))
    .slice(0, 20);

  res.json({ rezultate, totalAnalizate: scoruri.length });
});

// Radarul insiderilor: companiile din tot ce a analizat AI-ul unde directorii
// au cumpărat/vândut net propriile acțiuni în ultimele 90 de zile (raportări
// SEC publice, agregate la fiecare recalcul de scor). Pur descriptiv.
router.get("/insideri", requirePremium, async (req, res) => {
  const scoruri = await prisma.radarScore.findMany();

  const randuri = scoruri
    .map((s) => {
      try {
        const d = JSON.parse(s.sursaDate);
        if (typeof d.insiderNet90d !== "number") return null;
        return {
          ...imbogateste(s),
          cumparari: d.insiderCumparari90d || 0,
          vanzari: d.insiderVanzari90d || 0,
          net: d.insiderNet90d,
        };
      } catch {
        return null;
      }
    })
    .filter((r) => r && r.cumparari + r.vanzari > 0);

  const cumparate = randuri.filter((r) => r.net > 0).sort((a, b) => b.net - a.net).slice(0, 8);
  const vandute = randuri.filter((r) => r.net < 0).sort((a, b) => a.net - b.net).slice(0, 5);

  res.json({ cumparate, vandute, disponibile: randuri.length });
});

function comparaScor(eticheta, a, b, simbolA, simbolB) {
  if (a === b) return `${eticheta}: egalitate (${a}/100).`;
  const castiga = a > b ? simbolA : simbolB;
  return `${eticheta}: ${castiga} punctează mai sus (${Math.max(a, b)} vs ${Math.min(a, b)}).`;
}

// Comparator A vs B: calculează (sau ia din cache) scorurile ambelor și
// descrie diferențele determinist — fără Claude, deci funcționează identic
// și când creditul AI lipsește. Limbaj strict descriptiv.
router.get("/compare", requirePremium, async (req, res) => {
  const a = String(req.query.a || "").toUpperCase().trim();
  const b = String(req.query.b || "").toUpperCase().trim();
  if (!a || !b) return res.status(400).json({ error: "Introdu ambele simboluri." });
  if (a === b) return res.status(400).json({ error: "Alege două simboluri diferite." });

  try {
    const [ra, rb] = await Promise.all([getOrComputeRadarScore(a), getOrComputeRadarScore(b)]);
    // Cotații live doar pentru cele 2 simboluri — ieftin și face comparația
    // completă (scor + preț + variație + sector), nu doar scoruri.
    const [qa, qb] = await Promise.all([getStock(a), getStock(b)]);

    const strip = (r, q) => ({
      simbol: r.simbol,
      nume: getMockStock(r.simbol)?.nume || r.simbol,
      sector: getMockStock(r.simbol)?.sector || "—",
      pret: q?.pret ?? null,
      variatieProcent: q?.variatieProcent ?? null,
      scorCompozit: r.scorCompozit,
      verdict: r.verdict,
      incredere: r.incredere,
      scorAnalist: r.scorAnalist,
      scorMomentum: r.scorMomentum,
      scorFundamental: r.scorFundamental,
      scorRisc: r.scorRisc,
    });

    const diferente = [
      comparaScor("Scor compozit", ra.scorCompozit, rb.scorCompozit, a, b),
      comparaScor("Tendința analiștilor", ra.scorAnalist, rb.scorAnalist, a, b),
      comparaScor("Momentum de preț", ra.scorMomentum, rb.scorMomentum, a, b),
      comparaScor("Semnale fundamentale", ra.scorFundamental, rb.scorFundamental, a, b),
      ra.scorRisc === rb.scorRisc
        ? `Risc: egalitate (${ra.scorRisc}/100).`
        : `Risc: ${ra.scorRisc < rb.scorRisc ? a : b} are scorul de risc mai scăzut (${Math.min(ra.scorRisc, rb.scorRisc)} vs ${Math.max(ra.scorRisc, rb.scorRisc)}).`,
    ];

    res.json({ a: strip(ra, qa), b: strip(rb, qb), diferente });
  } catch (err) {
    console.error(`[tools] comparare ${a} vs ${b}: ${err.message}`);
    res.status(404).json({ error: "Nu am putut calcula scorurile — verifică simbolurile." });
  }
});

module.exports = router;

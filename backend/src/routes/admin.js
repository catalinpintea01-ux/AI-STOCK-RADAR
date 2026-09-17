const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isPremium } = require("../services/stripe");

const router = express.Router();

// Adresele cu drept de administrare — verificarea stă pe server (403), nu în
// UI. Suplimentabile prin env ADMIN_EMAILS (listă separată prin virgulă).
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "catalinpintea01@gmail.com,catalinpintea01+resetare@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);

// Conturile de test create pe parcursul dezvoltării — marcate în răspuns, ca
// cifrele "reale" să fie citibile dintr-o privire.
function esteCondTest(email) {
  return /@example\.com$/i.test(email) || /\+resetare@/i.test(email) || /^test-/i.test(email);
}

async function requireAdmin(req, res, next) {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } });
  if (!user || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
    return res.status(403).json({ error: "Pagina de administrare nu este disponibilă pentru acest cont." });
  }
  next();
}

router.use(requireAuth, requireAdmin);

router.get("/rezumat", async (req, res) => {
  const de14Zile = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const [utilizatori, waitlist, subscriptii, evenimente] = await Promise.all([
    prisma.user.findMany({ select: { email: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.premiumWaitlist.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.subscription.findMany(),
    prisma.eveniment.groupBy({
      by: ["tip"],
      where: { createdAt: { gte: de14Zile } },
      _count: { _all: true },
    }),
  ]);

  // Pâlnia ultimelor 14 zile, în ordinea pașilor — zero dacă n-a trecut nimeni.
  const nrEvenimente = Object.fromEntries(evenimente.map((e) => [e.tip, e._count._all]));
  const palnie = ["landing", "demo_ticker", "demo_cta", "register_view", "register_done"].map((tip) => ({
    tip,
    numar: nrEvenimente[tip] || 0,
  }));

  const subPeUser = new Map(subscriptii.map((s) => [s.userId, s]));
  const premiumActive = subscriptii.filter((s) => isPremium(s)).length;

  const reali = utilizatori.filter((u) => !esteCondTest(u.email));

  // Conturi noi pe zi, ultimele 14 zile (inclusiv zilele cu zero).
  const peZile = [];
  const azi = new Date();
  azi.setHours(0, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const start = new Date(azi.getTime() - i * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    peZile.push({
      zi: start.toISOString().slice(0, 10),
      conturi: utilizatori.filter((u) => u.createdAt >= start && u.createdAt < end).length,
    });
  }

  res.json({
    totalConturi: utilizatori.length,
    conturiReale: reali.length,
    premiumActive,
    preinregistrati: waitlist.length,
    peZile,
    palnie,
    loginViews14z: nrEvenimente.login_view || 0,
    waitlist: waitlist.map((w, i) => ({
      pozitie: i + 1,
      email: w.email,
      createdAt: w.createdAt,
      test: esteCondTest(w.email),
    })),
    conturiRecente: utilizatori.slice(0, 20).map((u) => ({
      email: u.email,
      createdAt: u.createdAt,
      test: esteCondTest(u.email),
    })),
  });
});

module.exports = { router, ADMIN_EMAILS };

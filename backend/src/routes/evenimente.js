const express = require("express");
const prisma = require("../db");

const router = express.Router();

// Pâlnia de conversie: evenimente anonime trimise de frontend (fără cont,
// fără cookie, fără IP stocat). Lista de tipuri e închisă — orice altceva
// e ignorat cu 204, ca endpoint-ul public să nu poată fi umplut cu gunoi.
const TIPURI = new Set(["landing", "demo_ticker", "demo_cta", "register_view", "login_view", "register_done"]);

router.post("/", async (req, res) => {
  const tip = typeof req.body?.tip === "string" ? req.body.tip : "";
  if (!TIPURI.has(tip)) return res.status(204).end();

  const simbolBrut = typeof req.body?.simbol === "string" ? req.body.simbol.toUpperCase() : "";
  const simbol = /^[A-Z.]{1,6}$/.test(simbolBrut) ? simbolBrut : null;

  try {
    await prisma.eveniment.create({ data: { tip, simbol } });
  } catch (err) {
    console.error(`[evenimente] ${err.message}`);
  }
  res.status(204).end();
});

module.exports = router;

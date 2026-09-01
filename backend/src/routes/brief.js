const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isPremium } = require("../services/stripe");
const { getDailyBrief } = require("../services/dailyBrief");
const { getBriefPersonal } = require("../services/briefPersonal");

const router = express.Router();

// Briefingul de dimineață — disponibil tuturor utilizatorilor logați (feature
// de retenție, nu de monetizare). Limba vine din X-Limba (req.limba).
router.get("/", requireAuth, async (req, res) => {
  try {
    const brief = await getDailyBrief(req.limba);
    res.json(brief);
  } catch (err) {
    console.error(`[brief] eroare: ${err.message}`);
    res.status(500).json({ error: "Briefingul zilei nu e disponibil momentan." });
  }
});

// Brieful personal al watchlist-ului: Premium = generat AI (cache 1/zi în
// DB), gratuit = sinteza deterministă. Ambele primesc 200 — diferă conținutul.
router.get("/personal", requireAuth, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
    const brief = await getBriefPersonal(req.userId, req.limba, isPremium(subscription));
    res.json(brief);
  } catch (err) {
    console.error(`[brief-personal] eroare: ${err.message}`);
    res.status(500).json({ error: "Brieful personal nu e disponibil momentan." });
  }
});

module.exports = router;

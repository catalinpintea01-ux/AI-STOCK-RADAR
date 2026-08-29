const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { getDailyBrief } = require("../services/dailyBrief");

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

module.exports = router;

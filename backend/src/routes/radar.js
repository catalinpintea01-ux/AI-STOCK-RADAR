const express = require("express");
const { getAcuratete } = require("../services/evaluareRadar");

const router = express.Router();

// Public (fără autentificare): landing-ul afișează acuratețea și ponderile
// curente ale radarului. Doar statistici agregate — niciun date de utilizator.
router.get("/acuratete", async (req, res) => {
  try {
    res.json(await getAcuratete());
  } catch (err) {
    console.error(`[radar] acuratete: ${err.message}`);
    res.status(500).json({ error: "Statistica nu e disponibilă momentan." });
  }
});

module.exports = router;

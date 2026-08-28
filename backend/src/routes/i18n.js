const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { traduceTexte } = require("../services/i18nContent");

const router = express.Router();

// TTL lung: textele trimise aici sunt conținut static de interfață/educativ
// (pagini, quiz-uri, descrieri de teme) — nu se schimbă între release-uri.
const TTL_STATIC_MS = 7 * 24 * 60 * 60 * 1000;

const MAX_TEXTE = 120;
const MAX_CHARS = 60_000;

// Traducerea la cerere a textelor statice din frontend, în limba interfeței
// (X-Limba). La orice problemă (fără credit, limită, eroare) răspundem cu
// textele originale — pagina rămâne funcțională în română, niciodată eroare.
router.post("/translate", requireAuth, async (req, res) => {
  const texte = Array.isArray(req.body.texte) ? req.body.texte : [];
  const valide =
    texte.length > 0 &&
    texte.length <= MAX_TEXTE &&
    texte.every((t) => typeof t === "string") &&
    texte.reduce((s, t) => s + t.length, 0) <= MAX_CHARS;

  if (!valide) {
    return res.json({ texte, limba: req.limba });
  }

  const traduse = await traduceTexte(texte, req.limba, TTL_STATIC_MS);
  res.json({ texte: traduse || texte, limba: req.limba });
});

module.exports = router;

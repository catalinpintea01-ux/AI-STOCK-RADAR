const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { isPremium } = require("../services/stripe");

const router = express.Router();
router.use(requireAuth);

const TEZA_MAX = 2000;

// Citirea propriei narative e liberă (frontend-ul decide ce afișează);
// scrierea e Premium — verificat pe server, nu doar în UI.
router.get("/:simbol", async (req, res) => {
  const simbol = req.params.simbol.toUpperCase();
  const [narativa, subscription] = await Promise.all([
    prisma.narativa.findUnique({ where: { userId_simbol: { userId: req.userId, simbol } } }),
    prisma.subscription.findUnique({ where: { userId: req.userId } }),
  ]);
  res.json({ narativa, premium: isPremium(subscription) });
});

router.put("/:simbol", async (req, res) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (!isPremium(subscription)) {
    return res.status(402).json({ error: "Narativele sunt disponibile cu abonamentul Premium.", limitaAtinsa: true });
  }

  const simbol = req.params.simbol.toUpperCase();
  const teza = String(req.body.teza || "").trim();
  if (!teza) {
    await prisma.narativa.deleteMany({ where: { userId: req.userId, simbol } });
    return res.json({ narativa: null });
  }
  if (teza.length > TEZA_MAX) {
    return res.status(400).json({ error: `Narativa poate avea maximum ${TEZA_MAX} de caractere.` });
  }

  // Instantaneul scorurilor de la momentul scrierii — reperul față de care
  // UI-ul arată determinist "ce s-a schimbat de când ți-ai scris teza".
  const radar = await prisma.radarScore.findUnique({ where: { simbol } });

  const narativa = await prisma.narativa.upsert({
    where: { userId_simbol: { userId: req.userId, simbol } },
    update: { teza, scorInitial: radar?.scorCompozit ?? null, momentumInitial: radar?.scorMomentum ?? null },
    create: {
      userId: req.userId,
      simbol,
      teza,
      scorInitial: radar?.scorCompozit ?? null,
      momentumInitial: radar?.scorMomentum ?? null,
    },
  });

  res.json({ narativa });
});

module.exports = router;

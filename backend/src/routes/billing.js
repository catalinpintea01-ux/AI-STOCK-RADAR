const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { stripe, getOrCreateCustomer, isPremium, TRIAL_DAYS } = require("../services/stripe");

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

router.get("/status", requireAuth, async (req, res) => {
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  res.json({
    plan: subscription?.plan || "free",
    status: subscription?.status || "inactive",
    premium: isPremium(subscription),
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
  });
});

// ── Preînregistrare Premium ──────────────────────────────────────────────
// Până la trecerea Stripe pe live nu încasăm bani: strângem doar emailuri
// pentru acces prioritar la lansare (+ oferta primilor utilizatori).

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.get("/waitlist", requireAuth, async (req, res) => {
  const [inscriere, user, total] = await Promise.all([
    prisma.premiumWaitlist.findUnique({ where: { userId: req.userId } }),
    prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } }),
    prisma.premiumWaitlist.count(),
  ]);

  let pozitie = null;
  if (inscriere) {
    pozitie = (await prisma.premiumWaitlist.count({ where: { createdAt: { lte: inscriere.createdAt } } }));
  }

  res.json({
    inscris: Boolean(inscriere),
    email: inscriere?.email || user?.email || "",
    pozitie,
    total,
  });
});

router.post("/waitlist", requireAuth, async (req, res) => {
  const emailBrut = String(req.body?.email || "").trim().toLowerCase();
  let email = emailBrut;
  if (!email) {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } });
    email = user?.email || "";
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Adresa de email nu pare validă." });
  }

  const inscriere = await prisma.premiumWaitlist.upsert({
    where: { userId: req.userId },
    update: { email },
    create: { userId: req.userId, email },
  });

  const pozitie = await prisma.premiumWaitlist.count({ where: { createdAt: { lte: inscriere.createdAt } } });
  const total = await prisma.premiumWaitlist.count();
  res.json({ inscris: true, email, pozitie, total });
});

router.post("/checkout", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Plățile nu sunt configurate momentan" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });

  if (isPremium(subscription)) {
    return res.status(400).json({ error: "Ai deja abonamentul Premium activ" });
  }

  const customerId = await getOrCreateCustomer(user, subscription || {});
  if (!subscription?.stripeCustomerId) {
    await prisma.subscription.update({
      where: { userId: req.userId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    // Trial de 3 zile cu cardul introdus la checkout: Stripe colectează cardul
    // acum și pornește facturarea automat la finalul trialului, dacă nu anulează.
    subscription_data: { trial_period_days: TRIAL_DAYS },
    success_url: `${FRONTEND_URL}/portofoliu?plata=succes`,
    cancel_url: `${FRONTEND_URL}/portofoliu?plata=anulat`,
    metadata: { userId: req.userId },
  });

  res.json({ url: session.url });
});

router.post("/portal", requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Plățile nu sunt configurate momentan" });
  }

  const subscription = await prisma.subscription.findUnique({ where: { userId: req.userId } });
  if (!subscription?.stripeCustomerId) {
    return res.status(400).json({ error: "Nu ai niciun abonament de gestionat" });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${FRONTEND_URL}/portofoliu`,
  });

  res.json({ url: session.url });
});

module.exports = router;

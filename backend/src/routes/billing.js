const express = require("express");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");
const { stripe, getOrCreateCustomer, isPremium } = require("../services/stripe");

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

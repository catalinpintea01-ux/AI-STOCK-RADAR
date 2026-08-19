const express = require("express");
const prisma = require("../db");
const { stripe } = require("../services/stripe");

const router = express.Router();

async function updateFromStripeSubscription(customerId, stripeSub) {
  const subscription = await prisma.subscription.findFirst({ where: { stripeCustomerId: customerId } });
  if (!subscription) return;

  const active = ["active", "trialing"].includes(stripeSub.status);

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      plan: active ? "premium" : "free",
      status: stripeSub.status,
      stripeSubscriptionId: stripeSub.id,
      currentPeriodEnd: stripeSub.current_period_end
        ? new Date(stripeSub.current_period_end * 1000)
        : null,
    },
  });
}

router.post("/stripe", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(503).send("Plățile nu sunt configurate");

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature invalid: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.subscription) {
          const stripeSub = await stripe.subscriptions.retrieve(session.subscription);
          await updateFromStripeSubscription(session.customer, stripeSub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const stripeSub = event.data.object;
        await updateFromStripeSubscription(stripeSub.customer, stripeSub);
        break;
      }
      case "customer.subscription.deleted": {
        const stripeSub = event.data.object;
        const subscription = await prisma.subscription.findFirst({
          where: { stripeCustomerId: stripeSub.customer },
        });
        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { plan: "free", status: "canceled", currentPeriodEnd: null },
          });
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error("Eroare la procesarea webhook-ului Stripe:", err);
    res.status(500).json({ error: "Eroare internă" });
  }
});

module.exports = router;

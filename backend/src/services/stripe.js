const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PREMIUM_WATCHLIST_LIMIT = 3; // planul gratuit: 3 acțiuni urmărite
const TRIAL_DAYS = 3; // Premium începe cu 3 zile gratuite, cu cardul introdus la activare

async function getOrCreateCustomer(user, subscription) {
  if (subscription.stripeCustomerId) return subscription.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  return customer.id;
}

function isPremium(subscription) {
  // "trialing" = perioada gratuită de 3 zile cu cardul salvat — acces complet,
  // exact ca "active" (webhook-ul o marchează deja ca plan "premium").
  return subscription?.plan === "premium" && ["active", "trialing"].includes(subscription?.status);
}

module.exports = { stripe, getOrCreateCustomer, isPremium, PREMIUM_WATCHLIST_LIMIT, TRIAL_DAYS };

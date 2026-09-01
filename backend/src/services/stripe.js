const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PREMIUM_WATCHLIST_LIMIT = 3; // planul gratuit: 3 acțiuni urmărite
const TRIAL_DAYS = 3; // Premium începe cu 3 zile gratuite, cu cardul introdus la activare

// Prețurile în USD — monedă universală pentru publicul global: $29/lună și
// $290/an (2 luni gratuite). Se creează programatic în Stripe la prima
// cerere (pe același produs ca prețul istoric din STRIPE_PRICE_ID,
// identificate prin lookup_key) — zero configurare manuală în dashboard,
// funcționează identic în test și în live.
const PRETURI = {
  lunar: { lookupKey: "premium_lunar_usd", centi: 2900, interval: "month", nickname: "Premium lunar ($29)" },
  anual: { lookupKey: "premium_anual_usd", centi: 29000, interval: "year", nickname: "Premium anual ($290)" },
};
const priceIdCache = new Map();

async function getPriceId(plan) {
  const cfg = PRETURI[plan] || PRETURI.lunar;
  if (priceIdCache.has(cfg.lookupKey)) return priceIdCache.get(cfg.lookupKey);

  const existente = await stripe.prices.list({ lookup_keys: [cfg.lookupKey], limit: 1 });
  if (existente.data.length > 0) {
    priceIdCache.set(cfg.lookupKey, existente.data[0].id);
    return existente.data[0].id;
  }

  const istoric = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
  const creat = await stripe.prices.create({
    product: typeof istoric.product === "string" ? istoric.product : istoric.product.id,
    currency: "usd",
    unit_amount: cfg.centi,
    recurring: { interval: cfg.interval },
    lookup_key: cfg.lookupKey,
    nickname: cfg.nickname,
  });
  priceIdCache.set(cfg.lookupKey, creat.id);
  return creat.id;
}

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

module.exports = { stripe, getOrCreateCustomer, getPriceId, isPremium, PREMIUM_WATCHLIST_LIMIT, TRIAL_DAYS };

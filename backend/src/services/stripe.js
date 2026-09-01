const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PREMIUM_WATCHLIST_LIMIT = 3; // planul gratuit: 3 acțiuni urmărite
const TRIAL_DAYS = 3; // Premium începe cu 3 zile gratuite, cu cardul introdus la activare

// Planul anual: 299,99 RON/an (~2 luni gratuite față de 12 × 29,99). Prețul
// se creează programatic în Stripe la prima cerere (același produs ca cel
// lunar, identificat prin lookup_key) — zero configurare manuală în dashboard,
// funcționează identic în test și în live.
const ANUAL_LOOKUP_KEY = "premium_anual";
const ANUAL_RON_BANI = 29999;
let anualPriceIdCache = null;

async function getAnnualPriceId() {
  if (anualPriceIdCache) return anualPriceIdCache;

  const existente = await stripe.prices.list({ lookup_keys: [ANUAL_LOOKUP_KEY], limit: 1 });
  if (existente.data.length > 0) {
    anualPriceIdCache = existente.data[0].id;
    return anualPriceIdCache;
  }

  const lunar = await stripe.prices.retrieve(process.env.STRIPE_PRICE_ID);
  const creat = await stripe.prices.create({
    product: typeof lunar.product === "string" ? lunar.product : lunar.product.id,
    currency: "ron",
    unit_amount: ANUAL_RON_BANI,
    recurring: { interval: "year" },
    lookup_key: ANUAL_LOOKUP_KEY,
    nickname: "Premium anual",
  });
  anualPriceIdCache = creat.id;
  return anualPriceIdCache;
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

module.exports = { stripe, getOrCreateCustomer, getAnnualPriceId, isPremium, PREMIUM_WATCHLIST_LIMIT, TRIAL_DAYS };

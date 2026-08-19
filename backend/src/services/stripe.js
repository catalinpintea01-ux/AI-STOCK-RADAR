const Stripe = require("stripe");

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PREMIUM_WATCHLIST_LIMIT = 5;

async function getOrCreateCustomer(user, subscription) {
  if (subscription.stripeCustomerId) return subscription.stripeCustomerId;

  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  return customer.id;
}

function isPremium(subscription) {
  return subscription?.plan === "premium" && subscription?.status === "active";
}

module.exports = { stripe, getOrCreateCustomer, isPremium, PREMIUM_WATCHLIST_LIMIT };

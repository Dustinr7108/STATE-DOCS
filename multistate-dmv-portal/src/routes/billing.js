import express from "express";
import Stripe from "stripe";

const router = express.Router();

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("xxx")) return null;
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

router.post("/api/billing/checkout", express.json({ limit: "20kb" }), async (req, res) => {
  const stripe = stripeClient();
  if (!stripe || !process.env.STRIPE_PRICE_ID || !process.env.CLIENT_URL) {
    return res.status(503).json({
      error: "Card checkout is not configured. Record packets do not require a subscription.",
    });
  }
  try {
    const { email, userId } = req.body || {};
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      metadata: { userId: userId || "" },
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Checkout could not be started." });
  }
});

router.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const stripe = stripeClient();
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: "Billing webhook is not configured." });
  }
  const signature = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  res.json({ received: true, type: event.type });
});

export default router;

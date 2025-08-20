import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

router.use(express.json());

// Create checkout session for subscription (trial set on Price in dashboard)
router.post("/api/billing/checkout", async (req, res) => {
  try {
    const { email, userId } = req.body;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/billing/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/billing/cancel`,
      metadata: { userId }
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Webhook must use raw body
router.post("/api/billing/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        // TODO: mark userId as active in your DB, store s.customer & s.subscription
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        // TODO: set status = sub.status for the subscription
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        // TODO: set status = canceled
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        // TODO: set status = past_due for invoice.subscription
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Webhook handler error");
  }
});

export default router;

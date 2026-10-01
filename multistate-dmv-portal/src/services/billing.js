import Stripe from "stripe";
import { envValue } from "./env.js";

const PLACEHOLDER = /xxx|your_|replace/i;

function stripeConfig() {
  const secret = envValue("STRIPE_SECRET_KEY");
  const price = envValue("STRIPE_PRICE_ID");
  const webhookSecret = envValue("STRIPE_WEBHOOK_SECRET");
  const ready = Boolean(secret && price) && !PLACEHOLDER.test(secret) && !PLACEHOLDER.test(price);
  return { secret, price, webhookSecret, ready };
}

let stripeClient;

function stripe() {
  const { secret, ready } = stripeConfig();
  if (!ready) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secret, { apiVersion: "2024-06-20" });
  }
  return stripeClient;
}

export function billingStatus() {
  const { ready } = stripeConfig();
  return {
    status: 200,
    body: {
      configured: ready,
      plan: "7-day trial, then $19.99 per month",
    },
  };
}

export async function createCheckout({ email, userId, origin }) {
  const client = stripe();
  const { price } = stripeConfig();
  if (!client) {
    return {
      status: 503,
      body: {
        error: "Billing is not configured yet. Add STRIPE_SECRET_KEY and STRIPE_PRICE_ID to turn on checkout.",
      },
    };
  }

  const normalized = String(email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { status: 400, body: { error: "Enter a valid email address." } };
  }

  const base = (envValue("CLIENT_URL") || origin || "").replace(/\/$/, "");
  if (!base) {
    return { status: 500, body: { error: "CLIENT_URL is not set." } };
  }

  try {
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      customer_email: normalized,
      line_items: [{ price, quantity: 1 }],
      success_url: `${base}/billing/success?sid={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/billing/cancel`,
      metadata: { userId: String(userId || "guest") },
    });
    return { status: 200, body: { url: session.url } };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "Failed to create checkout session" } };
  }
}

export async function receiveWebhook(rawBody, signature) {
  const client = stripe();
  const { webhookSecret } = stripeConfig();
  if (!client || !webhookSecret || PLACEHOLDER.test(webhookSecret)) {
    return { status: 503, body: { error: "Webhook secret is not configured." } };
  }

  let event;
  try {
    event = client.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return { status: 400, body: `Webhook Error: ${error.message}`, raw: true };
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "invoice.payment_failed":
    case "customer.subscription.trial_will_end":
      console.log(`Stripe event ${event.type} received`);
      break;
    default:
      break;
  }

  return { status: 200, body: { received: true } };
}

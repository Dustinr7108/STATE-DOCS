import express from "express";
import { billingStatus, createCheckout, receiveWebhook } from "../services/billing.js";

const router = express.Router();

router.get("/api/billing/status", (req, res) => {
  const result = billingStatus();
  res.status(result.status).json(result.body);
});

router.post("/api/billing/checkout", express.json(), async (req, res) => {
  const origin = `${req.protocol}://${req.get("host")}`;
  const result = await createCheckout({ ...req.body, origin });
  res.status(result.status).json(result.body);
});

router.post("/api/billing/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
  const result = await receiveWebhook(raw, req.headers["stripe-signature"]);
  if (result.raw) return res.status(result.status).send(result.body);
  res.status(result.status).json(result.body);
});

export default router;

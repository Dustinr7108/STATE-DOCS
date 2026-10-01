import express from "express";
import { feesFor, getService, listServices, MEMBERSHIP } from "../fees/schedule.js";
import requireActiveMembership from "../auth/requireActiveMembership.js";

const router = express.Router();

router.get("/api/services", requireActiveMembership, (req, res) => {
  res.json({ membership: MEMBERSHIP, services: listServices() });
});

router.get("/api/services/:id", requireActiveMembership, (req, res) => {
  const service = getService(req.params.id);
  if (!service) return res.status(404).json({ error: "Unknown service" });
  res.json(service);
});

router.get("/api/fees", requireActiveMembership, (req, res) => {
  const record = req.query.record;
  if (!record) return res.json({ membership: MEMBERSHIP, services: listServices() });
  res.json(feesFor(String(record)));
});

router.get("/api/fees/:recordId", requireActiveMembership, (req, res) => {
  res.json(feesFor(req.params.recordId));
});

export default router;

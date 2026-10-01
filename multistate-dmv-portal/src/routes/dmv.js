import express from "express";
import { generatePacket, getSchema, listStates } from "../services/dmv.js";
import requireActiveMembership from "../auth/requireActiveMembership.js";

const router = express.Router();

router.get("/api/dmv/states", requireActiveMembership, (req, res) => {
  res.json({ states: listStates() });
});

router.get("/api/dmv/schema/:state/:type", requireActiveMembership, (req, res) => {
  const result = getSchema(req.params.state, req.params.type);
  res.status(result.status).json(result.body);
});

router.post("/api/dmv/generate/:state/:type", requireActiveMembership, express.json(), async (req, res) => {
  const result = await generatePacket(req.params.state, req.params.type, req.body);
  res.status(result.status).json(result.body);
});

export default router;

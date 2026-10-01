import express from "express";
import { generateRecord, getRecordSchema, listCatalog } from "../services/records.js";
import requireActiveMembership from "../auth/requireActiveMembership.js";

const router = express.Router();

router.get("/api/records", requireActiveMembership, (req, res) => {
  res.json({ records: listCatalog() });
});

router.get("/api/records/schema/:id", requireActiveMembership, (req, res) => {
  const result = getRecordSchema(req.params.id, req.query.state);
  res.status(result.status).json(result.body);
});

router.post("/api/records/generate/:id", requireActiveMembership, express.json(), async (req, res) => {
  const result = await generateRecord(req.params.id, req.body);
  res.status(result.status).json(result.body);
});

export default router;

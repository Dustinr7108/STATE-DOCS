import express from "express";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { DMV_REGISTRY } from "../states/index.js";
import { buildPacket } from "../utils/packet.js";
import requireActiveMembership from "../auth/requireActiveMembership.js";

const router = express.Router();
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Return JSON schema for the selected state & request type
router.get("/api/dmv/schema/:state/:type", requireActiveMembership, (req, res) => {
  const { state, type } = req.params;
  const adapter = DMV_REGISTRY.get(state.toUpperCase());
  if (!adapter || !adapter.schema[type]) return res.status(404).json({ error: "Unsupported state/type" });
  res.json(adapter.schema[type]);
});

// Generate packet (PDFs + cover sheet + next steps)
router.post("/api/dmv/generate/:state/:type", requireActiveMembership, express.json(), async (req, res) => {
  const { state, type } = req.params;
  const adapter = DMV_REGISTRY.get(state.toUpperCase());
  if (!adapter) return res.status(404).json({ error: "Unsupported state" });

  const schema = adapter.schema?.[type];
  if (!schema) return res.status(400).json({ error: "Unsupported request type" });

  const validate = ajv.compile(schema);
  const valid = validate(req.body);
  if (!valid) return res.status(400).json({ error: "Validation failed", details: validate.errors });

  try {
    const result = await buildPacket(adapter, type, req.body);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to build packet" });
  }
});

export default router;

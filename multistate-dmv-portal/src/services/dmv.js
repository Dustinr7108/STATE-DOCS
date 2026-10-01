import Ajv from "ajv";
import addFormats from "ajv-formats";
import { DMV_REGISTRY } from "../states/index.js";
import { buildPacket } from "../utils/packet.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();

export function listStates() {
  return [...DMV_REGISTRY.values()].map((adapter) => ({
    state: adapter.state,
    displayName: adapter.displayName,
    supports: Object.keys(adapter.schema || {}),
    requiresNotary: adapter.requiresNotary,
    fees: adapter.fees,
    submission: {
      channel: adapter.submission.channel,
      portalUrl: adapter.submission.portalUrl || null,
    },
  }));
}

export function getSchema(state, type) {
  const adapter = DMV_REGISTRY.get(String(state || "").toUpperCase());
  const schema = adapter?.schema?.[type];
  if (!adapter || !schema) {
    return { status: 404, body: { error: "Unsupported state or request type" } };
  }
  return {
    status: 200,
    body: {
      state: adapter.state,
      displayName: adapter.displayName,
      type,
      fees: adapter.fees,
      requiresNotary: adapter.requiresNotary,
      submission: adapter.submission,
      schema,
    },
  };
}

export async function generatePacket(state, type, data) {
  const adapter = DMV_REGISTRY.get(String(state || "").toUpperCase());
  if (!adapter) return { status: 404, body: { error: "Unsupported state" } };
  const schema = adapter.schema?.[type];
  if (!schema) return { status: 400, body: { error: "Unsupported request type" } };

  const key = `${adapter.state}:${type}`;
  if (!validators.has(key)) validators.set(key, ajv.compile(schema));
  const validate = validators.get(key);
  const payload = data && typeof data === "object" ? data : {};
  if (!validate(payload)) {
    return { status: 400, body: { error: "Validation failed", details: validate.errors } };
  }

  try {
    const packet = await buildPacket(adapter, type, payload);
    return { status: 200, body: packet };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "Failed to build packet" } };
  }
}

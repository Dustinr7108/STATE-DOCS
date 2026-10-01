import Ajv from "ajv";
import addFormats from "ajv-formats";
import { DMV_REGISTRY } from "../states/index.js";
import { US_STATES } from "../states/us.js";
import { buildPacket } from "../utils/packet.js";
import { feesFor } from "../fees/schedule.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();

export function listPlaces() {
  return US_STATES.map((place) => ({
    code: place.code,
    name: place.name,
    vitalRecordsUrl: place.cdcUrl,
    motorVehicleUrl: place.dmvUrl,
  }));
}

export function listStates() {
  return [...DMV_REGISTRY.values()]
    .filter((adapter) => adapter.state !== "XX")
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((adapter) => ({
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
      pricing: feesFor(`dmv:${adapter.state}:${type}`),
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
    const pricing = feesFor(`dmv:${adapter.state}:${type}`);
    const packet = await buildPacket({ ...adapter, fees: pricing }, type, payload);
    return { status: 200, body: { ...packet, pricing } };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "Failed to build packet", detail: error.message } };
  }
}

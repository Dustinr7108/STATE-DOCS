import Ajv from "ajv";
import addFormats from "ajv-formats";
import { RECORD_REGISTRY } from "../records/catalog.js";
import { DMV_REGISTRY } from "../states/index.js";
import { buildPacket } from "../utils/packet.js";
import { feesFor } from "../fees/schedule.js";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();

export function listCatalog() {
  const motor = [...DMV_REGISTRY.values()].flatMap((adapter) =>
    Object.keys(adapter.schema || {}).map((type) => ({
      id: `dmv:${adapter.state}:${type}`,
      kind: "dmv",
      group: "Motor vehicle",
      label: `${type.replaceAll("_", " ")} (${adapter.displayName})`,
      summary: adapter.state === "XX"
        ? "Demo template only. It is not a real state filing."
        : `Prepare a ${type.replaceAll("_", " ")} packet for ${adapter.displayName}.`,
      limit: "You still submit the official form yourself.",
      state: adapter.state,
      type,
    }))
  );

  const records = [...RECORD_REGISTRY.values()].map((record) => ({
    id: record.id,
    kind: "record",
    group: record.group,
    label: record.label,
    summary: record.summary,
    limit: record.limit,
  }));

  return [...records, ...motor];
}

export function getRecordSchema(id) {
  const record = RECORD_REGISTRY.get(String(id || ""));
  if (!record) return { status: 404, body: { error: "Unsupported record" } };
  return {
    status: 200,
    body: {
      id: record.id,
      displayName: record.displayName,
      summary: record.summary,
      limit: record.limit,
      fees: record.fees,
      pricing: feesFor(record.id),
      submission: record.submission,
      schema: record.schema,
    },
  };
}

export async function generateRecord(id, data) {
  const record = RECORD_REGISTRY.get(String(id || ""));
  if (!record) return { status: 404, body: { error: "Unsupported record" } };

  if (!validators.has(record.id)) validators.set(record.id, ajv.compile(record.schema));
  const payload = data && typeof data === "object" ? data : {};
  const validate = validators.get(record.id);
  if (!validate(payload)) {
    return { status: 400, body: { error: "Validation failed", details: validate.errors } };
  }

  try {
    const pricing = feesFor(record.id);
    const packet = await buildPacket({ ...record, fees: pricing }, record.id, payload);
    return { status: 200, body: { ...packet, pricing } };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "Failed to build packet", detail: error.message } };
  }
}

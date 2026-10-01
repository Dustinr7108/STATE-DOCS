import Ajv from "ajv";
import addFormats from "ajv-formats";
import { RECORD_REGISTRY } from "../records/catalog.js";
import { DMV_REGISTRY } from "../states/index.js";
import { normalizeState, stateByCode } from "../states/us.js";
import { buildPacket } from "../utils/packet.js";
import { feesFor } from "../fees/schedule.js";

function recordTitle(record, state) {
  const place = stateByCode(normalizeState(state));
  if (!place || !PLACE_RECORDS.has(record.id)) return record.displayName;
  return `${record.displayName} — ${place.name}`;
}

function submissionFor(record, pricing) {
  if (!pricing?.url) return record.submission;
  return { ...record.submission, portalUrl: pricing.url };
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validators = new Map();

const PLACE_RECORDS = new Set(["all", "marriage", "divorce", "death", "property", "court_record"]);

export function listCatalog() {
  const motor = [...DMV_REGISTRY.values()]
    .filter((adapter) => adapter.state !== "XX")
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .flatMap((adapter) =>
      Object.keys(adapter.schema || {}).map((type) => ({
        id: `dmv:${adapter.state}:${type}`,
        kind: "dmv",
        group: "Motor vehicle",
        label: `${type.replaceAll("_", " ")} (${adapter.displayName})`,
        summary: adapter.state === "NV"
          ? `Prepare a ${type.replaceAll("_", " ")} packet for Nevada. Nevada publishes a fee schedule for this request.`
          : `Prepare a ${type.replaceAll("_", " ")} request letter for ${adapter.displayName}. The agency's own form and fee still apply.`,
        limit: "You still submit the request yourself. This site does not pull the record.",
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

export function getRecordSchema(id, state) {
  const record = RECORD_REGISTRY.get(String(id || ""));
  if (!record) return { status: 404, body: { error: "Unsupported record" } };
  const pricing = feesFor(record.id, state);
  return {
    status: 200,
    body: {
      id: record.id,
      displayName: recordTitle(record, state),
      summary: record.summary,
      limit: record.limit,
      fees: record.fees,
      pricing,
      submission: submissionFor(record, pricing),
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
    const pricing = feesFor(record.id, payload.eventState);
    const packet = await buildPacket({
      ...record,
      displayName: recordTitle(record, payload.eventState),
      submission: submissionFor(record, pricing),
      fees: pricing,
    }, record.id, payload);
    return { status: 200, body: { ...packet, pricing } };
  } catch (error) {
    console.error(error);
    return { status: 500, body: { error: "Failed to build packet", detail: error.message } };
  }
}

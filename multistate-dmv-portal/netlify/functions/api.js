import { generatePacket, getSchema, listPlaces, listStates } from "../../src/services/dmv.js";
import { generateRecord, getRecordSchema, listCatalog } from "../../src/services/records.js";
import { feesFor, getService, listServices, MEMBERSHIP } from "../../src/fees/schedule.js";
import { billingStatus, createCheckout, receiveWebhook } from "../../src/services/billing.js";
import { envValue } from "../../src/services/env.js";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async (req) => {
  const url = new URL(req.url);
  const { pathname } = url;

  if (req.method === "GET" && (pathname === "/health" || pathname === "/api/health")) {
    return json(200, { ok: true });
  }

  const membershipRequired = envValue("ENFORCE_MEMBERSHIP") === "true";
  const membership = req.headers.get("x-membership");
  const memberDenied = membershipRequired && membership !== "active" && membership !== "trialing";

  if (req.method === "GET" && pathname === "/api/services") {
    return json(200, { membership: MEMBERSHIP, services: listServices() });
  }

  const serviceMatch = pathname.match(/^\/api\/services\/([^/]+)$/);
  if (req.method === "GET" && serviceMatch) {
    const service = getService(decodeURIComponent(serviceMatch[1]));
    if (!service) return json(404, { error: "Unknown service" });
    return json(200, service);
  }

  if (req.method === "GET" && pathname === "/api/fees") {
    const record = url.searchParams.get("record");
    if (!record) return json(200, { membership: MEMBERSHIP, services: listServices() });
    return json(200, feesFor(record, url.searchParams.get("state")));
  }

  const feeMatch = pathname.match(/^\/api\/fees\/([^/]+)$/);
  if (req.method === "GET" && feeMatch) {
    return json(200, feesFor(decodeURIComponent(feeMatch[1]), url.searchParams.get("state")));
  }

  if (req.method === "GET" && pathname === "/api/records") {
    if (memberDenied) return json(402, { error: "Membership required" });
    return json(200, { records: listCatalog() });
  }

  const recordSchema = pathname.match(/^\/api\/records\/schema\/([^/]+)$/);
  if (req.method === "GET" && recordSchema) {
    if (memberDenied) return json(402, { error: "Membership required" });
    const result = getRecordSchema(decodeURIComponent(recordSchema[1]), url.searchParams.get("state"));
    return json(result.status, result.body);
  }

  const recordGenerate = pathname.match(/^\/api\/records\/generate\/([^/]+)$/);
  if (req.method === "POST" && recordGenerate) {
    if (memberDenied) return json(402, { error: "Membership required" });
    let data;
    try {
      data = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    const result = await generateRecord(decodeURIComponent(recordGenerate[1]), data);
    return json(result.status, result.body);
  }

  if (req.method === "GET" && pathname === "/api/states") {
    if (memberDenied) return json(402, { error: "Membership required" });
    return json(200, { states: listPlaces() });
  }

  if (req.method === "GET" && pathname === "/api/dmv/states") {
    if (memberDenied) return json(402, { error: "Membership required" });
    return json(200, { states: listStates() });
  }

  if (req.method === "GET" && pathname === "/api/billing/status") {
    const result = billingStatus();
    return json(result.status, result.body);
  }

  const schemaMatch = pathname.match(/^\/api\/dmv\/schema\/([^/]+)\/([^/]+)$/);
  if (req.method === "GET" && schemaMatch) {
    if (memberDenied) return json(402, { error: "Membership required" });
    const result = getSchema(decodeURIComponent(schemaMatch[1]), decodeURIComponent(schemaMatch[2]));
    return json(result.status, result.body);
  }

  const generateMatch = pathname.match(/^\/api\/dmv\/generate\/([^/]+)\/([^/]+)$/);
  if (req.method === "POST" && generateMatch) {
    if (memberDenied) return json(402, { error: "Membership required" });
    let data;
    try {
      data = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    const result = await generatePacket(
      decodeURIComponent(generateMatch[1]),
      decodeURIComponent(generateMatch[2]),
      data
    );
    return json(result.status, result.body);
  }

  if (req.method === "POST" && pathname === "/api/billing/checkout") {
    let data;
    try {
      data = await req.json();
    } catch {
      return json(400, { error: "Invalid JSON" });
    }
    const result = await createCheckout({
      ...data,
      origin: `${url.protocol}//${url.host}`,
    });
    return json(result.status, result.body);
  }

  if (req.method === "POST" && pathname === "/api/billing/webhook") {
    const result = await receiveWebhook(await req.text(), req.headers.get("stripe-signature"));
    if (result.raw) return new Response(result.body, { status: result.status });
    return json(result.status, result.body);
  }

  return json(404, { error: "Not found" });
};

export const config = {
  includedFiles: ["multistate-dmv-portal/templates/**", "templates/**"],
  path: [
    "/health",
    "/api/health",
    "/api/services",
    "/api/services/:id",
    "/api/fees",
    "/api/fees/:recordId",
    "/api/records",
    "/api/records/schema/:id",
    "/api/records/generate/:id",
    "/api/states",
    "/api/dmv/states",
    "/api/dmv/schema/:state/:type",
    "/api/dmv/generate/:state/:type",
    "/api/billing/status",
    "/api/billing/checkout",
    "/api/billing/webhook",
  ],
};

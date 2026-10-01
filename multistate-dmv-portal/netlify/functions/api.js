import { generatePacket, getSchema, listStates } from "../../src/services/dmv.js";
import { generateRecord, getRecordSchema, listCatalog } from "../../src/services/records.js";
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

  if (req.method === "GET" && pathname === "/api/records") {
    if (memberDenied) return json(402, { error: "Membership required" });
    return json(200, { records: listCatalog() });
  }

  const recordSchema = pathname.match(/^\/api\/records\/schema\/([^/]+)$/);
  if (req.method === "GET" && recordSchema) {
    if (memberDenied) return json(402, { error: "Membership required" });
    const result = getRecordSchema(decodeURIComponent(recordSchema[1]));
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
    "/api/records",
    "/api/records/schema/:id",
    "/api/records/generate/:id",
    "/api/dmv/states",
    "/api/dmv/schema/:state/:type",
    "/api/dmv/generate/:state/:type",
    "/api/billing/status",
    "/api/billing/checkout",
    "/api/billing/webhook",
  ],
};

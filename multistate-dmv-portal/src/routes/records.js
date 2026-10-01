import express from "express";
import { getJurisdiction, listJurisdictions, RECORD_TYPES } from "../records/jurisdictions.js";
import { buildGuide, publicJurisdiction } from "../records/guide.js";
import { writePacket } from "../records/pdf.js";

const router = express.Router();

router.get("/api/records/types", (_req, res) => {
  res.json({ types: RECORD_TYPES });
});

router.get("/api/records/jurisdictions", (_req, res) => {
  res.json({ jurisdictions: listJurisdictions() });
});

router.get("/api/records/jurisdictions/:code", (req, res) => {
  const jurisdiction = getJurisdiction(req.params.code);
  if (!jurisdiction) return res.status(404).json({ error: "That state is not in the directory." });
  res.json(publicJurisdiction(jurisdiction));
});

router.post("/api/records/guide", express.json({ limit: "80kb" }), (req, res) => {
  try {
    res.json(present(buildGuide(req.body || {})));
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message, problems: error.problems || [] });
  }
});

router.post("/api/records/packet", express.json({ limit: "80kb" }), async (req, res) => {
  try {
    const guide = buildGuide(req.body || {});
    const file = await writePacket(guide);
    res.json({ ...present(guide), ...file });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({ error: error.message || "Could not build the mail packet.", problems: error.problems || [] });
  }
});

function present(guide) {
  return {
    code: guide.code,
    place: guide.place,
    recordType: guide.recordType,
    recordTitle: guide.recordTitle,
    phone: guide.phone,
    url: guide.url,
    since: guide.since,
    localNote: guide.localNote,
    names: guide.names,
    channels: guide.channels,
    destinations: guide.destinations.map((desk) => ({
      role: desk.role,
      kind: desk.kind,
      title: desk.title,
      address: desk.address,
      phone: desk.phone,
      url: desk.url,
      knownAddress: desk.knownAddress,
      why: desk.why,
    })),
    checklist: guide.checklist,
    disclaimer: guide.disclaimer,
  };
}

export default router;

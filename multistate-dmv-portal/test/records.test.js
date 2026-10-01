import test from "node:test";
import assert from "node:assert/strict";
import { CA_COUNTIES } from "../src/records/caCounties.js";
import { JURISDICTIONS, getJurisdiction } from "../src/records/jurisdictions.js";
import { buildGuide, namesToSearch } from "../src/records/guide.js";
import { renderPacket } from "../src/records/pdf.js";
import { createApp } from "../server.js";

const sample = {
  code: "CA",
  recordType: "birth",
  county: "Los Angeles",
  obstacles: ["name_change", "marriage", "no_online"],
  legalName: "Jane Smith",
  nameAtEvent: "Jane Doe",
  priorNames: ["Jane Roe"],
  eventYear: "1988",
  eventCity: "Los Angeles",
  parentNames: "Ann Doe and Robert Doe",
  purpose: "Passport",
  address1: "123 Main Street",
  city: "Oakland",
  region: "CA",
  zip: "94607",
  relationship: "self",
};

test("every state and New York City has a vital-records mailing address", () => {
  assert.ok(JURISDICTIONS.length >= 52);
  for (const item of JURISDICTIONS) {
    assert.ok(item.vital.mail.includes("\n"), `${item.code} mail address is incomplete`);
    assert.ok(item.vital.url.startsWith("https://"), `${item.code} needs an official page`);
    assert.equal(getJurisdiction(item.code).code, item.code);
    for (const type of ["birth", "death", "marriage", "divorce", "adoption", "driver"]) {
      assert.ok(item.records[type].holder, `${item.code} ${type}`);
    }
  }
});

test("California counties can be reached by mail", () => {
  assert.equal(CA_COUNTIES.length, 58);
  for (const county of CA_COUNTIES) {
    assert.match(county.mail, /CA \d{5}/);
    assert.match(county.phone, /\(\d{3}\)/);
  }
});

test("a former name from marriage is part of the search, and the county gets a letter", () => {
  const guide = buildGuide(sample);
  assert.deepEqual(namesToSearch(sample), ["Jane Doe", "Jane Smith", "Jane Roe"]);
  assert.ok(guide.names.includes("Jane Doe"));
  assert.ok(guide.channels.some((channel) => channel.id === "mail" && channel.available && channel.recommended));
  assert.ok(guide.destinations.some((desk) => desk.knownAddress && /Norwalk/.test(desk.address)));
  assert.ok(guide.destinations.some((desk) => /Sacramento/.test(desk.address)));
});

test("a county with no online marriage desk still gets a mail letter", () => {
  const guide = buildGuide({
    ...sample,
    code: "AZ",
    recordType: "marriage",
    county: "Maricopa",
    spouseName: "Alex Smith",
    obstacles: ["no_online", "marriage"],
  });
  assert.equal(guide.destinations[0].kind, "county");
  assert.match(guide.destinations[0].address, /Maricopa/);
  assert.equal(guide.destinations[0].knownAddress, false);
});

test("adoption instructions stay on the legal path", () => {
  const guide = buildGuide({
    ...sample,
    recordType: "adoption",
    obstacles: ["adoption"],
  });
  const letter = guide.letters.map((item) => item.paragraphs.join(" ")).join(" ");
  assert.match(letter, /current legal name/);
  assert.match(letter, /not asking you to bypass a court seal/);
  assert.doesNotMatch(letter, /unseal it yourself/i);
});

test("mail packet is a real PDF", async () => {
  const bytes = await renderPacket(buildGuide(sample));
  assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 2000);
});

test("the records API is not blocked by a membership gate", async () => {
  const server = createApp().listen(0);
  const port = server.address().port;
  try {
    const schema = await fetch(`http://127.0.0.1:${port}/api/dmv/schema/NV/driver_history`);
    assert.equal(schema.status, 200);
    const packet = await fetch(`http://127.0.0.1:${port}/api/records/packet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sample),
    });
    const body = await packet.json();
    assert.equal(packet.status, 200);
    assert.match(body.file, /Mail_Packet\.pdf$/);
    const pdf = await fetch(`http://127.0.0.1:${port}${body.file}`);
    assert.equal(pdf.status, 200);
    assert.match(pdf.headers.get("content-type") || "", /pdf/);
    const checkout = await fetch(`http://127.0.0.1:${port}/api/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "person@example.com" }),
    });
    assert.equal(checkout.status, 503);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

import { generatePacket, listStates } from "../src/services/dmv.js";
import { generateRecord, listCatalog } from "../src/services/records.js";
import { billingStatus, createCheckout } from "../src/services/billing.js";

const states = listStates();
if (!states.some((state) => state.state === "NV" && state.supports.includes("vehicle_record"))) {
  throw new Error("Nevada adapter is missing vehicle records");
}

const sample = {
  fullName: "Test User",
  dob: "01/02/1990",
  dlNumber: "N1234567",
  address1: "123 Main St",
  city: "Las Vegas",
  state: "NV",
  zip: "89101",
  phone: "7025550000",
  email: "test@example.com",
  purpose: "Own record",
};

const created = await generatePacket("NV", "driver_history", sample);
if (created.status !== 200) throw new Error(JSON.stringify(created.body));
if (!created.body.files?.length) throw new Error("packet has no files");
for (const file of created.body.files) {
  const header = Buffer.from(file.base64, "base64").subarray(0, 5).toString();
  if (header !== "%PDF-") throw new Error(`${file.name} is not a PDF`);
}

const invalid = await generatePacket("NV", "driver_history", { fullName: "Only" });
if (invalid.status !== 400) throw new Error("expected validation to fail");

const vehicle = await generatePacket("NV", "vehicle_record", {
  ...sample,
  vin: "1HGCM82633A004352",
  plate: "ABC123",
});
if (vehicle.status !== 200) throw new Error(JSON.stringify(vehicle.body));

const marriage = await generateRecord("marriage", {
  yourName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "7755550100",
  address1: "1 Analytical Way",
  city: "Carson City",
  state: "NV",
  zip: "89701",
  relationship: "I am one of the spouses",
  party1Name: "Ada Lovelace",
  party2Name: "William King",
  eventState: "NV",
});
if (marriage.status !== 200) throw new Error(JSON.stringify(marriage.body));
if (Buffer.from(marriage.body.files[0].base64, "base64").subarray(0, 5).toString() !== "%PDF-") {
  throw new Error("marriage letter is not a PDF");
}

const bank = await generateRecord("bank", {
  yourName: "Ada Lovelace",
  email: "ada@example.com",
  phone: "7755550100",
  address1: "1 Analytical Way",
  city: "Carson City",
  state: "NV",
  zip: "89701",
  bankName: "Example Credit Union",
  accountLast4: "1234",
  dateRange: "2025",
});
if (bank.status !== 400) throw new Error("bank request must confirm the account holder");

const catalog = listCatalog();
for (const id of ["all", "marriage", "divorce", "death", "property", "bank", "criminal_history", "court_record"]) {
  if (!catalog.some((item) => item.id === id)) throw new Error(`missing ${id}`);
}

const status = billingStatus();
if (status.body.configured) throw new Error("billing should be unconfigured in the smoke test");
const checkout = await createCheckout({ email: "test@example.com", origin: "http://localhost:3001" });
if (checkout.status !== 503) throw new Error("checkout should explain that billing is off");

console.log(`smoke ok: ${created.body.files.map((file) => file.name).join(", ")}`);

import { generatePacket, listStates } from "../src/services/dmv.js";
import { generateRecord, listCatalog } from "../src/services/records.js";
import { feesFor, listServices } from "../src/fees/schedule.js";
import { billingStatus, createCheckout } from "../src/services/billing.js";

const states = listStates();
if (states.length !== 51) throw new Error(`expected 51 states, got ${states.length}`);
if (states.some((state) => state.state === "XX")) throw new Error("demo state should stay out of the public list");
for (const code of ["CA", "TX", "NY", "DC", "WY"]) {
  if (!states.some((state) => state.state === code && state.supports.includes("driver_history") && state.supports.includes("vehicle_record"))) {
    throw new Error(`${code} is missing a motor vehicle packet`);
  }
}
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
for (const id of ["all", "marriage", "divorce", "death", "property", "bank", "criminal_history", "court_record", "dmv:CA:driver_history", "dmv:DC:vehicle_record", "dmv:NV:driver_history"]) {
  if (!catalog.some((item) => item.id === id)) throw new Error(`missing ${id}`);
}
if (catalog.some((item) => item.state === "XX")) throw new Error("demo template is in the public catalog");

const services = listServices();
if (!services.some((service) => service.online && service.id === "pacer")) throw new Error("PACER service missing");
const history = feesFor("criminal_history");
if (!history.lines.some((line) => line.amount === 18)) throw new Error("FBI $18 fee missing");
const driver = feesFor("dmv:NV:driver_history");
if (!driver.lines.some((line) => line.amount === 7) || !driver.lines.some((line) => line.amount === 1.5)) {
  throw new Error("Nevada driver fees missing");
}
const checklist = feesFor("all", "NV");
if (!checklist.lines.some((line) => line.amount === 25) || checklist.membership.lines[1].amount !== 19.99) {
  throw new Error("Nevada checklist fees missing");
}
const unscoped = feesFor("death");
if (unscoped.lines.some((line) => line.amount === 25)) throw new Error("death fees must not assume Nevada");
const californiaDeath = feesFor("death", "CA");
if (!californiaDeath.lines.some((line) => line.amount === 24) || !californiaDeath.url.includes("california.htm")) {
  throw new Error("California death fee missing");
}
const texasMarriage = feesFor("marriage", "TX");
if (!texasMarriage.lines.some((line) => line.amount === 20)) throw new Error("Texas marriage fee missing");
const massachusettsDivorce = feesFor("divorce", "MA");
if (!massachusettsDivorce.lines.some((line) => line.amount === 0)) throw new Error("Massachusetts divorce fee missing");
const coloradoDeath = feesFor("death", "CO");
if (coloradoDeath.lines.some((line) => line.amount != null) || !coloradoDeath.lines.some((line) => line.note.includes("$20.00") && line.note.includes("$13.00"))) {
  throw new Error("Colorado death fee should keep both published prices");
}
const newYorkDeath = feesFor("death", "NY");
if (!newYorkDeath.lines.some((line) => line.amount === 30) || !newYorkDeath.lines.some((line) => line.group === "New York City" && line.amount === 15)) {
  throw new Error("New York death fees missing");
}
const californiaDriver = feesFor("dmv:CA:driver_history");
if (californiaDriver.lines.some((line) => line.amount != null) || !californiaDriver.url.includes("dmv.ca.gov")) {
  throw new Error("California driver fee should stay with the agency");
}
if (!marriage.body.pricing?.lines?.length || !marriage.body.pricing.lines.some((line) => line.amount === 10)) {
  throw new Error("marriage packet did not include Nevada pricing");
}

const californiaLetter = await generatePacket("CA", "driver_history", { ...sample, state: "CA" });
if (californiaLetter.status !== 200) throw new Error(JSON.stringify(californiaLetter.body));
if (Buffer.from(californiaLetter.body.files[0].base64, "base64").subarray(0, 5).toString() !== "%PDF-") {
  throw new Error("California letter is not a PDF");
}
if (californiaLetter.body.pricing.lines.some((line) => line.amount != null)) {
  throw new Error("California driver packet invented a fee");
}

const status = billingStatus();
if (status.body.configured) throw new Error("billing should be unconfigured in the smoke test");
const checkout = await createCheckout({ email: "test@example.com", origin: "http://localhost:3001" });
if (checkout.status !== 503) throw new Error("checkout should explain that billing is off");

console.log(`smoke ok: ${created.body.files.map((file) => file.name).join(", ")}`);

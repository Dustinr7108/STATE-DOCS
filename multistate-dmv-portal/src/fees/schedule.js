import { CDC_PAGES } from "./cdcPages.js";
import { normalizeState, stateByCode, US_STATES } from "../states/us.js";

export const MEMBERSHIP = {
  id: "membership",
  name: "State Document Portal membership",
  online: true,
  access: "Billed by this site through Stripe after the trial.",
  lines: [
    { label: "Trial", amount: 0, unit: "for 7 days" },
    { label: "Membership", amount: 19.99, unit: "per month after the trial" },
  ],
};

const checked = "2026-10-01";

export const SERVICES = [
  {
    id: "nv-driver-history",
    recordIds: ["dmv:NV:driver_history"],
    name: "Nevada driver history",
    online: true,
    access: "Order a 3-year or 10-year history online, at a kiosk, by mail, or in person.",
    url: "https://dmv.nv.gov/dlhistory.htm",
    source: "https://dmv.nv.gov/dlhistory.htm",
    sourceLabel: "Nevada DMV driver history",
    asOf: checked,
    lines: [
      { label: "Driver history report", amount: 7, note: "Online, kiosk, mail, or in person." },
      { label: "Kiosk processing fee", amount: 1.5, note: "Only if you use a kiosk." },
      { label: "Certified copy", amount: 4, note: "Mail the Records Section. Add this to the $7 report fee." },
    ],
  },
  {
    id: "nv-vehicle-record",
    recordIds: ["dmv:NV:vehicle_record"],
    name: "Nevada vehicle record",
    online: true,
    access: "Vehicle registration and title lookups that are not on the public driver-history page go through the DMV Records Section. The fee schedule is on the IR-005 instructions.",
    url: "https://dmv.nv.gov/pdfforms/ir005.pdf",
    source: "https://dmv.nv.gov/pdfforms/ir005.pdf",
    sourceLabel: "Nevada DMV IR-005 fee schedule",
    asOf: checked,
    lines: [
      { label: "Vehicle registration information", amount: 5 },
      { label: "Vehicle title information", amount: 5 },
      { label: "Registration history", amount: 7 },
      { label: "Title history", amount: 7, note: "Research pages are $3 each, front and back." },
      { label: "Certification of documents", amount: 4 },
      { label: "Research", amount: 3, unit: "per page" },
    ],
  },
  {
    id: "nv-death",
    recordIds: ["vital:NV:death"],
    name: "Nevada death certificate",
    online: true,
    access: "Order from the Nevada Office of Vital Records. The forms page lists one schedule and another state page lists a higher one, so both are shown.",
    url: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/birth-death-vital-records-forms/",
    source: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/birth-death-vital-records-faqs/",
    sourceLabel: "Nevada Office of Vital Records",
    asOf: checked,
    lines: [
      { label: "Certified copy, Carson, Clark, Douglas, Lyon, Mineral, or Washoe County", amount: 25, note: "Listed on the vital records FAQ." },
      { label: "Certified copy, any other Nevada county", amount: 22, note: "Listed on the vital records FAQ." },
      { label: "Amount on a second state page", amount: null, note: "That page lists $42–$45 by county, plus $20 for expedited delivery. Confirm which schedule the office is charging." },
      { label: "Verification", amount: 10, note: "Listed for birth, death, marriage, divorce, and a paternity letter." },
    ],
  },
  {
    id: "nv-marriage",
    recordIds: ["vital:NV:marriage"],
    name: "Marriage record",
    online: true,
    access: "A certified marriage certificate comes from the county recorder where the license was issued. The state can search its index online or by mail when you do not know the county.",
    url: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/marriage-and-divorce-records-home/",
    source: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/marriage-and-divorce-records-home/",
    sourceLabel: "Nevada marriage and divorce records",
    asOf: checked,
    lines: [
      { label: "State index search, per name", amount: 10, note: "Does not include the certified certificate. Indexes cover parts of 1968–2005 and 2015 to current." },
      { label: "Certified certificate from the county recorder", amount: null, note: "The county sets this fee." },
    ],
  },
  {
    id: "nv-divorce",
    recordIds: ["vital:NV:divorce"],
    name: "Divorce record",
    online: true,
    access: "The decree comes from the county clerk where the divorce was granted. The state search is separate and does not include the decree.",
    url: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/marriage-and-divorce-records-home/",
    source: "https://www.dpbh.nv.gov/programs/birth-death-marriage-divorce-records/marriage-and-divorce-records-home/",
    sourceLabel: "Nevada marriage and divorce records",
    asOf: checked,
    lines: [
      { label: "State index search, per name", amount: 10, note: "Does not include the decree." },
      { label: "Certified decree from the county clerk", amount: null, note: "The county sets this fee." },
    ],
  },
  {
    id: "property",
    recordIds: ["property"],
    name: "Property record",
    online: true,
    access: "County recorders and assessors publish many indexes online. Certified copies are ordered from that county.",
    url: "https://www.usa.gov/local-governments",
    source: "https://www.usa.gov/local-governments",
    sourceLabel: "USA.gov local government finder",
    asOf: checked,
    lines: [
      { label: "Online index", amount: 0, note: "Many counties publish this at no charge. Confirm that county." },
      { label: "Certified deed or tax copy", amount: null, note: "Priced by the county recorder or assessor." },
    ],
  },
  {
    id: "bank",
    recordIds: ["bank"],
    name: "Your bank statements",
    online: true,
    access: "Download statements from your own bank's online banking. This site cannot sign in to a bank.",
    url: null,
    source: null,
    sourceLabel: "Your bank's fee schedule",
    asOf: checked,
    lines: [
      { label: "Recent statements in online banking", amount: 0, note: "Usually included with the account. Confirm with your bank." },
      { label: "Older copies or research", amount: null, note: "Your bank sets this fee. The letter is only for an account in your name." },
    ],
  },
  {
    id: "fbi-identity-history",
    recordIds: ["criminal_history"],
    name: "FBI Identity History Summary",
    online: true,
    access: "Request your own summary electronically or by mail. Fingerprints are required. This is not an employment background check.",
    url: "https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks/identity-history-summary-checks-faqs",
    source: "https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks/identity-history-summary-checks-faqs",
    sourceLabel: "FBI Identity History Summary FAQ",
    asOf: checked,
    lines: [
      { label: "Identity History Summary", amount: 18, note: "Same price online or by mail. A fee waiver must be approved before you apply." },
      { label: "Fingerprints", amount: null, note: "Charged by the place that takes the prints, not by the FBI's $18 fee." },
    ],
  },
  {
    id: "fbi-authorized-check",
    recordIds: [],
    name: "FBI check for employment or licensing",
    online: true,
    access: "An employer or licensing agency submits this through an authorized channeler. It is a different product from the $18 personal summary.",
    url: "https://www.federalregister.gov/documents/2026/06/08/2026-11435/fbi-criminal-justice-information-services-division-user-fee-schedule",
    source: "https://www.federalregister.gov/documents/2026/06/08/2026-11435/fbi-criminal-justice-information-services-division-user-fee-schedule",
    sourceLabel: "FBI CJIS user fee schedule, effective October 1, 2026",
    asOf: checked,
    lines: [
      { label: "Fingerprint-based check", amount: 15, note: "Authorized users. Channelers billed under the CBSP rate pay $13." },
      { label: "Fingerprint-based volunteer check", amount: 13, note: "Channelers billed under the CBSP rate pay $11." },
      { label: "Name-based check", amount: 1.75, note: "Authorized users only." },
    ],
  },
  {
    id: "pacer",
    recordIds: ["court_record"],
    name: "PACER federal court records",
    online: true,
    access: "Federal case files are read online in PACER after you register. State cases stay with that court's clerk.",
    url: "https://pacer.uscourts.gov/pacer-pricing-how-fees-work",
    source: "https://pacer.uscourts.gov/pacer-pricing-how-fees-work",
    sourceLabel: "PACER pricing",
    asOf: checked,
    lines: [
      { label: "Electronic access", amount: 0.1, unit: "per page", note: "A document or case-specific report is capped at $3. Transcripts and name-search results are not capped." },
      { label: "Quarterly waiver", amount: 30, note: "If a quarter totals $30 or less, PACER does not bill it. On January 1, 2027 the page rate becomes $0.12 and this waiver becomes $40." },
    ],
  },
  {
    id: "cdc-directory",
    recordIds: [],
    name: "Vital records directory",
    online: true,
    access: "Find the state office that issues the certificate. The directory itself does not take orders.",
    url: "https://www.cdc.gov/nchs/w2w/index.htm",
    source: "https://www.cdc.gov/nchs/w2w/index.htm",
    sourceLabel: "CDC where to write for vital records",
    asOf: checked,
    lines: [
      { label: "Directory", amount: 0 },
      { label: "State certificate", amount: null, note: "Open the state page. It lists the office and the fee that page published. Nevada also has a state fee schedule when Nevada is selected." },
    ],
  },
  {
    id: "demo-template",
    recordIds: ["dmv:XX:driver_history"],
    name: "Example template",
    online: false,
    access: "Demo only. There is no office and no fee.",
    url: null,
    source: null,
    sourceLabel: "This project",
    asOf: checked,
    lines: [
      { label: "Demo packet", amount: 0, note: "Not a government filing." },
    ],
  },
];

const RECORD_COMPONENTS = ["marriage", "divorce", "death", "property", "bank", "criminal_history", "court_record"];
const VITAL_RECORDS = new Set(["marriage", "divorce", "death"]);
const NV_VITAL = { marriage: "nv-marriage", divorce: "nv-divorce", death: "nv-death" };
const CDC_INDEX = "https://www.cdc.gov/nchs/w2w/index.htm";

let cachedServices;

function allServices() {
  if (cachedServices) return cachedServices;
  const generated = US_STATES.filter((place) => place.code !== "NV").flatMap((place) => [
    motorService(place, "driver_history", "Driver history"),
    motorService(place, "vehicle_record", "Vehicle record"),
  ]);
  cachedServices = [...SERVICES, ...generated];
  return cachedServices;
}

function motorService(place, type, label) {
  return {
    id: `dmv-${place.code.toLowerCase()}-${type}`,
    recordIds: [`dmv:${place.code}:${type}`],
    name: `${place.name} ${label.toLowerCase()}`,
    online: true,
    access: `USA.gov lists a motor vehicle agency for ${place.name}. This site prepares a request letter. It does not sign in to that agency or pull the record.`,
    url: place.dmvUrl,
    source: "https://www.usa.gov/state-motor-vehicle-services",
    sourceLabel: "USA.gov state motor vehicle services",
    asOf: checked,
    lines: [
      {
        label,
        amount: null,
        note: "That agency sets the fee. Driver licensing and vehicle titles are different offices in some states.",
      },
    ],
  };
}

export function listServices() {
  return allServices().map(publicService);
}

export function getService(id) {
  const service = allServices().find((entry) => entry.id === id);
  if (!service) return null;
  return publicService(service);
}

export function feesFor(recordId, state) {
  const code = normalizeState(state);

  if (recordId === "all") {
    const parts = RECORD_COMPONENTS.map((id) => feesFor(id, code));
    const place = code ? stateByCode(code) : null;
    return {
      id: "all",
      name: place ? `All listed records — ${place.name}` : "All listed records",
      online: true,
      access: "Each office charges its own fee. Nothing in this list is billed by this site except the membership.",
      url: place?.cdcUrl || CDC_INDEX,
      source: place?.cdcUrl || CDC_INDEX,
      sourceLabel: place
        ? `Vital-record lines for ${place.name} come from that state's CDC page. Other lines name their own source.`
        : "Select a state to see that state's vital-record fees",
      asOf: checked,
      lines: parts.flatMap((part) => part.lines.map((line) => ({
        ...line,
        group: line.group ? `${part.name} — ${line.group}` : part.name,
      }))),
      membership: MEMBERSHIP,
    };
  }

  if (VITAL_RECORDS.has(recordId)) return vitalFees(recordId, state);
  if (recordId === "court_record") return courtFees(code);
  if (recordId === "property") return propertyFees(code);

  const service = allServices().find((entry) => entry.recordIds.includes(recordId));
  if (!service) {
    return {
      id: recordId,
      name: "Office fee",
      online: false,
      access: "The office that keeps this record posts the fee.",
      url: null,
      source: null,
      sourceLabel: null,
      asOf: checked,
      lines: [{ label: "Office fee", amount: null, note: "Confirm the current amount before you pay." }],
      membership: MEMBERSHIP,
    };
  }

  return { ...publicService(service), membership: MEMBERSHIP };
}

function vitalFees(recordId, state) {
  const raw = state == null ? "" : String(state).trim();
  if (raw && !normalizeState(raw)) {
    return chooseState(recordId, "That value is not a US state or the District of Columbia. Choose one to see the published fee.");
  }
  const code = normalizeState(raw);
  if (!code) return chooseState(recordId, "Select the state where the event happened. The CDC page for that state lists the office and the fee it published.");
  if (code === "NV") {
    const service = SERVICES.find((entry) => entry.id === NV_VITAL[recordId]);
    return { ...publicService(service), membership: MEMBERSHIP };
  }

  const page = CDC_PAGES[code];
  const place = stateByCode(code);
  const lines = page.blocks.filter((block) => eventKind(block) === recordId).map((block) => costLine(block));
  if (code === "NY") {
    const city = CDC_PAGES.NYC;
    for (const block of city.blocks.filter((entry) => eventKind(entry) === recordId)) {
      const line = costLine(block);
      line.group = "New York City";
      line.note = [line.note, `New York City keeps its own records: ${city.url}`].filter(Boolean).join(" ");
      lines.push(line);
    }
  }
  if (!lines.length) {
    lines.push({
      label: "Certified copy",
      amount: null,
      note: "The CDC page does not list a dollar amount for this record. Confirm the fee with that office.",
    });
  }

  const label = { marriage: "marriage record", divorce: "divorce record", death: "death certificate" }[recordId];
  return {
    id: `${recordId}-${code}`,
    name: `${place.name} ${label}`,
    online: true,
    access: `Order from the office on the CDC where-to-write page for ${place.name}. A dollar amount below is the fee printed on that page. Confirm it before you pay.`,
    url: page.url,
    source: page.url,
    sourceLabel: `CDC where to write for vital records, ${place.name}, page reviewed ${page.reviewed}`,
    asOf: page.reviewed,
    lines,
    membership: MEMBERSHIP,
  };
}

function chooseState(recordId, note) {
  const label = { marriage: "Marriage record", divorce: "Divorce record", death: "Death certificate" }[recordId];
  return {
    id: recordId,
    name: label,
    online: true,
    access: "The state where the event happened sets the fee. This site does not charge that fee.",
    url: CDC_INDEX,
    source: CDC_INDEX,
    sourceLabel: "CDC where to write for vital records",
    asOf: checked,
    lines: [{ label: "State certificate", amount: null, note }],
    membership: MEMBERSHIP,
  };
}

function propertyFees(code) {
  const service = SERVICES.find((entry) => entry.id === "property");
  const place = code ? stateByCode(code) : null;
  const priced = publicService(service);
  if (!place) return { ...priced, membership: MEMBERSHIP };
  return {
    ...priced,
    name: `${place.name} property record`,
    access: `County recorders and assessors in ${place.name} publish many indexes online. Certified copies are ordered from that county.`,
    lines: priced.lines.map((line) => ({
      ...line,
      note: line.note ? `${line.note} This request is for ${place.name}.` : `This request is for ${place.name}.`,
    })),
    membership: MEMBERSHIP,
  };
}

function courtFees(code) {
  const pacer = SERVICES.find((entry) => entry.id === "pacer");
  const place = code ? stateByCode(code) : null;
  const clerkNote = place
    ? `The clerk of the ${place.name} court that heard the case sets this fee.`
    : "The clerk of the court that heard the case sets this fee.";
  return {
    id: "court_record",
    name: place ? `${place.name} court record` : "Court record",
    online: true,
    access: "A state or local file comes from that court's clerk. A federal file is read in PACER after you register.",
    url: pacer.url,
    source: pacer.source,
    sourceLabel: pacer.sourceLabel,
    asOf: pacer.asOf,
    lines: [
      { label: "State or local clerk copy", amount: null, note: clerkNote },
      ...pacer.lines.map((line) => ({ ...line, group: "PACER" })),
    ],
    membership: MEMBERSHIP,
  };
}

function eventKind(block) {
  const text = `${block.section} ${block.event}`;
  if (/divorce|dissolution/i.test(text)) return "divorce";
  if (/marriage|civil union/i.test(text)) return "marriage";
  if (/\bdeath\b/i.test(text)) return "death";
  return null;
}

function costLine(block) {
  const parsed = parseCost(block.cost);
  return {
    label: block.event || block.section,
    amount: parsed.amount,
    note: parsed.note,
  };
}

function parseCost(cost) {
  const text = String(cost || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return { amount: null, note: "The CDC page does not list a dollar amount. Confirm the fee with that office." };
  }
  if (/^no fee$/i.test(text)) {
    return { amount: 0, note: "The CDC page lists no fee. Confirm that with the office before you order." };
  }
  if (/^(see remarks|varies)$/i.test(text)) {
    return { amount: null, note: `The CDC page says “${text}.” Confirm the current fee with that office.` };
  }
  const amounts = [...text.matchAll(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g)].map((match) => Number(match[1].replace(/,/g, "")));
  const distinct = [...new Set(amounts)];
  const confirm = "Confirm the current fee on the CDC page before you pay.";
  if (distinct.length === 1 && text.replace(/\$\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/, "").trim() === "") {
    return { amount: distinct[0], note: `Listed on the CDC page. ${confirm}` };
  }
  if (distinct.length === 1) {
    return { amount: distinct[0], note: `${text} ${confirm}` };
  }
  return { amount: null, note: `${text} ${confirm}` };
}

function publicService(service) {
  return {
    id: service.id,
    name: service.name,
    online: service.online,
    access: service.access,
    url: service.url,
    source: service.source,
    sourceLabel: service.sourceLabel,
    asOf: service.asOf,
    lines: service.lines.map((line) => ({ ...line })),
  };
}

export function formatMoney(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  if (Number.isInteger(amount)) return `$${amount}`;
  return `$${Number(amount).toFixed(2)}`;
}

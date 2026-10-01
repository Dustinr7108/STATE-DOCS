import { getJurisdiction, RECORD_TYPES } from "./jurisdictions.js";

const RECORD_IDS = new Set(RECORD_TYPES.map((item) => item.id));
const MAX_LEN = 240;

export function normalizeCounty(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\bcounty\b/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function lookupCounty(jurisdiction, countyName) {
  const wanted = normalizeCounty(countyName);
  if (!wanted) return null;
  return jurisdiction.counties.find((item) => normalizeCounty(item.name) === wanted) || null;
}

function clean(value, max = MAX_LEN) {
  return String(value ?? "")
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function linesOf(address) {
  return String(address || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function namesToSearch(input) {
  const names = [
    input.nameAtEvent,
    input.legalName,
    ...(Array.isArray(input.priorNames) ? input.priorNames : []),
  ]
    .map((name) => clean(name, 120))
    .filter(Boolean);
  return [...new Set(names)];
}

function countyDesk(jurisdiction, input, spec) {
  const countyName = clean(input.county, 80);
  const known = lookupCounty(jurisdiction, countyName);
  const place = jurisdiction.code === "NYC" ? "New York City" : jurisdiction.name;
  const kind = spec.holder === "court" ? "court" : "county";
  if (known) {
    return {
      role: "primary",
      kind,
      title: known.mail.split("\n")[0],
      address: known.mail,
      phone: known.phone,
      url: jurisdiction.vital.url,
      knownAddress: true,
      payableTo: known.mail.split("\n")[0],
      why: `This county has a published mailing desk, so you do not need an online account.`,
    };
  }
  const label = countyName
    ? `${countyName} County Clerk`
    : `County clerk in ${place}`;
  const officeLine = spec.holder === "court"
    ? (countyName ? `Clerk of Court, ${countyName} County` : `Clerk of the court that holds this record`)
    : label;
  const address = [
    officeLine,
    "Vital Records / Court Records",
    countyName ? `${countyName} County, ${jurisdiction.code === "NYC" ? "NY" : jurisdiction.code}` : place,
    "",
    "Write the street address or post office box from the county or court website on the envelope.",
    `If you cannot find it, call the state office at ${jurisdiction.vital.phone} and ask which clerk mails this record.`,
  ].join("\n");
  return {
    role: "primary",
    kind,
    title: officeLine,
    address,
    phone: jurisdiction.vital.phone,
    url: jurisdiction.vital.url,
    knownAddress: false,
    payableTo: officeLine,
    why: countyName
      ? `Many ${countyName} County records are not sold online. Mail still reaches the clerk.`
      : `Add the county where the event happened and this letter is ready for that clerk.`,
  };
}

function stateDesk(jurisdiction, role, why) {
  return {
    role,
    kind: "state",
    title: jurisdiction.vital.office.split("\n")[0],
    address: jurisdiction.vital.mail,
    phone: jurisdiction.vital.phone,
    url: jurisdiction.vital.url,
    knownAddress: true,
    payableTo: jurisdiction.vital.payableTo,
    why,
  };
}

function driverDesk(jurisdiction) {
  if (jurisdiction.dmv.mail) {
    return {
      role: "primary",
      kind: "dmv",
      title: jurisdiction.dmv.office,
      address: jurisdiction.dmv.mail,
      phone: jurisdiction.dmv.phone,
      url: jurisdiction.dmv.url,
      knownAddress: true,
      payableTo: jurisdiction.dmv.payableTo,
      why: "This motor-vehicle unit publishes a mailing address. The state still verifies your identity.",
    };
  }
  return {
    role: "primary",
    kind: "dmv",
    title: jurisdiction.dmv.office,
    address: [
      jurisdiction.dmv.office,
      `${jurisdiction.name} driver records`,
      "",
      "Copy the mailing address from the official motor-vehicle page onto this envelope.",
      jurisdiction.dmv.url,
    ].join("\n"),
    phone: jurisdiction.dmv.phone,
    url: jurisdiction.dmv.url,
    knownAddress: false,
    payableTo: jurisdiction.dmv.payableTo,
    why: "Driver-record mailing addresses change often. The letter is finished. Copy the address from the official page, which is linked here.",
  };
}

export function destinationsFor(jurisdiction, input) {
  const spec = jurisdiction.records[input.recordType];
  if (input.recordType === "driver") return [driverDesk(jurisdiction)];

  const obstacles = new Set(input.obstacles || []);
  const wantsLocal = obstacles.has("no_online") || obstacles.has("older_record") || obstacles.has("rejected");
  const knownCounty = lookupCounty(jurisdiction, input.county);
  const list = [];

  if (spec.holder === "state" || spec.holder === "both") {
    list.push(stateDesk(
      jurisdiction,
      "primary",
      "This state office accepts mail requests. A website is optional."
    ));
  }

  const needsCounty = spec.holder === "county"
    || spec.holder === "court"
    || spec.holder === "both"
    || Boolean(knownCounty)
    || (wantsLocal && spec.localNote);
  if (needsCounty) {
    const county = countyDesk(jurisdiction, input, spec);
    if (spec.holder === "state") county.role = "local_backup";
    if (spec.holder === "both" && list.length) county.role = "local_copy";
    list.push(county);
  }

  if (!list.length) list.push(stateDesk(jurisdiction, "primary", "Mail is available even when the website is not."));

  if (jurisdiction.code === "DC" && input.recordType === "marriage") {
    return [{
      role: "primary",
      kind: "court",
      title: "DC Superior Court Marriage Bureau",
      address: "DC Superior Court\nMarriage Bureau\n500 Indiana Avenue N.W., Room 4485\nWashington, DC 20001",
      phone: "(202) 879-1212",
      url: "https://www.dccourts.gov/services/marriage-matters",
      knownAddress: true,
      payableTo: "DC Superior Court",
      why: "DC marriage licenses are at the court, not the health department.",
    }];
  }

  return list;
}

function recommendMail(jurisdiction, input) {
  const spec = jurisdiction.records[input.recordType];
  const obstacles = new Set(input.obstacles || []);
  if (spec.portal !== "full") return true;
  if (obstacles.has("name_change") || obstacles.has("adoption") || obstacles.has("no_online") || obstacles.has("rejected")) return true;
  if (namesToSearch(input).length > 1) return true;
  return spec.holder === "county" || spec.holder === "court";
}

export function channelsFor(jurisdiction, input) {
  const spec = jurisdiction.records[input.recordType];
  const destinations = destinationsFor(jurisdiction, input);
  const mailFirst = recommendMail(jurisdiction, input);
  const onlineUrl = input.recordType === "driver" ? jurisdiction.dmv.url : jurisdiction.vital.url;
  const inPerson = jurisdiction.vital.inPerson;
  const channels = [
    {
      id: "online",
      title: "Try the official website",
      available: Boolean(onlineUrl),
      recommended: !mailFirst && spec.portal === "full",
      url: onlineUrl,
      detail: spec.portal === "none"
        ? "This record is not reliably sold online. Use mail."
        : "If the site rejects a former name, times out, or the county has no portal, do not stop. The mail packet uses every name the record may be filed under.",
    },
    {
      id: "mail",
      title: "Order by mail",
      available: true,
      recommended: mailFirst || spec.portal !== "full",
      detail: destinations[0].knownAddress
        ? "Print the letter, sign it, add a copy of your photo ID and a check or money order, and mail it."
        : "Print the letter and put the clerk's street address on the envelope. Call the phone number on the cover if you cannot find that address.",
    },
    {
      id: "phone",
      title: "Ask the office to mail you their form",
      available: Boolean(destinations[0].phone),
      recommended: false,
      phone: destinations[0].phone,
      detail: "Some clerks only accept their own blank form. Call and ask them to mail it. Copy every former name from this packet onto that form.",
    },
  ];
  if (inPerson) {
    channels.push({
      id: "in_person",
      title: "Go in person",
      available: true,
      recommended: false,
      detail: inPerson,
    });
  }
  return { channels, destinations };
}

function reasonSentence(input) {
  const reasons = new Set(input.obstacles || []);
  const bits = [];
  if (reasons.has("marriage") || input.nameChangeReason === "marriage") {
    bits.push("My name changed through marriage");
  }
  if (reasons.has("divorce") || input.nameChangeReason === "divorce") {
    bits.push("My name changed through divorce");
  }
  if (reasons.has("adoption") || input.recordType === "adoption" || input.nameChangeReason === "adoption") {
    bits.push("My name changed through adoption");
  }
  if (reasons.has("court_order") || input.nameChangeReason === "court") {
    bits.push("A court ordered a name change");
  }
  if (!bits.length && namesToSearch(input).length > 1) bits.push("I have used more than one legal name");
  return bits;
}

export function buildGuide(input) {
  const jurisdiction = getJurisdiction(input.code);
  if (!jurisdiction) {
    const error = new Error("Choose a state or New York City.");
    error.status = 400;
    throw error;
  }
  if (!RECORD_IDS.has(input.recordType)) {
    const error = new Error("Choose a record type.");
    error.status = 400;
    throw error;
  }

  const legalName = clean(input.legalName, 120);
  const mailLine = clean(input.address1, 120);
  const city = clean(input.city, 80);
  const region = clean(input.region, 40);
  const zip = clean(input.zip, 20);
  const problems = [];
  if (!legalName) problems.push("Enter your current legal name.");
  if (!mailLine || !city || !region || !zip) problems.push("Enter the mailing address where the office should send the record.");
  if (input.recordType !== "driver" && !clean(input.eventDate) && !clean(input.eventYear, 10) && !clean(input.eventCity)) {
    problems.push("Enter a date, a year, or the city of the event so the clerk can search.");
  }
  if (input.recordType === "marriage" && !clean(input.spouseName)) {
    problems.push("Enter the other spouse's name, including any former surname.");
  }
  if (input.recordType === "driver" && !clean(input.dob, 40)) {
    problems.push("Enter your date of birth so the motor-vehicle office can match your record.");
  }
  if (input.recordType === "driver" && input.forSelf === false && !input.authorized) {
    problems.push("A driver record for someone else needs their written permission. Request your own record, or confirm you have legal authority.");
  }
  if (problems.length) {
    const error = new Error(problems[0]);
    error.status = 400;
    error.problems = problems;
    throw error;
  }

  const names = namesToSearch({ ...input, legalName });
  const { channels, destinations } = channelsFor(jurisdiction, { ...input, legalName });
  const spec = jurisdiction.records[input.recordType];
  const typeMeta = RECORD_TYPES.find((item) => item.id === input.recordType);
  const reasons = reasonSentence({ ...input, legalName });
  const returnAddress = [legalName, mailLine, clean(input.address2, 120), `${city}, ${region} ${zip}`].filter(Boolean);

  const letters = destinations.map((desk) => letterFor({
    jurisdiction,
    input: { ...input, legalName },
    desk,
    names,
    reasons,
    returnAddress,
    spec,
    typeMeta,
  }));

  const checklist = [
    "Sign the letter in ink. A typed name is not a signature.",
    "Include a clear photocopy of your government photo ID.",
    "Pay by check or money order for the current fee. Do not send cash.",
    jurisdiction.vital.paymentNote,
    "If your name changed, include a copy of the marriage certificate, divorce decree, or court order if you already have it. If you do not have it yet, still mail this letter. The names on it are the search terms.",
    "Mail a copy of this packet to yourself or photograph it before you send it.",
    "If the office writes back that it only accepts its own form, call the number on the cover and ask them to mail that form. Copy every name from this letter onto it.",
    "If the first office says the record is filed somewhere else, mail the same letter to that second office. The packet already includes a local clerk letter when that path exists.",
  ];

  if (input.recordType === "adoption" || (input.obstacles || []).includes("adoption")) {
    checklist.push("If you need the birth record from before an adoption and the office says it is sealed, follow the written instructions they send. The legal path is that office's adult-adoptee process or a petition to the court that granted the adoption.");
  }
  if (input.relationship && input.relationship !== "self") {
    checklist.push("Attach a signed authorization from the person whose record this is, or the court papers that give you authority.");
  }

  return {
    code: jurisdiction.code,
    place: jurisdiction.name,
    recordType: input.recordType,
    recordTitle: typeMeta.title,
    office: jurisdiction.vital.office,
    phone: jurisdiction.vital.phone,
    url: input.recordType === "driver" ? jurisdiction.dmv.url : jurisdiction.vital.url,
    since: spec.since,
    localNote: spec.localNote,
    names,
    reasons,
    channels,
    destinations,
    letters,
    checklist,
    returnAddress,
    disclaimer: "State Docs is a private assistance service. It is not a government agency, and this letter is not an official government form. The office that keeps the record decides whether to release it. Fees, forms, and hours change — confirm the fee on the official page before you mail payment.",
  };
}

function letterFor({ jurisdiction, input, desk, names, reasons, returnAddress, spec, typeMeta }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const eventBits = [
    clean(input.eventDate) && `Date: ${clean(input.eventDate)}`,
    !clean(input.eventDate) && clean(input.eventYear, 10) && `Year: ${clean(input.eventYear, 10)}`,
    clean(input.eventCity) && `City or town: ${clean(input.eventCity)}`,
    clean(input.county) && `County: ${clean(input.county)}`,
    `State or city: ${jurisdiction.name}`,
  ].filter(Boolean);

  const paragraphs = [
    `Please mail me a certified copy of this ${typeMeta.title.toLowerCase()}.`,
    `Search every name below. The record may be indexed under a name I no longer use.`,
  ];

  if (reasons.length) {
    paragraphs.push(`${reasons.join(". ")}. Please do not reject this request only because my photo ID uses a different surname.`);
  }

  if (input.recordType === "birth" || input.recordType === "adoption") {
    paragraphs.push("I am requesting the certified long-form birth certificate, the copy that includes parent names, not an abstract or wallet card.");
  }

  if (input.recordType === "adoption" || (input.obstacles || []).includes("adoption")) {
    paragraphs.push("Please send the birth certificate in my current legal name. If a record from before an adoption is sealed, please send written instructions for the legal way an adult adoptee may request it. I am not asking you to bypass a court seal.");
  }

  if (input.recordType === "driver") {
    paragraphs.push(input.forSelf === false
      ? "I request this driver record as an authorized representative. A signed authorization is attached. I understand the Driver's Privacy Protection Act limits who may receive a motor-vehicle record."
      : "I request my own driver record for personal use. I understand the office will verify my identity under the Driver's Privacy Protection Act.");
  }

  if (desk.kind !== "dmv" && (input.obstacles || []).includes("older_record") && spec.localNote) {
    paragraphs.push(spec.localNote);
  }
  if (desk.kind === "dmv" && jurisdiction.records.driver.localNote) paragraphs.push(jurisdiction.records.driver.localNote);

  paragraphs.push(`I have enclosed a photocopy of my photo ID and payment for the current fee, payable to ${desk.payableTo}. If the fee has changed, please apply this payment and tell me the balance, or return the payment with the current fee schedule. Please do not discard the request.`);
  paragraphs.push(`Please mail the record to:\n${returnAddress.join("\n")}`);

  const facts = [
    ["Record", typeMeta.title],
    ["Current legal name", input.legalName],
    ["Names to search", names.join("; ")],
    ["Name on the record, if different", clean(input.nameAtEvent) || "See the names to search"],
  ];
  if (clean(input.parentNames)) facts.push(["Parent names, including a parent's surname before marriage", clean(input.parentNames, 300)]);
  if (clean(input.spouseName)) facts.push(["Other spouse, and any former surname", clean(input.spouseName, 180)]);
  if (clean(input.dob)) facts.push(["Date of birth", clean(input.dob, 40)]);
  if (clean(input.relationship) && input.relationship !== "self") facts.push(["My relationship to the person on the record", clean(input.relationship, 80)]);
  else facts.push(["Relationship", "This is my own record, or I am the person entitled to a certified copy."]);
  if (clean(input.purpose)) facts.push(["Purpose", clean(input.purpose, 180)]);
  if (clean(input.phone, 40)) facts.push(["Phone", clean(input.phone, 40)]);
  if (clean(input.email, 120)) facts.push(["Email", clean(input.email, 120)]);
  facts.push(["Copies", String(Math.min(5, Math.max(1, Number(input.copies) || 1)))]);
  facts.push(...eventBits.map((bit) => ["Event", bit.replace(/^[^:]+:\s*/, (match) => match)]));

  return {
    desk,
    date: today,
    paragraphs,
    facts,
    signatureName: input.legalName,
  };
}

export function publicJurisdiction(jurisdiction) {
  return {
    code: jurisdiction.code,
    name: jurisdiction.name,
    vital: jurisdiction.vital,
    records: jurisdiction.records,
    dmv: {
      office: jurisdiction.dmv.office,
      mail: jurisdiction.dmv.mail,
      phone: jurisdiction.dmv.phone,
      url: jurisdiction.dmv.url,
    },
    counties: jurisdiction.counties.map((item) => ({ name: item.name, phone: item.phone })),
  };
}

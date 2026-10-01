import { normalizeState, STATE_CODES, STATE_LABELS, stateByCode } from "../states/us.js";

function placeName(code) {
  return stateByCode(normalizeState(code))?.name || code || "the state you named";
}

const stateChoice = (title) => ({
  type: "string",
  title,
  enum: STATE_CODES,
  "x-labels": STATE_LABELS,
});

const contactFields = {
  yourName: { type: "string", title: "Your full legal name" },
  email: { type: "string", title: "Email" },
  phone: { type: "string", title: "Phone" },
  address1: { type: "string", title: "Mailing address" },
  city: { type: "string", title: "City" },
  state: stateChoice("Your state"),
  zip: { type: "string", title: "ZIP" },
};

const letterForm = {
  code: "Request_Letter",
  title: "Request letter",
  fillStrategy: "letter",
};

function record(definition) {
  return {
    requiresNotary: false,
    requiredDocs: ["government_id"],
    forms: [letterForm],
    fees: { base: null, currency: "USD", note: "The office sets the fee. Confirm the current amount before you pay." },
    ...definition,
  };
}

export const RECORDS = [
  record({
    id: "all",
    group: "Start here",
    label: "All of these records",
    summary: "A checklist for marriage, divorce, death, property, your own bank records, and a criminal-history request.",
    limit: "Each office sends its own record. This packet does not retrieve them.",
    displayName: "Records checklist",
    submission: {
      channel: "mail",
      address: "Send each section to the office named in the letter.",
      portalUrl: "https://www.cdc.gov/nchs/w2w/index.htm",
      notes: [
        "Vital records: use the CDC where-to-write directory for the state where the event happened.",
        "Property records: county recorder or assessor where the property sits.",
        "Bank records: only from your own bank, in your name.",
        "Criminal history: your own FBI Identity History Summary, or a public court file from the clerk.",
      ],
    },
    nextSteps: [
      "Use the letter as a checklist, then file a separate request with each office.",
      "Open the CDC where-to-write directory for marriage, divorce, and death certificates.",
      "Ask the county recorder for deeds and the assessor for tax records.",
      "Send the bank section only to your own bank, with your ID.",
      "For your own criminal history, follow the FBI Identity History Summary instructions. Fingerprints are required.",
    ],
    letterTitle: "Records request checklist",
    letterIntro: "This is a private preparation checklist. No office in this list will release a record just because this letter exists. File each request with the office that keeps that record.",
    letterBody: (data) => [
      `Requester: ${data.yourName}`,
      `Mailing address: ${data.address1}, ${data.city}, ${data.state} ${data.zip}`,
      `Phone: ${data.phone}  Email: ${data.email}`,
      `State where the events happened: ${placeName(data.eventState)}`,
      "",
      "Marriage, divorce, and death certificates",
      "Request these from the state vital records office where the event occurred. Start at https://www.cdc.gov/nchs/w2w/index.htm. A divorce decree may instead be at the clerk of the court that entered it.",
      "",
      "Property",
      data.propertyAddress
        ? `Ask the county recorder and assessor for ${data.propertyAddress} in ${data.propertyCounty || "the property county"}, ${placeName(data.eventState)}.`
        : "Ask the county recorder for the deed and the assessor for the tax record in the county where the property sits.",
      "",
      "Bank records",
      data.bankName
        ? `Ask ${data.bankName} for statements on the account in ${data.yourName}'s own name. Do not send this to a bank for someone else's account.`
        : "Ask your own bank for statements on accounts in your name. Another person's bank records require that person's consent or a court order.",
      "",
      "Criminal history",
      "Request your own Identity History Summary from the FBI at https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks. For a public court case, ask the clerk of the court that heard it. Sealed files need a court order.",
    ].join("\n"),
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "eventState"],
      properties: {
        ...contactFields,
        eventState: stateChoice("State where the records are"),
        propertyAddress: { type: "string", title: "Property address, if you need a deed" },
        propertyCounty: { type: "string", title: "Property county" },
        bankName: { type: "string", title: "Your bank, if you need your own statements" },
      },
    },
  }),
  record({
    id: "marriage",
    group: "Vital records",
    label: "Marriage record",
    summary: "Ask the vital records office in the state where the marriage happened for a certificate.",
    limit: "The state decides who may order a certificate. This service does not issue one.",
    displayName: "Marriage record",
    submission: {
      channel: "portal",
      address: "Vital records office in the state where the marriage took place.",
      portalUrl: "https://www.cdc.gov/nchs/w2w/index.htm",
      notes: ["Use the CDC directory to find that state's current form, fee, and ID rules."],
    },
    nextSteps: [
      "Open the CDC where-to-write page and choose the state of the marriage.",
      "Order from that office if you are eligible. Bring the ID they require.",
      "Keep this letter for your files. It is not a marriage certificate.",
    ],
    letterTitle: "Marriage record request",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "party1Name", "party2Name", "eventState", "relationship"],
      properties: {
        ...contactFields,
        relationship: { type: "string", title: "Your relationship to the spouses", enum: ["I am one of the spouses", "Parent", "Child", "Legal representative", "Other eligible requester"] },
        party1Name: { type: "string", title: "Spouse 1 full name" },
        party2Name: { type: "string", title: "Spouse 2 full name" },
        eventDate: { type: "string", title: "Marriage date or approximate year" },
        eventCity: { type: "string", title: "City or county of the marriage" },
        eventState: stateChoice("State where the marriage happened"),
        purpose: { type: "string", title: "Why you need the certificate", default: "Personal records" },
      },
    },
  }),
  record({
    id: "divorce",
    group: "Vital records",
    label: "Divorce record",
    summary: "Ask the vital records office or the court that entered the decree.",
    limit: "A certificate and the court decree can be different documents. The court or state decides what is released.",
    displayName: "Divorce record",
    submission: {
      channel: "portal",
      address: "Vital records office or the clerk of the court that entered the divorce.",
      portalUrl: "https://www.cdc.gov/nchs/w2w/index.htm",
      notes: ["If you need the decree itself, ask the clerk of the court in the county where it was entered."],
    },
    nextSteps: [
      "Decide whether you need a vital-records certificate or the court decree.",
      "Use the CDC directory for the certificate, or the trial-court clerk for the decree.",
      "This letter is not a divorce decree.",
    ],
    letterTitle: "Divorce record request",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "party1Name", "party2Name", "eventState", "relationship"],
      properties: {
        ...contactFields,
        relationship: { type: "string", title: "Your relationship to the parties", enum: ["I am one of the parties", "Attorney for a party", "Other eligible requester"] },
        party1Name: { type: "string", title: "Party 1 full name" },
        party2Name: { type: "string", title: "Party 2 full name" },
        eventDate: { type: "string", title: "Decree date or approximate year" },
        eventCounty: { type: "string", title: "County of the divorce" },
        eventState: stateChoice("State where the divorce was entered"),
        caseNumber: { type: "string", title: "Case number, if you have it" },
        purpose: { type: "string", title: "Why you need the record", default: "Personal records" },
      },
    },
  }),
  record({
    id: "death",
    group: "Vital records",
    label: "Death record",
    summary: "Ask the vital records office in the state where the death occurred.",
    limit: "States limit who can order a death certificate. This service does not issue one.",
    displayName: "Death record",
    submission: {
      channel: "portal",
      address: "Vital records office in the state where the death occurred.",
      portalUrl: "https://www.cdc.gov/nchs/w2w/index.htm",
      notes: ["Have the requester's ID ready. Some states also ask for proof of relationship."],
    },
    nextSteps: [
      "Open the CDC where-to-write page and choose the state where the death occurred.",
      "Order only if that office's rules say you are eligible.",
      "This letter is not a death certificate.",
    ],
    letterTitle: "Death record request",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "decedentName", "eventState", "relationship"],
      properties: {
        ...contactFields,
        relationship: { type: "string", title: "Your relationship to the decedent", enum: ["Spouse", "Child", "Parent", "Legal representative", "Other eligible requester"] },
        decedentName: { type: "string", title: "Decedent's full legal name" },
        eventDate: { type: "string", title: "Date of death or approximate year" },
        eventCity: { type: "string", title: "City or county of death" },
        eventState: stateChoice("State where the death occurred"),
        purpose: { type: "string", title: "Why you need the certificate", default: "Estate or personal records" },
      },
    },
  }),
  record({
    id: "property",
    group: "Property",
    label: "Property record",
    summary: "Ask the county recorder for deeds and the assessor for tax and assessment records.",
    limit: "These are county records. Availability depends on that county.",
    displayName: "Property record",
    submission: {
      channel: "portal",
      address: "County recorder (deeds) and county assessor (tax and assessment) where the property is located.",
      portalUrl: "https://www.usa.gov/local-governments",
      notes: ["Use USA.gov to find the county offices if you do not already have their sites."],
    },
    nextSteps: [
      "Find the county recorder and assessor for the property's county.",
      "Ask the recorder for the deed and the assessor for the tax record.",
      "Give them the address or parcel number from this letter.",
    ],
    letterTitle: "Property record request",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "propertyAddress", "propertyCounty", "eventState", "recordNeeded"],
      properties: {
        ...contactFields,
        propertyAddress: { type: "string", title: "Property street address" },
        propertyCounty: { type: "string", title: "County" },
        eventState: stateChoice("State"),
        parcelNumber: { type: "string", title: "Parcel or APN, if you have it" },
        ownerName: { type: "string", title: "Owner name on the deed, if known" },
        recordNeeded: { type: "string", title: "What you need", enum: ["Deed", "Assessment or tax record", "Both the deed and the tax record"] },
        purpose: { type: "string", title: "Why you need it", default: "Property research" },
      },
    },
  }),
  record({
    id: "bank",
    group: "Your bank",
    label: "Bank records (your account)",
    summary: "Write your own bank and ask for statements on an account in your name.",
    limit: "Only the account holder can use this. Someone else's bank records need that person's consent or a court order. This service cannot pull them.",
    displayName: "Your bank records",
    submission: {
      channel: "mail",
      address: "Your bank's records or statements department.",
      notes: [
        "Send this only to a bank where you are the account holder.",
        "Do not include a full account number in this letter. The bank can match the last four digits to your ID.",
      ],
    },
    requiredDocs: ["government_id"],
    nextSteps: [
      "Sign the letter and attach a copy of your photo ID.",
      "Send it to your own bank's statements or records address.",
      "Do not use this letter to ask for another person's account.",
    ],
    letterTitle: "Request for my own bank records",
    letterIntro: "I am the account holder. Please send copies of my own account records to me at the address below. I will include a copy of my identification. Please do not release these records to anyone else based on this letter.",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "bankName", "accountLast4", "dateRange", "accountHolder"],
      properties: {
        ...contactFields,
        accountHolder: { type: "string", title: "Are you the account holder?", enum: ["Yes, these are my own records"] },
        bankName: { type: "string", title: "Your bank or credit union" },
        accountLast4: { type: "string", title: "Last 4 digits of the account", pattern: "^[0-9]{4}$" },
        dateRange: { type: "string", title: "Statement dates you need", default: "The last 12 months" },
        documents: { type: "string", title: "What you need", enum: ["Monthly statements", "Deposited item copies", "Statements and deposited items"] },
      },
    },
  }),
  record({
    id: "criminal_history",
    group: "Criminal records",
    label: "Your criminal history",
    summary: "Request your own FBI Identity History Summary. State police may also offer a state check.",
    limit: "This is your own record. It does not search another person, and it does not return results from this site.",
    displayName: "Your criminal history",
    submission: {
      channel: "portal",
      address: "FBI Identity History Summary Check. A state check goes to that state's criminal history repository.",
      portalUrl: "https://www.fbi.gov/how-we-can-help-you/more-fbi-services-and-information/identity-history-summary-checks",
      notes: ["The FBI check requires fingerprints and a fee. Confirm the current steps on the FBI page."],
    },
    nextSteps: [
      "Follow the FBI Identity History Summary instructions and get fingerprinted.",
      "If you only need one state, ask that state's criminal history repository.",
      "This packet is the request checklist, not the record.",
    ],
    letterTitle: "Request for my own criminal history",
    letterIntro: "I am requesting my own identity history summary. Please use the official FBI or state-repository process. This letter does not replace fingerprints or the official application.",
    schema: {
      type: "object",
      required: ["yourName", "dateOfBirth", "email", "phone", "address1", "city", "state", "zip", "placeOfBirth", "purpose"],
      properties: {
        ...contactFields,
        dateOfBirth: { type: "string", title: "Your date of birth" },
        placeOfBirth: { type: "string", title: "Your place of birth" },
        purpose: { type: "string", title: "Why you need your own record", enum: ["Personal review", "Employment", "Licensing", "Immigration or travel", "Other"] },
      },
    },
  }),
  record({
    id: "court_record",
    group: "Criminal records",
    label: "Public court record",
    summary: "Ask the clerk of the court that heard the case for a public file.",
    limit: "The clerk decides what is public. Sealed and expunged files need a court order. This site does not search criminal databases.",
    displayName: "Public court record",
    submission: {
      channel: "portal",
      address: "Clerk of the court that heard the case. Federal cases are on PACER.",
      portalUrl: "https://pacer.uscourts.gov/",
      notes: ["For a state case, contact that county's clerk. For a federal case, use PACER."],
    },
    nextSteps: [
      "Contact the clerk in the county or federal court named in the letter.",
      "Give them the case number if you have it.",
      "If the file is sealed, you need an order from that court.",
    ],
    letterTitle: "Public court record request",
    schema: {
      type: "object",
      required: ["yourName", "email", "phone", "address1", "city", "state", "zip", "courtName", "eventCounty", "eventState", "partyName"],
      properties: {
        ...contactFields,
        courtName: { type: "string", title: "Court name" },
        eventCounty: { type: "string", title: "County, or Federal if it is a federal case" },
        eventState: stateChoice("State"),
        caseNumber: { type: "string", title: "Case number, if you have it" },
        partyName: { type: "string", title: "Party name on the public docket" },
        recordNeeded: { type: "string", title: "What you need", enum: ["Docket sheet", "A specific public filing", "The public case file"] },
      },
    },
  }),
];

export const RECORD_REGISTRY = new Map(RECORDS.map((entry) => [entry.id, entry]));

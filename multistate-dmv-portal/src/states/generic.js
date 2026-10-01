import { STATE_CODES, STATE_LABELS } from "./us.js";

const mailingState = {
  type: "string",
  title: "Your state",
  enum: STATE_CODES,
  "x-labels": STATE_LABELS,
};

function driverSchema(code) {
  return {
    type: "object",
    required: ["fullName", "dob", "dlNumber", "address1", "city", "state", "zip", "phone", "email"],
    properties: {
      fullName: { type: "string", title: "Full legal name" },
      dob: { type: "string", title: "Date of birth (MM/DD/YYYY)" },
      dlNumber: { type: "string", title: "Driver license number" },
      address1: { type: "string", title: "Mailing address" },
      city: { type: "string", title: "City" },
      state: { ...mailingState, default: code },
      zip: { type: "string", title: "ZIP" },
      phone: { type: "string", title: "Phone" },
      email: { type: "string", title: "Email" },
      purpose: { type: "string", title: "Purpose", default: "Own record" },
    },
  };
}

function vehicleSchema(code) {
  return {
    type: "object",
    required: ["fullName", "vin", "address1", "city", "state", "zip", "phone", "email"],
    properties: {
      fullName: { type: "string", title: "Full legal name" },
      vin: { type: "string", title: "Vehicle identification number" },
      plate: { type: "string", title: "License plate" },
      address1: { type: "string", title: "Mailing address" },
      city: { type: "string", title: "City" },
      state: { ...mailingState, default: code },
      zip: { type: "string", title: "ZIP" },
      phone: { type: "string", title: "Phone" },
      email: { type: "string", title: "Email" },
      purpose: { type: "string", title: "Purpose", default: "Own vehicle record" },
    },
  };
}

export function genericMotorState(place) {
  return {
    state: place.code,
    displayName: place.name,
    supports: ["driver_history", "vehicle_record"],
    requiresNotary: false,
    requiresAuthorizationWhenRequestingForAnother: true,
    requiredDocs: ["government_id"],
    fees: {
      base: null,
      currency: "USD",
      note: "The motor vehicle agency sets this fee. Confirm the current amount before you pay.",
    },
    submission: {
      channel: "portal",
      address: `${place.name} motor vehicle agency`,
      portalUrl: place.dmvUrl,
      notes: [
        "USA.gov lists this agency for motor vehicle services in this state.",
        "Driver licensing and vehicle titles are different offices in some states. If this agency does not keep the record, ask which office does.",
        "This packet is a request letter. File the agency's own form when that agency requires one.",
      ],
    },
    forms: [
      {
        code: "Request_Letter",
        title: "Request letter",
        fillStrategy: "letter",
      },
    ],
    letterTitle: `${place.name} motor vehicle record request`,
    letterIntro: `Please accept this letter as a request for my own motor vehicle record from ${place.name}. Your agency decides eligibility, the official form, and the fee. This letter does not replace that form.`,
    nextSteps: [
      `Open the ${place.name} motor vehicle agency site and confirm the current form and fee.`,
      "Use this letter as your checklist. File the agency's own form if they require one.",
      "Driver licensing and vehicle titles are different offices in some states.",
      "Keep a copy of what you send.",
    ],
    schema: {
      driver_history: driverSchema(place.code),
      vehicle_record: vehicleSchema(place.code),
    },
  };
}

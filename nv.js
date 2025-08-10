export const NV = {
  state: "NV",
  displayName: "Nevada",
  supports: ["driver_history", "vehicle_record"],
  requiresNotary: true,
  requiresAuthorizationWhenRequestingForAnother: true,
  requiredDocs: ["gov_id_front", "notarized_affidavit"],
  fees: { base: 7, certifiedAddOn: 4, currency: "USD" },
  submission: {
    channel: "mail",
    address: "Central Services Records Division\n555 Wright Way\nCarson City, NV 89711-0250",
    portalUrl: "https://nevada-dmv.govqa.us/WEBAPP/_rs/SupportHome.aspx",
    notes: [
      "Include driver’s license copy.",
      "Affidavit must be notarized (e-notary acceptable in most cases)."
    ]
  },
  forms: [
    {
      code: "IR-002",
      title: "Individual Records Request",
      templateFile: "templates/NV/IR-002.pdf",
      fillStrategy: "overlay",
      overlayMap: {
        fullName: { x: 95, y: 690 },
        dob: { x: 420, y: 690 },
        dlNumber: { x: 420, y: 670 },
        address1: { x: 95, y: 670 },
        cityStateZip: { x: 95, y: 650 },
        phone: { x: 95, y: 630 },
        email: { x: 300, y: 630 },
        purpose: { x: 95, y: 610 }
      }
    },
    {
      code: "IR-003",
      title: "Affidavit",
      templateFile: "templates/NV/IR-003.pdf",
      fillStrategy: "overlay",
      overlayMap: {
        fullName: { x: 120, y: 705 },
        address1: { x: 120, y: 685 },
        cityStateZip: { x: 120, y: 665 }
      }
    }
  ],
  schema: {
    driver_history: {
      type: "object",
      required: ["fullName", "dob", "dlNumber", "address1", "city", "state", "zip", "phone", "email"],
      properties: {
        fullName: { type: "string", title: "Full legal name" },
        dob: { type: "string", title: "Date of birth (MM/DD/YYYY)" },
        dlNumber: { type: "string", title: "Driver License number" },
        address1: { type: "string", title: "Address line 1" },
        address2: { type: "string", title: "Address line 2" },
        city: { type: "string", title: "City" },
        state: { type: "string", title: "State", default: "NV" },
        zip: { type: "string", title: "ZIP" },
        phone: { type: "string", title: "Phone" },
        email: { type: "string", title: "Email" },
        purpose: { type: "string", title: "Purpose", default: "Own record" }
      }
    }
  }
};

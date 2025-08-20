export const TEMPLATE_STATE = {
  state: "XX",
  displayName: "Example State",
  supports: ["driver_history"],
  requiresNotary: false,
  requiresAuthorizationWhenRequestingForAnother: true,
  requiredDocs: ["gov_id_front"],
  fees: { base: 10, certifiedAddOn: 5, currency: "USD" },
  submission: {
    channel: "portal",
    portalUrl: "https://example.gov/records",
    notes: ["Portal requires user login", "Allow 5–7 business days"]
  },
  forms: [
    {
      code: "FORM-1",
      title: "Driver Record Request",
      templateFile: "templates/XX/FORM-1.pdf",
      fillStrategy: "overlay",
      overlayMap: {
        fullName: { x: 95, y: 700 },
        dob: { x: 420, y: 700 },
        dlNumber: { x: 420, y: 680 }
      }
    }
  ],
  schema: {
    driver_history: {
      type: "object",
      required: ["fullName", "dob", "dlNumber"],
      properties: {
        fullName: { type: "string", title: "Full legal name" },
        dob: { type: "string", title: "DOB (MM/DD/YYYY)" },
        dlNumber: { type: "string", title: "Driver License number" }
      }
    }
  }
};

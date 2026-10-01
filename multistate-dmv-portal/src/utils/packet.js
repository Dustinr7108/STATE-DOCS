import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { v4 as uuid } from "uuid";
import { drawBlock, plainText } from "./pdfText.js";
import { readTemplate } from "./templates.js";
import { formatMoney } from "../fees/schedule.js";
import { normalizeState, stateByCode } from "../states/us.js";

const FIELD_LABELS = {
  fullName: "Full legal name",
  dob: "Date of birth",
  dlNumber: "Driver license number",
  vin: "Vehicle identification number",
  plate: "License plate",
  address1: "Address",
  address2: "Address line 2",
  city: "City",
  state: "State",
  zip: "ZIP",
  phone: "Phone",
  email: "Email",
  purpose: "Purpose",
};

export async function buildPacket(adapter, requestType, data) {
  const packetId = uuid();
  const files = [];

  for (const form of adapter.forms) {
    const filled = form.fillStrategy === "letter"
      ? await makeLetter(adapter, data)
      : form.fillStrategy === "acroform"
        ? await fillAcroForm(await readTemplate(form.templateFile), form, data)
        : await fillOverlay(await readTemplate(form.templateFile), form, data);
    files.push({
      name: `${form.code}.pdf`,
      title: form.title,
      bytes: filled,
    });
  }

  const cover = await makeCover({
    state: adapter.displayName,
    requestType,
    address: adapter.submission.address,
    portalUrl: adapter.submission.portalUrl,
    fees: adapter.fees,
    requiredDocs: adapter.requiredDocs,
    notes: adapter.submission.notes || [],
    details: data,
  });
  files.push({
    name: "Cover_Instructions.pdf",
    title: "Cover and instructions",
    bytes: cover,
  });

  return {
    packetId,
    state: adapter.state,
    requestType,
    files: files.map((file) => ({
      name: file.name,
      title: file.title,
      contentType: "application/pdf",
      base64: Buffer.from(file.bytes).toString("base64"),
    })),
    nextSteps: buildNextSteps(adapter),
    disclaimer: "This is a private preparation packet, not a government agency filing. Confirm the current official form, fee, and submission rules before you send anything.",
  };
}

async function fillAcroForm(bytes, form, data) {
  const pdf = await PDFDocument.load(bytes);
  const formApi = pdf.getForm();
  for (const [pdfField, logical] of Object.entries(form.fieldMap || {})) {
    const value = valueFor(data, logical);
    try {
      formApi.getTextField(pdfField).setText(value ?? "");
    } catch {
      // Placeholder templates may not contain every mapped field.
    }
  }
  try {
    formApi.flatten();
  } catch {
    // Some blank templates have no AcroForm fields to flatten.
  }
  return pdf.save();
}

async function fillOverlay(bytes, form, data) {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const [logical, pos] of Object.entries(form.overlayMap || {})) {
    const page = pdf.getPage(pos.page ?? 0);
    const value = plainText(valueFor(data, logical)).replace(/[\n\r\t]/g, " ");
    if (!value) continue;
    page.drawText(value, {
      x: pos.x,
      y: pos.y,
      size: pos.size ?? 10,
      font,
      color: rgb(0, 0, 0),
    });
  }
  return pdf.save();
}

function labelFor(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const spaced = String(key).replace(/([A-Z])/g, " $1").replaceAll("_", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function shown(key, value) {
  const text = value == null ? "" : String(value);
  const place = (key === "state" || key === "eventState") ? stateByCode(normalizeState(text)) : null;
  return place ? place.name : text;
}

function valueFor(data, key) {
  if (key === "cityStateZip") return `${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim();
  const value = data?.[key];
  return value == null ? "" : String(value);
}

async function makeCover({ state, requestType, address, portalUrl, fees, requiredDocs, notes, details }) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 790;

  const ensure = (needed = 40) => {
    if (y >= needed) return;
    page = pdf.addPage([595, 842]);
    y = 790;
  };

  const heading = (text, size = 16) => {
    ensure(size + 20);
    y = drawBlock(page, bold, text, 40, y, { size, maxWidth: 515, lineGap: 3 });
    y -= 6;
  };
  const body = (text, size = 11) => {
    ensure(size + 16);
    y = drawBlock(page, font, text, 40, y, { size, maxWidth: 515 });
    y -= 8;
  };

  heading(`${state} records packet`);
  body(`Request type: ${String(requestType || "").replaceAll("_", " ")}`);
  body("Private assistance packet. This service is not a government agency. The included PDFs are preparation copies. Replace them with the official blank forms before you submit a request.");

  if (address) {
    heading("Where to send it", 13);
    body(address);
  }
  if (portalUrl) {
    heading("Agency portal", 13);
    body(portalUrl);
  }

  heading("Fees to confirm", 13);
  if (Array.isArray(fees?.lines) && fees.lines.length) {
    for (const line of fees.lines) {
      const price = formatMoney(line.amount) || "Set by the office";
      const unit = line.unit ? ` ${line.unit}` : "";
      const note = line.note ? ` — ${line.note}` : "";
      const group = line.group ? `${line.group}: ` : "";
      body(`${group}${line.label}: ${price}${unit}${note}`);
    }
    if (fees.source) body(`Source: ${fees.source}`);
  } else {
    const feeLine = fees?.base == null
      ? (fees?.note || "The office sets the fee. Confirm the current amount before you pay.")
      : `Listed base fee: $${fees.base}${fees.certifiedAddOn ? `. Certified copy add-on: $${fees.certifiedAddOn}` : ""}. ${fees.currency || "USD"}. Agencies change fees; check the current amount before you pay.`;
    body(feeLine);
  }
  body("Portal membership is $0 for 7 days, then $19.99 per month. That charge is separate from the office fees.");

  heading("Attachments", 13);
  body(requiredDocs.map((doc) => doc.replaceAll("_", " ")).join(", ") || "None listed");

  if (notes.length) {
    heading("Notes", 13);
    notes.forEach((note) => body(`• ${note}`));
  }

  heading("Details you entered", 13);
  for (const [key, value] of Object.entries(details || {})) {
    if (value == null || String(value).trim() === "") continue;
    body(`${labelFor(key)}: ${shown(key, value)}`);
  }

  heading("Before you submit", 13);
  body("Review every page, sign where the official form requires it, and keep a copy for your records.");

  return pdf.save();
}

async function makeLetter(adapter, data) {
  const pdf = await PDFDocument.create();
  let page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let y = 790;
  const ensure = (needed = 40) => {
    if (y >= needed) return;
    page = pdf.addPage([595, 842]);
    y = 790;
  };
  const heading = (text, size = 16) => {
    ensure(size + 20);
    y = drawBlock(page, bold, text, 40, y, { size, maxWidth: 515, lineGap: 3 });
    y -= 6;
  };
  const body = (text, size = 11) => {
    ensure(size + 16);
    y = drawBlock(page, font, text, 40, y, { size, maxWidth: 515 });
    y -= 8;
  };

  heading(adapter.letterTitle || `${adapter.displayName} request`);
  body(adapter.letterIntro || "Please treat this letter as a request for the record described below. Your office decides eligibility, the official form, and the fee.");
  if (adapter.submission?.address) body(`Send to:\n${adapter.submission.address}`);
  if (typeof adapter.letterBody === "function") {
    body(adapter.letterBody(data));
  } else {
    for (const [key, value] of Object.entries(data || {})) {
      if (value == null || String(value).trim() === "") continue;
      body(`${labelFor(key)}: ${shown(key, value)}`);
    }
  }
  body("Signature: ________________________________");
  body(`Printed name: ${data.yourName || data.fullName || ""}`);
  body("This letter was prepared by a private assistance service. It is not a government form or a copy of the record.");
  return pdf.save();
}

function buildNextSteps(adapter) {
  if (Array.isArray(adapter.nextSteps) && adapter.nextSteps.length) return adapter.nextSteps;
  const steps = [
    "Review the packet and confirm it matches the current official instructions for this state.",
  ];
  if (adapter.requiresNotary) {
    steps.push("Get the affidavit notarized where the agency requires it. An e-notary is acceptable only if that agency allows it.");
  }
  steps.push("Attach a clear copy of the government ID the agency asks for.");
  if (adapter.submission.channel === "mail") {
    steps.push("Print, sign, and mail the official forms with the required fee.");
  }
  if (adapter.submission.channel === "portal" && adapter.submission.portalUrl) {
    steps.push("Open the agency portal and upload the official forms there.");
  }
  if (adapter.submission.portalUrl && adapter.submission.channel !== "portal") {
    steps.push("You can also check the agency portal linked in the cover sheet for an online option.");
  }
  steps.push("Keep your confirmation or mailing receipt.");
  return steps;
}

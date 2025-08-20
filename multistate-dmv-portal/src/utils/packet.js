import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

export async function buildPacket(adapter, requestType, data) {
  const outId = uuid();
  const outDir = path.join(process.cwd(), "generated", adapter.state, outId);
  await fs.mkdir(outDir, { recursive: true });

  // Fill each form according to mapping
  for (const form of adapter.forms) {
    const bytes = await fs.readFile(path.join(process.cwd(), form.templateFile));
    const filled = form.fillStrategy === "acroform"
      ? await fillAcroForm(bytes, form, data)
      : await fillOverlay(bytes, form, data);
    await fs.writeFile(path.join(outDir, `${form.code}.pdf`), filled);
  }

  // Cover sheet
  const cover = await makeCover({
    state: adapter.displayName,
    address: adapter.submission.address,
    portalUrl: adapter.submission.portalUrl,
    fees: adapter.fees,
    requiredDocs: adapter.requiredDocs,
    notes: adapter.submission.notes || [],
  });
  await fs.writeFile(path.join(outDir, "Cover_Instructions.pdf"), cover);

  return {
    packetId: outId,
    files: [
      ...adapter.forms.map(f => `/download/${adapter.state}/${outId}/${f.code}.pdf`),
      `/download/${adapter.state}/${outId}/Cover_Instructions.pdf`,
    ],
    nextSteps: buildNextSteps(adapter),
  };
}

async function fillAcroForm(bytes, form, data) {
  const pdf = await PDFDocument.load(bytes);
  const formApi = pdf.getForm();
  for (const [pdfField, logical] of Object.entries(form.fieldMap || {})) {
    const v = valueFor(data, logical);
    try { formApi.getTextField(pdfField).setText(v ?? ""); } catch {}
  }
  return pdf.save();
}

async function fillOverlay(bytes, form, data) {
  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (const [logical, pos] of Object.entries(form.overlayMap || {})) {
    const page = pdf.getPage(pos.page ?? 0);
    const val = valueFor(data, logical) ?? "";
    page.drawText(val, { x: pos.x, y: pos.y, size: pos.size ?? 10, font, color: rgb(0, 0, 0) });
  }
  return pdf.save();
}

function valueFor(data, key) {
  if (key === "cityStateZip") return `${data.city}, ${data.state} ${data.zip}`;
  return data[key];
}

async function makeCover({ state, address, portalUrl, fees, requiredDocs, notes }) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const draw = (t, x, y, s=12) => page.drawText(t, { x, y, size: s, font });
  let y = 790;
  draw(`State: ${state} — DMV Records Packet`, 40, y, 16); y -= 30;
  if (address) { draw("Mail to:", 40, y); y -= 16; draw(address, 40, y); y -= 40; }
  if (portalUrl) { draw(`Portal: ${portalUrl}`, 40, y); y -= 20; }
  draw(`Fees: $${fees.base}${fees.certifiedAddOn ? ` (+$${fees.certifiedAddOn} certified)` : ""}`, 40, y); y -= 20;
  draw(`Required attachments: ${requiredDocs.join(", ")}`, 40, y); y -= 20;
  notes.forEach(n => { draw(`• ${n}`, 40, y); y -= 16; });
  draw("We are a private assistance service, not a government agency.", 40, y - 8, 10);
  return pdf.save();
}

function buildNextSteps(adapter) {
  const steps = [];
  if (adapter.requiresNotary) steps.push("Get the affidavit notarized (e-notary accepted where allowed).");
  steps.push("Attach a clear image of your government ID.");
  if (adapter.submission.channel === "mail") steps.push("Print, sign, and mail the packet with required fees.");
  if (adapter.submission.channel === "portal") steps.push("Follow the portal link and upload the generated forms.");
  steps.push("Track status from your dashboard.");
  return steps;
}

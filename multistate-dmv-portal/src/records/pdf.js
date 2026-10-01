import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const INK = rgb(0.11, 0.09, 0.07);
const MUTED = rgb(0.33, 0.28, 0.24);
const RULE = rgb(0.72, 0.62, 0.5);

function pdfSafe(text) {
  return String(text ?? "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00a0/g, " ")
    .replace(/[^\n\x20-\x7E]/g, "");
}

function wrap(text, font, size, maxWidth) {
  const lines = [];
  for (const paragraph of pdfSafe(text).split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(trial, size) <= maxWidth) {
        line = trial;
      } else {
        if (line) lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function startPage(pdf, fonts) {
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  page.drawRectangle({ x: 0, y: PAGE_H - 28, width: PAGE_W, height: 28, color: rgb(0.45, 0.22, 0.12) });
  page.drawText("STATE DOCS  ·  MAIL PACKET", {
    x: MARGIN,
    y: PAGE_H - 18,
    size: 9,
    font: fonts.bold,
    color: rgb(1, 0.96, 0.9),
  });
  return { page, y: PAGE_H - 52 };
}

function footer(page, fonts, pageNo) {
  page.drawText("Private assistance service, not a government agency. Confirm the fee before you mail payment.", {
    x: MARGIN,
    y: 28,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
  page.drawText(String(pageNo), {
    x: PAGE_W - MARGIN - 10,
    y: 28,
    size: 8,
    font: fonts.regular,
    color: MUTED,
  });
}

export async function renderPacket(guide) {
  const pdf = await PDFDocument.create();
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  let cursor = startPage(pdf, fonts);
  let pageNo = 1;
  const maxW = PAGE_W - MARGIN * 2;

  function need(height) {
    if (cursor.y - height < 48) {
      footer(cursor.page, fonts, pageNo);
      pageNo += 1;
      cursor = startPage(pdf, fonts);
    }
  }

  function drawLines(lines, { font = fonts.regular, size = 11, color = INK, gap = 4 } = {}) {
    for (const line of lines) {
      need(size + gap);
      if (line) {
        cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size, font, color });
      }
      cursor.y -= size + gap;
    }
  }

  drawLines(wrap(guide.recordTitle, fonts.bold, 20, maxW), { font: fonts.bold, size: 20, gap: 3 });
  cursor.y -= 4;
  drawLines(wrap(guide.place, fonts.regular, 12, maxW), { size: 12, color: MUTED });
  cursor.y -= 8;
  drawLines(wrap("Mail this even if the website has no button for your county or rejects the name you use now.", fonts.regular, 11, maxW), { size: 11 });
  cursor.y -= 6;

  if (guide.names.length) {
    drawLines(["Names the clerk must search"], { font: fonts.bold, size: 12 });
    drawLines(wrap(guide.names.join("   ·   "), fonts.regular, 11, maxW));
    cursor.y -= 6;
  }

  drawLines(["Where to send it"], { font: fonts.bold, size: 12 });
  for (const desk of guide.destinations) {
    const label = desk.role === "primary" ? "Send this copy" : "Also send a copy here";
    drawLines(wrap(`${label}: ${desk.title}`, fonts.bold, 11, maxW), { font: fonts.bold, size: 11 });
    drawLines(wrap(desk.address, fonts.regular, 11, maxW));
    if (desk.phone) drawLines([`Phone: ${desk.phone}`], { size: 10, color: MUTED });
    drawLines(wrap(desk.why, fonts.regular, 10, maxW), { size: 10, color: MUTED });
    cursor.y -= 6;
  }

  if (guide.localNote) {
    drawLines(["If the year or the county is unusual"], { font: fonts.bold, size: 12 });
    drawLines(wrap(guide.localNote, fonts.regular, 10, maxW), { size: 10 });
    cursor.y -= 8;
  }

  drawLines(["Before you mail"], { font: fonts.bold, size: 12 });
  guide.checklist.forEach((item, index) => {
    drawLines(wrap(`${index + 1}. ${item}`, fonts.regular, 10, maxW), { size: 10 });
  });
  cursor.y -= 8;
  drawLines(wrap(guide.disclaimer, fonts.regular, 8, maxW), { size: 8, color: MUTED });

  for (const letter of guide.letters) {
    footer(cursor.page, fonts, pageNo);
    pageNo += 1;
    cursor = startPage(pdf, fonts);
    drawLines(["Request letter"], { font: fonts.bold, size: 16, gap: 3 });
    drawLines([letter.date], { size: 11 });
    cursor.y -= 8;
    drawLines(wrap(letter.desk.address, fonts.regular, 11, maxW));
    cursor.y -= 8;
    drawLines(wrap(`Re: Request for a certified copy — ${guide.recordTitle}`, fonts.bold, 11, maxW), { font: fonts.bold, size: 11 });
    cursor.y -= 6;
    for (const paragraph of letter.paragraphs) {
      drawLines(wrap(paragraph, fonts.regular, 11, maxW));
      cursor.y -= 6;
    }
    drawLines(["Facts for the search"], { font: fonts.bold, size: 12 });
    for (const [label, value] of letter.facts) {
      drawLines(wrap(`${label}: ${value}`, fonts.regular, 10, maxW), { size: 10 });
    }
    cursor.y -= 16;
    need(48);
    cursor.page.drawLine({
      start: { x: MARGIN, y: cursor.y },
      end: { x: MARGIN + 220, y: cursor.y },
      thickness: 0.6,
      color: RULE,
    });
    cursor.y -= 14;
    drawLines([pdfSafe(letter.signatureName), "Signature"], { size: 10 });
  }

  footer(cursor.page, fonts, pageNo);
  pageNo += 1;
  cursor = startPage(pdf, fonts);
  drawLines(["Envelope sheet"], { font: fonts.bold, size: 16, gap: 3 });
  drawLines(wrap("Tape or copy this onto the envelope. Use one envelope per office.", fonts.regular, 11, maxW));

  for (const desk of guide.destinations) {
    const block = ["FROM", ...guide.returnAddress, "", "TO", ...pdfSafe(desk.address).split("\n").filter((line) => line.trim())];
    const height = 28 + block.length * 14;
    cursor.y -= 10;
    need(height);
    const top = cursor.y;
    cursor.page.drawRectangle({
      x: MARGIN,
      y: top - height,
      width: maxW,
      height,
      borderColor: RULE,
      borderWidth: 1,
    });
    cursor.y = top - 18;
    for (const line of block) {
      cursor.page.drawText(pdfSafe(line).slice(0, 88), {
        x: MARGIN + 16,
        y: cursor.y,
        size: 11,
        font: line === "FROM" || line === "TO" ? fonts.bold : fonts.regular,
        color: INK,
      });
      cursor.y -= 14;
    }
    cursor.y = top - height - 12;
  }

  footer(cursor.page, fonts, pageNo);
  return pdf.save();
}

export async function writePacket(guide) {
  const bytes = await renderPacket(guide);
  const packetId = uuid();
  const outDir = path.join(process.cwd(), "generated", "mail", packetId);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, "Mail_Packet.pdf"), bytes);
  return {
    packetId,
    file: `/download/mail/${packetId}/Mail_Packet.pdf`,
  };
}

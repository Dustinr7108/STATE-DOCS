import { rgb } from "pdf-lib";

const INK = rgb(0.11, 0.1, 0.08);

export function plainText(text) {
  return String(text ?? "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\n\r\t\x20-\x7E]/g, "");
}

export function wrapLine(text, font, size, maxWidth) {
  const words = String(text ?? "").split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function drawBlock(page, font, text, x, y, { size = 12, maxWidth = 500, color = INK, lineGap = 4 } = {}) {
  const paragraphs = plainText(text).split(/\n/);
  for (const paragraph of paragraphs) {
    const lines = wrapLine(paragraph, font, size, maxWidth);
    for (const line of lines) {
      page.drawText(line, { x, y, size, font, color });
      y -= size + lineGap;
    }
  }
  return y;
}

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { TEMPLATES } from "../data/templates.js";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function readTemplate(relativePath) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), "multistate-dmv-portal", relativePath),
    path.resolve(here, "../../", relativePath),
    path.resolve(here, "../../../", relativePath),
  ];
  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate);
    } catch {
      // Bundled Netlify functions fall through to the embedded copy.
    }
  }
  const embedded = TEMPLATES[relativePath];
  if (embedded) return Buffer.from(embedded, "base64");
  throw new Error(`Template not found: ${relativePath}`);
}

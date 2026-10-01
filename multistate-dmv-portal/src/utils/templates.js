import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

export async function readTemplate(relativePath) {
  const candidates = [
    path.join(process.cwd(), relativePath),
    path.join(process.cwd(), "multistate-dmv-portal", relativePath),
    path.resolve(here, "../../", relativePath),
    path.resolve(here, "../../../", relativePath),
    path.resolve(here, "../../../../", relativePath),
  ];
  const tried = [];
  for (const candidate of candidates) {
    tried.push(candidate);
    try {
      return await fs.readFile(candidate);
    } catch {
      // Try the next location. Bundled functions and local runs differ.
    }
  }
  throw new Error(`Template not found: ${relativePath} (looked in ${tried.join(", ")})`);
}

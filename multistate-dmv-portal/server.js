import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import billingRouter from "./src/routes/billing.js";
import dmvRouter from "./src/routes/dmv.js";
import recordsRouter from "./src/routes/records.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet({
    contentSecurityPolicy: false,
  }));
  app.use(cors({ origin: true }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/download", express.static(path.join(__dirname, "generated"), {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "private, max-age=600");
      res.setHeader("Content-Disposition", "inline");
    },
  }));

  app.use(billingRouter);
  app.use(dmvRouter);
  app.use(recordsRouter);
  app.use("/", express.static(path.join(__dirname, "public")));

  app.use((req, res) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
    return res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
  });

  return app;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isDirectRun) {
  const port = process.env.PORT || 3001;
  createApp().listen(port, () => {
    console.log(`State Docs listening on :${port}`);
  });
}

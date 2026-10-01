import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import billingRouter from "./src/routes/billing.js";
import dmvRouter from "./src/routes/dmv.js";
import recordsRouter from "./src/routes/records.js";
import servicesRouter from "./src/routes/services.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get("/health", (req, res) => res.json({ ok: true }));

app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use("/", express.static(path.join(__dirname, "public")));
app.get("/billing/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "billing", "success.html"));
});
app.get("/billing/cancel", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "billing", "cancel.html"));
});

app.use(billingRouter);
app.use(dmvRouter);
app.use(recordsRouter);
app.use(servicesRouter);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isDirectRun) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log(`Server listening on :${port}`));
}

export default app;

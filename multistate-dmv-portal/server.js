import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import billingRouter from "./src/routes/billing.js";
import dmvRouter from "./src/routes/dmv.js";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Health
app.get("/health", (req,res)=>res.json({ ok:true }));

// Static files (front-end demo + generated packets)
app.use("/", express.static(path.join(__dirname, "public")));
app.use("/download", express.static(path.join(__dirname, "generated"), {
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "private, max-age=600");
  }
}));

// CORS for your Manus site
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Routers
app.use(billingRouter);  // mounts /api/billing/*
app.use(dmvRouter);      // mounts /api/dmv/*

// 404
app.use((req,res)=>res.status(404).json({ error:"Not found" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, ()=>console.log(`Server listening on :${PORT}`));

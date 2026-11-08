// Express app shared by the local server (index.js) and the Vercel function (/api/index.js).
import express from "express";
import mongoose from "mongoose";
import api from "./api.js";
import admin from "./admin.js";

// One connection per process; serverless instances reuse it between requests.
let connecting = null;
export function connectDb() {
  for (const k of ["MONGODB_URI", "JWT_SECRET"]) {
    if (!process.env[k]) throw new Error(`Missing env ${k} (copy server/.env.example to server/.env, or set it in Vercel)`);
  }
  // small pool: many short-lived serverless instances share Atlas free tier's 500-connection cap
  connecting ??= mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000, maxPoolSize: 5 }).catch((e) => {
    connecting = null; // let the next request retry
    throw e;
  });
  return connecting;
}

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "4mb" })); // Vercel caps request bodies at 4.5 MB
app.use("/api", async (_req, _res, next) => {
  await connectDb();
  next();
});
app.use("/api/admin", admin);
app.use("/api", api);
app.use("/api", (_req, res) => res.status(404).json({ error: "ไม่พบ API" }));

app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ error: "รหัสประจำตัวนี้มีในระบบแล้ว" });
  if (err.name === "CastError") return res.status(404).json({ error: "ไม่พบข้อมูล" });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "ข้อมูลใหญ่เกินไป" });
  console.error(err);
  res.status(500).json({ error: "เกิดข้อผิดพลาดของเซิร์ฟเวอร์" });
});

export default app;

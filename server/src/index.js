// Local / single-server run: API + built React app on one port. On Vercel, /api/index.js is used instead.
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import app, { connectDb } from "./app.js";

await connectDb();

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));

// Loads the original site's data files into MongoDB and creates the teacher + demo student.
// Usage: npm run seed            (only fills missing content)
//        npm run seed -- --force (overwrite content with the original data)
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { User, Content } from "./models.js";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../seed-data");
const ctx = { window: {} };
vm.createContext(ctx);
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".js"))) vm.runInContext(fs.readFileSync(path.join(dir, f), "utf8"), ctx);
const w = JSON.parse(JSON.stringify(ctx.window));

const content = {
  units: [...w.UNITS_PART1, ...w.UNITS_PART2],
  quizzes: { ...w.QUIZZES_U1_U2, ...w.QUIZZES_U3_U4_U5 },
  diagnostic: w.DIAGNOSTIC_QUESTIONS,
  minigames: w.MINIGAMES_DATA,
  bibliography: w.BIBLIOGRAPHY_LIST,
  syllabus: w.SYLLABUS_PLANS
};

const force = process.argv.includes("--force");
await mongoose.connect(process.env.MONGODB_URI);

for (const [key, data] of Object.entries(content)) {
  const exists = await Content.exists({ key });
  if (exists && !force) {
    console.log(`content ${key}: kept (use --force to overwrite)`);
    continue;
  }
  await Content.updateOne({ key }, { data }, { upsert: true });
  console.log(`content ${key}: ${exists ? "overwritten" : "inserted"}`);
}

const { TEACHER_USERNAME = "teacher", TEACHER_PASSWORD, TEACHER_NAME = "ครูนฤเบศ พานิชย์" } = process.env;
if (!(await User.exists({ username: TEACHER_USERNAME }))) {
  if (!TEACHER_PASSWORD) throw new Error("Set TEACHER_PASSWORD in .env");
  await User.create({ role: "teacher", username: TEACHER_USERNAME, name: TEACHER_NAME, passwordHash: await bcrypt.hash(TEACHER_PASSWORD, 10) });
  console.log(`teacher account "${TEACHER_USERNAME}" created`);
}

// Demo student from the original site (password: demo1234)
if (!(await User.exists({ username: "69101" }))) {
  await User.create({
    username: "69101",
    name: "กิตติภพ สุขสวัสดิ์ (บัญชีตัวอย่าง)",
    studentClass: "ม.6/1",
    passwordHash: await bcrypt.hash("demo1234", 10),
    progress: {
      diagnostic: { completed: true, timestamp: "2569-11-05 12:30", totalScore: 19, unitScores: { 1: 4, 2: 3, 3: 5, 4: 4, 5: 3 }, answers: {} },
      unitProgress: {
        1: { preScore: 14, postScore: 18, gameScore: 100 },
        2: { preScore: 12, postScore: 17, gameScore: 88 },
        3: { preScore: 15, postScore: 19, gameScore: 100 },
        4: { preScore: 13, postScore: 18, gameScore: 88 },
        5: { preScore: 11, postScore: null, gameScore: null }
      }
    }
  });
  console.log('demo student "69101" created (password demo1234)');
}

await mongoose.disconnect();

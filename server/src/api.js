import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, getContent } from "./models.js";
import { auth, signToken } from "./auth.js";
import { CLASSES, UNIT_IDS, publicContent, gradeDiagnostic, gradeQuiz, gradeGame, quizList } from "./grading.js";

const r = Router();
const str = (v, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Validates student fields; returns an error message or null.
export function studentFieldsError({ name, studentClass, studentId, password }, { requirePassword = true } = {}) {
  if (!str(name)) return "กรุณากรอกชื่อ-นามสกุล";
  if (!CLASSES.includes(studentClass)) return "ชั้นเรียนไม่ถูกต้อง";
  if (studentId !== undefined && !/^[0-9A-Za-z_-]{1,20}$/.test(str(studentId, 20))) return "รหัสนักเรียนใช้ได้เฉพาะตัวเลข/ตัวอักษร (ไม่เกิน 20 ตัว)";
  if ((requirePassword || password) && (typeof password !== "string" || password.length < 4 || password.length > 100))
    return "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร";
  return null;
}

r.post("/auth/register", async (req, res) => {
  const err = studentFieldsError(req.body);
  if (err) return res.status(400).json({ error: err });
  const { name, studentClass, studentId, password } = req.body;
  const user = await User.create({
    username: str(studentId, 20),
    name: str(name),
    studentClass,
    passwordHash: await bcrypt.hash(password, 10)
  });
  res.status(201).json({ token: signToken(user), user });
});

r.post("/auth/login", async (req, res) => {
  const user = await User.findOne({ username: str(req.body.username, 50) });
  if (!user || !(await bcrypt.compare(String(req.body.password || ""), user.passwordHash)))
    return res.status(401).json({ error: "รหัสประจำตัวหรือรหัสผ่านไม่ถูกต้อง" });
  res.json({ token: signToken(user), user });
});

r.use(auth);

async function loadMe(req, res) {
  const user = await User.findById(req.user.sub);
  if (!user) res.status(401).json({ error: "ไม่พบบัญชีผู้ใช้ กรุณาเข้าสู่ระบบใหม่" });
  return user;
}

r.get("/me", async (req, res) => {
  const user = await loadMe(req, res);
  if (user) res.json(user);
});

r.patch("/me", async (req, res) => {
  const user = await loadMe(req, res);
  if (!user) return;
  const err = studentFieldsError({ name: req.body.name, studentClass: req.body.studentClass }, { requirePassword: false });
  if (err && user.role === "student") return res.status(400).json({ error: err });
  if (str(req.body.name)) user.name = str(req.body.name);
  if (CLASSES.includes(req.body.studentClass)) user.studentClass = req.body.studentClass;
  await user.save();
  res.json(user);
});

r.get("/content", async (req, res) => {
  res.json(publicContent(await getContent(), req.user.role === "teacher"));
});

async function saveProgress(user, mutate) {
  mutate(user.progress);
  user.markModified("progress");
  await user.save();
  return user.progress;
}

r.post("/me/diagnostic", async (req, res) => {
  const user = await loadMe(req, res);
  if (!user) return;
  const { diagnostic, key } = gradeDiagnostic((await getContent()).diagnostic || [], req.body.answers);
  const progress = await saveProgress(user, (p) => (p.diagnostic = diagnostic));
  res.json({ progress, key });
});

r.post("/me/quiz/:unit/:mode", async (req, res) => {
  const unit = Number(req.params.unit);
  const { mode } = req.params;
  if (!UNIT_IDS.includes(unit) || !["pretest", "posttest"].includes(mode)) return res.status(404).json({ error: "ไม่พบแบบทดสอบ" });
  const user = await loadMe(req, res);
  if (!user) return;
  const { score, key } = gradeQuiz(quizList((await getContent()).quizzes || {}, unit, mode), req.body.answers);
  const progress = await saveProgress(user, (p) => (p.unitProgress[unit][mode === "posttest" ? "postScore" : "preScore"] = score));
  res.json({ progress, score, key });
});

r.post("/me/game/:unit", async (req, res) => {
  const unit = Number(req.params.unit);
  const mg = ((await getContent()).minigames || {})[unit];
  if (!mg) return res.status(404).json({ error: "ไม่พบมินิเกม" });
  const user = await loadMe(req, res);
  if (!user) return;
  const { gameScore, key } = gradeGame(mg, req.body);
  const progress = await saveProgress(user, (p) => (p.unitProgress[unit].gameScore = gameScore));
  res.json({ progress, gameScore, key });
});

export default r;

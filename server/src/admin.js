import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Content, CONTENT_KEYS, clearContentCache } from "./models.js";
import { auth, teacherOnly } from "./auth.js";
import { emptyProgress } from "./grading.js";
import { studentFieldsError } from "./api.js";

const r = Router();
r.use(auth, teacherOnly);

const findStudent = (id) => User.findOne({ _id: id, role: "student" });

r.get("/students", async (_req, res) => {
  res.json(await User.find({ role: "student" }).sort({ studentClass: 1, username: 1 }));
});

r.post("/students", async (req, res) => {
  const err = studentFieldsError(req.body);
  if (err) return res.status(400).json({ error: err });
  const { name, studentClass, studentId, password } = req.body;
  const user = await User.create({
    username: studentId.trim(),
    name: name.trim(),
    studentClass,
    passwordHash: await bcrypt.hash(password, 10)
  });
  res.status(201).json(user);
});

r.patch("/students/:id", async (req, res) => {
  const user = await findStudent(req.params.id);
  if (!user) return res.status(404).json({ error: "ไม่พบนักเรียน" });
  const err = studentFieldsError(req.body, { requirePassword: false });
  if (err) return res.status(400).json({ error: err });
  user.name = req.body.name.trim();
  user.studentClass = req.body.studentClass;
  if (req.body.studentId) user.username = req.body.studentId.trim();
  if (req.body.password) user.passwordHash = await bcrypt.hash(req.body.password, 10);
  await user.save();
  res.json(user);
});

r.post("/students/:id/reset-progress", async (req, res) => {
  const user = await findStudent(req.params.id);
  if (!user) return res.status(404).json({ error: "ไม่พบนักเรียน" });
  user.progress = emptyProgress();
  user.markModified("progress");
  await user.save();
  res.json(user);
});

r.delete("/students/:id", async (req, res) => {
  const { deletedCount } = await User.deleteOne({ _id: req.params.id, role: "student" });
  if (!deletedCount) return res.status(404).json({ error: "ไม่พบนักเรียน" });
  res.status(204).end();
});

const validKey = (req, res, next) => (CONTENT_KEYS.includes(req.params.key) ? next() : res.status(404).json({ error: "ไม่พบเนื้อหา" }));

r.get("/content/:key", validKey, async (req, res) => {
  const doc = await Content.findOne({ key: req.params.key }).lean();
  res.json({ key: req.params.key, data: doc?.data ?? null, updatedAt: doc?.updatedAt });
});

// Teacher-edited content: only checks top-level shape, the editor UI owns field-level structure.
r.put("/content/:key", validKey, async (req, res) => {
  const { data } = req.body;
  const isArrayKey = ["units", "diagnostic", "bibliography", "syllabus"].includes(req.params.key);
  if (isArrayKey ? !Array.isArray(data) : !data || typeof data !== "object" || Array.isArray(data))
    return res.status(400).json({ error: isArrayKey ? "ข้อมูลต้องเป็น Array" : "ข้อมูลต้องเป็น Object" });
  const doc = await Content.findOneAndUpdate({ key: req.params.key }, { data }, { upsert: true, new: true });
  clearContentCache();
  res.json({ key: doc.key, data: doc.data, updatedAt: doc.updatedAt });
});

export default r;

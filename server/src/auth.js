import jwt from "jsonwebtoken";
import { User } from "./models.js";

export const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

export function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "กรุณาเข้าสู่ระบบใหม่" });
  }
}

// Role is read from the DB, not the token, so approving/revoking a teacher takes effect immediately.
export async function teacherOnly(req, res, next) {
  const me = await User.findById(req.user.sub, { role: 1 }).lean();
  if (me?.role !== "teacher") return res.status(403).json({ error: "สำหรับครูผู้สอนเท่านั้น" });
  next();
}

import jwt from "jsonwebtoken";

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

export const teacherOnly = (req, res, next) =>
  req.user.role === "teacher" ? next() : res.status(403).json({ error: "สำหรับครูผู้สอนเท่านั้น" });

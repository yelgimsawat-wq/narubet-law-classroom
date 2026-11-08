import mongoose from "mongoose";
import { emptyProgress } from "./grading.js";

const { Mixed } = mongoose.Schema.Types;

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["student", "teacher"], default: "student" },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    studentClass: { type: String, default: "" },
    progress: { type: Mixed, default: emptyProgress }
  },
  { timestamps: true, minimize: false }
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

const contentSchema = new mongoose.Schema(
  { key: { type: String, required: true, unique: true }, data: { type: Mixed, required: true } },
  { timestamps: true, minimize: false }
);

export const User = mongoose.model("User", userSchema);
export const Content = mongoose.model("Content", contentSchema);

export const CONTENT_KEYS = ["units", "quizzes", "diagnostic", "minigames", "bibliography", "syllabus"];

// shortcut: in-process cache, fine for a single server instance; move to no-cache if you run several instances
let cache = null;
export async function getContent() {
  if (!cache) {
    const docs = await Content.find({ key: { $in: CONTENT_KEYS } }).lean();
    cache = Object.fromEntries(docs.map((d) => [d.key, d.data]));
  }
  return cache;
}
export const clearContentCache = () => (cache = null);

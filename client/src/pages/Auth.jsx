import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { DeveloperCredits, LangToggle, useLang } from "../i18n.jsx";
import { CLASSES, ThemeToggle } from "../ui.jsx";

export default function AuthPage({ mode }) {
  const { signIn } = useAuth();
  const { tx } = useLang();
  const [f, setF] = useState({ username: "", password: "", name: "", studentClass: "ม.6/1", studentId: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isReg = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (isReg && f.password !== f.confirm) return setErr(tx("รหัสผ่านทั้งสองช่องไม่ตรงกัน", "Passwords do not match"));
    setBusy(true);
    try {
      if (isReg) await signIn("/auth/register", { name: f.name, studentClass: f.studentClass, studentId: f.studentId, password: f.password });
      else await signIn("/auth/login", { username: f.username, password: f.password });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-theme" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LangToggle />
        <ThemeToggle />
      </div>
      <section className="auth-side">
        <div className="auth-logos">
          <img src="/logo.png" alt="" width="64" height="64" />
          <img className="school-emblem" src="/emblem.png" alt="ตราโรงเรียนสวนกุหลาบวิทยาลัย ธนบุรี" width="64" height="64" onError={(e) => (e.currentTarget.style.display = "none")} />
        </div>
        <p className="school-name">{tx("โรงเรียนสวนกุหลาบวิทยาลัย ธนบุรี", "Suankularb Wittayalai Thonburi School")}</p>
        <h1>{tx("ห้องเรียนกฎหมายของครูนฤเบศ", "Kru Narubet's Law Classroom")}</h1>
        <p>{tx("สังคมศึกษา 6 · กฎหมายที่ประชาชนควรรู้ (ม.6)", "Social Studies 6 · Essential Laws for Citizens (Grade 12)")}</p>
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.22)" }}>
          <DeveloperCredits style={{ fontSize: "0.9rem" }} />
        </div>
      </section>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>{isReg ? tx("สมัครสมาชิกนักเรียน", "Register Account") : tx("เข้าสู่ระบบ", "Sign In")}</h2>
          <p className="muted small">{isReg ? tx("ใช้ชื่อและรหัสจริงของตัวเอง", "Use your real full name and student ID") : tx("นักเรียนใช้รหัสประจำตัว", "Sign in with your student ID")}</p>
          <div className="seg">
            <Link to="/login" className={!isReg ? "active" : ""}>{tx("เข้าสู่ระบบ", "Sign In")}</Link>
            <Link to="/register" className={isReg ? "active" : ""}>{tx("สมัครสมาชิก", "Register")}</Link>
          </div>

          {isReg ? (
            <>
              <div className="form-field">
                <label htmlFor="r-name">{tx("ชื่อ-นามสกุล", "Full Name")}</label>
                <input id="r-name" className="form-input" value={f.name} onChange={set("name")} placeholder={tx("เช่น นายรพีพัฒน์ รักยุติธรรม", "e.g. Rapeepat Rakyutitham")} required autoComplete="name" />
              </div>
              <div className="form-grid" style={{ margin: 0 }}>
                <div className="form-field">
                  <label htmlFor="r-class">{tx("ชั้นเรียน", "Class / Group")}</label>
                  <select
                    id="r-class"
                    className="form-select"
                    value={f.studentClass}
                    onChange={(e) => {
                      const nextClass = e.target.value;
                      const isNonStudent = nextClass === "ครู" || nextClass === "บุคคลทั่วไป";
                      setF({
                        ...f,
                        studentClass: nextClass,
                        studentId: isNonStudent && !f.studentId ? "00000" : !isNonStudent && f.studentId === "00000" ? "" : f.studentId
                      });
                    }}
                  >
                    {CLASSES.map((c) => <option key={c} value={c}>{c === "ครู" ? tx("ครู", "ครู (Teacher)") : c === "บุคคลทั่วไป" ? tx("บุคคลทั่วไป", "บุคคลทั่วไป (General Public)") : c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="r-id">{tx("รหัสประจำตัวนักเรียน (กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000)", "Student ID (กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000)")}</label>
                  <input id="r-id" className="form-input num" value={f.studentId} onChange={set("studentId")} placeholder={tx("เช่น 69115 หรือ 00000", "e.g. 69115 or 00000")} required autoComplete="username" />
                  <small className="small muted" style={{ display: "block", marginTop: 4 }}>{tx("กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000", "กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000 (Use 00000 for Teacher / General Public)")}</small>
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="r-pass">{tx("รหัสผ่าน (อย่างน้อย 4 ตัว)", "Password (at least 4 characters)")}</label>
                <input id="r-pass" type="password" className="form-input" value={f.password} onChange={set("password")} required minLength={4} autoComplete="new-password" />
              </div>
              <div className="form-field">
                <label htmlFor="r-confirm">{tx("ยืนยันรหัสผ่าน", "Confirm Password")}</label>
                <input id="r-confirm" type="password" className="form-input" value={f.confirm} onChange={set("confirm")} required autoComplete="new-password" />
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <label htmlFor="l-user">{tx("รหัสประจำตัว / ชื่อผู้ใช้", "Student ID / Username")}</label>
                <input id="l-user" className="form-input" value={f.username} onChange={set("username")} required autoComplete="username" />
              </div>
              <div className="form-field">
                <label htmlFor="l-pass">{tx("รหัสผ่าน", "Password")}</label>
                <input id="l-pass" type="password" className="form-input" value={f.password} onChange={set("password")} required autoComplete="current-password" />
              </div>
            </>
          )}

          {err && <p className="form-error" role="alert" style={{ marginBottom: 12 }}>{err}</p>}
          <button className="btn btn-primary" style={{ width: "100%", padding: "11px" }} disabled={busy} aria-busy={busy}>
            <span>{isReg ? tx("สมัครและเริ่มเรียน", "Register & Start Learning") : tx("เข้าสู่ระบบ", "Sign In")}</span>
          </button>
          {!isReg && <p className="small muted" style={{ marginTop: 14 }}>{tx("ลืมรหัสผ่าน? แจ้งครูผู้สอน", "Forgot password? Contact your teacher.")}</p>}
        </form>
      </div>
    </div>
  );
}

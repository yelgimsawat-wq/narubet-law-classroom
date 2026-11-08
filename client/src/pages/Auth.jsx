import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { CLASSES, ThemeToggle } from "../ui.jsx";

export default function AuthPage({ mode }) {
  const { signIn } = useAuth();
  const [f, setF] = useState({ username: "", password: "", name: "", studentClass: "ม.6/1", studentId: "", confirm: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isReg = mode === "register";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (isReg && f.password !== f.confirm) return setErr("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
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
      <ThemeToggle className="auth-theme" />
      <section className="auth-side">
        <img src="/logo.png" alt="" width="64" height="64" />
        <h1>ห้องเรียนกฎหมายของครูนฤเบศ</h1>
        <p>สังคมศึกษา 6 · กฎหมายที่ประชาชนควรรู้ (ม.6)</p>
      </section>

      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <h2>{isReg ? "สมัครสมาชิกนักเรียน" : "เข้าสู่ระบบ"}</h2>
          <p className="muted small">{isReg ? "ใช้ชื่อและรหัสจริงของตัวเอง" : "นักเรียนใช้รหัสประจำตัว"}</p>
          <div className="seg">
            <Link to="/login" className={!isReg ? "active" : ""}>เข้าสู่ระบบ</Link>
            <Link to="/register" className={isReg ? "active" : ""}>สมัครสมาชิก</Link>
          </div>

          {isReg ? (
            <>
              <div className="form-field">
                <label htmlFor="r-name">ชื่อ-นามสกุล</label>
                <input id="r-name" className="form-input" value={f.name} onChange={set("name")} placeholder="เช่น นายรพีพัฒน์ รักยุติธรรม" required autoComplete="name" />
              </div>
              <div className="form-grid" style={{ margin: 0 }}>
                <div className="form-field">
                  <label htmlFor="r-class">ชั้นเรียน</label>
                  <select id="r-class" className="form-select" value={f.studentClass} onChange={set("studentClass")}>
                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="r-id">รหัสประจำตัวนักเรียน</label>
                  <input id="r-id" className="form-input num" value={f.studentId} onChange={set("studentId")} placeholder="เช่น 69115" required autoComplete="username" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="r-pass">รหัสผ่าน (อย่างน้อย 4 ตัว)</label>
                <input id="r-pass" type="password" className="form-input" value={f.password} onChange={set("password")} required minLength={4} autoComplete="new-password" />
              </div>
              <div className="form-field">
                <label htmlFor="r-confirm">ยืนยันรหัสผ่าน</label>
                <input id="r-confirm" type="password" className="form-input" value={f.confirm} onChange={set("confirm")} required autoComplete="new-password" />
              </div>
            </>
          ) : (
            <>
              <div className="form-field">
                <label htmlFor="l-user">รหัสประจำตัว / ชื่อผู้ใช้</label>
                <input id="l-user" className="form-input" value={f.username} onChange={set("username")} required autoComplete="username" />
              </div>
              <div className="form-field">
                <label htmlFor="l-pass">รหัสผ่าน</label>
                <input id="l-pass" type="password" className="form-input" value={f.password} onChange={set("password")} required autoComplete="current-password" />
              </div>
            </>
          )}

          {err && <p className="form-error" role="alert" style={{ marginBottom: 12 }}>{err}</p>}
          <button className="btn btn-primary" style={{ width: "100%", padding: "11px" }} disabled={busy} aria-busy={busy}>
            <span>{isReg ? "สมัครและเริ่มเรียน" : "เข้าสู่ระบบ"}</span>
          </button>
          {!isReg && <p className="small muted" style={{ marginTop: 14 }}>ลืมรหัสผ่าน? แจ้งครูผู้สอน</p>}
        </form>
      </div>
    </div>
  );
}

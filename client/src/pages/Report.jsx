import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { DeveloperCredits, UNIT_EN_META, useLang } from "../i18n.jsx";
import { CLASSES, Icon, PageHead, has, pctOf, useBusy, useToast } from "../ui.jsx";

export function ReportCard({ student, units }) {
  const { lang, tx } = useLang();
  const d = student.progress.diagnostic;
  const up = student.progress.unitProgress;
  const fmt = (v, total) => (has(v) ? `${v} / ${total}` : "-");
  return (
    <section className="editorial-panel">
      <div className="row between" style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 14, marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", color: "var(--primary)" }}>
            {tx("ใบรายงานผลการเรียนรู้ รายวิชาสังคมศึกษา 6 (ส33102)", "Learning Progress Report · Social Studies 6 (SO33102)")}
          </h2>
          <p className="muted">
            {tx(
              "เรื่อง กฎหมายที่ประชาชนควรรู้ · ชั้นมัธยมศึกษาปีที่ 6 · ห้องเรียนกฎหมายของครูนฤเบศ",
              "Essential Laws for Citizens · Grade 12 · Kru Narubet's Law Classroom"
            )}
          </p>
        </div>
        <div className="num" style={{ textAlign: "right" }}>
          <strong>{student.name}</strong>
          <br />
          {tx("ชั้น", "Class")} {student.studentClass || "-"} · {tx("รหัส", "ID")} {student.username}
        </div>
      </div>
      <p style={{ marginBottom: 12 }}>
        <strong>{tx("ประเมินเส้นทางการเรียนรู้แรกเข้า (25 ข้อ):", "Diagnostic Learning Path Assessment (25 Qs):")}</strong>{" "}
        <span className="num" style={{ fontWeight: 700, color: "var(--primary)" }}>{d.totalScore} / 25 ({pctOf(d.totalScore, 25)}%)</span> · {tx("วันที่ประเมิน", "Date")} <span className="num">{d.timestamp}</span>
      </p>
      <div className="table-wrap">
        <table className="legal-table stack-mobile">
          <thead>
            <tr>
              <th>{tx("หน่วยการเรียนรู้", "Learning Unit")}</th>
              <th>{tx("แรกเข้า (5)", "Diagnostic (5)")}</th>
              <th>{tx("ก่อนเรียน (20)", "Pre-test (20)")}</th>
              <th>{tx("หลังเรียน (20)", "Post-test (20)")}</th>
              <th>{tx("พัฒนาการ", "Improvement")}</th>
              <th>{tx("มินิเกม", "Minigame")}</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const p = up[u.id] || {};
              const gain = has(p.preScore) && has(p.postScore) ? p.postScore - p.preScore : null;
              const uTitle = lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].title : u.title;
              return (
                <tr key={u.id}>
                  <td><strong>{tx(`หน่วยที่ ${u.id}: `, `Unit ${u.id}: `)}{uTitle}</strong></td>
                  <td className="num" data-label={tx("แรกเข้า (5)", "Diagnostic (5)")}>{d.unitScores[u.id] ?? 0} / 5</td>
                  <td className="num" data-label={tx("ก่อนเรียน (20)", "Pre-test (20)")}>{fmt(p.preScore, 20)}</td>
                  <td className="num" data-label={tx("หลังเรียน (20)", "Post-test (20)")}><strong>{fmt(p.postScore, 20)}</strong></td>
                  <td className="num" data-label={tx("พัฒนาการ", "Improvement")} style={{ color: gain < 0 ? "var(--rose)" : "var(--green)", fontWeight: 700 }}>
                    {has(gain) ? `${gain >= 0 ? "+" : ""}${gain} ${tx("คะแนน", "pts")}` : "-"}
                  </td>
                  <td className="num" data-label={tx("มินิเกม", "Minigame")}>{has(p.gameScore) ? `${p.gameScore}%` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px dashed var(--line)", display: "flex", justifyContent: "flex-end" }}>
        <DeveloperCredits />
      </div>
    </section>
  );
}

export default function Report() {
  const { user, setUser, content } = useAuth();
  const { tx } = useLang();
  const [f, setF] = useState({ name: user.name, studentClass: user.studentClass || "ม.6/1" });
  const [err, setErr] = useState("");
  const [toast, setToast] = useToast();
  const [busy, run] = useBusy();

  const save = (e) => {
    e.preventDefault();
    setErr("");
    return run("save", async () => {
      try {
        setUser(await api("/me", { method: "PATCH", body: f }));
        setToast(tx("บันทึกข้อมูลผู้เรียนแล้ว", "Profile saved"));
      } catch (e2) {
        setErr(e2.message);
      }
    })();
  };

  return (
    <>
      <div className="no-print">
        <PageHead
          title={tx("ข้อมูลผู้เรียน & ใบรายงานผล", "Learner Profile & Progress Report")}
          subtitle={tx("ตรวจสอบหรือแก้ไขชื่อ-นามสกุลและชั้นเรียน แล้วพิมพ์ใบรายงานผลส่งครูผู้สอน", "Review or update your name and class, then print or save your report as PDF.")}
          actions={<button type="button" className="btn btn-primary" onClick={() => window.print()}><Icon name="print" /> {tx("พิมพ์ / บันทึกเป็น PDF", "Print / Save as PDF")}</button>}
        >
          {user.role === "student" && (
            <form onSubmit={save}>
              <div className="form-grid" style={{ marginBottom: 10 }}>
                <div className="form-field">
                  <label htmlFor="p-name">{tx("ชื่อ-นามสกุล", "Full Name")}</label>
                  <input id="p-name" className="form-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="p-class">{tx("ชั้นเรียน", "Class")}</label>
                  <select id="p-class" className="form-select" value={f.studentClass} onChange={(e) => setF({ ...f, studentClass: e.target.value })}>
                    {CLASSES.map((c) => {
                      const blocked = (c === "ครู" || c === "บุคคลทั่วไป") && user.studentClass !== c;
                      return (
                        <option key={c} value={c} disabled={blocked}>
                          {blocked ? `${c} (ไม่อนุญาตให้ย้ายเข้ากลุ่ม${c})` : c}
                        </option>
                      );
                    })}
                  </select>
                  {!["ครู", "บุคคลทั่วไป"].includes(user.studentClass) && (
                    <small className="small muted" style={{ display: "block", marginTop: 4 }}>
                      {tx("*สมาชิกกลุ่มนักเรียนที่ลงทะเบียนแล้ว ไม่สามารถย้ายไปอยู่กลุ่มครูหรือบุคคลทั่วไปได้", "*Registered students cannot move to the Teacher or General Public group.")}
                    </small>
                  )}
                </div>
                <div className="form-field">
                  <label>{tx("รหัสประจำตัว (แก้ไขได้โดยครู)", "Student ID (Editable by teacher)")}</label>
                  <input className="form-input num" value={user.username} disabled />
                </div>
              </div>
              {err && <p className="form-error" style={{ marginBottom: 10 }}>{err}</p>}
              <button className="btn btn-sm" disabled={!!busy} aria-busy={busy === "save"}><span>{tx("บันทึกข้อมูล", "Save Profile")}</span></button>
            </form>
          )}
        </PageHead>
      </div>
      <ReportCard student={user} units={content.units} />
      {toast}
    </>
  );
}

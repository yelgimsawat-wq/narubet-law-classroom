import { useState } from "react";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { CLASSES, Icon, PageHead, has, pctOf, useBusy, useToast } from "../ui.jsx";

export function ReportCard({ student, units }) {
  const d = student.progress.diagnostic;
  const up = student.progress.unitProgress;
  const fmt = (v, total) => (has(v) ? `${v} / ${total}` : "-");
  return (
    <section className="editorial-panel">
      <div className="row between" style={{ borderBottom: "2px solid var(--ink)", paddingBottom: 14, marginBottom: 16, alignItems: "flex-start" }}>
        <div>
          <h2 style={{ fontSize: "1.35rem", color: "var(--primary)" }}>ใบรายงานผลการเรียนรู้ รายวิชาสังคมศึกษา 6 (ส33102)</h2>
          <p className="muted">เรื่อง กฎหมายที่ประชาชนควรรู้ · ชั้นมัธยมศึกษาปีที่ 6 · ห้องเรียนกฎหมายของครูนฤเบศ</p>
        </div>
        <div className="num" style={{ textAlign: "right" }}>
          <strong>{student.name}</strong>
          <br />ชั้น {student.studentClass || "-"} · รหัส {student.username}
        </div>
      </div>
      <p style={{ marginBottom: 12 }}>
        <strong>ประเมินเส้นทางการเรียนรู้แรกเข้า (25 ข้อ):</strong>{" "}
        <span className="num" style={{ fontWeight: 700, color: "var(--primary)" }}>{d.totalScore} / 25 ({pctOf(d.totalScore, 25)}%)</span> · วันที่ประเมิน <span className="num">{d.timestamp}</span>
      </p>
      <div className="table-wrap">
        <table className="legal-table stack-mobile">
          <thead>
            <tr><th>หน่วยการเรียนรู้</th><th>แรกเข้า (5)</th><th>ก่อนเรียน (20)</th><th>หลังเรียน (20)</th><th>พัฒนาการ</th><th>มินิเกม</th></tr>
          </thead>
          <tbody>
            {units.map((u) => {
              const p = up[u.id] || {};
              const gain = has(p.preScore) && has(p.postScore) ? p.postScore - p.preScore : null;
              return (
                <tr key={u.id}>
                  <td><strong>หน่วยที่ {u.id}: {u.title}</strong></td>
                  <td className="num" data-label="แรกเข้า (5)">{d.unitScores[u.id] ?? 0} / 5</td>
                  <td className="num" data-label="ก่อนเรียน (20)">{fmt(p.preScore, 20)}</td>
                  <td className="num" data-label="หลังเรียน (20)"><strong>{fmt(p.postScore, 20)}</strong></td>
                  <td className="num" data-label="พัฒนาการ" style={{ color: gain < 0 ? "var(--rose)" : "var(--green)", fontWeight: 700 }}>{has(gain) ? `${gain >= 0 ? "+" : ""}${gain} คะแนน` : "-"}</td>
                  <td className="num" data-label="มินิเกม">{has(p.gameScore) ? `${p.gameScore}%` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Report() {
  const { user, setUser, content } = useAuth();
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
        setToast("บันทึกข้อมูลผู้เรียนแล้ว");
      } catch (e2) {
        setErr(e2.message);
      }
    })();
  };

  return (
    <>
      <div className="no-print">
        <PageHead
          title="ข้อมูลผู้เรียน & ใบรายงานผล"
          subtitle="ตรวจสอบหรือแก้ไขชื่อ-นามสกุลและชั้นเรียน แล้วพิมพ์ใบรายงานผลส่งครูผู้สอน"
          actions={<button type="button" className="btn btn-primary" onClick={() => window.print()}><Icon name="print" /> พิมพ์ / บันทึกเป็น PDF</button>}
        >
          {user.role === "student" && (
            <form onSubmit={save}>
              <div className="form-grid" style={{ marginBottom: 10 }}>
                <div className="form-field">
                  <label htmlFor="p-name">ชื่อ-นามสกุล</label>
                  <input id="p-name" className="form-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label htmlFor="p-class">ชั้นเรียน</label>
                  <select id="p-class" className="form-select" value={f.studentClass} onChange={(e) => setF({ ...f, studentClass: e.target.value })}>
                    {CLASSES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>รหัสประจำตัว (แก้ไขได้โดยครู)</label>
                  <input className="form-input num" value={user.username} disabled />
                </div>
              </div>
              {err && <p className="form-error" style={{ marginBottom: 10 }}>{err}</p>}
              <button className="btn btn-sm" disabled={!!busy} aria-busy={busy === "save"}><span>บันทึกข้อมูล</span></button>
            </form>
          )}
        </PageHead>
      </div>
      <ReportCard student={user} units={content.units} />
      {toast}
    </>
  );
}

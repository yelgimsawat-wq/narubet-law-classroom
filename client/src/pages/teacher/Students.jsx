import { useEffect, useState } from "react";
import { useAuth } from "../../auth.jsx";
import { api } from "../../api.js";
import { useLang } from "../../i18n.jsx";
import { CLASSES, ErrorState, Icon, Modal, PageHead, PageSkeleton, downloadFile, has, useBusy, useToast } from "../../ui.jsx";
import { ReportCard } from "../Report.jsx";
import { useStudents } from "./useStudents.js";

function StudentForm({ initial, onSave, onCancel }) {
  const { tx } = useLang();
  const isNew = !initial;
  const [f, setF] = useState({ name: initial?.name || "", studentClass: initial?.studentClass || "ม.6/1", studentId: initial?.username || "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const body = { ...f };
      if (!isNew && !body.password) delete body.password;
      await onSave(body);
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="s-name">{tx("ชื่อ-นามสกุล", "Full Name")}</label>
          <input id="s-name" className="form-input" value={f.name} onChange={set("name")} required />
        </div>
        <div className="form-field">
          <label htmlFor="s-class">{tx("ชั้นเรียน", "Class")}</label>
          <select id="s-class" className="form-select" value={f.studentClass} onChange={set("studentClass")}>
            {CLASSES.map((c) => {
              const blocked = !isNew && (c === "ครู" || c === "บุคคลทั่วไป") && initial?.studentClass !== c;
              return (
                <option key={c} value={c} disabled={blocked}>
                  {blocked ? `${c} (ไม่อนุญาตให้ย้ายเข้ากลุ่ม${c})` : c}
                </option>
              );
            })}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="s-id">{tx("รหัสประจำตัว (กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000)", "Student ID (Use 00000 for Teacher / General Public)")}</label>
          <input id="s-id" className="form-input num" value={f.studentId} onChange={set("studentId")} required />
        </div>
        <div className="form-field">
          <label htmlFor="s-pass">{isNew ? tx("รหัสผ่าน", "Password") : tx("ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)", "New Password (leave blank to keep current)")}</label>
          <input id="s-pass" className="form-input" type="text" value={f.password} onChange={set("password")} required={isNew} minLength={4} autoComplete="new-password" />
        </div>
      </div>
      {err && <p className="form-error" style={{ marginBottom: 12 }}>{err}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onCancel}>{tx("ยกเลิก", "Cancel")}</button>
        <button className="btn btn-primary" disabled={busy} aria-busy={busy}><span>{isNew ? tx("เพิ่มนักเรียน", "Add Student") : tx("บันทึก", "Save")}</span></button>
      </div>
    </form>
  );
}

const UNITS = [1, 2, 3, 4, 5];
const FIELDS = [["preScore", "ก่อนเรียน", "Pre-test"], ["postScore", "หลังเรียน", "Post-test"], ["gameScore", "มินิเกม", "Minigame"]];

const missing = (s, u, f) => !has(s.progress.unitProgress[u]?.[f]);
const allDone = (s) => s.progress.diagnostic.completed && UNITS.every((u) => FIELDS.every(([f]) => !missing(s, u, f)));

function getTodoMap(tx) {
  return {
    all: [tx("ทุกสถานะ", "All Statuses"), () => true],
    pending: [tx("ยังมีงานค้าง", "Pending Work"), (s) => !allDone(s)],
    done: [tx("ทำครบทุกงานแล้ว", "All Completed"), allDone],
    diag: [tx("ยังไม่ทำแบบประเมินแรกเข้า", "Diagnostic Not Taken"), (s) => !s.progress.diagnostic.completed],
    ...Object.fromEntries(
      UNITS.flatMap((u) =>
        FIELDS.map(([f, thLabel, enLabel]) => [
          `${f}-${u}`,
          [tx(`หน่วย ${u}: ยังไม่ทำ${thLabel}`, `Unit ${u}: Missing ${enLabel}`), (s) => missing(s, u, f)]
        ])
      )
    )
  };
}

function ScoreForm({ s, quizzes, onSave, onCancel }) {
  const { lang, tx } = useLang();
  const up = s.progress.unitProgress;
  const [f, setF] = useState(() => Object.fromEntries(UNITS.flatMap((u) => FIELDS.map(([k]) => [`${u}.${k}`, has(up[u]?.[k]) ? String(up[u][k]) : ""]))));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const max = (u, k) => (k === "gameScore" ? 100 : quizzes?.[u]?.length || 20);

  async function submit(e) {
    e.preventDefault();
    const unitProgress = {};
    for (const u of UNITS)
      for (const [k] of FIELDS) {
        const v = f[`${u}.${k}`].trim() === "" ? null : Number(f[`${u}.${k}`]);
        if (v !== (has(up[u]?.[k]) ? up[u][k] : null)) (unitProgress[u] ??= {})[k] = v;
      }
    if (!Object.keys(unitProgress).length) return onCancel();
    setBusy(true);
    setErr("");
    try {
      await onSave({ unitProgress });
    } catch (e2) {
      setErr(e2.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <p className="small muted" style={{ marginTop: 0 }}>
        {tx("เว้นว่าง = ยังไม่ทำ · ก่อน/หลังเรียนเต็มตามจำนวนข้อของหน่วย · มินิเกมเต็ม 100%", "Leave blank = Not taken · Pre/Post-test max equals unit question count · Minigame max 100%")}
      </p>
      <div className="table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th>{tx("หน่วย", "Unit")}</th>
              {FIELDS.map(([k, thL, enL]) => <th key={k}>{lang === "en" ? enL : thL}</th>)}
            </tr>
          </thead>
          <tbody>
            {UNITS.map((u) => (
              <tr key={u}>
                <td><strong>{tx(`หน่วย ${u}`, `Unit ${u}`)}</strong></td>
                {FIELDS.map(([k, thL, enL]) => (
                  <td key={k}>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap", alignItems: "center" }}>
                      <input
                        type="number" inputMode="numeric" className="form-input num" style={{ width: 76 }}
                        min={0} max={max(u, k)} step={1} placeholder="–"
                        value={f[`${u}.${k}`]} onChange={(e) => setF({ ...f, [`${u}.${k}`]: e.target.value })}
                        aria-label={`${tx(`หน่วย ${u}`, `Unit ${u}`)} ${lang === "en" ? enL : thL}`}
                      />
                      <span className="small muted">/{max(u, k)}{k === "gameScore" ? "%" : ""}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {err && <p className="form-error" style={{ marginBottom: 12 }}>{err}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onCancel}>{tx("ยกเลิก", "Cancel")}</button>
        <button className="btn btn-primary" disabled={busy} aria-busy={busy}><span>{tx("บันทึกคะแนน", "Save Scores")}</span></button>
      </div>
    </form>
  );
}

function exportCsv(list) {
  const header = ["ชื่อ-นามสกุล", "ชั้นเรียน", "รหัสประจำตัว", "ประเมินแรกเข้า(25)", "วันที่ประเมิน"];
  for (let u = 1; u <= 5; u++) header.push(`หน่วย${u}_ก่อนเรียน(20)`, `หน่วย${u}_หลังเรียน(20)`, `หน่วย${u}_มินิเกม(%)`);
  const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = list.map((s) => {
    const d = s.progress.diagnostic, up = s.progress.unitProgress;
    const cells = [s.name, s.studentClass, s.username, d.completed ? d.totalScore : "", d.completed ? d.timestamp : ""];
    for (let u = 1; u <= 5; u++) cells.push(up[u]?.preScore, up[u]?.postScore, up[u]?.gameScore);
    return cells.map(q).join(",");
  });
  downloadFile("\uFEFF" + [header.map(q).join(","), ...rows].join("\r\n"), "รายงานผลผู้เรียน_ส33102_ครูนฤเบศ.csv", "text/csv;charset=utf-8");
}

function TeacherRequests({ onDone, setToast }) {
  const { tx } = useLang();
  const [reqs, setReqs] = useState(null);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    api("/admin/teacher-requests").then(setReqs, (e) => setToast(`${tx("โหลดคำขอเป็นครูไม่ได้", "Failed to load teacher requests")}: ${e.message}`));
  }, []);
  if (!reqs?.length) return null;

  async function act(u, action) {
    const verb = action === "approve"
      ? tx("ยืนยันให้เป็นครู (เข้า Backoffice ได้)", "Approve as Teacher (grants Backoffice access)")
      : tx("ปฏิเสธ (ย้ายไปกลุ่มบุคคลทั่วไป)", "Reject (move to General Public group)");
    if (!window.confirm(`${verb}: ${u.name}?`)) return;
    setBusy(u._id);
    try {
      const updated = await api(`/admin/teacher-requests/${u._id}/${action}`, { method: "POST" });
      setReqs((all) => all.filter((x) => x._id !== u._id));
      onDone(updated, action);
      setToast(action === "approve" ? tx(`ยืนยัน ${u.name} เป็นครูแล้ว`, `Approved ${u.name} as Teacher`) : tx("ปฏิเสธคำขอแล้ว", "Request rejected"));
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="editorial-panel" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>{tx(`คำขอเป็นครู (${reqs.length})`, `Teacher Role Requests (${reqs.length})`)}</h3>
      <p className="small muted">
        {tx(
          "ผู้ที่สมัครโดยเลือก “ครู” — ตรวจสอบว่าเป็นครูจริงก่อนกดยืนยัน ครูที่ยืนยันแล้วจะเข้า Backoffice ได้ทันที",
          "Users who registered under “Teacher” — verify before approving. Approved teachers gain access to the Teacher Backoffice."
        )}
      </p>
      <div className="table-wrap">
        <table className="legal-table">
          <tbody>
            {reqs.map((u) => (
              <tr key={u._id} style={busy === u._id ? { opacity: 0.55 } : undefined}>
                <td><strong>{u.name}</strong><div className="small muted">{tx("สมัครเมื่อ", "Registered")} {new Date(u.createdAt).toLocaleString("th-TH")}</div></td>
                <td className="cell-action">
                  <div className="row" style={{ gap: 4, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => act(u, "approve")}>{tx("ยืนยันเป็นครู", "Approve")}</button>
                    <button type="button" className="btn btn-sm btn-danger" disabled={!!busy} onClick={() => act(u, "reject")}>{tx("ปฏิเสธ", "Reject")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function Students() {
  const { content } = useAuth();
  const { tx } = useLang();
  const { students, setStudents, error, reload } = useStudents();
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [todo, setTodo] = useState("all");
  const [modal, setModal] = useState(null); // {type: 'new'|'edit'|'scores'|'report', s}
  const [toast, setToast] = useToast();
  const [busy, run] = useBusy();
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!students) return <PageSkeleton rows={6} />;

  const TODO = getTodoMap(tx);
  const ql = q.trim().toLowerCase();
  const base = students.filter((s) => (cls === "all" || s.studentClass === cls) && (!ql || `${s.name} ${s.username}`.toLowerCase().includes(ql)));
  const list = base.filter(TODO[todo][1]);
  const todoOption = (k) => <option key={k} value={k}>{TODO[k][0]} ({base.filter(TODO[k][1]).length})</option>;
  const filtered = cls !== "all" || ql || todo !== "all";
  const replace = (u) => setStudents((all) => all.map((s) => (s._id === u._id ? u : s)));
  const close = () => setModal(null);

  const resetProgress = (s) =>
    window.confirm(tx(`ล้างคะแนนทั้งหมดของ ${s.name}? (ย้อนกลับไม่ได้)`, `Reset all scores for ${s.name}? (Cannot be undone)`)) &&
    run(`reset-${s._id}`, async () => {
      replace(await api(`/admin/students/${s._id}/reset-progress`, { method: "POST" }));
      setToast(tx("ล้างคะแนนแล้ว", "Scores reset"));
    })().catch((e) => setToast(e.message));
  const remove = (s) =>
    window.confirm(tx(`ลบบัญชี ${s.name} (${s.username}) และคะแนนทั้งหมดถาวร? (ย้อนกลับไม่ได้)`, `Permanently delete ${s.name} (${s.username}) and all scores?`)) &&
    run(`del-${s._id}`, async () => {
      await api(`/admin/students/${s._id}`, { method: "DELETE" });
      setStudents((all) => all.filter((x) => x._id !== s._id));
      setToast(tx("ลบบัญชีแล้ว", "Account deleted"));
    })().catch((e) => setToast(e.message));
  const score = (v) => (has(v) ? v : "–");

  return (
    <>
      <PageHead
        title={tx("จัดการนักเรียน", "Manage Students")}
        subtitle={tx("เพิ่ม แก้ไข ตั้งรหัสผ่านใหม่ ล้างคะแนน และส่งออกผลการเรียนของนักเรียน", "Add, edit, reset passwords/scores, and export learner results to CSV.")}
        actions={
          <>
            <button type="button" className="btn" onClick={() => exportCsv(list)}><Icon name="download" /> {tx("ส่งออก CSV", "Export CSV")} ({list.length})</button>
            <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "new" })}><Icon name="plus" /> {tx("เพิ่มนักเรียน", "Add Student")}</button>
          </>
        }
      >
        <div className="row">
          <input type="search" className="form-input" style={{ maxWidth: 280 }} placeholder={tx("ค้นหาชื่อหรือรหัส", "Search name or ID")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={tx("ค้นหานักเรียน", "Search students")} />
          <select className="form-select" style={{ width: "auto" }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label={tx("กรองห้อง", "Filter class")}>
            <option value="all">{tx("ทุกห้อง", "All Classes")} ({students.length})</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c} ({students.filter((s) => s.studentClass === c).length})</option>)}
          </select>
          <select className="form-select" style={{ width: "auto" }} value={todo} onChange={(e) => setTodo(e.target.value)} aria-label={tx("กรองสถานะงาน", "Filter work status")}>
            {["all", "pending", "done", "diag"].map(todoOption)}
            {UNITS.map((u) => <optgroup key={u} label={tx(`หน่วย ${u}`, `Unit ${u}`)}>{FIELDS.map(([f]) => todoOption(`${f}-${u}`))}</optgroup>)}
          </select>
          {filtered && <button type="button" className="btn btn-sm" onClick={() => { setCls("all"); setQ(""); setTodo("all"); }}>{tx("ล้างตัวกรอง", "Clear Filters")}</button>}
        </div>
      </PageHead>

      <TeacherRequests
        setToast={setToast}
        onDone={(u, action) =>
          setStudents((all) => (action === "approve" ? all.filter((s) => s._id !== u._id) : all.map((s) => (s._id === u._id ? { ...s, studentClass: u.studentClass } : s))))
        }
      />

      <section className="editorial-panel">
        {list.length === 0 ? (
          <p className="empty">{filtered ? tx("ไม่มีนักเรียนที่ตรงกับตัวกรอง", "No students match the selected filters.") : tx("ยังไม่มีนักเรียน — นักเรียนสมัครเองได้ที่หน้าเข้าสู่ระบบ หรือกด “เพิ่มนักเรียน”", "No students yet — students can register on the sign-in page or click “Add Student”.")}</p>
        ) : (
          <div className="table-wrap">
            <table className="legal-table stack-mobile">
              <thead>
                <tr>
                  <th>{tx("นักเรียน", "Student")}</th><th>{tx("ห้อง", "Class")}</th><th>{tx("แรกเข้า (25)", "Diagnostic (25)")}</th>
                  {[1, 2, 3, 4, 5].map((u) => <th key={u}>{tx(`หน่วย ${u}`, `Unit ${u}`)}<br /><span className="small">{tx("ก่อน/หลัง/เกม", "Pre/Post/Game")}</span></th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const d = s.progress.diagnostic;
                  return (
                    <tr key={s._id} style={busy?.endsWith(s._id) ? { opacity: 0.55, transition: "opacity 200ms" } : { transition: "opacity 200ms" }}>
                      <td><strong>{s.name}</strong><div className="small muted num">{s.username}</div></td>
                      <td data-label={tx("ห้อง", "Class")}>{s.studentClass}</td>
                      <td className="num" data-label={tx("แรกเข้า (25)", "Diagnostic (25)")}>{d.completed ? <strong>{d.totalScore}</strong> : <span className="seal-badge seal-warn">{tx("ยังไม่ทำ", "Not taken")}</span>}</td>
                      {[1, 2, 3, 4, 5].map((u) => {
                        const p = s.progress.unitProgress[u] || {};
                        return <td key={u} className="num small" data-label={tx(`หน่วย ${u} ก่อน/หลัง/เกม`, `Unit ${u} Pre/Post/Game`)}>{score(p.preScore)} / <strong>{score(p.postScore)}</strong> / {has(p.gameScore) ? `${p.gameScore}%` : "–"}</td>;
                      })}
                      <td className="cell-action">
                        <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                          <button type="button" className="btn btn-sky btn-sm" onClick={() => setModal({ type: "report", s })}>{tx("รายงาน", "Report")}</button>
                          <button type="button" className="btn btn-sm" onClick={() => setModal({ type: "scores", s })}>{tx("แก้คะแนน", "Scores")}</button>
                          <button type="button" className="btn btn-sm" onClick={() => setModal({ type: "edit", s })} aria-label={`${tx("แก้ไข", "Edit")} ${s.name}`}><Icon name="edit" size={14} /></button>
                          <button type="button" className="btn btn-sm" aria-busy={busy === `reset-${s._id}`} disabled={!!busy} onClick={() => resetProgress(s)}><span>{tx("ล้างคะแนน", "Reset")}</span></button>
                          <button type="button" className="btn btn-sm btn-danger" aria-busy={busy === `del-${s._id}`} disabled={!!busy} onClick={() => remove(s)} aria-label={`${tx("ลบ", "Delete")} ${s.name}`}><Icon name="trash" size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modal?.type === "new" && (
        <Modal title={tx("เพิ่มนักเรียน", "Add Student")} onClose={close}>
          <StudentForm
            onCancel={close}
            onSave={async (body) => {
              const u = await api("/admin/students", { method: "POST", body });
              setStudents((all) => [...all, u]);
              close();
              setToast(tx("เพิ่มนักเรียนแล้ว", "Student added"));
            }}
          />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title={`${tx("แก้ไขข้อมูล", "Edit Profile")}: ${modal.s.name}`} onClose={close}>
          <StudentForm
            initial={modal.s}
            onCancel={close}
            onSave={async (body) => {
              replace(await api(`/admin/students/${modal.s._id}`, { method: "PATCH", body }));
              close();
              setToast(tx("บันทึกแล้ว", "Saved"));
            }}
          />
        </Modal>
      )}
      {modal?.type === "scores" && (
        <Modal title={`${tx("แก้คะแนน", "Edit Scores")}: ${modal.s.name}`} onClose={close} wide>
          <ScoreForm
            s={modal.s}
            quizzes={content.quizzes}
            onCancel={close}
            onSave={async (body) => {
              replace(await api(`/admin/students/${modal.s._id}/scores`, { method: "PATCH", body }));
              close();
              setToast(tx("บันทึกคะแนนแล้ว", "Scores saved"));
            }}
          />
        </Modal>
      )}
      {modal?.type === "report" && (
        <Modal title={tx("ใบรายงานผลการเรียน", "Learning Progress Report")} onClose={close} wide>
          <ReportCard student={modal.s} units={content.units} />
        </Modal>
      )}
      {toast}
    </>
  );
}

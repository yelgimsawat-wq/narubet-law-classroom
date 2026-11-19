import { useEffect, useState } from "react";
import { useAuth } from "../../auth.jsx";
import { api } from "../../api.js";
import { CLASSES, ErrorState, Icon, Modal, PageHead, PageSkeleton, downloadFile, has, useBusy, useToast } from "../../ui.jsx";
import { ReportCard } from "../Report.jsx";
import { useStudents } from "./useStudents.js";

function StudentForm({ initial, onSave, onCancel }) {
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
          <label htmlFor="s-name">ชื่อ-นามสกุล</label>
          <input id="s-name" className="form-input" value={f.name} onChange={set("name")} required />
        </div>
        <div className="form-field">
          <label htmlFor="s-class">ชั้นเรียน</label>
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
          <label htmlFor="s-id">รหัสประจำตัว (กรณี ครู หรือ บุคคลทั่วไป ใช้ตัวเลข 00000)</label>
          <input id="s-id" className="form-input num" value={f.studentId} onChange={set("studentId")} required />
        </div>
        <div className="form-field">
          <label htmlFor="s-pass">{isNew ? "รหัสผ่าน" : "ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)"}</label>
          <input id="s-pass" className="form-input" type="text" value={f.password} onChange={set("password")} required={isNew} minLength={4} autoComplete="new-password" />
        </div>
      </div>
      {err && <p className="form-error" style={{ marginBottom: 12 }}>{err}</p>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button type="button" className="btn" onClick={onCancel}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} aria-busy={busy}><span>{isNew ? "เพิ่มนักเรียน" : "บันทึก"}</span></button>
      </div>
    </form>
  );
}

const UNITS = [1, 2, 3, 4, 5];
const FIELDS = [["preScore", "ก่อนเรียน"], ["postScore", "หลังเรียน"], ["gameScore", "มินิเกม"]];

// Work-status filter: key -> [label, (student) => bool]
const missing = (s, u, f) => !has(s.progress.unitProgress[u]?.[f]);
const allDone = (s) => s.progress.diagnostic.completed && UNITS.every((u) => FIELDS.every(([f]) => !missing(s, u, f)));
const TODO = {
  all: ["ทุกสถานะ", () => true],
  pending: ["ยังมีงานค้าง", (s) => !allDone(s)],
  done: ["ทำครบทุกงานแล้ว", allDone],
  diag: ["ยังไม่ทำแบบประเมินแรกเข้า", (s) => !s.progress.diagnostic.completed],
  ...Object.fromEntries(UNITS.flatMap((u) => FIELDS.map(([f, label]) => [`${f}-${u}`, [`หน่วย ${u}: ยังไม่ทำ${label}`, (s) => missing(s, u, f)]])))
};

// Teacher edits unit scores; blank = "not done yet".
function ScoreForm({ s, quizzes, onSave, onCancel }) {
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
      <p className="small muted" style={{ marginTop: 0 }}>เว้นว่าง = ยังไม่ทำ · ก่อน/หลังเรียนเต็มตามจำนวนข้อของหน่วย · มินิเกมเต็ม 100%</p>
      <div className="table-wrap">
        <table className="legal-table">
          <thead>
            <tr><th>หน่วย</th>{FIELDS.map(([k, label]) => <th key={k}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {UNITS.map((u) => (
              <tr key={u}>
                <td><strong>หน่วย {u}</strong></td>
                {FIELDS.map(([k, label]) => (
                  <td key={k}>
                    <div className="row" style={{ gap: 6, flexWrap: "nowrap", alignItems: "center" }}>
                      <input
                        type="number" inputMode="numeric" className="form-input num" style={{ width: 76 }}
                        min={0} max={max(u, k)} step={1} placeholder="–"
                        value={f[`${u}.${k}`]} onChange={(e) => setF({ ...f, [`${u}.${k}`]: e.target.value })}
                        aria-label={`หน่วย ${u} ${label}`}
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
        <button type="button" className="btn" onClick={onCancel}>ยกเลิก</button>
        <button className="btn btn-primary" disabled={busy} aria-busy={busy}><span>บันทึกคะแนน</span></button>
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
  downloadFile("﻿" + [header.map(q).join(","), ...rows].join("\r\n"), "รายงานผลผู้เรียน_ส33102_ครูนฤเบศ.csv", "text/csv;charset=utf-8");
}

// People who signed up as "ครู" wait here until any teacher approves them.
function TeacherRequests({ onDone, setToast }) {
  const [reqs, setReqs] = useState(null);
  const [busy, setBusy] = useState("");
  useEffect(() => {
    api("/admin/teacher-requests").then(setReqs, (e) => setToast(`โหลดคำขอเป็นครูไม่ได้: ${e.message}`));
  }, []);
  if (!reqs?.length) return null;

  async function act(u, action) {
    const verb = action === "approve" ? "ยืนยันให้เป็นครู (เข้า Backoffice ได้)" : "ปฏิเสธ (ย้ายไปกลุ่มบุคคลทั่วไป)";
    if (!window.confirm(`${verb}: ${u.name}?`)) return;
    setBusy(u._id);
    try {
      const updated = await api(`/admin/teacher-requests/${u._id}/${action}`, { method: "POST" });
      setReqs((all) => all.filter((x) => x._id !== u._id));
      onDone(updated, action);
      setToast(action === "approve" ? `ยืนยัน ${u.name} เป็นครูแล้ว` : "ปฏิเสธคำขอแล้ว");
    } catch (e) {
      setToast(e.message);
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="editorial-panel" style={{ marginBottom: 16 }}>
      <h3 style={{ marginTop: 0 }}>คำขอเป็นครู ({reqs.length})</h3>
      <p className="small muted">ผู้ที่สมัครโดยเลือก “ครู” — ตรวจสอบว่าเป็นครูจริงก่อนกดยืนยัน ครูที่ยืนยันแล้วจะเข้า Backoffice ได้ทันที</p>
      <div className="table-wrap">
        <table className="legal-table">
          <tbody>
            {reqs.map((u) => (
              <tr key={u._id} style={busy === u._id ? { opacity: 0.55 } : undefined}>
                <td><strong>{u.name}</strong><div className="small muted">สมัครเมื่อ {new Date(u.createdAt).toLocaleString("th-TH")}</div></td>
                <td className="cell-action">
                  <div className="row" style={{ gap: 4, flexWrap: "nowrap", justifyContent: "flex-end" }}>
                    <button type="button" className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => act(u, "approve")}>ยืนยันเป็นครู</button>
                    <button type="button" className="btn btn-sm btn-danger" disabled={!!busy} onClick={() => act(u, "reject")}>ปฏิเสธ</button>
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
  const { students, setStudents, error, reload } = useStudents();
  const [cls, setCls] = useState("all");
  const [q, setQ] = useState("");
  const [todo, setTodo] = useState("all");
  const [modal, setModal] = useState(null); // {type: 'new'|'edit'|'scores'|'report', s}
  const [toast, setToast] = useToast();
  const [busy, run] = useBusy();
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!students) return <PageSkeleton rows={6} />;

  const ql = q.trim().toLowerCase();
  const base = students.filter((s) => (cls === "all" || s.studentClass === cls) && (!ql || `${s.name} ${s.username}`.toLowerCase().includes(ql)));
  const list = base.filter(TODO[todo][1]);
  const todoOption = (k) => <option key={k} value={k}>{TODO[k][0]} ({base.filter(TODO[k][1]).length})</option>;
  const filtered = cls !== "all" || ql || todo !== "all";
  const replace = (u) => setStudents((all) => all.map((s) => (s._id === u._id ? u : s)));
  const close = () => setModal(null);

  // confirm first, then mark the row busy only while the request is in flight
  const resetProgress = (s) =>
    window.confirm(`ล้างคะแนนทั้งหมดของ ${s.name}? (ย้อนกลับไม่ได้)`) &&
    run(`reset-${s._id}`, async () => {
      replace(await api(`/admin/students/${s._id}/reset-progress`, { method: "POST" }));
      setToast("ล้างคะแนนแล้ว");
    })().catch((e) => setToast(e.message));
  const remove = (s) =>
    window.confirm(`ลบบัญชี ${s.name} (${s.username}) และคะแนนทั้งหมดถาวร? (ย้อนกลับไม่ได้)`) &&
    run(`del-${s._id}`, async () => {
      await api(`/admin/students/${s._id}`, { method: "DELETE" });
      setStudents((all) => all.filter((x) => x._id !== s._id));
      setToast("ลบบัญชีแล้ว");
    })().catch((e) => setToast(e.message));
  const score = (v) => (has(v) ? v : "–");

  return (
    <>
      <PageHead
        title="จัดการนักเรียน"
        subtitle="เพิ่ม แก้ไข ตั้งรหัสผ่านใหม่ ล้างคะแนน และส่งออกผลการเรียนของนักเรียน"
        actions={
          <>
            <button type="button" className="btn" onClick={() => exportCsv(list)}><Icon name="download" /> ส่งออก CSV ({list.length})</button>
            <button type="button" className="btn btn-primary" onClick={() => setModal({ type: "new" })}><Icon name="plus" /> เพิ่มนักเรียน</button>
          </>
        }
      >
        <div className="row">
          <input type="search" className="form-input" style={{ maxWidth: 280 }} placeholder="ค้นหาชื่อหรือรหัส" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหานักเรียน" />
          <select className="form-select" style={{ width: "auto" }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label="กรองห้อง">
            <option value="all">ทุกห้อง ({students.length})</option>
            {CLASSES.map((c) => <option key={c} value={c}>{c} ({students.filter((s) => s.studentClass === c).length})</option>)}
          </select>
          <select className="form-select" style={{ width: "auto" }} value={todo} onChange={(e) => setTodo(e.target.value)} aria-label="กรองสถานะงาน">
            {["all", "pending", "done", "diag"].map(todoOption)}
            {UNITS.map((u) => <optgroup key={u} label={`หน่วย ${u}`}>{FIELDS.map(([f]) => todoOption(`${f}-${u}`))}</optgroup>)}
          </select>
          {filtered && <button type="button" className="btn btn-sm" onClick={() => { setCls("all"); setQ(""); setTodo("all"); }}>ล้างตัวกรอง</button>}
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
          <p className="empty">{filtered ? "ไม่มีนักเรียนที่ตรงกับตัวกรอง" : "ยังไม่มีนักเรียน — นักเรียนสมัครเองได้ที่หน้าเข้าสู่ระบบ หรือกด “เพิ่มนักเรียน”"}</p>
        ) : (
          <div className="table-wrap">
            <table className="legal-table stack-mobile">
              <thead>
                <tr>
                  <th>นักเรียน</th><th>ห้อง</th><th>แรกเข้า (25)</th>
                  {[1, 2, 3, 4, 5].map((u) => <th key={u}>หน่วย {u}<br /><span className="small">ก่อน/หลัง/เกม</span></th>)}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const d = s.progress.diagnostic;
                  return (
                    <tr key={s._id} style={busy?.endsWith(s._id) ? { opacity: 0.55, transition: "opacity 200ms" } : { transition: "opacity 200ms" }}>
                      <td><strong>{s.name}</strong><div className="small muted num">{s.username}</div></td>
                      <td data-label="ห้อง">{s.studentClass}</td>
                      <td className="num" data-label="แรกเข้า (25)">{d.completed ? <strong>{d.totalScore}</strong> : <span className="seal-badge seal-warn">ยังไม่ทำ</span>}</td>
                      {[1, 2, 3, 4, 5].map((u) => {
                        const p = s.progress.unitProgress[u] || {};
                        return <td key={u} className="num small" data-label={`หน่วย ${u} ก่อน/หลัง/เกม`}>{score(p.preScore)} / <strong>{score(p.postScore)}</strong> / {has(p.gameScore) ? `${p.gameScore}%` : "–"}</td>;
                      })}
                      <td className="cell-action">
                        <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
                          <button type="button" className="btn btn-sky btn-sm" onClick={() => setModal({ type: "report", s })}>รายงาน</button>
                          <button type="button" className="btn btn-sm" onClick={() => setModal({ type: "scores", s })}>แก้คะแนน</button>
                          <button type="button" className="btn btn-sm" onClick={() => setModal({ type: "edit", s })} aria-label={`แก้ไข ${s.name}`}><Icon name="edit" size={14} /></button>
                          <button type="button" className="btn btn-sm" aria-busy={busy === `reset-${s._id}`} disabled={!!busy} onClick={() => resetProgress(s)}><span>ล้างคะแนน</span></button>
                          <button type="button" className="btn btn-sm btn-danger" aria-busy={busy === `del-${s._id}`} disabled={!!busy} onClick={() => remove(s)} aria-label={`ลบ ${s.name}`}><Icon name="trash" size={14} /></button>
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
        <Modal title="เพิ่มนักเรียน" onClose={close}>
          <StudentForm
            onCancel={close}
            onSave={async (body) => {
              const u = await api("/admin/students", { method: "POST", body });
              setStudents((all) => [...all, u]);
              close();
              setToast("เพิ่มนักเรียนแล้ว");
            }}
          />
        </Modal>
      )}
      {modal?.type === "edit" && (
        <Modal title={`แก้ไขข้อมูล: ${modal.s.name}`} onClose={close}>
          <StudentForm
            initial={modal.s}
            onCancel={close}
            onSave={async (body) => {
              replace(await api(`/admin/students/${modal.s._id}`, { method: "PATCH", body }));
              close();
              setToast("บันทึกแล้ว");
            }}
          />
        </Modal>
      )}
      {modal?.type === "scores" && (
        <Modal title={`แก้คะแนน: ${modal.s.name}`} onClose={close} wide>
          <ScoreForm
            s={modal.s}
            quizzes={content.quizzes}
            onCancel={close}
            onSave={async (body) => {
              replace(await api(`/admin/students/${modal.s._id}/scores`, { method: "PATCH", body }));
              close();
              setToast("บันทึกคะแนนแล้ว");
            }}
          />
        </Modal>
      )}
      {modal?.type === "report" && (
        <Modal title="ใบรายงานผลการเรียน" onClose={close} wide>
          <ReportCard student={modal.s} units={content.units} />
        </Modal>
      )}
      {toast}
    </>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth.jsx";
import { BilingualHtml, UNIT_EN_META, useLang } from "../../i18n.jsx";
import { CLASSES, ErrorState, PageHead, PageSkeleton, has } from "../../ui.jsx";
import { Radar } from "../Dashboard.jsx";
import { avg, fmt1, useStudents } from "./useStudents.js";

function Bar({ value, max, color }) {
  return <div className="bar"><span style={{ width: `${has(value) ? (value / max) * 100 : 0}%`, background: color }} /></div>;
}

export default function Overview() {
  const { content } = useAuth();
  const { lang, tx } = useLang();
  const { students, error, reload } = useStudents();
  const [cls, setCls] = useState("all");
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!students) return <PageSkeleton stats rows={5} />;

  const list = students.filter((s) => cls === "all" || s.studentClass === cls);
  const done = list.filter((s) => s.progress.diagnostic.completed);
  const units = content.units;
  const unitStat = (id, k) => avg(list.map((s) => s.progress.unitProgress[id]?.[k]).filter(has));
  const diagUnitAvg = Object.fromEntries(units.map((u) => [u.id, avg(done.map((s) => s.progress.diagnostic.unitScores[u.id] ?? 0)) ?? 0]));
  const allPost = list.flatMap((s) => units.map((u) => s.progress.unitProgress[u.id]?.postScore).filter(has));
  const watch = list
    .map((s) => ({ s, missing: units.filter((u) => !has(s.progress.unitProgress[u.id]?.postScore)).length }))
    .filter(({ s, missing }) => !s.progress.diagnostic.completed || s.progress.diagnostic.totalScore < 15 || missing > 0)
    .sort((a, b) => (a.s.progress.diagnostic.totalScore - b.s.progress.diagnostic.totalScore) || b.missing - a.missing)
    .slice(0, 8);

  const uTitle = (u) => (lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].title : u.title);

  return (
    <>
      <PageHead
        title={tx("ภาพรวมชั้นเรียน", "Classroom Overview")}
        subtitle={tx(
          "ติดตามผลการเรียนของนักเรียนทุกห้อง · ข้อมูลอัปเดตทันทีเมื่อนักเรียนส่งแบบทดสอบ",
          "Monitor learner progress across all classes · Real-time updates upon quiz submission."
        )}
        actions={
          <>
            <select className="form-select" style={{ width: "auto" }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label={tx("เลือกห้อง", "Filter Class")}>
              <option value="all">{tx("ทุกห้อง", "All Classes")}</option>
              {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Link className="btn btn-primary" to="/teacher/students">{tx("จัดการนักเรียน", "Manage Students")}</Link>
          </>
        }
      />

      <div className="stat-grid">
        <div className="stat"><div className="label">{tx("นักเรียน", "Learners")}</div><div className="value">{list.length}<small> {tx("คน", "users")}</small></div></div>
        <div className="stat"><div className="label">{tx("ทำแบบประเมินแรกเข้าแล้ว", "Completed Diagnostic")}</div><div className="value">{done.length}<small> / {list.length}</small></div></div>
        <div className="stat"><div className="label">{tx("ค่าเฉลี่ยแรกเข้า", "Diagnostic Average")}</div><div className="value">{fmt1(avg(done.map((s) => s.progress.diagnostic.totalScore)))}<small> / 25</small></div></div>
        <div className="stat"><div className="label">{tx("ค่าเฉลี่ยหลังเรียน (ทุกหน่วย)", "Post-test Average (All Units)")}</div><div className="value">{fmt1(avg(allPost))}<small> / 20</small></div></div>
      </div>

      <div className="dashboard-split">
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx("ก่อนเรียน vs หลังเรียน รายหน่วย", "Pre-test vs. Post-test by Unit")}</h2>
            <span className="row small muted" style={{ gap: 12 }}>
              <span><span style={{ color: "var(--ink-3)" }}>●</span> {tx("ก่อน", "Pre")}</span>
              <span><span style={{ color: "var(--primary)" }}>●</span> {tx("หลัง", "Post")}</span>
              <span><span style={{ color: "var(--green)" }}>●</span> {tx("เกม", "Game")}</span>
            </span>
          </div>
          {units.map((u) => {
            const pre = unitStat(u.id, "preScore"), post = unitStat(u.id, "postScore"), game = unitStat(u.id, "gameScore");
            return (
              <div key={u.id} style={{ marginBottom: 14 }}>
                <div className="row between small">
                  <strong>{tx(`หน่วยที่ ${u.id}: `, `Unit ${u.id}: `)}{uTitle(u)}</strong>
                  <span className="num muted">
                    {tx("พัฒนาการ", "Gain")} {has(pre) && has(post) ? `${post - pre >= 0 ? "+" : ""}${(post - pre).toFixed(1)}` : "–"}
                  </span>
                </div>
                <div className="bar-row"><span className="muted">{tx("ก่อน", "Pre")} {fmt1(pre)}</span><Bar value={pre} max={20} color="var(--ink-3)" /><span /></div>
                <div className="bar-row"><span className="muted">{tx("หลัง", "Post")} {fmt1(post)}</span><Bar value={post} max={20} color="var(--primary)" /><span /></div>
                <div className="bar-row"><span className="muted">{tx("เกม", "Game")} {has(game) ? `${Math.round(game)}%` : "–"}</span><Bar value={game} max={100} color="var(--green)" /><span /></div>
              </div>
            );
          })}
        </section>
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx("ความรู้แรกเข้าเฉลี่ยรายหน่วย", "Average Diagnostic Competency")}</h2>
            <span className="mono-tag">{done.length} {tx("คนที่ทำแล้ว", "completed")}</span>
          </div>
          <Radar unitScores={Object.fromEntries(Object.entries(diagUnitAvg).map(([k, v]) => [k, Number(v.toFixed(1))]))} />
        </section>
      </div>

      <section className="editorial-panel">
        <div className="panel-header">
          <h2>{tx("นักเรียนที่ควรติดตาม", "Students Needing Follow-up")}</h2>
          <span className="mono-tag">{tx("แรกเข้าต่ำกว่า 15/25 หรือยังทำแบบทดสอบหลังเรียนไม่ครบ", "Diagnostic < 15/25 or incomplete post-tests")}</span>
        </div>
        {watch.length === 0 ? (
          <p className="empty">{tx("ไม่มีนักเรียนที่ต้องติดตามเป็นพิเศษ", "No students currently require special follow-up.")}</p>
        ) : (
          <div className="table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>{tx("นักเรียน", "Student")}</th>
                  <th>{tx("ห้อง", "Class")}</th>
                  <th>{tx("แรกเข้า", "Diagnostic")}</th>
                  <th>{tx("หน่วยที่ยังไม่ทำหลังเรียน", "Missing Post-tests")}</th>
                </tr>
              </thead>
              <tbody>
                {watch.map(({ s, missing }) => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong> <span className="muted small">({s.username})</span></td>
                    <td>{s.studentClass}</td>
                    <td className="num">{s.progress.diagnostic.completed ? `${s.progress.diagnostic.totalScore}/25` : <span className="seal-badge seal-warn">{tx("ยังไม่ทำ", "Not taken")}</span>}</td>
                    <td className="num">{missing} {tx("หน่วย", "units")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {content.syllabus?.length > 0 && (
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx(`แผนการจัดการเรียนรู้ (${content.syllabus.length} แผน)`, `Course Lesson Plans (${content.syllabus.length} Plans)`)}</h2>
            <Link className="btn btn-sm" to="/teacher/content">{tx("แก้ไข", "Edit")}</Link>
          </div>
          <div className="table-wrap">
            <table className="legal-table">
              <thead>
                <tr>
                  <th>{tx("สัปดาห์", "Week")}</th>
                  <th>{tx("แผนที่", "Plan #")}</th>
                  <th>{tx("หน่วย", "Unit")}</th>
                  <th>{tx("เรื่อง", "Topic")}</th>
                  <th>{tx("ชั่วโมง", "Hours")}</th>
                  <th>{tx("ตัวชี้วัด", "Indicators")}</th>
                </tr>
              </thead>
              <tbody>
                {content.syllabus.map((p) => (
                  <tr key={p.planNo}>
                    <td className="num">{p.week}</td>
                    <td className="num">{p.planNo}</td>
                    <td className="num">{p.unit}</td>
                    <td><BilingualHtml as="span" html={p.topic} /></td>
                    <td className="num">{p.hours}</td>
                    <td className="small">{(p.indicators || []).join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

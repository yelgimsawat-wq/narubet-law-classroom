import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth.jsx";
import { CLASSES, ErrorState, PageHead, PageSkeleton, has } from "../../ui.jsx";
import { Radar } from "../Dashboard.jsx";
import { avg, fmt1, useStudents } from "./useStudents.js";

function Bar({ value, max, color }) {
  return <div className="bar"><span style={{ width: `${has(value) ? (value / max) * 100 : 0}%`, background: color }} /></div>;
}

export default function Overview() {
  const { content } = useAuth();
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

  return (
    <>
      <PageHead
        title="ภาพรวมชั้นเรียน"
        subtitle="ติดตามผลการเรียนของนักเรียนทุกห้อง · ข้อมูลอัปเดตทันทีเมื่อนักเรียนส่งแบบทดสอบ"
        actions={
          <>
            <select className="form-select" style={{ width: "auto" }} value={cls} onChange={(e) => setCls(e.target.value)} aria-label="เลือกห้อง">
              <option value="all">ทุกห้อง</option>
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Link className="btn btn-primary" to="/teacher/students">จัดการนักเรียน</Link>
          </>
        }
      />

      <div className="stat-grid">
        <div className="stat"><div className="label">นักเรียน</div><div className="value">{list.length}<small> คน</small></div></div>
        <div className="stat"><div className="label">ทำแบบประเมินแรกเข้าแล้ว</div><div className="value">{done.length}<small> / {list.length}</small></div></div>
        <div className="stat"><div className="label">ค่าเฉลี่ยแรกเข้า</div><div className="value">{fmt1(avg(done.map((s) => s.progress.diagnostic.totalScore)))}<small> / 25</small></div></div>
        <div className="stat"><div className="label">ค่าเฉลี่ยหลังเรียน (ทุกหน่วย)</div><div className="value">{fmt1(avg(allPost))}<small> / 20</small></div></div>
      </div>

      <div className="dashboard-split">
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>ก่อนเรียน vs หลังเรียน รายหน่วย</h2>
            <span className="row small muted" style={{ gap: 12 }}>
              <span><span style={{ color: "var(--ink-3)" }}>●</span> ก่อน</span>
              <span><span style={{ color: "var(--primary)" }}>●</span> หลัง</span>
              <span><span style={{ color: "var(--green)" }}>●</span> เกม</span>
            </span>
          </div>
          {units.map((u) => {
            const pre = unitStat(u.id, "preScore"), post = unitStat(u.id, "postScore"), game = unitStat(u.id, "gameScore");
            return (
              <div key={u.id} style={{ marginBottom: 14 }}>
                <div className="row between small"><strong>หน่วยที่ {u.id}: {u.title}</strong><span className="num muted">พัฒนาการ {has(pre) && has(post) ? `${post - pre >= 0 ? "+" : ""}${(post - pre).toFixed(1)}` : "–"}</span></div>
                <div className="bar-row"><span className="muted">ก่อน {fmt1(pre)}</span><Bar value={pre} max={20} color="var(--ink-3)" /><span /></div>
                <div className="bar-row"><span className="muted">หลัง {fmt1(post)}</span><Bar value={post} max={20} color="var(--primary)" /><span /></div>
                <div className="bar-row"><span className="muted">เกม {has(game) ? `${Math.round(game)}%` : "–"}</span><Bar value={game} max={100} color="var(--green)" /><span /></div>
              </div>
            );
          })}
        </section>
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>ความรู้แรกเข้าเฉลี่ยรายหน่วย</h2>
            <span className="mono-tag">{done.length} คนที่ทำแล้ว</span>
          </div>
          <Radar unitScores={Object.fromEntries(Object.entries(diagUnitAvg).map(([k, v]) => [k, Number(v.toFixed(1))]))} />
        </section>
      </div>

      <section className="editorial-panel">
        <div className="panel-header">
          <h2>นักเรียนที่ควรติดตาม</h2>
          <span className="mono-tag">แรกเข้าต่ำกว่า 15/25 หรือยังทำแบบทดสอบหลังเรียนไม่ครบ</span>
        </div>
        {watch.length === 0 ? (
          <p className="empty">ไม่มีนักเรียนที่ต้องติดตามเป็นพิเศษ</p>
        ) : (
          <div className="table-wrap">
            <table className="legal-table">
              <thead><tr><th>นักเรียน</th><th>ห้อง</th><th>แรกเข้า</th><th>หน่วยที่ยังไม่ทำหลังเรียน</th></tr></thead>
              <tbody>
                {watch.map(({ s, missing }) => (
                  <tr key={s._id}>
                    <td><strong>{s.name}</strong> <span className="muted small">({s.username})</span></td>
                    <td>{s.studentClass}</td>
                    <td className="num">{s.progress.diagnostic.completed ? `${s.progress.diagnostic.totalScore}/25` : <span className="seal-badge seal-warn">ยังไม่ทำ</span>}</td>
                    <td className="num">{missing} หน่วย</td>
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
            <h2>แผนการจัดการเรียนรู้ ({content.syllabus.length} แผน)</h2>
            <Link className="btn btn-sm" to="/teacher/content">แก้ไข</Link>
          </div>
          <div className="table-wrap">
            <table className="legal-table">
              <thead><tr><th>สัปดาห์</th><th>แผนที่</th><th>หน่วย</th><th>เรื่อง</th><th>ชั่วโมง</th><th>ตัวชี้วัด</th></tr></thead>
              <tbody>
                {content.syllabus.map((p) => (
                  <tr key={p.planNo}>
                    <td className="num">{p.week}</td><td className="num">{p.planNo}</td><td className="num">{p.unit}</td>
                    <td>{p.topic}</td><td className="num">{p.hours}</td><td className="small">{(p.indicators || []).join(", ")}</td>
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

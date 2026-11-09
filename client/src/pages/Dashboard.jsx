import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Icon, PageHead, UNIT_SHORT, has, levelLabel, pctOf } from "../ui.jsx";

export function Radar({ unitScores, max = 5 }) {
  const cx = 190, cy = 170, R = 110;
  const angles = [0, 1, 2, 3, 4].map((i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);
  const pt = (a, r) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  const val = (i) => Math.max(0.06, (unitScores?.[i + 1] || 0) / max);
  return (
    <svg viewBox="0 0 380 345" width="100%" height="300" role="img" aria-label="กราฟเรดาร์ผลประเมิน 5 หน่วย">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34CBFF" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#F398CA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      {[0.2, 0.4, 0.6, 0.8, 1].map((l) => (
        <polygon key={l} points={angles.map((a) => pt(a, R * l)).join(" ")} style={{ fill: l === 1 ? "var(--surface-2)" : "none", stroke: "var(--line-strong)" }} />
      ))}
      {angles.map((a, i) => <line key={i} x1={cx} y1={cy} x2={pt(a, R).split(",")[0]} y2={pt(a, R).split(",")[1]} style={{ stroke: "var(--line-strong)" }} />)}
      <polygon points={angles.map((a, i) => pt(a, R * val(i))).join(" ")} fill="url(#radar-fill)" stroke="#EC4899" strokeWidth="2.2" strokeLinejoin="round" />
      {angles.map((a, i) => {
        const [x, y] = pt(a, R * val(i)).split(",");
        return <circle key={i} cx={x} cy={y} r="4.5" strokeWidth="2" style={{ fill: "var(--ink)", stroke: "var(--surface)" }} />;
      })}
      {angles.map((a, i) => (
        <text key={i} x={cx + Math.cos(a) * (R + 34)} y={cy + Math.sin(a) * (R + 22) + 4} textAnchor="middle" fontSize="12" fontWeight="600" fontFamily="Anuphan, Sarabun, sans-serif" style={{ fill: "var(--ink-2)" }}>
          {`หน่วย ${i + 1} ${UNIT_SHORT[i]} (${unitScores?.[i + 1] || 0}/${max})`}
        </text>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const { user, content } = useAuth();
  const d = user.progress.diagnostic;
  const up = user.progress.unitProgress;
  const units = content.units;
  const totalPct = pctOf(d.totalScore, 25);
  const overall = levelLabel(totalPct);
  const posts = units.map((u) => up[u.id]?.postScore).filter(has);
  const games = units.map((u) => up[u.id]?.gameScore).filter(has);
  const sorted = units.slice().sort((a, b) => (d.unitScores[a.id] ?? 0) - (d.unitScores[b.id] ?? 0));

  return (
    <>
      <PageHead
        title={`สวัสดี ${user.name}`}
        subtitle={user.role === "teacher" ? "ครูผู้สอน (มุมมองนักเรียน)" : `${user.studentClass} · รหัส ${user.username}`}
        actions={
          <>
            <Link className="btn btn-primary" to="/diagnostic"><Icon name="compass" /> {d.completed ? "ทำแบบประเมินอีกครั้ง" : "เริ่มแบบประเมิน"}</Link>
            <Link className="btn" to="/documents"><Icon name="book" /> เอกสาร</Link>
          </>
        }
      >
        {d.completed && (
          <div className="row">
            <span className="muted">ผลประเมินแรกเข้า</span>
            <strong className="num">{d.totalScore}/25 ({totalPct}%)</strong>
            <span className={`seal-badge ${overall.cls}`}>{overall.text}</span>
            <span className="small muted num">· {d.timestamp}</span>
          </div>
        )}
      </PageHead>

      <div className="stat-grid">
        <div className="stat"><div className="label">ประเมินแรกเข้า</div><div className="value">{d.completed ? d.totalScore : "–"}<small> / 25</small></div></div>
        <div className="stat"><div className="label">ค่าเฉลี่ยหลังเรียน</div><div className="value">{posts.length ? (posts.reduce((a, b) => a + b, 0) / posts.length).toFixed(1) : "–"}<small> / 20</small></div></div>
        <div className="stat"><div className="label">ทำแบบทดสอบหลังเรียนแล้ว</div><div className="value">{posts.length}<small> / {units.length} หน่วย</small></div></div>
        <div className="stat"><div className="label">มินิเกมที่เล่นแล้ว</div><div className="value">{games.length}<small> / {units.length} เกม</small></div></div>
      </div>

      <div className="dashboard-split">
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>เรียนอะไรก่อนดี</h2>
            <span className="mono-tag">เรียงจากหน่วยที่ควรเสริม</span>
          </div>
          {!d.completed && (
            <div className="legal-box">
              <Link to="/diagnostic">ทำแบบประเมิน 25 ข้อ</Link> เพื่อจัดลำดับหน่วยที่ควรเรียนก่อน
            </div>
          )}
          {sorted.map((u, i) => {
            const s = d.unitScores[u.id] ?? 0;
            const weak = s <= 3;
            return (
              <div key={u.id} className="path-item">
                <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                  <span className="path-rank" style={{ background: weak ? "var(--rose-soft)" : "var(--green-soft)", color: weak ? "var(--rose)" : "var(--green)" }}>{i + 1}</span>
                  <div>
                    <h3>หน่วยที่ {u.id}: {u.title}</h3>
                    <p className="small muted" style={{ marginTop: 2 }}>
                      แรกเข้า {s}/5 · {weak ? "เริ่มจากอ่านเนื้อหาและลองสื่อจำลอง" : "พื้นฐานดี ลองเล่นมินิเกมและทำแบบทดสอบหลังเรียน"}
                    </p>
                  </div>
                </div>
                <Link className="btn btn-sm" to={`/units/${u.id}`}>เปิดบทเรียน</Link>
              </div>
            );
          })}
        </section>

        <section className="editorial-panel">
          <div className="panel-header">
            <h2>ความรู้ 5 หน่วย</h2>
          </div>
          <Radar unitScores={d.unitScores} />
          <p className="small muted" style={{ textAlign: "center" }}>4–5 = เชี่ยวชาญ · 3 = ผ่าน · 0–2 = ควรทบทวน</p>
        </section>
      </div>

      <section className="editorial-panel">
        <div className="panel-header">
          <h2>สรุปผลการเรียน</h2>
          <Link className="btn btn-sm" to="/report"><Icon name="print" size={15} /> ใบรายงานผล</Link>
        </div>
        <div className="table-wrap">
          <table className="legal-table stack-mobile">
            <thead>
              <tr><th>หน่วยการเรียนรู้</th><th>ประเมินแรกเข้า</th><th>ระดับ</th><th>แบบทดสอบ 20 ข้อ</th><th>มินิเกม</th><th></th></tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const s = d.unitScores[u.id] ?? 0;
                const pct = pctOf(s, 5);
                const lvl = levelLabel(pct);
                const p = up[u.id] || {};
                return (
                  <tr key={u.id}>
                    <td><strong>หน่วยที่ {u.id}: {u.title}</strong><div className="small muted">{u.pages} · {u.hours}</div></td>
                    <td className="num" data-label="ประเมินแรกเข้า"><div style={{ minWidth: 120 }}>{s} / 5 ({pct}%)<div className="meter-track"><div className="meter-fill" style={{ width: `${pct}%` }} /></div></div></td>
                    <td data-label="ระดับ"><span className={`seal-badge ${lvl.cls}`}>{lvl.text}</span></td>
                    <td className="num" data-label="ก่อน / หลังเรียน"><span>ก่อน: {has(p.preScore) ? `${p.preScore}/20` : "ยังไม่ทำ"}<br />หลัง: <strong>{has(p.postScore) ? `${p.postScore}/20` : "ยังไม่ทำ"}</strong></span></td>
                    <td className="num" data-label="มินิเกม">{has(p.gameScore) ? `${p.gameScore}%` : "ยังไม่เล่น"}</td>
                    <td className="cell-action"><Link className="btn btn-sky btn-sm" to={`/units/${u.id}`}>เข้าเรียน</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

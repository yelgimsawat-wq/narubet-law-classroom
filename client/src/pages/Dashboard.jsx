import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { UNIT_EN_META, UNIT_SHORT_EN, useLang } from "../i18n.jsx";
import { Icon, PageHead, UNIT_SHORT, has, levelLabel, pctOf } from "../ui.jsx";

export function Radar({ unitScores, max = 5 }) {
  const { lang, tx } = useLang();
  const shortNames = lang === "en" ? UNIT_SHORT_EN : UNIT_SHORT;
  const cx = 190, cy = 170, R = 110;
  const angles = [0, 1, 2, 3, 4].map((i) => (Math.PI * 2 * i) / 5 - Math.PI / 2);
  const pt = (a, r) => `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  const val = (i) => Math.max(0.06, (unitScores?.[i + 1] || 0) / max);
  return (
    <svg viewBox="0 0 380 345" width="100%" height="300" role="img" aria-label={tx("กราฟเรดาร์ผลประเมิน 5 หน่วย", "5-Unit Diagnostic Radar Chart")}>
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
          {`${tx("หน่วย", "U")}${i + 1} ${shortNames[i]} (${unitScores?.[i + 1] || 0}/${max})`}
        </text>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const { user, content } = useAuth();
  const { lang, tx } = useLang();
  const d = user.progress.diagnostic;
  const up = user.progress.unitProgress;
  const units = content.units;
  const totalPct = pctOf(d.totalScore, 25);
  const overall = levelLabel(totalPct, lang);
  const posts = units.map((u) => up[u.id]?.postScore).filter(has);
  const games = units.map((u) => up[u.id]?.gameScore).filter(has);
  const sorted = units.slice().sort((a, b) => (d.unitScores[a.id] ?? 0) - (d.unitScores[b.id] ?? 0));

  const uTitle = (u) => (lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].title : u.title);
  const uPages = (u) => (lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].pages : u.pages);
  const uHours = (u) => (lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].hours : u.hours);

  return (
    <>
      <PageHead
        title={tx(`สวัสดี ${user.name}`, `Welcome, ${user.name}`)}
        subtitle={
          user.role === "teacher"
            ? tx("ครูผู้สอน (มุมมองนักเรียน)", "Instructor (Student View)")
            : `${user.studentClass} · ${tx("รหัส", "ID")} ${user.username}`
        }
        actions={
          <>
            <Link className="btn btn-primary" to="/diagnostic">
              <Icon name="compass" /> {d.completed ? tx("ทำแบบประเมินอีกครั้ง", "Retake Diagnostic") : tx("เริ่มแบบประเมิน", "Start Diagnostic")}
            </Link>
            <Link className="btn" to="/documents"><Icon name="book" /> {tx("เอกสาร", "Textbook")}</Link>
          </>
        }
      >
        {d.completed && (
          <div className="row">
            <span className="muted">{tx("ผลประเมินแรกเข้า", "Diagnostic Score")}</span>
            <strong className="num">{d.totalScore}/25 ({totalPct}%)</strong>
            <span className={`seal-badge ${overall.cls}`}>{overall.text}</span>
            <span className="small muted num">· {d.timestamp}</span>
          </div>
        )}
      </PageHead>

      <div className="stat-grid">
        <div className="stat"><div className="label">{tx("ประเมินแรกเข้า", "Diagnostic Score")}</div><div className="value">{d.completed ? d.totalScore : "–"}<small> / 25</small></div></div>
        <div className="stat"><div className="label">{tx("ค่าเฉลี่ยหลังเรียน", "Post-test Average")}</div><div className="value">{posts.length ? (posts.reduce((a, b) => a + b, 0) / posts.length).toFixed(1) : "–"}<small> / 20</small></div></div>
        <div className="stat"><div className="label">{tx("ทำแบบทดสอบหลังเรียนแล้ว", "Completed Post-tests")}</div><div className="value">{posts.length}<small> / {units.length} {tx("หน่วย", "Units")}</small></div></div>
        <div className="stat"><div className="label">{tx("มินิเกมที่เล่นแล้ว", "Minigames Played")}</div><div className="value">{games.length}<small> / {units.length} {tx("เกม", "Games")}</small></div></div>
      </div>

      <div className="dashboard-split">
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx("เรียนอะไรก่อนดี", "Recommended Learning Path")}</h2>
            <span className="mono-tag">{tx("เรียงจากหน่วยที่ควรเสริม", "Ordered by priority")}</span>
          </div>
          {!d.completed && (
            <div className="legal-box">
              <Link to="/diagnostic">{tx("ทำแบบประเมิน 25 ข้อ", "Take the 25-Question Diagnostic Test")}</Link>{" "}
              {tx("เพื่อจัดลำดับหน่วยที่ควรเรียนก่อน", "to personalize your recommended unit order.")}
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
                    <h3>{tx(`หน่วยที่ ${u.id}: `, `Unit ${u.id}: `)}{uTitle(u)}</h3>
                    <p className="small muted" style={{ marginTop: 2 }}>
                      {tx(`แรกเข้า ${s}/5 · `, `Diagnostic ${s}/5 · `)}
                      {weak
                        ? tx("เริ่มจากอ่านเนื้อหาและลองสื่อจำลอง", "Start by reading the lesson content and trying the interactive simulator")
                        : tx("พื้นฐานดี ลองเล่นมินิเกมและทำแบบทดสอบหลังเรียน", "Strong foundation — try the minigame and take the post-test")}
                    </p>
                  </div>
                </div>
                <Link className="btn btn-sm" to={`/units/${u.id}`}>{tx("เปิดบทเรียน", "Open Unit")}</Link>
              </div>
            );
          })}
        </section>

        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx("ความรู้ 5 หน่วย", "5-Unit Competency Radar")}</h2>
          </div>
          <Radar unitScores={d.unitScores} />
          <p className="small muted" style={{ textAlign: "center" }}>
            {tx("4–5 = เชี่ยวชาญ · 3 = ผ่าน · 0–2 = ควรทบทวน", "4–5 = Mastery · 3 = Passed · 0–2 = Needs Review")}
          </p>
        </section>
      </div>

      <section className="editorial-panel">
        <div className="panel-header">
          <h2>{tx("สรุปผลการเรียน", "Learning Progress Summary")}</h2>
          <Link className="btn btn-sm" to="/report"><Icon name="print" size={15} /> {tx("ใบรายงานผล", "Progress Report")}</Link>
        </div>
        <div className="table-wrap">
          <table className="legal-table stack-mobile">
            <thead>
              <tr>
                <th>{tx("หน่วยการเรียนรู้", "Learning Unit")}</th>
                <th>{tx("ประเมินแรกเข้า", "Diagnostic")}</th>
                <th>{tx("ระดับ", "Level")}</th>
                <th>{tx("แบบทดสอบ 20 ข้อ", "20-Question Quizzes")}</th>
                <th>{tx("มินิเกม", "Minigame")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u) => {
                const s = d.unitScores[u.id] ?? 0;
                const pct = pctOf(s, 5);
                const lvl = levelLabel(pct, lang);
                const p = up[u.id] || {};
                return (
                  <tr key={u.id}>
                    <td>
                      <strong>{tx(`หน่วยที่ ${u.id}: `, `Unit ${u.id}: `)}{uTitle(u)}</strong>
                      <div className="small muted">{uPages(u)} · {uHours(u)}</div>
                    </td>
                    <td className="num" data-label={tx("ประเมินแรกเข้า", "Diagnostic")}>
                      <div style={{ minWidth: 120 }}>
                        {s} / 5 ({pct}%)
                        <div className="meter-track"><div className="meter-fill" style={{ width: `${pct}%` }} /></div>
                      </div>
                    </td>
                    <td data-label={tx("ระดับ", "Level")}><span className={`seal-badge ${lvl.cls}`}>{lvl.text}</span></td>
                    <td className="num" data-label={tx("ก่อน / หลังเรียน", "Pre / Post-test")}>
                      <span>
                        {tx("ก่อน", "Pre")}: {has(p.preScore) ? `${p.preScore}/20` : tx("ยังไม่ทำ", "Not taken")}<br />
                        {tx("หลัง", "Post")}: <strong>{has(p.postScore) ? `${p.postScore}/20` : tx("ยังไม่ทำ", "Not taken")}</strong>
                      </span>
                    </td>
                    <td className="num" data-label={tx("มินิเกม", "Minigame")}>{has(p.gameScore) ? `${p.gameScore}%` : tx("ยังไม่เล่น", "Not played")}</td>
                    <td className="cell-action"><Link className="btn btn-sky btn-sm" to={`/units/${u.id}`}>{tx("เข้าเรียน", "Study")}</Link></td>
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

import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { Html, Icon, has } from "../ui.jsx";
import { QuizRunner, shuffle } from "../Quiz.jsx";
import { complianceCard, getUnitExternalCasesHtml, getUnitInfographicSvg, renderInteractiveSimulator, updateSimulator } from "../legacy.js";

const TABS = ["content", "interactive", "media", "pretest", "posttest", "minigame"];

export function UnitVisuals({ unitId }) {
  return (
    <>
      <article className="unit-section-block">
        <div className="unit-section-header">
          <h3>แผนผังสรุป</h3>
        </div>
        <Html html={getUnitInfographicSvg(unitId)} />
      </article>
      <article className="unit-section-block">
        <div className="unit-section-header">
          <h3>กรณีศึกษาจากเรื่องจริง</h3>
        </div>
        <Html html={getUnitExternalCasesHtml(unitId)} />
      </article>
    </>
  );
}

// The simulator markup + calculators come from the original site; they read/write the DOM by id.
function Simulator({ unitId }) {
  const ref = useRef(null);
  useEffect(() => {
    const run = updateSimulator[unitId];
    const el = ref.current;
    if (!run || !el) return;
    run();
    el.addEventListener("input", run);
    el.addEventListener("change", run);
    return () => {
      el.removeEventListener("input", run);
      el.removeEventListener("change", run);
    };
  }, [unitId]);
  return <div key={unitId} ref={ref} dangerouslySetInnerHTML={{ __html: renderInteractiveSimulator(unitId) }} />;
}

function Media({ unit }) {
  const [idx, setIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const stop = () => (window.speechSynthesis?.cancel(), setSpeaking(false));
  const go = (i) => (stop(), setIdx(i));
  const speak = (slide) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(`${slide.heading}. ${slide.narration}`);
    u.lang = "th-TH";
    u.onstart = () => setSpeaking(true);
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      <UnitVisuals unitId={unit.id} />
      {(unit.externalResources || []).map((res, rIdx) => {
        if (res.type === "video" && Array.isArray(res.slides) && res.slides.length) {
          const n = res.slides.length;
          const i = Math.min(n - 1, idx);
          const s = res.slides[i];
          return (
            <div key={rIdx} className="unit-section-block">
              <div className="unit-section-header">
                <h3>{res.title}</h3>
                <span className="seal-badge seal-info num">{res.duration}</span>
              </div>
              <p>{res.summary} <span className="muted">({res.source})</span></p>
              <div className="slide-card" style={{ marginTop: 12 }}>
                <div className="row between" style={{ marginBottom: 12 }}>
                  <span className="seal-badge seal-pass">{s.step}</span>
                  <div className="row">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => (speaking ? stop() : speak(s))} aria-pressed={speaking} style={{ minWidth: 132 }}>
                      {speaking ? <><span className="eq" aria-hidden="true"><i /><i /><i /></span> กำลังบรรยาย</> : <><Icon name="play" size={14} /> ฟังเสียงบรรยาย</>}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={stop} disabled={!speaking}><Icon name="stop" size={14} /> หยุด</button>
                  </div>
                </div>
                <h4 key={i} className="tab-enter" style={{ color: "var(--primary)", marginBottom: 8 }}>{s.heading}</h4>
                <ul style={{ marginLeft: "1.3rem", marginBottom: 12 }}>
                  {s.points.map((pt, k) => <Html as="li" key={k} html={pt} style={{ marginBottom: 4 }} />)}
                </ul>
                <div className="legal-box small muted"><strong>บทบรรยาย:</strong> “{s.narration}”</div>
                <div className="row between" style={{ marginTop: 12 }}>
                  <div className="row" style={{ gap: 6 }}>
                    {res.slides.map((sl, k) => (
                      <button key={k} type="button" className={`btn btn-sm ${k === i ? "btn-primary" : ""}`} onClick={() => go(k)}>{sl.step.split("·")[0].trim()}</button>
                    ))}
                  </div>
                  <div className="row">
                    <button type="button" className="btn btn-sm" onClick={() => go((i - 1 + n) % n)}>◀ ก่อนหน้า</button>
                    <button type="button" className="btn btn-sky btn-sm" onClick={() => go((i + 1) % n)}>ถัดไป ▶</button>
                  </div>
                </div>
              </div>
              {res.url && <p style={{ marginTop: 12 }}><a className="btn btn-sm" href={res.url} target="_blank" rel="noopener noreferrer">ค้นคว้าเพิ่มเติมจากหน่วยงานภาครัฐ ↗</a></p>}
            </div>
          );
        }
        return (
          <div key={rIdx} className="unit-section-block">
            <div className="unit-section-header">
              <h3>{res.title}</h3>
              <span className="seal-badge seal-info">{res.source}</span>
            </div>
            <p>{res.summary}</p>
            {res.url && <p style={{ marginTop: 10 }}><a className="btn btn-sm" href={res.url} target="_blank" rel="noopener noreferrer">เปิดแหล่งเรียนรู้ภายนอก ↗</a></p>}
          </div>
        );
      })}
      <Html html={complianceCard} />
    </>
  );
}

function UnitQuiz({ unit, mode }) {
  const { content, setProgress } = useAuth();
  const isPost = mode === "posttest";
  const raw = content.quizzes[unit.id] || [];
  const list = isPost ? raw.slice().reverse() : raw;

  async function onSubmit(answers) {
    const { progress, score, key } = await api(`/me/quiz/${unit.id}/${mode}`, { method: "POST", body: { answers } });
    setProgress(progress);
    return { score, key };
  }

  return (
    <>
      <div className="editorial-panel">
        <h2>{isPost ? "แบบทดสอบหลังเรียน (Post-test)" : "แบบทดสอบก่อนเรียน (Pre-test)"} — หน่วยที่ {unit.id}</h2>
        <p className="small muted">{list.length} ข้อ · ตัวชี้วัด {unit.indicators.join(", ")}</p>
      </div>
      <QuizRunner
        items={list.map((q) => ({
          badge: (n, total) => <span className={`seal-badge ${isPost ? "seal-alert" : "seal-info"}`}>{isPost ? "หลังเรียน" : "ก่อนเรียน"} · ข้อ {n} / {total}</span>,
          title: (n) => q.q.replace(/^\d+\.\s*/, `${n}. `),
          options: q.options
        }))}
        onSubmit={onSubmit}
        submitLabel={`ส่งข้อสอบ${isPost ? "หลังเรียน" : "ก่อนเรียน"}`}
        explanationLabel="คำอธิบายหลักกฎหมาย"
      />
    </>
  );
}

function HierarchyGame({ mg }) {
  const { setProgress } = useAuth();
  const [order, setOrder] = useState(mg.hierarchyItems.map((h) => h.name));
  const [hist, setHist] = useState({});
  const [choices] = useState(() => mg.historyScenarios.map((sc) => shuffle(sc.choices)));
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [moved, setMoved] = useState(null); // {name, n}: n changes every move so the flash replays
  const byName = Object.fromEntries(mg.hierarchyItems.map((h) => [h.name, h]));

  const move = (i, dir) => {
    const n = [...order];
    [n[i], n[i + dir]] = [n[i + dir], n[i]];
    setOrder(n);
    setMoved((m) => ({ name: n[i + dir], n: (m?.n || 0) + 1 }));
    setRes(null);
  };
  async function submit() {
    setBusy(true);
    setErr("");
    try {
      const r = await api(`/me/game/${mg.unitId}`, { method: "POST", body: { order, hist } });
      setProgress(r.progress);
      setRes(r);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="editorial-panel">
      <div className="panel-header">
        <h2>{mg.title}</h2>
        <span className="seal-badge seal-alert">{mg.badge}</span>
      </div>
      <p style={{ marginBottom: 16 }}>{mg.instructions}</p>
      {res && <div className="form-ok" style={{ marginBottom: 14 }}>คะแนนมินิเกม: <strong>{res.gameScore}%</strong> (บันทึกแล้ว)</div>}

      <h3 style={{ marginBottom: 10 }}>ด่านที่ 1: เรียงลำดับศักดิ์ของกฎหมายไทย (สูงสุด → ต่ำสุด)</h3>
      {order.map((name, i) => {
        const ok = res && res.key.order[i] === name;
        return (
          <div key={moved?.name === name ? `${name}-${moved.n}` : name} className={`order-item ${res ? (ok ? "ok" : "bad") : moved?.name === name ? "moved" : ""}`}>
            <div>
              <span className="seal-badge num">ลำดับที่ {i + 1}</span> <strong style={{ marginLeft: 6 }}>{name}</strong>
              <div className="small muted">{byName[name]?.desc}</div>
            </div>
            <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
              <button type="button" className="btn btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น"><Icon name="up" size={15} /></button>
              <button type="button" className="btn btn-sm" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="เลื่อนลง"><Icon name="down" size={15} /></button>
            </div>
          </div>
        );
      })}

      <h3 style={{ margin: "22px 0 10px" }}>ด่านที่ 2: จับคู่ยุคสมัยวิวัฒนาการของกฎหมายไทย</h3>
      {mg.historyScenarios.map((sc, i) => (
        <div key={i} className="legal-box">
          <p><strong>ภารกิจที่ {i + 1}:</strong> {sc.prompt}</p>
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            {choices[i].map((c) => (
              <button key={c} type="button" className={`btn btn-sm ${hist[i] === c ? "btn-navy" : ""}`} onClick={() => (setHist({ ...hist, [i]: c }), setRes(null))}>{c}</button>
            ))}
          </div>
          {res && <p className="small" style={{ marginTop: 8, color: hist[i] === res.key.hist[i] ? "var(--green)" : "var(--rose)" }}><strong>เฉลย:</strong> {res.key.hist[i]}</p>}
        </div>
      ))}
      {err && <p className="form-error" role="alert" style={{ marginTop: 12 }}>{err}</p>}
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy} aria-busy={busy}><span>ตรวจคำตอบและบันทึกคะแนน</span></button>
      </div>
    </div>
  );
}

function Minigame({ unitId }) {
  const { content, setProgress } = useAuth();
  const mg = content.minigames[unitId];
  if (!mg) return <div className="editorial-panel empty">ยังไม่มีมินิเกมสำหรับหน่วยนี้</div>;
  if (mg.hierarchyItems) return <HierarchyGame mg={mg} />;
  const cases = mg.cases || [];

  async function onSubmit(ans) {
    const answers = Object.fromEntries(ans.map((a, i) => [i, a]).filter(([, a]) => has(a)));
    const r = await api(`/me/game/${unitId}`, { method: "POST", body: { answers } });
    setProgress(r.progress);
    return { score: r.key.filter((k, i) => k.answer === ans[i]).length, key: r.key, gameScore: r.gameScore };
  }

  return (
    <>
      <div className="editorial-panel">
        <h2>{mg.title}</h2>
        <p className="muted">{mg.instructions}</p>
      </div>
      <QuizRunner
        items={cases.map((c) => ({
          badge: <span className="seal-badge seal-alert">{c.caseNo}</span>,
          title: (
            <>
              <p style={{ margin: "8px 0" }}><strong>ข้อเท็จจริง:</strong> <Html as="span" html={c.scenario} /></p>
              <Html as="p" html={c.question} style={{ fontWeight: 700 }} />
            </>
          ),
          options: c.options
        }))}
        letters={false}
        explanationLabel="คำวินิจฉัย"
        submitLabel="ส่งคำตัดสินและบันทึกคะแนนเกม"
        scoreLabel={(r) => `${r.gameScore}%`}
        onSubmit={onSubmit}
      />
    </>
  );
}

export default function Unit() {
  const { id, tab = "content" } = useParams();
  const { user, content } = useAuth();
  const unit = content.units.find((u) => String(u.id) === id);
  useEffect(() => {
    document.querySelector(".mode-tab.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [id, tab]);
  if (!unit || !TABS.includes(tab)) return <Navigate to="/" replace />;
  const up = user.progress.unitProgress[unit.id] || {};
  const score = (v, suffix) => (has(v) ? <span className="tab-score num">{v}{suffix}</span> : null);
  const labels = {
    content: <>เนื้อหา & อินโฟกราฟิก</>,
    interactive: <>สื่ออินเตอร์แอคทีฟ</>,
    media: <>วิดีโอ & แหล่งเรียนรู้</>,
    pretest: <>ก่อนเรียน {score(up.preScore, "/20")}</>,
    posttest: <>หลังเรียน {score(up.postScore, "/20")}</>,
    minigame: <>มินิเกม {score(up.gameScore, "%")}</>
  };

  return (
    <>
      <section className="gazette-banner">
        <div className="gazette-banner-top">
          <div>
            <span className="small muted">หน่วยที่ {unit.id} · {unit.pages}</span>
            <h1 style={{ marginTop: 2 }}>{unit.title}</h1>
            <p className="muted" style={{ marginTop: 4 }}>{unit.subtitle}</p>
          </div>
        </div>
        {tab === "content" && (
          <>
            <Html as="p" html={unit.summary} />
            <Html as="blockquote" className="gazette-quote" html={unit.heroQuote} />
          </>
        )}
      </section>

      <nav className="unit-mode-bar" aria-label="ส่วนของบทเรียน">
        {TABS.map((t) => (
          <Link key={t} to={`/units/${unit.id}/${t}`} className={`mode-tab ${t === tab ? "active" : ""}`}>{labels[t]}</Link>
        ))}
      </nav>

      <div key={tab} className="tab-enter">
      {tab === "content" && (
        <>
          {unit.sections.map((sec) => (
            <article key={sec.id || sec.title} className="unit-section-block">
              <div className="unit-section-header">
                <h3>{sec.title}</h3>
                <span className="seal-badge seal-info num">{sec.badge}</span>
              </div>
              <Html className="legal-prose" html={sec.content} />
            </article>
          ))}
          <UnitVisuals unitId={unit.id} />
          <Simulator unitId={unit.id} />
          <div className="row between editorial-panel">
            <strong>อ่านจบแล้ว?</strong>
            <div className="row">
              <Link className="btn" to={`/units/${unit.id}/minigame`}><Icon name="game" /> เล่นมินิเกม</Link>
              <Link className="btn btn-primary" to={`/units/${unit.id}/posttest`}>ทำแบบทดสอบหลังเรียน</Link>
            </div>
          </div>
        </>
      )}
      {tab === "interactive" && <Simulator unitId={unit.id} />}
      {tab === "media" && <Media unit={unit} />}
      {(tab === "pretest" || tab === "posttest") && <UnitQuiz key={`${unit.id}-${tab}`} unit={unit} mode={tab} />}
      {tab === "minigame" && <Minigame key={unit.id} unitId={unit.id} />}
      </div>
    </>
  );
}

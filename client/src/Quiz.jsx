import { useState } from "react";
import { QuestionCard, has, pctOf, useBusy } from "./ui.jsx";

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Options like "ถูกทุกข้อ" only make sense in their written position.
const FIXED_ORDER = /ทุกข้อ|กล่าวมา|ถูกทั้ง|ผิดทั้ง/;
const range = (n) => Array.from({ length: n }, (_, i) => i);

// Random question order + option order. order[k] = original question index; opts[q][d] = original option index.
function makeLayout(items) {
  return {
    order: shuffle(range(items.length)),
    opts: items.map((it) => (it.options.some((o) => FIXED_ORDER.test(o)) ? range(it.options.length) : shuffle(range(it.options.length))))
  };
}

const resolve = (v, n, total) => (typeof v === "function" ? v(n, total) : v);

// Shared runner for diagnostic, pre/post tests and case minigames. onSubmit(answers[]) -> { score, key[] }
// answers/key always use ORIGINAL question + option indexes, so the server grading is unaware of the shuffle.
// Item fields `badge` and `title` may be functions of (displayNumber, total).
export function QuizRunner({ items, initial = [], onSubmit, submitLabel = "ส่งคำตอบ", letters = true, explanationLabel, resultExtra, scoreLabel = (r) => `${r.score} / ${items.length}` }) {
  const [layout, setLayout] = useState(() => makeLayout(items));
  const [ans, setAns] = useState(initial);
  const [res, setRes] = useState(null);
  const [busy, run] = useBusy();
  const [err, setErr] = useState("");
  const answered = ans.filter(has).length;

  const send = run("submit", async () => {
    setErr("");
    try {
      setRes(await onSubmit(ans));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErr(e.message);
    }
  });
  const submit = () =>
    (answered === items.length || window.confirm(`ยังตอบไม่ครบ (${answered}/${items.length} ข้อ) ต้องการส่งคำตอบเลยหรือไม่?`)) && send();

  function retry() {
    setRes(null);
    setAns([]);
    setLayout(makeLayout(items));
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      {res && (
        <section className="editorial-panel result-hero">
          <div className="score">{scoreLabel(res)}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>บันทึกคะแนนเรียบร้อยแล้ว ({pctOf(res.score, items.length)}%)</strong>
            <p className="small muted">ดูเฉลยและคำอธิบายหลักกฎหมายได้ในแต่ละข้อด้านล่าง</p>
          </div>
          <div className="row">
            {resultExtra}
            <button type="button" className="btn" onClick={retry}>ทำใหม่อีกครั้ง (สุ่มข้อใหม่)</button>
          </div>
        </section>
      )}
      {layout.order.map((q, k) => {
        const it = items[q];
        const perm = layout.opts[q];
        const key = res?.key[q];
        return (
          <QuestionCard
            key={q}
            badge={resolve(it.badge, k + 1, items.length)}
            meta={it.meta}
            title={resolve(it.title, k + 1, items.length)}
            options={perm.map((o) => it.options[o])}
            letters={letters}
            explanationLabel={explanationLabel}
            picked={has(ans[q]) ? perm.indexOf(ans[q]) : undefined}
            result={key && { ...key, answer: perm.indexOf(key.answer) }}
            onPick={(d) => setAns((a) => Object.assign([...a], { [q]: perm[d] }))}
          />
        );
      })}
      {!res && (
        <div className="sticky-bar">
          <div className="row">
            <span className="num">ตอบแล้ว {answered} / {items.length} ข้อ</span>
            <div className="progress-line"><div style={{ width: `${pctOf(answered, items.length)}%` }} /></div>
          </div>
          {err && <span role="alert" style={{ color: "var(--rose)", fontSize: "0.9rem" }}>{err}</span>}
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!!busy} aria-busy={!!busy}>
            <span>{submitLabel}</span>
          </button>
        </div>
      )}
    </>
  );
}

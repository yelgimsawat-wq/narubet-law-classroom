import { useState } from "react";
import { BilingualHtml, LETTERS_EN, LangToggle, useLang } from "./i18n.jsx";
import { LETTERS, QuestionCard, has, pctOf, useBusy } from "./ui.jsx";

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Options like "ถูกทุกข้อ" / "All of the above" only make sense in their written position.
const FIXED_ORDER = /ทุกข้อ|กล่าวมา|ถูกทั้ง|ผิดทั้ง|All of the above|None of the above|Both /i;
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
export function QuizRunner({ items, initial = [], onSubmit, submitLabel, letters = true, explanationLabel, resultExtra, scoreLabel = (r) => `${r.score} / ${items.length}` }) {
  const { lang, tx } = useLang();
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
    (answered === items.length ||
      window.confirm(
        tx(
          `ยังตอบไม่ครบ (${answered}/${items.length} ข้อ) ต้องการส่งคำตอบเลยหรือไม่?`,
          `You have answered ${answered}/${items.length} questions. Submit anyway?`
        )
      )) &&
    send();

  function retry() {
    setRes(null);
    setAns([]);
    setLayout(makeLayout(items));
    window.scrollTo({ top: 0 });
  }

  const activeLetters = lang === "en" ? LETTERS_EN : LETTERS;
  const activeSubmitLabel = submitLabel || tx("ส่งคำตอบ", "Submit Answers");
  const activeExplanationLabel = explanationLabel || tx("คำอธิบายหลักกฎหมาย", "Legal Explanation");

  return (
    <>
      <div className="row between no-print" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <span className="small muted">
          {tx(
            "ระบบแบบทดสอบ 2 ภาษา: สามารถสลับภาษา ไทย / EN ได้ตลอดเวลาโดยไม่ล้างคำตอบที่เลือกไว้",
            "Bilingual Quiz Mode: You can switch between Thai (ไทย) and English (EN) anytime without losing your selected answers."
          )}
        </span>
        <LangToggle />
      </div>

      {res && (
        <section className="editorial-panel result-hero">
          <div className="score">{scoreLabel(res)}</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong>
              {tx(
                `บันทึกคะแนนเรียบร้อยแล้ว (${pctOf(res.score, items.length)}%)`,
                `Score recorded (${pctOf(res.score, items.length)}%)`
              )}
            </strong>
            <p className="small muted">
              {tx(
                "ดูเฉลยและคำอธิบายหลักกฎหมายได้ในแต่ละข้อด้านล่าง",
                "Review the correct answers and legal explanations for each question below."
              )}
            </p>
          </div>
          <div className="row">
            {resultExtra}
            <button type="button" className="btn" onClick={retry}>
              {tx("ทำใหม่อีกครั้ง (สุ่มข้อใหม่)", "Retry Quiz (Reshuffle)")}
            </button>
          </div>
        </section>
      )}
      {layout.order.map((q, k) => {
        const it = items[q];
        const perm = layout.opts[q];
        const key = res?.key[q];
        const rawTitle = resolve(it.title, k + 1, items.length);
        const titleNode = typeof rawTitle === "string" ? <BilingualHtml as="h3" html={rawTitle} /> : rawTitle;
        const metaNode = typeof it.meta === "string" ? <BilingualHtml as="span" html={it.meta} /> : it.meta;
        const pickedIdx = has(ans[q]) ? perm.indexOf(ans[q]) : undefined;
        const correctDispIdx = key ? perm.indexOf(key.answer) : undefined;
        return (
          <QuestionCard
            key={q}
            badge={resolve(it.badge, k + 1, items.length)}
            meta={metaNode}
            title={titleNode}
            options={perm.map((o) => <BilingualHtml as="span" html={it.options[o]} />)}
            letters={letters ? activeLetters : false}
            explanationLabel={
              letters && has(correctDispIdx)
                ? `${activeExplanationLabel} (${tx("เฉลยข้อ", "Answer")} ${activeLetters[correctDispIdx]})`
                : activeExplanationLabel
            }
            picked={pickedIdx}
            result={
              key && {
                ...key,
                answer: correctDispIdx,
                explanation: <BilingualHtml as="span" html={key.explanation} />
              }
            }
            onPick={(d) => setAns((a) => Object.assign([...a], { [q]: perm[d] }))}
          />
        );
      })}
      {!res && (
        <div className="sticky-bar">
          <div className="row">
            <span className="num">
              {tx(`ตอบแล้ว ${answered} / ${items.length} ข้อ`, `Answered ${answered} / ${items.length}`)}
            </span>
            <div className="progress-line"><div style={{ width: `${pctOf(answered, items.length)}%` }} /></div>
          </div>
          {err && <span role="alert" style={{ color: "var(--rose)", fontSize: "0.9rem" }}>{err}</span>}
          <button type="button" className="btn btn-primary" onClick={submit} disabled={!!busy} aria-busy={!!busy}>
            <span>{activeSubmitLabel}</span>
          </button>
        </div>
      )}
    </>
  );
}

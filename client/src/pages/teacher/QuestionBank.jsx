import { useEffect, useState } from "react";
import { useAuth } from "../../auth.jsx";
import { api } from "../../api.js";
import { BilingualHtml, LETTERS_EN, useLang } from "../../i18n.jsx";
import { ErrorState, Icon, LETTERS, PageHead, PageSkeleton, useBusy, useToast } from "../../ui.jsx";

const FIELDS = {
  diagnostic: { q: "question", a: "answer", e: "explanation" },
  quiz: { q: "q", a: "ans", e: "exp" }
};

export default function QuestionBank() {
  const { content, reloadContent } = useAuth();
  const { lang, tx } = useLang();
  const [set, setSet] = useState("diagnostic");
  const [raw, setRaw] = useState(null); // { diagnostic: [...], quizzes: {...} }
  const [list, setList] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useToast();
  const [busy, run] = useBusy();
  const kind = set === "diagnostic" ? "diagnostic" : "quiz";
  const F = FIELDS[kind];
  const activeLetters = lang === "en" ? LETTERS_EN : LETTERS;

  const load = () => {
    setErr("");
    Promise.all([api("/admin/content/diagnostic"), api("/admin/content/quizzes")]).then(
      ([d, q]) => setRaw({ diagnostic: d.data || [], quizzes: q.data || {} }),
      (e) => setErr(e.message)
    );
  };
  useEffect(load, []);
  useEffect(() => {
    if (raw) setList(structuredClone(set === "diagnostic" ? raw.diagnostic : raw.quizzes[set] || []));
    setDirty(false);
  }, [raw, set]);

  if (err && !raw) return <ErrorState message={err} onRetry={load} />;
  if (!list) return <PageSkeleton rows={6} />;

  const update = (i, patch) => (setList(list.map((q, k) => (k === i ? { ...q, ...patch } : q))), setDirty(true));
  const move = (i, dir) => {
    const n = [...list];
    [n[i], n[i + dir]] = [n[i + dir], n[i]];
    setList(n);
    setDirty(true);
  };
  const add = () => {
    const base = { [F.q]: "", options: ["", "", "", ""], [F.a]: 0, [F.e]: "" };
    if (kind === "diagnostic") {
      const ids = new Set(list.map((q) => q.id));
      let n = list.length + 1;
      while (ids.has(`D${String(n).padStart(2, "0")}`)) n++;
      const u = content.units[0];
      Object.assign(base, { id: `D${String(n).padStart(2, "0")}`, unitId: u.id, unitTitle: `หน่วยที่ ${u.id} ${u.title}`, subtopic: "" });
    }
    setList([...list, base]);
    setDirty(true);
  };

  async function save() {
    const bad = list.findIndex((q) => !q[F.q].trim() || q.options.some((o) => !o.trim()));
    if (bad !== -1) return setToast(tx(`ข้อ ${bad + 1}: กรอกโจทย์และตัวเลือกให้ครบ`, `Q${bad + 1}: Please fill in the prompt and all options.`));
    try {
      if (kind === "diagnostic") {
        const { data } = await api("/admin/content/diagnostic", { method: "PUT", body: { data: list } });
        setRaw({ ...raw, diagnostic: data });
      } else {
        const { data } = await api("/admin/content/quizzes", { method: "PUT", body: { data: { ...raw.quizzes, [set]: list } } });
        setRaw({ ...raw, quizzes: data });
      }
      await reloadContent();
      setToast(tx("บันทึกคลังข้อสอบแล้ว", "Question bank saved"));
    } catch (e) {
      setToast(e.message);
    }
  }

  const switchSet = (v) =>
    (!dirty || window.confirm(tx("มีการแก้ไขที่ยังไม่บันทึก ต้องการเปลี่ยนชุดข้อสอบหรือไม่?", "You have unsaved changes. Switch question set anyway?"))) && setSet(v);

  return (
    <>
      <PageHead
        title={tx("คลังข้อสอบ", "Question Bank")}
        subtitle={tx(
          "แก้ไขโจทย์ ตัวเลือก เฉลย และคำอธิบาย · แบบทดสอบหลังเรียนใช้ข้อสอบชุดเดียวกับก่อนเรียนโดยสลับลำดับข้อ",
          "Edit question prompts, options, answer keys, and explanations · Post-tests use the reversed pre-test question set."
        )}
        actions={
          <>
            <select className="form-select" style={{ width: "auto" }} value={set} onChange={(e) => switchSet(e.target.value)} aria-label={tx("เลือกชุดข้อสอบ", "Select question set")}>
              <option value="diagnostic">{tx(`แบบประเมินแรกเข้า (${raw.diagnostic.length} ข้อ)`, `Diagnostic Test (${raw.diagnostic.length} Qs)`)}</option>
              {content.units.map((u) => (
                <option key={u.id} value={String(u.id)}>
                  {tx(`หน่วยที่ ${u.id} ก่อน/หลังเรียน (${(raw.quizzes[u.id] || []).length} ข้อ)`, `Unit ${u.id} Pre/Post-test (${(raw.quizzes[u.id] || []).length} Qs)`)}
                </option>
              ))}
            </select>
            <button type="button" className="btn btn-primary" onClick={run("save", save)} disabled={!dirty || !!busy} aria-busy={busy === "save"}>
              <span>{dirty ? tx("บันทึกการแก้ไข", "Save Changes") : tx("บันทึกแล้ว", "Saved")}</span>
            </button>
          </>
        }
      />

      {list.map((q, i) => (
        <article key={i} className="quiz-question-box">
          <div className="row between" style={{ marginBottom: 10 }}>
            <strong>{tx(`ข้อ ${i + 1}`, `Question ${i + 1}`)}{q.id ? ` · ${q.id}` : ""}</strong>
            <div className="row" style={{ gap: 4 }}>
              <button type="button" className="btn btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={tx("เลื่อนขึ้น", "Move Up")}><Icon name="up" size={14} /></button>
              <button type="button" className="btn btn-sm" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={tx("เลื่อนลง", "Move Down")}><Icon name="down" size={14} /></button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => window.confirm(tx(`ลบข้อ ${i + 1}?`, `Delete question ${i + 1}?`)) && (setList(list.filter((_, k) => k !== i)), setDirty(true))} aria-label={tx("ลบข้อ", "Delete")}><Icon name="trash" size={14} /></button>
            </div>
          </div>
          {kind === "diagnostic" && (
            <div className="form-grid" style={{ marginTop: 0 }}>
              <div className="form-field">
                <label>{tx("หน่วยการเรียนรู้", "Learning Unit")}</label>
                <select className="form-select" value={q.unitId} onChange={(e) => {
                  const u = content.units.find((x) => x.id === Number(e.target.value));
                  update(i, { unitId: u.id, unitTitle: `หน่วยที่ ${u.id} ${u.title}` });
                }}>
                  {content.units.map((u) => <option key={u.id} value={u.id}>{tx(`หน่วยที่ ${u.id}`, `Unit ${u.id}`)}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label>{tx("ประเด็น", "Subtopic")}</label>
                <input className="form-input" value={q.subtopic || ""} onChange={(e) => update(i, { subtopic: e.target.value })} />
              </div>
            </div>
          )}
          <div className="form-field">
            <label>{tx("โจทย์", "Question Prompt")}</label>
            <textarea className="form-input" value={q[F.q]} onChange={(e) => update(i, { [F.q]: e.target.value })} />
            {lang === "en" && q[F.q] && (
              <div className="small muted" style={{ marginTop: 4 }}>
                <strong>EN Preview:</strong> <BilingualHtml as="span" html={q[F.q]} />
              </div>
            )}
          </div>
          <div className="quiz-options" style={{ margin: "12px 0" }}>
            {q.options.map((o, k) => (
              <label key={k} className={`quiz-option-btn ${q[F.a] === k ? "correct" : ""}`} style={{ cursor: "text" }}>
                <input type="radio" name={`ans-${set}-${i}`} checked={q[F.a] === k} onChange={() => update(i, { [F.a]: k })} aria-label={tx(`ข้อ ${activeLetters[k]} เป็นคำตอบที่ถูก`, `Option ${activeLetters[k]} is correct`)} />
                <span className="opt-letter">{activeLetters[k]}</span>
                <div style={{ flex: 1 }}>
                  <input className="form-input" style={{ padding: "4px 8px", width: "100%" }} value={o} onChange={(e) => update(i, { options: q.options.map((x, j) => (j === k ? e.target.value : x)) })} aria-label={`${tx("ตัวเลือก", "Option")} ${activeLetters[k]}`} />
                  {lang === "en" && o && (
                    <div className="small muted" style={{ marginTop: 2 }}>
                      <BilingualHtml as="span" html={o} />
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <div className="form-field">
            <label>{tx("คำอธิบายเฉลย", "Answer Explanation")}</label>
            <textarea className="form-input" value={q[F.e] || ""} onChange={(e) => update(i, { [F.e]: e.target.value })} />
            {lang === "en" && q[F.e] && (
              <div className="small muted" style={{ marginTop: 4 }}>
                <strong>EN Preview:</strong> <BilingualHtml as="span" html={q[F.e]} />
              </div>
            )}
          </div>
        </article>
      ))}
      <div className="row" style={{ marginBottom: 80 }}>
        <button type="button" className="btn" onClick={add}><Icon name="plus" /> {tx("เพิ่มข้อสอบ", "Add Question")}</button>
      </div>
      {dirty && (
        <div className="sticky-bar">
          <span>{tx("มีการแก้ไขที่ยังไม่บันทึก", "You have unsaved changes")}</span>
          <button type="button" className="btn btn-primary" onClick={run("save", save)} disabled={!!busy} aria-busy={busy === "save"}><span>{tx("บันทึกการแก้ไข", "Save Changes")}</span></button>
        </div>
      )}
      {toast}
    </>
  );
}

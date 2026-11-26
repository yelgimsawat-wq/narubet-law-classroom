// Form building blocks for the teacher content editors.
import { useCallback, useEffect, useId, useState } from "react";
import { api } from "../../api.js";
import { useAuth } from "../../auth.jsx";
import { BilingualHtml, LETTERS_EN, useLang } from "../../i18n.jsx";
import { Icon, LETTERS, useBusy } from "../../ui.jsx";

// Immutable set by path: setIn(obj, [0, "sections", 2, "title"], "x")
export function setIn(obj, [k, ...rest], v) {
  const copy = Array.isArray(obj) ? [...obj] : { ...obj };
  copy[k] = rest.length ? setIn(obj?.[k], rest, v) : v;
  return copy;
}

const lines = (arr) => (arr || []).map((s) => String(s).trim()).filter(Boolean);
export const cleanLines = lines;

// Loads one content key, tracks unsaved edits, saves with a validator/normalizer.
export function useContentDoc(key, onDirty) {
  const { reloadContent } = useAuth();
  const [data, setData] = useState(null);
  const [original, setOriginal] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState("");
  const [busy, run] = useBusy();
  const dirty = data !== original;

  const load = useCallback(() => {
    setError("");
    api(`/admin/content/${key}`).then(
      (r) => (setData(r.data), setOriginal(r.data), setUpdatedAt(r.updatedAt)),
      (e) => setError(e.message)
    );
  }, [key]);
  useEffect(load, [load]);
  useEffect(() => onDirty?.(key, dirty), [key, dirty, onDirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = (path, v) => setData((d) => setIn(d, path, v));
  const save = (normalize = (d) => d) =>
    run("save", async () => {
      const clean = normalize(data);
      const r = await api(`/admin/content/${key}`, { method: "PUT", body: { data: clean } });
      setData(r.data);
      setOriginal(r.data);
      setUpdatedAt(r.updatedAt);
      await reloadContent();
    })();
  const revert = () => setData(original);

  return { data, setData, set, error, load, dirty, busy: busy === "save", save, revert, updatedAt };
}

export function Field({ label, value, onChange, textarea, rows = 3, type = "text", placeholder, hint, className = "" }) {
  const id = useId();
  const Tag = textarea ? "textarea" : "input";
  return (
    <div className={`form-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <Tag
        id={id}
        className="form-input"
        type={textarea ? undefined : type}
        rows={textarea ? rows : undefined}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      />
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

// Array of strings edited one-per-line; empty lines are dropped on save (cleanLines).
export function LinesField({ label, value, onChange, rows = 3, hint }) {
  const { tx } = useLang();
  return <Field label={label} textarea rows={rows} hint={hint || tx("หนึ่งรายการต่อหนึ่งบรรทัด", "One item per line")} value={(value || []).join("\n")} onChange={(v) => onChange(v.split("\n"))} />;
}

export function SelectField({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="form-select" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
      </select>
    </div>
  );
}

export function HtmlField({ label, value, onChange, rows = 10 }) {
  const { tx } = useLang();
  const [preview, setPreview] = useState(false);
  const id = useId();
  return (
    <div className="form-field">
      <div className="row between">
        <label htmlFor={id}>{label}</label>
        <div className="seg-mini" role="group" aria-label={tx("โหมดแสดงผล", "Display Mode")}>
          <button type="button" className={!preview ? "active" : ""} onClick={() => setPreview(false)}>HTML</button>
          <button type="button" className={preview ? "active" : ""} onClick={() => setPreview(true)}>{tx("ตัวอย่าง", "Preview")}</button>
        </div>
      </div>
      {preview ? (
        <BilingualHtml className="legal-prose html-preview" html={value} />
      ) : (
        <textarea id={id} className="form-input code-input" rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      )}
    </div>
  );
}

export function OptionsEditor({ options, correct, onChange, min = 2, max = 4 }) {
  const { lang, tx } = useLang();
  const activeLetters = lang === "en" ? LETTERS_EN : LETTERS;
  const name = useId();
  const setOpt = (k, v) => onChange({ options: options.map((o, j) => (j === k ? v : o)), correct });
  const remove = (k) => onChange({ options: options.filter((_, j) => j !== k), correct: correct === k ? 0 : correct > k ? correct - 1 : correct });
  return (
    <div className="form-field">
      <label>{tx("ตัวเลือก · เลือกวงกลมหน้าข้อที่ถูก", "Options · Select the radio button for the correct answer")}</label>
      <div className="stack-tight">
        {options.map((o, k) => (
          <div key={k} className={`option-row ${correct === k ? "is-correct" : ""}`}>
            <input type="radio" name={name} checked={correct === k} onChange={() => onChange({ options, correct: k })} aria-label={`ข้อ ${activeLetters[k]} ถูก`} />
            <span className="opt-letter">{activeLetters[k]}</span>
            <input className="form-input" value={o} onChange={(e) => setOpt(k, e.target.value)} aria-label={`ตัวเลือก ${activeLetters[k]}`} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(k)} disabled={options.length <= min} aria-label={`ลบตัวเลือก ${activeLetters[k]}`}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
      {options.length < max && (
        <button type="button" className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ options: [...options, ""], correct })}>
          <Icon name="plus" size={14} /> {tx("เพิ่มตัวเลือก", "Add Option")}
        </button>
      )}
    </div>
  );
}

// Reorderable, collapsible list of item cards. Open/closed flags follow items when moved.
export function ListEditor({ items, onChange, renderItem, newItem, addLabel, itemTitle, defaultOpen = false, confirmDelete = true }) {
  const { tx } = useLang();
  const [open, setOpen] = useState(() => items.map(() => defaultOpen));
  useEffect(() => {
    if (open.length !== items.length) setOpen((o) => items.map((_, i) => o[i] ?? defaultOpen));
  }, [items, open.length, defaultOpen]);

  const swap = (arr, i, j) => {
    const n = [...arr];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  };
  const move = (i, d) => (onChange(swap(items, i, i + d)), setOpen((o) => swap(o, i, i + d)));
  const remove = (i) => {
    if (confirmDelete && !window.confirm(`${tx("ลบ", "Delete")} "${itemTitle(items[i], i)}"?`)) return;
    onChange(items.filter((_, k) => k !== i));
    setOpen((o) => o.filter((_, k) => k !== i));
  };
  const add = () => (onChange([...items, newItem(items.length)]), setOpen((o) => [...o, true]));

  return (
    <div className="list-editor">
      {items.map((it, i) => (
        <div key={i} className={`edit-item ${open[i] ? "open" : ""}`}>
          <div className="edit-item-head">
            <button type="button" className="edit-item-toggle" onClick={() => setOpen((o) => Object.assign([...o], { [i]: !o[i] }))} aria-expanded={!!open[i]}>
              <Icon name="down" size={16} className="chev" />
              <span className="edit-item-no num">{i + 1}</span>
              <span className="edit-item-title">{itemTitle(it, i) || <span className="muted">{tx("(ยังไม่มีชื่อ)", "(Untitled)")}</span>}</span>
            </button>
            <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={tx("เลื่อนขึ้น", "Move Up")}><Icon name="up" size={14} /></button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={tx("เลื่อนลง", "Move Down")}><Icon name="down" size={14} /></button>
              <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(i)} aria-label={tx("ลบ", "Delete")}><Icon name="trash" size={14} /></button>
            </div>
          </div>
          {open[i] && <div className="edit-item-body tab-enter">{renderItem(it, i, (path, v) => onChange(setIn(items, [i, ...path], v)))}</div>}
        </div>
      ))}
      <button type="button" className="btn btn-sm" onClick={add}><Icon name="plus" size={14} /> {addLabel}</button>
    </div>
  );
}

export function SaveBar({ doc, normalize, toast }) {
  const { tx } = useLang();
  if (!doc.dirty) return null;
  return (
    <div className="sticky-bar">
      <span>{tx("มีการแก้ไขที่ยังไม่บันทึก", "You have unsaved changes")}</span>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <button type="button" className="btn" onClick={() => window.confirm(tx("ยกเลิกการแก้ไขทั้งหมด?", "Discard all unsaved changes?")) && doc.revert()} disabled={doc.busy}>{tx("ยกเลิก", "Revert")}</button>
        <button type="button" className="btn btn-primary" onClick={() => doc.save(normalize).then(() => toast(tx("บันทึกแล้ว", "Saved")), (e) => toast(e.message))} disabled={doc.busy} aria-busy={doc.busy}>
          <span>{tx("บันทึก", "Save")}</span>
        </button>
      </div>
    </div>
  );
}

// Raw JSON escape hatch for fields the forms don't cover (e.g. interactiveConfig).
export function JsonFallback({ doc }) {
  const { tx } = useLang();
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  return (
    <details className="json-fallback" onToggle={(e) => e.currentTarget.open && setText(JSON.stringify(doc.data, null, 2))}>
      <summary>{tx("แก้แบบ JSON (ขั้นสูง)", "Advanced JSON Editor")}</summary>
      <textarea className="form-input code-input" rows={18} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} aria-label="ข้อมูล JSON" />
      {err && <p className="form-error" style={{ marginTop: 8 }}>{err}</p>}
      <button
        type="button"
        className="btn btn-sm"
        style={{ marginTop: 8 }}
        onClick={() => {
          try {
            doc.setData(JSON.parse(text));
            setErr("");
          } catch (e) {
            setErr(`${tx("JSON ไม่ถูกต้อง", "Invalid JSON")}: ${e.message}`);
          }
        }}
      >
        {tx("ใช้ข้อมูลนี้ (ยังไม่บันทึก)", "Apply JSON (Not saved yet)")}
      </button>
    </details>
  );
}

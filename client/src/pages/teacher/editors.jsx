// Form building blocks for the teacher content editors.
import { useCallback, useEffect, useId, useState } from "react";
import { api } from "../../api.js";
import { useAuth } from "../../auth.jsx";
import { Html, Icon, LETTERS, useBusy } from "../../ui.jsx";

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
  // normalize(data) returns cleaned data or throws Error(message) for invalid input
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
  return <Field label={label} textarea rows={rows} hint={hint || "หนึ่งรายการต่อหนึ่งบรรทัด"} value={(value || []).join("\n")} onChange={(v) => onChange(v.split("\n"))} />;
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
  const [preview, setPreview] = useState(false);
  const id = useId();
  return (
    <div className="form-field">
      <div className="row between">
        <label htmlFor={id}>{label}</label>
        <div className="seg-mini" role="group" aria-label="โหมดแสดงผล">
          <button type="button" className={!preview ? "active" : ""} onClick={() => setPreview(false)}>HTML</button>
          <button type="button" className={preview ? "active" : ""} onClick={() => setPreview(true)}>ตัวอย่าง</button>
        </div>
      </div>
      {preview ? (
        <Html className="legal-prose html-preview" html={value} />
      ) : (
        <textarea id={id} className="form-input code-input" rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      )}
    </div>
  );
}

export function OptionsEditor({ options, correct, onChange, min = 2, max = 4 }) {
  const name = useId();
  const setOpt = (k, v) => onChange({ options: options.map((o, j) => (j === k ? v : o)), correct });
  const remove = (k) => onChange({ options: options.filter((_, j) => j !== k), correct: correct === k ? 0 : correct > k ? correct - 1 : correct });
  return (
    <div className="form-field">
      <label>ตัวเลือก · เลือกวงกลมหน้าข้อที่ถูก</label>
      <div className="stack-tight">
        {options.map((o, k) => (
          <div key={k} className={`option-row ${correct === k ? "is-correct" : ""}`}>
            <input type="radio" name={name} checked={correct === k} onChange={() => onChange({ options, correct: k })} aria-label={`ข้อ ${LETTERS[k]} ถูก`} />
            <span className="opt-letter">{LETTERS[k]}</span>
            <input className="form-input" value={o} onChange={(e) => setOpt(k, e.target.value)} aria-label={`ตัวเลือก ${LETTERS[k]}`} />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(k)} disabled={options.length <= min} aria-label={`ลบตัวเลือก ${LETTERS[k]}`}>
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
      {options.length < max && (
        <button type="button" className="btn btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ options: [...options, ""], correct })}>
          <Icon name="plus" size={14} /> เพิ่มตัวเลือก
        </button>
      )}
    </div>
  );
}

// Reorderable, collapsible list of item cards. Open/closed flags follow items when moved.
export function ListEditor({ items, onChange, renderItem, newItem, addLabel, itemTitle, defaultOpen = false, confirmDelete = true }) {
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
    if (confirmDelete && !window.confirm(`ลบ "${itemTitle(items[i], i)}"?`)) return;
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
              <span className="edit-item-title">{itemTitle(it, i) || <span className="muted">(ยังไม่มีชื่อ)</span>}</span>
            </button>
            <div className="row" style={{ gap: 4, flexWrap: "nowrap" }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="เลื่อนขึ้น"><Icon name="up" size={14} /></button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="เลื่อนลง"><Icon name="down" size={14} /></button>
              <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => remove(i)} aria-label="ลบ"><Icon name="trash" size={14} /></button>
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
  if (!doc.dirty) return null;
  return (
    <div className="sticky-bar">
      <span>มีการแก้ไขที่ยังไม่บันทึก</span>
      <div className="row" style={{ flexWrap: "nowrap" }}>
        <button type="button" className="btn" onClick={() => window.confirm("ยกเลิกการแก้ไขทั้งหมด?") && doc.revert()} disabled={doc.busy}>ยกเลิก</button>
        <button type="button" className="btn btn-primary" onClick={() => doc.save(normalize).then(() => toast("บันทึกแล้ว"), (e) => toast(e.message))} disabled={doc.busy} aria-busy={doc.busy}>
          <span>บันทึก</span>
        </button>
      </div>
    </div>
  );
}

// Raw JSON escape hatch for fields the forms don't cover (e.g. interactiveConfig).
export function JsonFallback({ doc }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  return (
    <details className="json-fallback" onToggle={(e) => e.currentTarget.open && setText(JSON.stringify(doc.data, null, 2))}>
      <summary>แก้แบบ JSON (ขั้นสูง)</summary>
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
            setErr(`JSON ไม่ถูกต้อง: ${e.message}`);
          }
        }}
      >
        ใช้ข้อมูลนี้ (ยังไม่บันทึก)
      </button>
    </details>
  );
}

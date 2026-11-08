import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const CLASSES = Array.from({ length: 16 }, (_, i) => `ม.6/${i + 1}`);
export const LETTERS = ["ก", "ข", "ค", "ง"];
export const UNIT_IDS = [1, 2, 3, 4, 5];
export const UNIT_SHORT = ["กฎหมายเบื้องต้น", "กฎหมายแพ่ง", "กฎหมายอาญา", "กฎหมายสำคัญ", "กระบวนการยุติธรรม"];

// Lesson HTML comes from the teacher-managed database (trusted author).
export const Html = ({ html, as: Tag = "div", ...p }) => <Tag {...p} dangerouslySetInnerHTML={{ __html: html || "" }} />;

export function levelLabel(pct) {
  if (pct >= 80) return { text: "เชี่ยวชาญ (ดีเยี่ยม)", cls: "seal-pass" };
  if (pct >= 60) return { text: "ผ่านเกณฑ์ (ควรเสริมบางจุด)", cls: "seal-info" };
  return { text: "ควรเร่งทบทวนเป็นพิเศษ", cls: "seal-alert" };
}

export const has = (v) => v !== null && v !== undefined;
export const pctOf = (n, total) => (total ? Math.round((n / total) * 100) : 0);

const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  compass: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.2 7.8l-2.1 6.3-6.3 2.1 2.1-6.3z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
  chart: "M3 3v18h18M7 15l4-4 3 3 5-6",
  info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
  users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  db: "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  play: "M6 4l14 8-14 8z",
  stop: "M6 6h12v12H6z",
  check: "M20 6 9 17l-5-5",
  menu: "M3 6h18M3 12h18M3 18h18",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  plus: "M12 5v14M5 12h14",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  up: "M18 15l-6-6-6 6",
  down: "M6 9l6 6 6-6",
  print: "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  scale: "M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6zM8 21h8",
  game: "M6 11h4M8 9v4M15 12h.01M18 10h.01M17.3 5H6.7a4 4 0 0 0-4 3.6L2 15a3 3 0 0 0 5.3 2.1L9 15h6l1.7 2.1A3 3 0 0 0 22 15l-.7-6.4A4 4 0 0 0 17.3 5z"
};

export function Icon({ name, size = 18, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
      <path d={paths[name]} />
    </svg>
  );
}

export function QuestionCard({ badge, meta, title, options, picked, onPick, result, letters = true, explanationLabel = "คำอธิบาย" }) {
  return (
    <article className="quiz-question-box">
      <div className="row between" style={{ marginBottom: 4 }}>
        {badge}
        {meta && <span className="small muted">{meta}</span>}
      </div>
      {typeof title === "string" ? <Html as="h3" html={title} /> : title}
      <div className="quiz-options">
        {options.map((opt, i) => {
          let cls = "quiz-option-btn";
          if (picked === i) cls += " selected";
          if (result) {
            if (i === result.answer) cls += " correct";
            else if (picked === i) cls += " wrong";
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => onPick(i)} disabled={!!result} aria-pressed={picked === i}>
              {letters && <span className="opt-letter">{LETTERS[i]}</span>}
              <Html as="span" html={opt} />
            </button>
          );
        })}
      </div>
      {result && (
        <div className="quiz-explanation">
          <strong>
            {explanationLabel}
            {letters && has(result.answer) ? ` (เฉลยข้อ ${LETTERS[result.answer]})` : ""}:
          </strong>{" "}
          <Html as="span" html={result.explanation} />
        </div>
      )}
    </article>
  );
}

const readSavedTheme = () => {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
};

// Light/dark switch. Follows the OS until the user picks, then remembers the choice.
export function ThemeToggle({ className = "" }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "light");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0C0B10" : "#FFFFFF");
  }, [theme]);
  useEffect(() => {
    if (readSavedTheme()) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = (e) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", follow);
    return () => mq.removeEventListener("change", follow);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-switching");
    setTimeout(() => root.classList.remove("theme-switching"), 400);
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  const label = theme === "dark" ? "เปลี่ยนเป็นธีมสว่าง" : "เปลี่ยนเป็นธีมมืด";
  return (
    <button type="button" className={`btn btn-ghost btn-sm theme-toggle ${className}`} onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === "dark" ? "sun" : "moon"} />
    </button>
  );
}

// Overlays render into <body>: an animated ancestor (transform) would otherwise trap position:fixed.
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // page behind must not scroll
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="panel-header">
          <h2>{title}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClose} aria-label="ปิด">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2600);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg ? createPortal(<div className="toast" role="status">{msg}</div>, document.body) : null, setMsg];
}

export function downloadFile(content, filename, mimeType = "text/html;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Skeletons mirror the real page blocks (banner, stat cards, panels) so nothing jumps when data lands.
const Sk = ({ className = "", style }) => <div className={`sk ${className}`} style={style} />;

export function PageSkeleton({ stats = false, rows = 4 }) {
  return (
    <div className="skeleton-wrap" role="status" aria-label="กำลังโหลด">
      <div className="sk-card">
        <Sk className="sk-title" />
        <Sk className="sk-line" style={{ width: "80%" }} />
        <div className="row" style={{ marginTop: 16 }}>
          <Sk className="sk-btn" />
          <Sk className="sk-btn" style={{ width: 100 }} />
        </div>
      </div>
      {stats && (
        <div className="stat-grid">
          {[0, 1, 2, 3].map((i) => <Sk key={i} className="sk-stat" />)}
        </div>
      )}
      <div className="sk-card">
        <Sk className="sk-title" style={{ width: "35%" }} />
        {Array.from({ length: rows }, (_, i) => <Sk key={i} className="sk-row" />)}
      </div>
    </div>
  );
}

export function ShellSkeleton() {
  return (
    <div className="shell-skeleton" role="status" aria-label="กำลังโหลด">
      <aside>
        <Sk style={{ height: 44, marginBottom: 22 }} />
        {Array.from({ length: 9 }, (_, i) => <Sk key={i} />)}
      </aside>
      <main>
        <PageSkeleton stats />
      </main>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="editorial-panel error-state" role="alert">
      <p>{message}</p>
      {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>ลองใหม่</button>}
    </div>
  );
}

// Async click handler with busy flag; the button keeps its width (see .btn[aria-busy]).
export function useBusy() {
  const [busy, setBusy] = useState(null);
  const lock = useRef(false); // state lags a render behind; the ref blocks a same-tick double click
  const run = (id, fn) => async (...args) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(id);
    try {
      return await fn(...args);
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };
  return [busy, run];
}

export function PageHead({ title, subtitle, actions, children }) {
  return (
    <section className="gazette-banner">
      <div className="gazette-banner-top">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="muted" style={{ marginTop: 4 }}>{subtitle}</p>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

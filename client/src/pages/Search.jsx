import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Html, LETTERS, PageHead, has } from "../ui.jsx";

const POPULAR = ["ลำดับศักดิ์ของกฎหมาย", "พระราชกำหนด", "ราชกิจจานุเบกษา", "ผู้เยาว์", "โมฆะ", "โมฆียะ", "สมรสเท่าเทียม", "ทายาทโดยธรรม", "พินัยกรรม", "อายุความ", "ป้องกันโดยชอบด้วยกฎหมาย", "เด็กอายุไม่เกิน 12 ปี", "ลักทรัพย์", "ชิงทรัพย์", "ปล้นทรัพย์", "ความผิดลหุโทษ", "ภาษีเงินได้", "สิทธิผู้บริโภค", "ศาลแขวง", "อุทธรณ์"];

const strip = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
// Text is escaped first so only our <mark> tags end up as HTML.
const highlight = (text, kw) => {
  const safe = escapeHtml(String(text || ""));
  return kw ? safe.replace(new RegExp(`(${escapeRe(escapeHtml(kw))})`, "gi"), '<mark class="search-highlight">$1</mark>') : safe;
};
function snippet(plain, kw, r = 140) {
  const i = kw ? plain.toLowerCase().indexOf(kw.toLowerCase()) : -1;
  if (i === -1) return highlight(plain.slice(0, r * 2), kw) + (plain.length > r * 2 ? "..." : "");
  const s = Math.max(0, i - r), e = Math.min(plain.length, i + kw.length + r);
  return (s > 0 ? "..." : "") + highlight(plain.slice(s, e), kw) + (e < plain.length ? "..." : "");
}

export default function Search() {
  const { content } = useAuth();
  const [params, setParams] = useSearchParams();
  const kw = (params.get("q") || "").trim();
  const [input, setInput] = useState(kw);
  const [unit, setUnit] = useState("all");
  const setKw = (q) => (setInput(q), setParams(q ? { q } : {}));

  const { sections, questions } = useMemo(() => {
    const low = kw.toLowerCase();
    const units = content.units.filter((u) => unit === "all" || String(u.id) === unit);
    const sections = units.flatMap((u) =>
      u.sections
        .map((sec) => ({ u, sec, plain: strip(sec.content) }))
        .filter(({ u, sec, plain }) => !kw || `${u.title} ${u.subtitle} ${sec.title} ${sec.badge} ${plain}`.toLowerCase().includes(low))
    );
    const questions = !kw
      ? []
      : units.flatMap((u) =>
          (content.quizzes[u.id] || [])
            .map((q, i) => ({ u, q, no: i + 1 }))
            .filter(({ q }) => `${q.q} ${q.options.join(" ")} ${q.exp || ""}`.toLowerCase().includes(low))
        );
    return { sections, questions };
  }, [content, kw, unit]);

  return (
    <>
      <PageHead
        title="ค้นหาคำสำคัญและหลักกฎหมาย"
        subtitle="ค้นหาคำศัพท์กฎหมาย หัวข้อบทเรียน มาตราสำคัญ และโจทย์วิเคราะห์จากทั้ง 5 หน่วย"
        actions={
          <>
            <span className="seal-badge seal-pass num">พบเนื้อหา {sections.length} หัวข้อ</span>
            {kw && <span className="seal-badge seal-info num">พบโจทย์ {questions.length} ข้อ</span>}
          </>
        }
      >
        <form className="row" style={{ marginBottom: 14 }} onSubmit={(e) => (e.preventDefault(), setKw(input.trim()))}>
          <input type="search" className="form-input" style={{ flex: 1, minWidth: 220 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="เช่น สมรสเท่าเทียม, โมฆียะ, มรดก, ลักทรัพย์, ภาษี..." aria-label="คำค้นหา" />
          <button className="btn btn-primary">ค้นหา</button>
          {kw && <button type="button" className="btn" onClick={() => setKw("")}>ล้าง</button>}
        </form>
        <div className="row" style={{ marginBottom: 12, gap: 6 }}>
          <strong className="small">หน่วย:</strong>
          {["all", "1", "2", "3", "4", "5"].map((u) => (
            <button key={u} type="button" className={`btn btn-sm ${unit === u ? "btn-navy" : ""}`} onClick={() => setUnit(u)}>{u === "all" ? "ทุกหน่วย" : `หน่วยที่ ${u}`}</button>
          ))}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {POPULAR.map((c) => (
            <button key={c} type="button" className={`keyword-chip ${kw === c ? "active" : ""}`} onClick={() => setKw(c)}>#{c}</button>
          ))}
        </div>
      </PageHead>

      {sections.length === 0 && (
        <div className="editorial-panel empty">ไม่พบเนื้อหาที่ตรงกับคำว่า <strong>“{kw}”</strong> ลองเปลี่ยนคำค้นหาหรือเลือกจากป้ายคำสำคัญ</div>
      )}
      {sections.map(({ u, sec, plain }) => (
        <article key={`${u.id}-${sec.id || sec.title}`} className="unit-section-block">
          <div className="unit-section-header">
            <div>
              <span className="seal-badge seal-info">หน่วยที่ {u.id}: {u.title}</span>
              <Html as="h3" html={highlight(sec.title, kw)} style={{ marginTop: 6 }} />
            </div>
            <div className="row">
              <span className="seal-badge seal-warn num">{sec.badge}</span>
              <Link className="btn btn-primary btn-sm" to={`/units/${u.id}`}>เปิดอ่าน</Link>
            </div>
          </div>
          <Html as="p" className="muted" html={snippet(plain, kw)} />
        </article>
      ))}

      {questions.length > 0 && (
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>โจทย์วิเคราะห์ที่เกี่ยวข้องกับ “{kw}” ({questions.length} ข้อ)</h2>
          </div>
          {questions.slice(0, 12).map(({ u, q, no }) => (
            <div key={`${u.id}-${no}`} className="legal-box">
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="seal-badge seal-info">หน่วยที่ {u.id} · ข้อ {no}</span>
                <Link className="btn btn-sky btn-sm" to={`/units/${u.id}/pretest`}>ฝึกทำข้อสอบหน่วยที่ {u.id}</Link>
              </div>
              <Html as="p" html={`<strong>โจทย์:</strong> ${highlight(q.q, kw)}`} />
              {has(q.ans) && (
                <>
                  <Html as="p" style={{ marginTop: 4, color: "var(--green)" }} html={`<strong>คำตอบ (${LETTERS[q.ans]}):</strong> ${highlight(q.options[q.ans], kw)}`} />
                  <Html as="p" className="small muted" style={{ marginTop: 4 }} html={`<strong>หลักกฎหมาย:</strong> ${highlight(q.exp, kw)}`} />
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}

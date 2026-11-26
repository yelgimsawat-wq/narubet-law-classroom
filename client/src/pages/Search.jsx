import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { BilingualHtml, LETTERS_EN, UNIT_EN_META, useLang } from "../i18n.jsx";
import { LETTERS, PageHead, has } from "../ui.jsx";

const POPULAR_BILINGUAL = [
  ["ลำดับศักดิ์ของกฎหมาย", "Hierarchy of Laws"],
  ["พระราชกำหนด", "Emergency Decree"],
  ["ราชกิจจานุเบกษา", "Royal Gazette"],
  ["ผู้เยาว์", "Minors"],
  ["โมฆะ", "Void"],
  ["โมฆียะ", "Voidable"],
  ["สมรสเท่าเทียม", "Marriage Equality"],
  ["ทายาทโดยธรรม", "Statutory Heirs"],
  ["พินัยกรรม", "Wills"],
  ["อายุความ", "Prescription"],
  ["ป้องกันโดยชอบด้วยกฎหมาย", "Self-Defense"],
  ["เด็กอายุไม่เกิน 12 ปี", "Child Under 12"],
  ["ลักทรัพย์", "Theft"],
  ["ชิงทรัพย์", "Robbery"],
  ["ปล้นทรัพย์", "Gang-Robbery"],
  ["ความผิดลหุโทษ", "Petty Offense"],
  ["ภาษีเงินได้", "Income Tax"],
  ["สิทธิผู้บริโภค", "Consumer Rights"],
  ["PDPA", "PDPA"],
  ["ศาลแขวง", "Kwaeng Court"],
  ["อุทธรณ์", "Appeal"]
];

// Maps common English search queries to Thai legal keywords so searching in English finds matching Thai sections & quiz items
const EN_TO_TH_QUERY = [
  ["hierarchy", "ลำดับศักดิ์ของกฎหมาย"],
  ["emergency decree", "พระราชกำหนด"],
  ["royal gazette", "ราชกิจจานุเบกษา"],
  ["constitution", "รัฐธรรมนูญ"],
  ["minor", "ผู้เยาว์"],
  ["voidable", "โมฆียะ"],
  ["void", "โมฆะ"],
  ["marriage", "สมรส"],
  ["inheritance", "มรดก"],
  ["statutory heir", "ทายาทโดยธรรม"],
  ["heir", "ทายาท"],
  ["will", "พินัยกรรม"],
  ["prescription", "อายุความ"],
  ["self-defense", "ป้องกันโดยชอบด้วยกฎหมาย"],
  ["child under 12", "เด็กอายุไม่เกิน 12 ปี"],
  ["theft", "ลักทรัพย์"],
  ["snatching", "วิ่งราวทรัพย์"],
  ["robbery", "ชิงทรัพย์"],
  ["gang-robbery", "ปล้นทรัพย์"],
  ["extortion", "กรรโชก"],
  ["blackmail", "รีดเอาทรัพย์"],
  ["fraud", "ฉ้อโกง"],
  ["embezzlement", "ยักยอก"],
  ["petty offense", "ความผิดลหุโทษ"],
  ["income tax", "ภาษีเงินได้"],
  ["tax", "ภาษี"],
  ["consumer", "ผู้บริโภค"],
  ["personal data", "ข้อมูลส่วนบุคคล"],
  ["pdpa", "ข้อมูลส่วนบุคคล"],
  ["kwaeng court", "ศาลแขวง"],
  ["court", "ศาล"],
  ["appeal", "อุทธรณ์"],
  ["contract", "สัญญา"],
  ["property", "ทรัพย์"]
];

function resolveSearchTerms(kw) {
  const low = kw.toLowerCase().trim();
  if (!low) return [];
  const terms = [low];
  for (const [th, en] of POPULAR_BILINGUAL) {
    if (en.toLowerCase().includes(low) || low.includes(en.toLowerCase())) terms.push(th.toLowerCase());
  }
  for (const [en, th] of EN_TO_TH_QUERY) {
    if (low.includes(en)) terms.push(th.toLowerCase());
  }
  return Array.from(new Set(terms));
}

const strip = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const highlight = (text, kw) => {
  const safe = escapeHtml(String(text || ""));
  return kw ? safe.replace(new RegExp(`(${escapeRe(escapeHtml(kw))})`, "gi"), '<mark class="search-highlight">$1</mark>') : safe;
};
function snippet(plain, terms, kw, r = 140) {
  let i = -1;
  let matchedLen = kw.length;
  for (const t of terms) {
    const idx = plain.toLowerCase().indexOf(t);
    if (idx !== -1) {
      i = idx;
      matchedLen = t.length;
      break;
    }
  }
  if (i === -1) return highlight(plain.slice(0, r * 2), kw) + (plain.length > r * 2 ? "..." : "");
  const s = Math.max(0, i - r), e = Math.min(plain.length, i + matchedLen + r);
  return (s > 0 ? "..." : "") + highlight(plain.slice(s, e), terms[0]) + (e < plain.length ? "..." : "");
}

export default function Search() {
  const { content } = useAuth();
  const { lang, tx } = useLang();
  const [params, setParams] = useSearchParams();
  const kw = (params.get("q") || "").trim();
  const [input, setInput] = useState(kw);
  const [unit, setUnit] = useState("all");
  const setKw = (q) => (setInput(q), setParams(q ? { q } : {}));
  const activeLetters = lang === "en" ? LETTERS_EN : LETTERS;

  const { sections, questions, terms } = useMemo(() => {
    const terms = resolveSearchTerms(kw);
    const units = content.units.filter((u) => unit === "all" || String(u.id) === unit);
    const sections = units.flatMap((u) => {
      const meta = UNIT_EN_META[u.id];
      return u.sections
        .map((sec, idx) => {
          const secKey = sec.id || `u${u.id}-s${idx + 1}`;
          const secEn = meta?.sections?.[secKey];
          return { u, sec, secEn, meta, plain: strip(sec.content) };
        })
        .filter(({ u, sec, secEn, meta, plain }) => {
          if (!terms.length) return true;
          const haystack = `${u.title} ${u.subtitle} ${meta?.title || ""} ${meta?.subtitle || ""} ${sec.title} ${secEn?.title || ""} ${sec.badge} ${plain}`.toLowerCase();
          return terms.some((t) => haystack.includes(t));
        });
    });
    const questions = !terms.length
      ? []
      : units.flatMap((u) =>
          (content.quizzes[u.id] || [])
            .map((q, i) => ({ u, q, no: i + 1 }))
            .filter(({ q }) => {
              const haystack = `${q.q} ${q.options.join(" ")} ${q.exp || ""}`.toLowerCase();
              return terms.some((t) => haystack.includes(t));
            })
        );
    return { sections, questions, terms };
  }, [content, kw, unit]);

  return (
    <>
      <PageHead
        title={tx("ค้นหาคำสำคัญและหลักกฎหมาย", "Search Legal Keywords & Principles")}
        subtitle={tx(
          "ค้นหาคำศัพท์กฎหมาย หัวข้อบทเรียน มาตราสำคัญ และโจทย์วิเคราะห์จากทั้ง 5 หน่วย (รองรับทั้งภาษาไทยและภาษาอังกฤษ)",
          "Search legal terminology, lesson topics, key sections, and analytical quiz questions across all 5 units in Thai or English."
        )}
        actions={
          <>
            <span className="seal-badge seal-pass num">{tx(`พบเนื้อหา ${sections.length} หัวข้อ`, `${sections.length} Topics Found`)}</span>
            {kw && <span className="seal-badge seal-info num">{tx(`พบโจทย์ ${questions.length} ข้อ`, `${questions.length} Questions Found`)}</span>}
          </>
        }
      >
        <form className="row" style={{ marginBottom: 14 }} onSubmit={(e) => (e.preventDefault(), setKw(input.trim()))}>
          <input
            type="search"
            className="form-input"
            style={{ flex: 1, minWidth: 220 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tx("เช่น สมรสเท่าเทียม, โมฆียะ, มรดก, ลักทรัพย์, ภาษี, PDPA...", "e.g. Marriage Equality, Voidable, Inheritance, Theft, Tax, PDPA...")}
            aria-label={tx("คำค้นหา", "Search query")}
          />
          <button className="btn btn-primary">{tx("ค้นหา", "Search")}</button>
          {kw && <button type="button" className="btn" onClick={() => setKw("")}>{tx("ล้าง", "Clear")}</button>}
        </form>
        <div className="row" style={{ marginBottom: 12, gap: 6 }}>
          <strong className="small">{tx("หน่วย:", "Unit:")}</strong>
          {["all", "1", "2", "3", "4", "5"].map((u) => (
            <button key={u} type="button" className={`btn btn-sm ${unit === u ? "btn-navy" : ""}`} onClick={() => setUnit(u)}>
              {u === "all" ? tx("ทุกหน่วย", "All Units") : tx(`หน่วยที่ ${u}`, `Unit ${u}`)}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 6 }}>
          {POPULAR_BILINGUAL.map(([th, en]) => {
            const label = lang === "en" ? en : th;
            const active = kw === th || kw.toLowerCase() === en.toLowerCase();
            return (
              <button key={th} type="button" className={`keyword-chip ${active ? "active" : ""}`} onClick={() => setKw(lang === "en" ? en : th)}>
                #{label}
              </button>
            );
          })}
        </div>
      </PageHead>

      {sections.length === 0 && (
        <div className="editorial-panel empty">
          {tx("ไม่พบเนื้อหาที่ตรงกับคำว่า", "No content matching")} <strong>“{kw}”</strong>
        </div>
      )}
      {sections.map(({ u, sec, secEn, meta, plain }) => (
        <article key={`${u.id}-${sec.id || sec.title}`} className="unit-section-block">
          <div className="unit-section-header">
            <div>
              <span className="seal-badge seal-info">
                {tx(`หน่วยที่ ${u.id}: `, `Unit ${u.id}: `)}{lang === "en" && meta ? meta.title : u.title}
              </span>
              <BilingualHtml as="h3" html={highlight(lang === "en" && secEn ? secEn.title : sec.title, kw)} style={{ marginTop: 6 }} />
            </div>
            <div className="row">
              <span className="seal-badge seal-warn num">{lang === "en" && secEn ? secEn.badge : sec.badge}</span>
              <Link className="btn btn-primary btn-sm" to={`/units/${u.id}`}>{tx("เปิดอ่าน", "Read Unit")}</Link>
            </div>
          </div>
          <BilingualHtml as="p" className="muted" html={snippet(plain, terms, kw)} />
        </article>
      ))}

      {questions.length > 0 && (
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{tx(`โจทย์วิเคราะห์ที่เกี่ยวข้องกับ “${kw}” (${questions.length} ข้อ)`, `Analytical Questions matching “${kw}” (${questions.length})`)}</h2>
          </div>
          {questions.slice(0, 12).map(({ u, q, no }) => (
            <div key={`${u.id}-${no}`} className="legal-box">
              <div className="row between" style={{ marginBottom: 6 }}>
                <span className="seal-badge seal-info">{tx(`หน่วยที่ ${u.id} · ข้อ ${no}`, `Unit ${u.id} · Q${no}`)}</span>
                <Link className="btn btn-sky btn-sm" to={`/units/${u.id}/pretest`}>{tx(`ฝึกทำข้อสอบหน่วยที่ ${u.id}`, `Practice Unit ${u.id} Quiz`)}</Link>
              </div>
              <BilingualHtml as="p" html={`<strong>${tx("โจทย์", "Question")}:</strong> ${highlight(q.q, kw)}`} />
              {has(q.ans) && (
                <>
                  <BilingualHtml as="p" style={{ marginTop: 4, color: "var(--green)" }} html={`<strong>${tx("คำตอบ", "Answer")} (${activeLetters[q.ans]}):</strong> ${highlight(q.options[q.ans], kw)}`} />
                  <BilingualHtml as="p" className="small muted" style={{ marginTop: 4 }} html={`<strong>${tx("หลักกฎหมาย", "Legal Principle")}:</strong> ${highlight(q.exp, kw)}`} />
                </>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}

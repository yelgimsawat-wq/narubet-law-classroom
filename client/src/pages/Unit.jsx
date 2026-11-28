import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { BilingualHtml, LangToggle, translateDomNode, translateToEnglish, useLang, useLocalizedUnit } from "../i18n.jsx";
import { Html, Icon, has } from "../ui.jsx";
import { QuizRunner, shuffle } from "../Quiz.jsx";
import { UNIT1_YOUTUBE_VIDEOS, UNIT2_YOUTUBE_VIDEOS, UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS, UNIT3_YOUTUBE_VIDEOS, UNIT4_PDPA_EXTERNAL_DATA, complianceCard, getUnitExternalCasesHtml, getUnitInfographicSvg, renderInteractiveSimulator, updateSimulator } from "../legacy.js";

const TABS = ["content", "interactive", "media", "pretest", "posttest", "minigame"];

const UNIT1_VIDEO_FILTERS = [
  ["all", "ทั้งหมด (4 วิดีโอ)", "All (4 Videos)"],
  ["meaning-elements", "1. ความหมาย องค์ประกอบ & ความสำคัญ", "1. Definition, Elements & Importance"],
  ["sources-systems-hierarchy", "2. ที่มา ระบบ ประเภท & ลำดับศักดิ์", "2. Sources, Systems, Types & Hierarchy"],
  ["scope-interpretation", "3. ขอบเขตบังคับใช้ การตีความ & อุดช่องว่าง", "3. Scope, Interpretation & Gap-Filling"],
  ["legislative-process", "4. กระบวนการตรากฎหมายไทย", "4. Thai Legislative Process"]
];

function resolveUnit1SectionId(section) {
  if (section?.id && /^u1-s[1-4]$/.test(section.id)) return section.id;
  const t = section?.title || "";
  if (t.startsWith("1.") || t.includes("ความหมาย") || t.includes("Definition")) return "u1-s1";
  if (t.startsWith("2.") || t.includes("ที่มา") || t.includes("Sources")) return "u1-s2";
  if (t.startsWith("3.") || t.includes("ลำดับศักดิ์") || t.includes("ขอบเขต") || t.includes("Hierarchy")) return "u1-s3";
  if (t.startsWith("4.") || t.includes("กระบวนการตรา") || t.includes("วิวัฒนาการ") || t.includes("Legislative")) return "u1-s4";
  return "";
}

export function Unit1SectionVideos({ section }) {
  const secId = resolveUnit1SectionId(section);
  const videos = UNIT1_YOUTUBE_VIDEOS.filter((v) => v.sectionId === secId);
  if (!videos.length) return null;
  const multi = videos.length > 1;
  return (
    <div
      className="unit1-section-videos"
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: multi ? "repeat(auto-fit, minmax(310px, 1fr))" : "1fr",
        gap: 12
      }}
    >
      {videos.map((v) => (
        <Unit2VideoCard key={v.id} video={v} compact={multi} />
      ))}
    </div>
  );
}

export function Unit1YoutubeGallery() {
  const { lang, tx } = useLang();
  const [topic, setTopic] = useState("all");
  const videos = UNIT1_YOUTUBE_VIDEOS.filter((v) => topic === "all" || v.topicKey === topic);
  return (
    <div className="unit1-youtube-gallery" style={{ marginTop: 12 }}>
      <div className="legal-box" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--crimson-seal)" }}>
              {tx(
                "ชุดสื่อวิดีโอประกอบการเรียนรู้หน่วยที่ 1: ความรู้เบื้องต้นเกี่ยวกับกฎหมาย (ครบทั้ง 4 เรื่อง)",
                "Unit 1 Video Series: Introduction to Law (All 4 Topics)"
              )}
            </h4>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {tx("ช่องผู้จัดทำ", "Channel")}: <strong>Interesting Facts with Narubet (@Narubet0310)</strong> ·{" "}
              {tx("เลือกหัวข้อด้านล่างเพื่อรับชมวิดีโอแต่ละเรื่อง", "Select a topic tab below to filter videos")}
            </p>
          </div>
          <span className="seal-badge seal-pass">{tx("4 บทเรียนวิดีโอ YouTube", "4 YouTube Video Lessons")}</span>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }} role="tablist" aria-label={tx("หมวดหมู่วิดีโอความรู้เบื้องต้นเกี่ยวกับกฎหมาย", "Intro to Law Video Categories")}>
          {UNIT1_VIDEO_FILTERS.map(([key, thLabel, enLabel]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={topic === key}
              className={`btn btn-sm ${topic === key ? "btn-primary" : ""}`}
              onClick={() => setTopic(key)}
            >
              {lang === "en" ? enLabel : thLabel}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: videos.length > 1 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
          gap: 14
        }}
      >
        {videos.map((v) => (
          <Unit2VideoCard key={v.id} video={v} compact={videos.length > 1} />
        ))}
      </div>
    </div>
  );
}

const UNIT2_VIDEO_FILTERS = [
  ["all", "ทั้งหมด (5 วิดีโอ)", "All (5 Videos)"],
  ["person", "1. บุคคล (สถานะทางกฎหมาย)", "1. Persons (Legal Status)"],
  ["property", "2. ทรัพย์และทรัพย์สิน", "2. Things & Property"],
  ["juristic-act", "3. นิติกรรม (โมฆะ/โมฆียะ)", "3. Juristic Acts (Void/Voidable)"],
  ["contract", "4. สัญญาในชีวิตประจำวัน", "4. Everyday Contracts"],
  ["family-inheritance", "5. ครอบครัวและมรดก", "5. Family & Inheritance"]
];

function resolveUnit2SectionId(section) {
  if (section?.id && /^u2-s[1-4]$/.test(section.id)) return section.id;
  const t = section?.title || "";
  if (t.startsWith("1.") || t.includes("บุคคล") || t.includes("Persons")) return "u2-s1";
  if (t.startsWith("2.") || t.includes("ทรัพย์") || t.includes("นิติกรรม") || t.includes("Property")) return "u2-s2";
  if (t.startsWith("3.") || t.includes("เอกเทศสัญญา") || t.includes("Contracts")) return "u2-s3";
  if (t.startsWith("4.") || t.includes("ครอบครัว") || t.includes("มรดก") || t.includes("Family")) return "u2-s4";
  return "";
}

function Unit2VideoCard({ video, compact = false }) {
  const { tx } = useLang();
  return (
    <div className="legal-box" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10 }}>
      <div>
        <div className="row between" style={{ gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <span className="seal-badge seal-alert">{tx("สื่อวิดีโอ YouTube", "YouTube Video")}</span>
            <BilingualHtml as="span" className="seal-badge seal-info" html={video.topicBadge} />
          </div>
          <a className="btn btn-primary btn-sm" href={video.watchUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="play" size={14} /> {tx("เปิดดูบน YouTube ↗", "Watch on YouTube ↗")}
          </a>
        </div>
        <BilingualHtml as="h4" style={{ margin: "0 0 4px", color: "var(--crimson-seal)" }} html={video.title} />
        <p className="small muted" style={{ margin: 0 }}>
          {tx("ช่องผู้จัดทำ", "Channel")}: <strong>{video.channelName}</strong> · <BilingualHtml as="span" html={video.summary} />
        </p>
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: compact ? "100%" : 780,
          margin: "0 auto",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--line)",
          background: "#09090B"
        }}
      >
        <iframe
          src={video.embedUrl}
          title={video.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function Unit2SectionVideos({ section }) {
  const secId = resolveUnit2SectionId(section);
  const videos = UNIT2_YOUTUBE_VIDEOS.filter((v) => v.sectionId === secId);
  if (!videos.length) return null;
  const multi = videos.length > 1;
  return (
    <div
      className="unit2-section-videos"
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: multi ? "repeat(auto-fit, minmax(310px, 1fr))" : "1fr",
        gap: 12
      }}
    >
      {videos.map((v) => (
        <Unit2VideoCard key={v.id} video={v} compact={multi} />
      ))}
    </div>
  );
}

export function Unit2YoutubeGallery() {
  const { lang, tx } = useLang();
  const [topic, setTopic] = useState("all");
  const videos = UNIT2_YOUTUBE_VIDEOS.filter((v) => topic === "all" || v.topicKey === topic);
  return (
    <div className="unit2-youtube-gallery" style={{ marginTop: 12 }}>
      <div className="legal-box" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--crimson-seal)" }}>
              {tx(
                "ชุดสื่อวิดีโอประกอบการเรียนรู้หน่วยที่ 2: กฎหมายแพ่งที่ควรรู้ (ครบทั้ง 5 หัวข้อ)",
                "Unit 2 Video Series: Essential Civil Law (All 5 Topics)"
              )}
            </h4>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {tx("ช่องผู้จัดทำ", "Channel")}: <strong>Interesting Facts with Narubet (@Narubet0310)</strong> ·{" "}
              {tx("เลือกหัวข้อด้านล่างเพื่อรับชมวิดีโอแต่ละเรื่อง", "Select a topic tab below to filter videos")}
            </p>
          </div>
          <span className="seal-badge seal-pass">{tx("5 บทเรียนวิดีโอ YouTube", "5 YouTube Video Lessons")}</span>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }} role="tablist" aria-label={tx("หมวดหมู่วิดีโอกฎหมายแพ่ง", "Civil Law Video Categories")}>
          {UNIT2_VIDEO_FILTERS.map(([key, thLabel, enLabel]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={topic === key}
              className={`btn btn-sm ${topic === key ? "btn-primary" : ""}`}
              onClick={() => setTopic(key)}
            >
              {lang === "en" ? enLabel : thLabel}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: videos.length > 1 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
          gap: 14
        }}
      >
        {videos.map((v) => (
          <Unit2VideoCard key={v.id} video={v} compact={videos.length > 1} />
        ))}
      </div>
    </div>
  );
}

const UNIT3_VIDEO_FILTERS = [
  ["all", "ทั้งหมด (6 วิดีโอ)", "All (6 Videos)"],
  ["meaning", "1. ความหมาย & ลักษณะความผิด", "1. Definition & Nature of Offenses"],
  ["elements", "2. องค์ประกอบ & บุคคลในคดีอาญา", "2. Elements & Parties to Crime"],
  ["exemptions", "3. เหตุยกเว้น & ลดโทษ", "3. Justifications, Excuses & Mitigation"],
  ["property-crime", "4. ความผิดต่อทรัพย์", "4. Offenses Against Property"],
  ["life-body-sex", "5. ความผิดต่อชีวิต ร่างกาย & เพศ", "5. Life, Body & Sexual Offenses"],
  ["petty-termination", "6. ลหุโทษ & วิธีระงับคดี", "6. Petty Offenses & Case Termination"]
];

function resolveUnit3SectionId(section) {
  if (section?.id && /^u3-s[1-4]$/.test(section.id)) return section.id;
  const t = section?.title || "";
  if (t.startsWith("1.") || t.includes("โครงสร้างความรับผิด") || t.includes("Characteristics")) return "u3-s1";
  if (t.startsWith("2.") || t.includes("เหตุยกเว้น") || t.includes("Justifications")) return "u3-s2";
  if (t.startsWith("3.") || t.includes("ความผิดต่อทรัพย์") || t.includes("Property")) return "u3-s3";
  if (t.startsWith("4.") || t.includes("ลหุโทษ") || t.includes("Petty")) return "u3-s4";
  return "";
}

export function Unit3SectionVideos({ section }) {
  const secId = resolveUnit3SectionId(section);
  const videos = UNIT3_YOUTUBE_VIDEOS.filter((v) => v.sectionId === secId);
  if (!videos.length) return null;
  const multi = videos.length > 1;
  return (
    <div
      className="unit3-section-videos"
      style={{
        marginTop: 16,
        display: "grid",
        gridTemplateColumns: multi ? "repeat(auto-fit, minmax(310px, 1fr))" : "1fr",
        gap: 12
      }}
    >
      {videos.map((v) => (
        <Unit2VideoCard key={v.id} video={v} compact={multi} />
      ))}
    </div>
  );
}

export function Unit3YoutubeGallery() {
  const { lang, tx } = useLang();
  const [topic, setTopic] = useState("all");
  const videos = UNIT3_YOUTUBE_VIDEOS.filter((v) => topic === "all" || v.topicKey === topic);
  return (
    <div className="unit3-youtube-gallery" style={{ marginTop: 12 }}>
      <div className="legal-box" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--crimson-seal)" }}>
              {tx(
                "ชุดสื่อวิดีโอประกอบการเรียนรู้หน่วยที่ 3: กฎหมายอาญา (ครบทั้ง 6 เรื่อง)",
                "Unit 3 Video Series: Essential Criminal Law (All 6 Topics)"
              )}
            </h4>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {tx("ช่องผู้จัดทำ", "Channel")}: <strong>Interesting Facts with Narubet (@Narubet0310)</strong> ·{" "}
              {tx("เลือกหัวข้อด้านล่างเพื่อรับชมวิดีโอแต่ละเรื่อง", "Select a topic tab below to filter videos")}
            </p>
          </div>
          <span className="seal-badge seal-pass">{tx("6 บทเรียนวิดีโอ YouTube", "6 YouTube Video Lessons")}</span>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 8 }} role="tablist" aria-label={tx("หมวดหมู่วิดีโอกฎหมายอาญา", "Criminal Law Video Categories")}>
          {UNIT3_VIDEO_FILTERS.map(([key, thLabel, enLabel]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={topic === key}
              className={`btn btn-sm ${topic === key ? "btn-primary" : ""}`}
              onClick={() => setTopic(key)}
            >
              {lang === "en" ? enLabel : thLabel}
            </button>
          ))}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: videos.length > 1 ? "repeat(auto-fit, minmax(320px, 1fr))" : "1fr",
          gap: 14
        }}
      >
        {videos.map((v) => (
          <Unit2VideoCard key={v.id} video={v} compact={videos.length > 1} />
        ))}
      </div>
    </div>
  );
}

const PROPERTY_OFFENSE_FILTERS = [
  ["all", "ทั้งหมด (12 ภาพ)", "All (12 Infographics)"],
  ["taking", "แย่งการครอบครอง (ลัก·วิ่ง·ชิง·ปล้น)", "Taking Possession (Theft·Snatching·Robbery·Gang-Robbery)"],
  ["coercion", "ข่มขู่ / หลอกลวง (กรรโชก·รีด·ฉ้อโกง)", "Coercion / Deception (Extortion·Blackmail·Fraud)"],
  ["possession", "ครอบครองอยู่ก่อน / อื่นๆ (ยักยอก·รับของโจร·เสียทรัพย์·บุกรุก)", "Prior Possession / Others (Embezzlement·Stolen Goods·Mischief·Trespass)"]
];

export function PropertyOffensesExternalGallery() {
  const { lang, tx } = useLang();
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState(null);
  const [extMeta, setExtMeta] = useState({
    status: "loading",
    title: "อินโฟกราฟิกความผิดเกี่ยวกับทรัพย์ (ประมวลกฎหมายอาญา มาตรา 334–365)",
    updatedAt: null
  });

  useEffect(() => {
    let cancelled = false;
    fetch(UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.apiEndpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((post) => {
        if (cancelled) return;
        const rawTitle = post?.title?.rendered?.replace(/<[^>]*>/g, "") || extMeta.title;
        setExtMeta({
          status: "live",
          title: rawTitle,
          updatedAt: post?.modified ? new Date(post.modified).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : null
        });
      })
      .catch(() => {
        if (!cancelled) setExtMeta((m) => ({ ...m, status: "verified" }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.items.filter(
    (it) => cat === "all" || it.category === cat
  );

  return (
    <div className="property-offense-gallery" style={{ marginTop: 18 }}>
      <div className="legal-box" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--crimson-seal)" }}>
              {tx(
                `คลังภาพประกอบความผิดต่อทรัพย์จากแหล่งข้อมูลภายนอก (${extMeta.title})`,
                "External Infographic Gallery: Offenses Against Property (Criminal Code Sections 334–365)"
              )}
            </h4>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {tx("ดึงข้อมูลจาก", "Source:")} <strong>{UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.sourceName}</strong>
              {extMeta.updatedAt ? ` · ${tx("อัปเดตข้อมูลต้นทาง", "Updated")}: ${extMeta.updatedAt}` : ""}
            </p>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <span className="seal-badge seal-pass">
              {extMeta.status === "live"
                ? tx("เชื่อมต่อ API Justice Channel สำเร็จ", "Justice Channel API Connected")
                : tx("ข้อมูลภาพต้นฉบับ OJA ยืนยันแล้ว", "Verified OJA Infographics")}
            </span>
            <a className="btn btn-sm" href={UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.articleUrl} target="_blank" rel="noopener noreferrer">
              {tx("บทความต้นฉบับ ↗", "Original Article ↗")}
            </a>
            <a className="btn btn-sm" href={UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.ebookUrl} target="_blank" rel="noopener noreferrer">
              E-Book ↗
            </a>
            <a className="btn btn-sky btn-sm" href={UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.pdfUrl} target="_blank" rel="noopener noreferrer">
              {tx("ดาวน์โหลด PDF ↗", "Download PDF ↗")}
            </a>
          </div>
        </div>

        <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 10 }} role="tablist" aria-label={tx("หมวดหมู่ความผิดต่อทรัพย์", "Property Offense Categories")}>
          {PROPERTY_OFFENSE_FILTERS.map(([key, thLabel, enLabel]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={cat === key}
              className={`btn btn-sm ${cat === key ? "btn-primary" : ""}`}
              onClick={() => setCat(key)}
            >
              {lang === "en" ? enLabel : thLabel}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(245px, 1fr))", gap: 12 }}>
        {items.map((item) => (
          <div key={item.id} className="legal-box" style={{ padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div className="row between" style={{ gap: 6, marginBottom: 8 }}>
                <BilingualHtml as="span" className="seal-badge seal-info num" html={item.code} />
                <span className={`seal-badge ${item.compoundable ? "seal-pass" : "seal-alert"}`}>
                  {item.compoundable ? tx("ยอมความได้", "Compoundable") : tx("อาญาแผ่นดิน", "Non-Compoundable")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(item)}
                title={tx("คลิกเพื่อขยายดูภาพอินโฟกราฟิกขนาดใหญ่", "Click to zoom infographic")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#FFFFFF",
                  cursor: "zoom-in",
                  marginBottom: 8
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={`${item.title} (${item.code})`}
                  loading="lazy"
                  style={{ width: "100%", height: 190, objectFit: "contain", display: "block", background: "#FFFFFF" }}
                />
              </button>
              <BilingualHtml as="strong" style={{ display: "block", fontSize: "0.96rem", marginBottom: 4 }} html={item.title} />
              <BilingualHtml as="p" className="small" style={{ margin: 0, color: "var(--ink-2)" }} html={item.elements} />
            </div>
            <div className="small" style={{ borderTop: "1px dashed var(--line-strong)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span><strong>{tx("โทษ:", "Penalty:")}</strong> <BilingualHtml as="span" html={item.penalty} /></span>
              <div className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-sm" onClick={() => setSelected(item)}>{tx("ขยายภาพ", "Zoom")}</button>
                <a className="btn btn-sm" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{tx("ที่มา ↗", "Source ↗")}</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(9, 9, 11, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            className="editorial-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 860, width: "100%", maxHeight: "92vh", overflowY: "auto", margin: 0 }}
          >
            <div className="row between" style={{ marginBottom: 10, gap: 8 }}>
              <div>
                <BilingualHtml as="span" className="seal-badge seal-info num" style={{ marginRight: 6 }} html={selected.code} />
                <span className={`seal-badge ${selected.compoundable ? "seal-pass" : "seal-alert"}`}>
                  {selected.compoundable ? tx("ความผิดอันยอมความได้", "Compoundable Offense") : tx("ความผิดอาญาแผ่นดิน (ยอมความไม่ได้)", "Non-Compoundable Public Offense")}
                </span>
                <BilingualHtml as="h3" style={{ marginTop: 6, marginBottom: 0 }} html={selected.title} />
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}>✕ {tx("ปิดหน้าต่าง", "Close")}</button>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--line)", borderRadius: 10, padding: 10, textAlign: "center", marginBottom: 12 }}>
              <img
                src={selected.imageUrl}
                alt={selected.title}
                style={{ maxWidth: "100%", maxHeight: "62vh", objectFit: "contain", margin: "0 auto", display: "block" }}
              />
            </div>
            <div className="legal-box" style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px" }}><strong>{tx("องค์ประกอบความผิด:", "Elements of Offense:")}</strong> <BilingualHtml as="span" html={selected.elements} /></p>
              <p style={{ margin: 0 }}><strong>{tx("อัตราโทษตามกฎหมาย:", "Legal Penalty:")}</strong> <BilingualHtml as="span" html={selected.penalty} /></p>
            </div>
            <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className="small muted">{tx("แหล่งข้อมูลภาพ:", "Image Source:")} {UNIT3_PROPERTY_OFFENSE_INFOGRAPHICS.sourceName}</span>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn btn-sm" href={selected.imageUrl} target="_blank" rel="noopener noreferrer">{tx("เปิดไฟล์ภาพต้นฉบับ ↗", "Open Original Image ↗")}</a>
                <a className="btn btn-primary btn-sm" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{tx("อ่านบทความต้นทาง OJA ↗", "Read OJA Article ↗")}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const PDPA_FILTERS = [
  ["all", "ทั้งหมด (6 ภาพ)", "All (6 Infographics)"],
  ["overview", "หลักการ & ข้อมูลอ่อนไหว ม.26", "Core Principles & Sensitive Data (Sec. 26)"],
  ["practice", "ข้อควรระวังในชีวิตประจำวัน & โซเชียล", "Everyday & Social Media Precautions"],
  ["penalty", "บทลงโทษ & อายุความฟ้องคดี", "Penalties & Prescription Period"]
];

export function PdpaYoutubeVideoCard() {
  const { tx } = useLang();
  const yt = UNIT4_PDPA_EXTERNAL_DATA.youtubeVideo;
  if (!yt) return null;
  return (
    <div className="legal-box" style={{ marginBottom: 14 }}>
      <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <div>
          <div className="row" style={{ gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
            <span className="seal-badge seal-alert">{tx("สื่อวิดีโอ YouTube", "YouTube Video")}</span>
            <BilingualHtml as="span" className="seal-badge seal-info" html={yt.shortTitle} />
          </div>
          <BilingualHtml as="h4" style={{ margin: 0, color: "var(--crimson-seal)" }} html={yt.title} />
          <p className="small muted" style={{ margin: "4px 0 0" }}>
            {tx("ช่องผู้จัดทำ", "Channel")}: <strong>{yt.channelName}</strong> · <BilingualHtml as="span" html={yt.summary} />
          </p>
        </div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          <a className="btn btn-primary btn-sm" href={yt.watchUrl} target="_blank" rel="noopener noreferrer">
            <Icon name="play" size={14} /> {tx("เปิดดูบน YouTube ↗", "Watch on YouTube ↗")}
          </a>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 780,
          margin: "0 auto",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--line)",
          background: "#09090B"
        }}
      >
        <iframe
          src={yt.embedUrl}
          title={yt.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function PdpaExternalGallery({ showVideo = true }) {
  const { lang, tx } = useLang();
  const [cat, setCat] = useState("all");
  const [selected, setSelected] = useState(null);
  const [showRights, setShowRights] = useState(false);
  const [extMeta, setExtMeta] = useState({
    status: "loading",
    title: "พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ที่ประชาชนควรรู้",
    updatedAt: null
  });

  useEffect(() => {
    let cancelled = false;
    fetch(UNIT4_PDPA_EXTERNAL_DATA.apiEndpoint)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((post) => {
        if (cancelled) return;
        const rawTitle = post?.title?.rendered?.replace(/<[^>]*>/g, "") || extMeta.title;
        setExtMeta({
          status: "live",
          title: rawTitle,
          updatedAt: post?.modified
            ? new Date(post.modified).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" })
            : null
        });
      })
      .catch(() => {
        if (!cancelled) setExtMeta((m) => ({ ...m, status: "verified" }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = UNIT4_PDPA_EXTERNAL_DATA.items.filter(
    (it) => cat === "all" || it.category === cat
  );

  return (
    <div className="pdpa-external-gallery" style={{ marginTop: 18 }}>
      {showVideo && <PdpaYoutubeVideoCard />}
      <div className="legal-box" style={{ marginBottom: 14 }}>
        <div className="row between" style={{ gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div>
            <h4 style={{ margin: 0, color: "var(--crimson-seal)" }}>
              {tx(
                `คลังสื่ออินโฟกราฟิกกฎหมาย PDPA จากแหล่งข้อมูลภายนอก (${extMeta.title})`,
                "External PDPA Infographic Gallery (Personal Data Protection Act B.E. 2562)"
              )}
            </h4>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              {tx("ดึงข้อมูลจาก", "Source:")} <strong>{UNIT4_PDPA_EXTERNAL_DATA.sourceName}</strong>
              {extMeta.updatedAt ? ` · ${tx("อัปเดตข้อมูลต้นทาง", "Updated")}: ${extMeta.updatedAt}` : ""}
            </p>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
            <span className="seal-badge seal-pass">
              {extMeta.status === "live"
                ? tx("เชื่อมต่อ API Justice Channel สำเร็จ", "Justice Channel API Connected")
                : tx("ข้อมูลต้นฉบับ สคส. & OJA ยืนยันแล้ว", "Verified PDPC & OJA Data")}
            </span>
            <a className="btn btn-sm" href={UNIT4_PDPA_EXTERNAL_DATA.articleUrl} target="_blank" rel="noopener noreferrer">
              {tx("บทความ PDPA (OJA) ↗", "PDPA Article (OJA) ↗")}
            </a>
            <a className="btn btn-sm" href={UNIT4_PDPA_EXTERNAL_DATA.remedyUrl} target="_blank" rel="noopener noreferrer">
              {tx("อายุความ & บทลงโทษ ↗", "Prescription & Penalties ↗")}
            </a>
            <a className="btn btn-sky btn-sm" href={UNIT4_PDPA_EXTERNAL_DATA.pdpcUrl} target="_blank" rel="noopener noreferrer">
              {tx("เว็บไซต์ สคส. (PDPC) ↗", "PDPC Official Site ↗")}
            </a>
          </div>
        </div>

        <div className="row between" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <div className="row" style={{ gap: 6, flexWrap: "wrap" }} role="tablist" aria-label={tx("หมวดหมู่อินโฟกราฟิก PDPA", "PDPA Infographic Categories")}>
            {PDPA_FILTERS.map(([key, thLabel, enLabel]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={cat === key}
                className={`btn btn-sm ${cat === key ? "btn-primary" : ""}`}
                onClick={() => setCat(key)}
              >
                {lang === "en" ? enLabel : thLabel}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`btn btn-sm ${showRights ? "btn-navy" : ""}`}
            onClick={() => setShowRights((v) => !v)}
          >
            {showRights
              ? tx("ซ่อนตารางสิทธิ 8 ประการ ▲", "Hide 8 Data Subject Rights ▲")
              : tx("เปิดดูรายละเอียดสิทธิเจ้าของข้อมูล 8 ประการ ▼", "View 8 Data Subject Rights ▼")}
          </button>
        </div>

        {showRights && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 10, marginTop: 12 }}>
            {UNIT4_PDPA_EXTERNAL_DATA.rights.map((r) => (
              <div key={r.no} className="legal-box" style={{ margin: 0, background: "#FFFFFF" }}>
                <span className="seal-badge seal-info num" style={{ marginBottom: 4 }}>{tx(`สิทธิที่ ${r.no}`, `Right #${r.no}`)}</span>
                <BilingualHtml as="strong" style={{ display: "block", fontSize: "0.9rem", marginBottom: 4 }} html={r.title} />
                <BilingualHtml as="p" className="small" style={{ margin: 0, color: "var(--ink-2)" }} html={r.desc} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px, 1fr))", gap: 12 }}>
        {items.map((item) => (
          <div key={item.id} className="legal-box" style={{ padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div className="row between" style={{ gap: 6, marginBottom: 8 }}>
                <BilingualHtml as="span" className="seal-badge seal-info num" html={item.code} />
                <BilingualHtml as="span" className="seal-badge seal-alert" html={item.badge} />
              </div>
              <button
                type="button"
                onClick={() => setSelected(item)}
                title={tx("คลิกเพื่อขยายดูภาพอินโฟกราฟิก PDPA ขนาดใหญ่", "Click to zoom PDPA infographic")}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 0,
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#FFFFFF",
                  cursor: "zoom-in",
                  marginBottom: 8
                }}
              >
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: "100%", height: 195, objectFit: "contain", display: "block", background: "#FFFFFF" }}
                />
              </button>
              <BilingualHtml as="strong" style={{ display: "block", fontSize: "0.96rem", marginBottom: 4 }} html={item.title} />
              <BilingualHtml as="p" className="small" style={{ margin: 0, color: "var(--ink-2)" }} html={item.elements} />
            </div>
            <div className="small" style={{ borderTop: "1px dashed var(--line-strong)", paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span><strong>{tx("บทลงโทษ/อายุความ:", "Penalties/Prescription:")}</strong> <BilingualHtml as="span" html={item.penalty} /></span>
              <div className="row" style={{ gap: 6 }}>
                <button type="button" className="btn btn-sm" onClick={() => setSelected(item)}>{tx("ขยายภาพ", "Zoom")}</button>
                <a className="btn btn-sm" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{tx("ที่มา ↗", "Source ↗")}</a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(9, 9, 11, 0.78)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
        >
          <div
            className="editorial-panel"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 860, width: "100%", maxHeight: "92vh", overflowY: "auto", margin: 0 }}
          >
            <div className="row between" style={{ marginBottom: 10, gap: 8 }}>
              <div>
                <BilingualHtml as="span" className="seal-badge seal-info num" style={{ marginRight: 6 }} html={selected.code} />
                <BilingualHtml as="span" className="seal-badge seal-alert" html={selected.badge} />
                <BilingualHtml as="h3" style={{ marginTop: 6, marginBottom: 0 }} html={selected.title} />
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}>✕ {tx("ปิดหน้าต่าง", "Close")}</button>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid var(--line)", borderRadius: 10, padding: 10, textAlign: "center", marginBottom: 12 }}>
              <img
                src={selected.imageUrl}
                alt={selected.title}
                style={{ maxWidth: "100%", maxHeight: "62vh", objectFit: "contain", margin: "0 auto", display: "block" }}
              />
            </div>
            <div className="legal-box" style={{ marginBottom: 10 }}>
              <p style={{ margin: "0 0 6px" }}><strong>{tx("สาระสำคัญตามกฎหมาย:", "Key Legal Principles:")}</strong> <BilingualHtml as="span" html={selected.elements} /></p>
              <p style={{ margin: 0 }}><strong>{tx("บทลงโทษและอายุความ:", "Penalties & Prescription:")}</strong> <BilingualHtml as="span" html={selected.penalty} /></p>
            </div>
            <div className="row between" style={{ flexWrap: "wrap", gap: 8 }}>
              <span className="small muted">{tx("แหล่งข้อมูลภาพ:", "Image Source:")} {UNIT4_PDPA_EXTERNAL_DATA.sourceName}</span>
              <div className="row" style={{ gap: 8 }}>
                <a className="btn btn-sm" href={selected.imageUrl} target="_blank" rel="noopener noreferrer">{tx("เปิดไฟล์ภาพต้นฉบับ ↗", "Open Original Image ↗")}</a>
                <a className="btn btn-primary btn-sm" href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">{tx("อ่านบทความต้นทาง OJA ↗", "Read OJA Article ↗")}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function UnitVisuals({ unitId }) {
  const { tx } = useLang();
  return (
    <>
      <article className="unit-section-block">
        <div className="unit-section-header">
          <h3>{tx("แผนผังสรุป", "Summary Infographics & Diagrams")}</h3>
        </div>
        <BilingualHtml html={getUnitInfographicSvg(unitId)} />
      </article>
      <article className="unit-section-block">
        <div className="unit-section-header">
          <h3>{tx("กรณีศึกษาจากเรื่องจริง", "Real-World Legal Case Studies")}</h3>
        </div>
        <BilingualHtml html={getUnitExternalCasesHtml(unitId)} />
      </article>
    </>
  );
}

// The simulator markup + calculators come from the original site; they read/write the DOM by id.
function Simulator({ unitId }) {
  const { lang } = useLang();
  const ref = useRef(null);
  useEffect(() => {
    const baseRun = updateSimulator[unitId];
    const el = ref.current;
    if (!baseRun || !el) return;
    const run = () => {
      baseRun();
      if (lang === "en") translateDomNode(el);
    };
    run();
    el.addEventListener("input", run);
    el.addEventListener("change", run);
    return () => {
      el.removeEventListener("input", run);
      el.removeEventListener("change", run);
    };
  }, [unitId, lang]);
  return <div key={`${unitId}-${lang}`} ref={ref} dangerouslySetInnerHTML={{ __html: renderInteractiveSimulator(unitId) }} />;
}

function Media({ unit }) {
  const { lang, tx } = useLang();
  const [idx, setIdx] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  const stop = () => (window.speechSynthesis?.cancel(), setSpeaking(false));
  const go = (i) => (stop(), setIdx(i));
  const speak = async (slide) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const rawText = `${slide.heading}. ${slide.narration}`;
    const textToSpeak = lang === "en" ? await translateToEnglish(rawText) : rawText;
    const u = new SpeechSynthesisUtterance(textToSpeak);
    u.lang = lang === "en" ? "en-US" : "th-TH";
    u.onstart = () => setSpeaking(true);
    u.onend = u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  return (
    <>
      <UnitVisuals unitId={unit.id} />
      {Number(unit.id) === 1 && (
        <div className="unit-section-block">
          <div className="unit-section-header">
            <h3>{tx("ชุดสื่อวิดีโอ: ความรู้เบื้องต้นเกี่ยวกับกฎหมาย (ความหมาย · ระบบและลำดับศักดิ์ · ขอบเขตและการตีความ · กระบวนการตรากฎหมายไทย)", "Video Series: Introduction to Law (Definition · Systems & Hierarchy · Scope & Interpretation · Legislative Process)")}</h3>
            <span className="seal-badge seal-alert">YouTube · Interesting Facts with Narubet</span>
          </div>
          <Unit1YoutubeGallery />
        </div>
      )}
      {Number(unit.id) === 2 && (
        <div className="unit-section-block">
          <div className="unit-section-header">
            <h3>{tx("ชุดสื่อวิดีโอ: กฎหมายแพ่งที่ควรรู้ (บุคคล · ทรัพย์สิน · นิติกรรม · สัญญา · ครอบครัวและมรดก)", "Video Series: Essential Civil Law (Persons · Property · Juristic Acts · Contracts · Family & Inheritance)")}</h3>
            <span className="seal-badge seal-alert">YouTube · Interesting Facts with Narubet</span>
          </div>
          <Unit2YoutubeGallery />
        </div>
      )}
      {Number(unit.id) === 3 && (
        <>
          <div className="unit-section-block">
            <div className="unit-section-header">
              <h3>{tx("ชุดสื่อวิดีโอ: กฎหมายอาญาที่ควรรู้ (ลักษณะความผิด · องค์ประกอบ · เหตุยกเว้น/ลดโทษ · ความผิดต่อทรัพย์ · ชีวิต ร่างกาย เพศ · ลหุโทษและการระงับคดี)", "Video Series: Essential Criminal Law (Nature · Elements · Exemptions · Property · Life, Body & Sex · Petty Offenses)")}</h3>
              <span className="seal-badge seal-alert">YouTube · Interesting Facts with Narubet</span>
            </div>
            <Unit3YoutubeGallery />
          </div>
          <div className="unit-section-block">
            <div className="unit-section-header">
              <h3>{tx("สื่ออินโฟกราฟิกภายนอก: ความผิดเกี่ยวกับทรัพย์ (ป.อ. มาตรา 334–365)", "External Infographics: Offenses Against Property (Criminal Code Sec. 334–365)")}</h3>
              <span className="seal-badge seal-info">{tx("สำนักงานกิจการยุติธรรม (OJA)", "Office of Justice Affairs (OJA)")}</span>
            </div>
            <PropertyOffensesExternalGallery />
          </div>
        </>
      )}
      {Number(unit.id) === 4 && (
        <>
          <div className="unit-section-block">
            <div className="unit-section-header">
              <h3>{tx("สื่อวิดีโอ: PDPA น่ารู้ (PDPA ใกล้ตัวกว่าที่คิด — เคารพสิทธิ์ ข้อมูลของกันและกัน)", "Video Lesson: Essential PDPA (Personal Data Protection in Everyday Life)")}</h3>
              <span className="seal-badge seal-alert">YouTube · Interesting Facts with Narubet</span>
            </div>
            <PdpaYoutubeVideoCard />
          </div>
          <div className="unit-section-block">
            <div className="unit-section-header">
              <h3>{tx("สื่ออินโฟกราฟิกภายนอก: กฎหมายคุ้มครองข้อมูลส่วนบุคคล (พ.ร.บ. PDPA พ.ศ. 2562)", "External Infographics: Personal Data Protection Act B.E. 2562 (PDPA)")}</h3>
              <span className="seal-badge seal-info">{tx("สคส. (PDPC) & สำนักงานกิจการยุติธรรม (OJA)", "PDPC & Office of Justice Affairs (OJA)")}</span>
            </div>
            <PdpaExternalGallery showVideo={false} />
          </div>
        </>
      )}
      {(unit.externalResources || [])
        .filter((res) => {
          if (Number(unit.id) === 1 && UNIT1_YOUTUBE_VIDEOS.some((v) => res.embedUrl?.includes(v.id) || res.url?.includes(v.id))) {
            return false;
          }
          if (Number(unit.id) === 2 && UNIT2_YOUTUBE_VIDEOS.some((v) => res.embedUrl?.includes(v.id) || res.url?.includes(v.id))) {
            return false;
          }
          if (Number(unit.id) === 3 && UNIT3_YOUTUBE_VIDEOS.some((v) => res.embedUrl?.includes(v.id) || res.url?.includes(v.id))) {
            return false;
          }
          if (Number(unit.id) === 4 && (res.embedUrl?.includes("iu9D7HEnpKE") || res.url?.includes("iu9D7HEnpKE"))) {
            return false;
          }
          return true;
        })
        .map((res, rIdx) => {
        if (res.type === "video" && Array.isArray(res.slides) && res.slides.length) {
          const n = res.slides.length;
          const i = Math.min(n - 1, idx);
          const s = res.slides[i];
          return (
            <div key={rIdx} className="unit-section-block">
              <div className="unit-section-header">
                <BilingualHtml as="h3" html={res.title} />
                <BilingualHtml as="span" className="seal-badge seal-info num" html={res.duration} />
              </div>
              <p><BilingualHtml as="span" html={res.summary} /> <span className="muted">(<BilingualHtml as="span" html={res.source} />)</span></p>
              <div className="slide-card" style={{ marginTop: 12 }}>
                <div className="row between" style={{ marginBottom: 12 }}>
                  <BilingualHtml as="span" className="seal-badge seal-pass" html={s.step} />
                  <div className="row">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => (speaking ? stop() : speak(s))} aria-pressed={speaking} style={{ minWidth: 132 }}>
                      {speaking ? <><span className="eq" aria-hidden="true"><i /><i /><i /></span> {tx("กำลังบรรยาย", "Narrating")}</> : <><Icon name="play" size={14} /> {tx("ฟังเสียงบรรยาย", "Listen to Audio")}</>}
                    </button>
                    <button type="button" className="btn btn-sm" onClick={stop} disabled={!speaking}><Icon name="stop" size={14} /> {tx("หยุด", "Stop")}</button>
                  </div>
                </div>
                <BilingualHtml as="h4" key={i} className="tab-enter" style={{ color: "var(--primary)", marginBottom: 8 }} html={s.heading} />
                <ul style={{ marginLeft: "1.3rem", marginBottom: 12 }}>
                  {s.points.map((pt, k) => <BilingualHtml as="li" key={k} html={pt} style={{ marginBottom: 4 }} />)}
                </ul>
                <div className="legal-box small muted"><strong>{tx("บทบรรยาย:", "Transcript:")}</strong> “<BilingualHtml as="span" html={s.narration} />”</div>
                <div className="row between" style={{ marginTop: 12 }}>
                  <div className="row" style={{ gap: 6 }}>
                    {res.slides.map((sl, k) => (
                      <button key={k} type="button" className={`btn btn-sm ${k === i ? "btn-primary" : ""}`} onClick={() => go(k)}>{sl.step.split("·")[0].trim()}</button>
                    ))}
                  </div>
                  <div className="row">
                    <button type="button" className="btn btn-sm" onClick={() => go((i - 1 + n) % n)}>◀ {tx("ก่อนหน้า", "Prev")}</button>
                    <button type="button" className="btn btn-sky btn-sm" onClick={() => go((i + 1) % n)}>{tx("ถัดไป", "Next")} ▶</button>
                  </div>
                </div>
              </div>
              {res.url && <p style={{ marginTop: 12 }}><a className="btn btn-sm" href={res.url} target="_blank" rel="noopener noreferrer">{tx("ค้นคว้าเพิ่มเติมจากหน่วยงานภาครัฐ ↗", "Explore Official Government Source ↗")}</a></p>}
            </div>
          );
        }
        return (
          <div key={rIdx} className="unit-section-block">
            <div className="unit-section-header">
              <BilingualHtml as="h3" html={res.title} />
              <BilingualHtml as="span" className="seal-badge seal-info" html={res.source} />
            </div>
            <BilingualHtml as="p" html={res.summary} />
            {res.embedUrl && (
              <div style={{ position: "relative", width: "100%", maxWidth: 780, margin: "12px auto", aspectRatio: "16 / 9", borderRadius: 10, overflow: "hidden", border: "1px solid var(--line)", background: "#09090B" }}>
                <iframe
                  src={res.embedUrl}
                  title={res.title}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", border: 0, display: "block" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            )}
            {res.imageUrl && (
              <div style={{ margin: "12px 0", background: "#FFFFFF", border: "1px solid var(--line)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                <img src={res.imageUrl} alt={res.title} loading="lazy" style={{ maxWidth: "100%", maxHeight: 320, objectFit: "contain", margin: "0 auto" }} />
              </div>
            )}
            {res.url && <p style={{ marginTop: 10 }}><a className="btn btn-sm" href={res.url} target="_blank" rel="noopener noreferrer">{tx("เปิดแหล่งเรียนรู้ภายนอก ↗", "Open External Resource ↗")}</a></p>}
          </div>
        );
      })}
      <BilingualHtml html={complianceCard} />
    </>
  );
}

function UnitQuiz({ unit, mode }) {
  const { content, setProgress } = useAuth();
  const { tx } = useLang();
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
        <h2>
          {isPost
            ? tx(`แบบทดสอบหลังเรียน (Post-test) — หน่วยที่ ${unit.id}`, `Post-test Assessment — Unit ${unit.id}`)
            : tx(`แบบทดสอบก่อนเรียน (Pre-test) — หน่วยที่ ${unit.id}`, `Pre-test Assessment — Unit ${unit.id}`)}
        </h2>
        <p className="small muted">
          {tx(`${list.length} ข้อ · ตัวชี้วัด ${unit.indicators.join(", ")}`, `${list.length} Questions · Indicators: ${unit.indicators.join(", ")}`)}
        </p>
      </div>
      <QuizRunner
        items={list.map((q) => ({
          badge: (n, total) => (
            <span className={`seal-badge ${isPost ? "seal-alert" : "seal-info"}`}>
              {isPost ? tx("หลังเรียน", "Post-test") : tx("ก่อนเรียน", "Pre-test")} · {tx(`ข้อ ${n} / ${total}`, `Q ${n} / ${total}`)}
            </span>
          ),
          title: (n) => q.q.replace(/^\d+\.\s*/, `${n}. `),
          options: q.options
        }))}
        onSubmit={onSubmit}
        submitLabel={isPost ? tx("ส่งข้อสอบหลังเรียน", "Submit Post-test") : tx("ส่งข้อสอบก่อนเรียน", "Submit Pre-test")}
        explanationLabel={tx("คำอธิบายหลักกฎหมาย", "Legal Explanation")}
      />
    </>
  );
}

function HierarchyGame({ mg }) {
  const { setProgress } = useAuth();
  const { tx } = useLang();
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
        <BilingualHtml as="h2" html={mg.title} />
        <BilingualHtml as="span" className="seal-badge seal-alert" html={mg.badge} />
      </div>
      <BilingualHtml as="p" style={{ marginBottom: 16 }} html={mg.instructions} />
      {res && (
        <div className="form-ok" style={{ marginBottom: 14 }}>
          {tx("คะแนนมินิเกม:", "Minigame Score:")} <strong>{res.gameScore}%</strong> ({tx("บันทึกแล้ว", "Saved")})
        </div>
      )}

      <h3 style={{ marginBottom: 10 }}>{tx("ด่านที่ 1: เรียงลำดับศักดิ์ของกฎหมายไทย (สูงสุด → ต่ำสุด)", "Stage 1: Rank the Hierarchy of Thai Laws (Highest → Lowest)")}</h3>
      {order.map((name, i) => {
        const ok = res && res.key.order[i] === name;
        return (
          <div key={moved?.name === name ? `${name}-${moved.n}` : name} className={`order-item ${res ? (ok ? "ok" : "bad") : moved?.name === name ? "moved" : ""}`}>
            <div>
              <span className="seal-badge num">{tx(`ลำดับที่ ${i + 1}`, `Tier ${i + 1}`)}</span>{" "}
              <BilingualHtml as="strong" style={{ marginLeft: 6 }} html={name} />
              <BilingualHtml as="div" className="small muted" html={byName[name]?.desc} />
            </div>
            <div className="row" style={{ flexWrap: "nowrap", gap: 6 }}>
              <button type="button" className="btn btn-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label={tx("เลื่อนขึ้น", "Move Up")}><Icon name="up" size={15} /></button>
              <button type="button" className="btn btn-sm" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={tx("เลื่อนลง", "Move Down")}><Icon name="down" size={15} /></button>
            </div>
          </div>
        );
      })}

      <h3 style={{ margin: "22px 0 10px" }}>{tx("ด่านที่ 2: จับคู่ยุคสมัยวิวัฒนาการของกฎหมายไทย", "Stage 2: Match the Historical Eras of Thai Legal Evolution")}</h3>
      {mg.historyScenarios.map((sc, i) => (
        <div key={i} className="legal-box">
          <p><strong>{tx(`ภารกิจที่ ${i + 1}:`, `Task ${i + 1}:`)}</strong> <BilingualHtml as="span" html={sc.prompt} /></p>
          <div className="row" style={{ marginTop: 8, gap: 8 }}>
            {choices[i].map((c) => (
              <button key={c} type="button" className={`btn btn-sm ${hist[i] === c ? "btn-navy" : ""}`} onClick={() => (setHist({ ...hist, [i]: c }), setRes(null))}>
                <BilingualHtml as="span" html={c} />
              </button>
            ))}
          </div>
          {res && (
            <p className="small" style={{ marginTop: 8, color: hist[i] === res.key.hist[i] ? "var(--green)" : "var(--rose)" }}>
              <strong>{tx("เฉลย:", "Answer:")}</strong> <BilingualHtml as="span" html={res.key.hist[i]} />
            </p>
          )}
        </div>
      ))}
      {err && <p className="form-error" role="alert" style={{ marginTop: 12 }}>{err}</p>}
      <div className="row" style={{ marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={submit} disabled={busy} aria-busy={busy}>
          <span>{tx("ตรวจคำตอบและบันทึกคะแนน", "Check Answers & Save Score")}</span>
        </button>
      </div>
    </div>
  );
}

function Minigame({ unitId }) {
  const { content, setProgress } = useAuth();
  const { tx } = useLang();
  const mg = content.minigames[unitId];
  if (!mg) return <div className="editorial-panel empty">{tx("ยังไม่มีมินิเกมสำหรับหน่วยนี้", "No minigame available for this unit")}</div>;
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
        <BilingualHtml as="h2" html={mg.title} />
        <BilingualHtml as="p" className="muted" html={mg.instructions} />
      </div>
      <QuizRunner
        items={cases.map((c) => ({
          badge: <BilingualHtml as="span" className="seal-badge seal-alert" html={c.caseNo} />,
          title: (
            <>
              <p style={{ margin: "8px 0" }}><strong>{tx("ข้อเท็จจริง:", "Facts:")}</strong> <BilingualHtml as="span" html={c.scenario} /></p>
              <BilingualHtml as="p" html={c.question} style={{ fontWeight: 700 }} />
            </>
          ),
          options: c.options
        }))}
        letters={false}
        explanationLabel={tx("คำวินิจฉัย", "Legal Ruling")}
        submitLabel={tx("ส่งคำตัดสินและบันทึกคะแนนเกม", "Submit Ruling & Save Game Score")}
        scoreLabel={(r) => `${r.gameScore}%`}
        onSubmit={onSubmit}
      />
    </>
  );
}

export default function Unit() {
  const { id, tab = "content" } = useParams();
  const { user, content } = useAuth();
  const { tx } = useLang();
  const rawUnit = content.units.find((u) => String(u.id) === id);
  const unit = useLocalizedUnit(rawUnit);
  useEffect(() => {
    document.querySelector(".mode-tab.active")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [id, tab]);
  if (!unit || !TABS.includes(tab)) return <Navigate to="/" replace />;
  const up = user.progress.unitProgress[unit.id] || {};
  const score = (v, suffix) => (has(v) ? <span className="tab-score num">{v}{suffix}</span> : null);
  const labels = {
    content: <>{tx("เนื้อหา & อินโฟกราฟิก", "Content & Infographics")}</>,
    interactive: <>{tx("สื่ออินเตอร์แอคทีฟ", "Interactive Simulator")}</>,
    media: <>{tx("วิดีโอ & แหล่งเรียนรู้", "Videos & Resources")}</>,
    pretest: <>{tx("ก่อนเรียน", "Pre-test")} {score(up.preScore, "/20")}</>,
    posttest: <>{tx("หลังเรียน", "Post-test")} {score(up.postScore, "/20")}</>,
    minigame: <>{tx("มินิเกม", "Minigame")} {score(up.gameScore, "%")}</>
  };

  return (
    <>
      <section className="gazette-banner">
        <div className="gazette-banner-top">
          <div>
            <span className="small muted">{tx(`หน่วยที่ ${unit.id}`, `Unit ${unit.id}`)} · {unit.pages}</span>
            <h1 style={{ marginTop: 2 }}>{unit.title}</h1>
            <p className="muted" style={{ marginTop: 4 }}>{unit.subtitle}</p>
          </div>
          <div className="row no-print" style={{ gap: 8 }}>
            <LangToggle />
          </div>
        </div>
        {tab === "content" && (
          <>
            <BilingualHtml as="p" html={unit.summary} />
            <BilingualHtml as="blockquote" className="gazette-quote" html={unit.heroQuote} />
          </>
        )}
      </section>

      <nav className="unit-mode-bar" aria-label={tx("ส่วนของบทเรียน", "Unit Sections")}>
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
              <BilingualHtml className="legal-prose" html={sec.content} />
              {Number(unit.id) === 1 && <Unit1SectionVideos section={sec} />}
              {Number(unit.id) === 2 && <Unit2SectionVideos section={sec} />}
              {Number(unit.id) === 3 && <Unit3SectionVideos section={sec} />}
              {Number(unit.id) === 3 && (sec.id === "u3-s3" || sec.title?.includes("ความผิดต่อทรัพย์") || sec.title?.includes("Property")) && (
                <PropertyOffensesExternalGallery />
              )}
              {Number(unit.id) === 4 && (sec.id === "u4-s4" || sec.title?.includes("PDPA") || sec.title?.includes("คุ้มครองข้อมูลส่วนบุคคล")) && (
                <PdpaExternalGallery />
              )}
            </article>
          ))}
          {Number(unit.id) === 4 && !unit.sections.some((sec) => sec.id === "u4-s4" || sec.title?.includes("PDPA") || sec.title?.includes("คุ้มครองข้อมูลส่วนบุคคล")) && (
            <article className="unit-section-block">
              <div className="unit-section-header">
                <h3>{tx(UNIT4_PDPA_EXTERNAL_DATA.sectionTitle, "4. Essential Personal Data Protection Law (Personal Data Protection Act B.E. 2562 — PDPA)")}</h3>
                <span className="seal-badge seal-info num">{tx(UNIT4_PDPA_EXTERNAL_DATA.sectionBadge, "PDPA B.E. 2562 · PDPC")}</span>
              </div>
              <BilingualHtml className="legal-prose" html={UNIT4_PDPA_EXTERNAL_DATA.sectionHtml} />
              <PdpaExternalGallery />
            </article>
          )}
          <UnitVisuals unitId={unit.id} />
          <Simulator unitId={unit.id} />
          <div className="row between editorial-panel">
            <strong>{tx("อ่านจบแล้ว?", "Finished reading?")}</strong>
            <div className="row">
              <Link className="btn" to={`/units/${unit.id}/minigame`}><Icon name="game" /> {tx("เล่นมินิเกม", "Play Minigame")}</Link>
              <Link className="btn btn-primary" to={`/units/${unit.id}/posttest`}>{tx("ทำแบบทดสอบหลังเรียน", "Take Post-test")}</Link>
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

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Html } from "./ui.jsx";

const STORAGE_LANG_KEY = "narubet_law_lang";
const STORAGE_CACHE_KEY = "narubet_law_en_cache_v1";

export const DEVELOPERS_LIST = [
  { th: "นฤเบศ พานิชย์", en: "Narubet Panich" },
  { th: "อัฑฒกร กิมสวัสดิ์", en: "Atthakorn Kimsawat" },
  { th: "ชัชนก หนันเรือง", en: "Chatchanok Nanrueang" }
];

export const DEVELOPERS_TEXT_TH = `พัฒนาโดย นฤเบศ พานิชย์
                  อัฑฒกร กิมสวัสดิ์ 
                  ชัชนก หนันเรือง`;

export const DEVELOPERS_TEXT_EN = `Developed by Narubet Panich
             Atthakorn Kimsawat
             Chatchanok Nanrueang`;

// Curated English metadata for all 5 learning units
export const UNIT_EN_META = {
  1: {
    code: "SO33102 · Unit 1",
    title: "Introduction to Law",
    subtitle: "Definition, Elements, Legal Systems, Hierarchy of Laws, Scope of Enforcement, Interpretation, and Evolution of Thai Law",
    pages: "Pages 3 – 18",
    hours: "5 Hours (Weeks 1–3 · Lesson Plans 1–3)",
    heroQuote: "“Law establishes order and peace in society and the nation; it serves as the rule of conduct from birth until death.”",
    summary: "Study fundamental concepts and definitions of law, 5 core elements of law, world legal systems (Civil Law vs. Common Law), the 6-tier hierarchy of Thai laws, enforcement by time, place, and person, legal interpretation and gap-filling, enactment of Organic Acts, Acts, and Emergency Decrees, and the historical evolution of Thai law from the pre-Sukhothai era to King Rama V's legal reforms and the present.",
    sections: {
      "u1-s1": { title: "1. Definition, Elements, and Importance of Law", badge: "Pages 3–4" },
      "u1-s2": { title: "2. Sources of Law, World Legal Systems, and Classification of Law", badge: "Pages 4–5" },
      "u1-s3": { title: "3. Hierarchy of Thai Laws (6 Tiers) and Scope of Enforcement", badge: "Pages 5–8" },
      "u1-s4": { title: "4. Legal Interpretation, Gap-Filling, Legislative Process, and Evolution of Thai Law", badge: "Pages 8–18" }
    }
  },
  2: {
    code: "SO33102 · Unit 2",
    title: "Essential Civil and Commercial Law",
    subtitle: "Persons, Property, Juristic Acts, Specific Contracts, Obligations & Torts, Family & Inheritance, Civil Prescription",
    pages: "Pages 19 – 46",
    hours: "9 Hours (Weeks 3–7 · Lesson Plans 4–9)",
    heroQuote: "“Personality begins upon birth and survival as a live infant, and terminates upon death.” — Civil and Commercial Code, Section 15",
    summary: "Explore the 6 Books of the Civil and Commercial Code (CCC): Natural and Juristic Persons, commencement and termination of personality, disappearance, domicile, legal capacity of minors, incompetent and quasi-incompetent persons, Property Law (Real Rights vs. Personal Rights), validity of Juristic Acts (Void vs. Voidable), 10 Specific Contracts, Debt Collection Act, Family Law (Marriage Equality Act), Inheritance Law (6 classes of statutory heirs & 5 types of wills), and civil prescription periods.",
    sections: {
      "u2-s1": { title: "1. Structure of the CCC and Law of Persons (Personality, Disappearance, Domicile, Capacity)", badge: "Pages 19–27" },
      "u2-s2": { title: "2. Things, Property, Personal Rights vs. Real Rights, and Juristic Acts (Void vs. Voidable)", badge: "Pages 28–33" },
      "u2-s3": { title: "3. Specific Contracts, Obligations, and the Debt Collection Act", badge: "Pages 33–40" },
      "u2-s4": { title: "4. Family Law (Marriage Equality), Inheritance, Wills, and Civil Prescription", badge: "Pages 41–46" }
    }
  },
  3: {
    code: "SO33102 · Unit 3",
    title: "Essential Criminal Law",
    subtitle: "Nature of Criminal Law, 5 Criminal Penalties, 3-Tier Criminal Liability, Offenses Against Life, Body, Reputation, and Property",
    pages: "Pages 47 – 58",
    hours: "6 Hours (Weeks 8–10 · Lesson Plans 10–13)",
    heroQuote: "“A person shall be criminally punished only when they commit an act which the law in force at the time of commission provides to be an offense and defines a punishment therefor.” — Criminal Code, Section 2",
    summary: "Examine principles of the Criminal Code (strict interpretation, no retroactive punishment), 5 types of criminal penalties, 3-tier structure of criminal liability, principals, instigators, and supporters, age thresholds for children/youths (Sections 73–75 amended B.E. 2565), self-defense vs. necessity, offenses against life, body, and reputation, 11 property offenses (theft, snatching, robbery, gang-robbery, extortion, blackmail, fraud, embezzlement, receiving stolen property, mischief, trespass), petty offenses, and criminal prescription.",
    sections: {
      "u3-s1": { title: "1. Key Characteristics of Criminal Law and Structure of Criminal Liability", badge: "Pages 47–50" },
      "u3-s2": { title: "2. Justifications, Excuses, Age Thresholds for Children, and Mitigating Circumstances", badge: "Pages 50–52" },
      "u3-s3": { title: "3. 9 Offenses Against Property, Offenses Against Life, Body, and Sexual Offenses", badge: "Pages 52–56" },
      "u3-s4": { title: "4. Petty Offenses, Termination of Criminal Cases, and Criminal Prescription", badge: "Pages 56–58" }
    }
  },
  4: {
    code: "SO33102 · Unit 4",
    title: "Important Laws of the Country",
    subtitle: "2017 Constitution, Administrative Law, Taxation, Labor Law, Military Service Law, Consumer Protection, Child Protection, and PDPA",
    pages: "Pages 59 – 71",
    hours: "13 Hours (Weeks 11–17 · Lesson Plans 14–20)",
    heroQuote: "“Sovereign power belongs to the Thai people. The King as Head of State exercises such power through the National Assembly, the Council of Ministers, and the Courts in accordance with the Constitution.”",
    summary: "Study the Constitution of the Kingdom of Thailand B.E. 2560 (16 Chapters, 279 Sections), rights, liberties, and duties of the Thai people, Parliament (500 MPs, 200 Senators), the Cabinet, 4 Court systems, 5 Independent Organs, elections, Administrative Law, Taxation (progressive personal income tax & 2025 allowances, VAT 7%, stamp duty), Labor Law, Military Service (SorDor.9), Consumer Protection (5 consumer rights), Child Protection Act B.E. 2546, and Personal Data Protection Act B.E. 2562 (PDPA).",
    sections: {
      "u4-s1": { title: "1. 2017 Constitution, Political Institutions, Courts, Independent Organs, and Elections", badge: "Pages 59–64" },
      "u4-s2": { title: "2. Administrative Law and Taxation Law (Progressive Tax Brackets & 2025 Allowances)", badge: "Pages 64–67" },
      "u4-s3": { title: "3. Labor Law, Military Service Law, Consumer Protection Law, and Child Protection Law", badge: "Pages 68–71" },
      "u4-s4": { title: "4. Essential Personal Data Protection Law (Personal Data Protection Act B.E. 2562 — PDPA)", badge: "PDPA B.E. 2562 · PDPC" }
    }
  },
  5: {
    code: "SO33102 · Unit 5",
    title: "The Justice Process and Law Enforcement Challenges",
    subtitle: "Criminal Justice Process, Civil Justice Process, Court Jurisdiction & Claim Amounts, Law Enforcement Issues & Solutions",
    pages: "Pages 72 – 80",
    hours: "7 Hours (Weeks 17–20 · Lesson Plans 21–24)",
    heroQuote: "“Justice delayed is justice denied — Understanding judicial procedures empowers citizens to protect their rights fairly.”",
    summary: "Compare the Criminal Justice Process (injured person vs. public prosecutor under CPC Section 28, police investigation, preliminary hearing, bail, trial, judgment, execution) and the Civil Justice Process (jurisdiction of Kwaeng Courts vs. Provincial/Civil Courts at the 300,000 THB threshold, court fees, fact-appeal threshold > 50,000 THB, permission system for Supreme Court appeals, 10-year enforcement period), along with law enforcement challenges and modern reforms.",
    sections: {
      "u5-s1": { title: "1. The Criminal Justice Process (Pre-trial, Trial, and Post-trial Stages)", badge: "Pages 72–76" },
      "u5-s2": { title: "2. The Civil Justice Process, Court Jurisdiction, Court Fees, and Appeals", badge: "Pages 76–78" },
      "u5-s3": { title: "3. Law Enforcement Challenges in Thai Society and Guidelines for Reform", badge: "Pages 78–80" }
    }
  }
};

export const UNIT_SHORT_EN = ["Intro to Law", "Civil Law", "Criminal Law", "Key National Laws", "Justice Process"];
export const LETTERS_EN = ["A", "B", "C", "D"];

// Pre-normalize Thai legal abbreviations before machine translation so they translate accurately
const PRE_LEGAL_GLOSSARY = [
  [/ป\.พ\.พ\./g, "ประมวลกฎหมายแพ่งและพาณิชย์ (CCC)"],
  [/ป\.อ\./g, "ประมวลกฎหมายอาญา (Criminal Code)"],
  [/ป\.วิ\.พ\./g, "ประมวลกฎหมายวิธีพิจารณาความแพ่ง (CPC)"],
  [/ป\.วิ\.อ\./g, "ประมวลกฎหมายวิธีพิจารณาความอาญา (CrPC)"],
  [/พ\.ร\.ป\./g, "พระราชบัญญัติประกอบรัฐธรรมนูญ (Organic Act)"],
  [/พ\.ร\.บ\./g, "พระราชบัญญัติ (Act)"],
  [/พ\.ร\.ก\./g, "พระราชกำหนด (Emergency Decree)"],
  [/พ\.ร\.ฎ\./g, "พระราชกฤษฎีกา (Royal Decree)"],
  [/รธน\./g, "รัฐธรรมนูญ (Constitution)"],
  [/ครม\./g, "คณะรัฐมนตรี (Cabinet)"],
  [/ส\.ส\./g, "สมาชิกสภาผู้แทนราษฎร (MPs)"],
  [/ส\.ว\./g, "สมาชิกวุฒิสภา (Senators)"],
  [/สคบ\./g, "สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (OCPB)"],
  [/สคส\./g, "สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (PDPC)"],
  [/กกต\./g, "คณะกรรมการการเลือกตั้ง (ECT)"],
  [/ป\.ป\.ช\./g, "คณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ (NACC)"],
  [/คตง\./g, "คณะกรรมการตรวจเงินแผ่นดิน (SAC)"],
  [/กสม\./g, "คณะกรรมการสิทธิมนุษยชนแห่งชาติ (NHRC)"],
  [/สด\.9/g, "ใบสำคัญทหารกองเกิน (SorDor.9)"],
  [/ม\.(\d+)/g, "Section $1"],
  [/มาตรา\s*(\d+)/g, "Section $1"]
];

// Load translation cache from localStorage
const memCache = new Map();
try {
  const raw = localStorage.getItem(STORAGE_CACHE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed)) memCache.set(k, v);
  }
} catch {}

let saveTimer = null;
function scheduleSaveCache() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      // Keep up to 1500 entries in localStorage
      const entries = Array.from(memCache.entries()).slice(-1500);
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {}
  }, 600);
}

const inflight = new Map();

function normalizeThaiLegalForTranslate(str) {
  let out = String(str || "");
  for (const [re, rep] of PRE_LEGAL_GLOSSARY) out = out.replace(re, rep);
  return out;
}

function offlineFallbackTranslate(str) {
  let out = normalizeThaiLegalForTranslate(str);
  const dict = [
    ["รัฐธรรมนูญแห่งราชอาณาจักรไทย", "Constitution of the Kingdom of Thailand"],
    ["รัฐธรรมนูญ", "Constitution"],
    ["ประมวลกฎหมายแพ่งและพาณิชย์", "Civil and Commercial Code"],
    ["ประมวลกฎหมายอาญา", "Criminal Code"],
    ["พระราชบัญญัติประกอบรัฐธรรมนูญ", "Organic Act"],
    ["พระราชบัญญัติ", "Act"],
    ["พระราชกำหนด", "Emergency Decree"],
    ["พระราชกฤษฎีกา", "Royal Decree"],
    ["กฎกระทรวง", "Ministerial Regulation"],
    ["ประกาศกระทรวง", "Ministerial Notification"],
    ["ข้อบัญญัติท้องถิ่น", "Local Ordinance"],
    ["เทศบัญญัติ", "Municipal Ordinance"],
    ["ข้อบัญญัติเมืองพัทยา", "Pattaya City Ordinance"],
    ["ราชกิจจานุเบกษา", "Royal Gazette"],
    ["ผู้เยาว์", "Minor"],
    ["คนไร้ความสามารถ", "Incompetent Person"],
    ["คนเสมือนไร้ความสามารถ", "Quasi-Incompetent Person"],
    ["ผู้แทนโดยชอบธรรม", "Legal Representative"],
    ["ผู้อนุบาล", "Guardian"],
    ["ผู้พิทักษ์", "Curator"],
    ["โมฆะกรรม", "Void Juristic Act"],
    ["โมฆียะกรรม", "Voidable Juristic Act"],
    ["โมฆะ", "Void"],
    ["โมฆียะ", "Voidable"],
    ["อสังหาริมทรัพย์", "Immovable Property"],
    ["สังหาริมทรัพย์", "Movable Property"],
    ["ทรัพยสิทธิ", "Real Right"],
    ["บุคคลสิทธิ", "Personal Right"],
    ["ทายาทโดยธรรม", "Statutory Heir"],
    ["พินัยกรรม", "Will / Testament"],
    ["สินสมรส", "Marital Property"],
    ["สินส่วนตัว", "Personal Property"],
    ["สมรสเท่าเทียม", "Marriage Equality"],
    ["ลักทรัพย์", "Theft"],
    ["วิ่งราวทรัพย์", "Snatching"],
    ["ชิงทรัพย์", "Robbery"],
    ["ปล้นทรัพย์", "Gang-Robbery"],
    ["กรรโชกทรัพย์", "Extortion"],
    ["รีดเอาทรัพย์", "Blackmail"],
    ["ฉ้อโกง", "Fraud"],
    ["ยักยอกทรัพย์", "Embezzlement"],
    ["รับของโจร", "Receiving Stolen Property"],
    ["ทำให้เสียทรัพย์", "Mischief"],
    ["บุกรุก", "Trespass"],
    ["ความผิดลหุโทษ", "Petty Offense"],
    ["ความผิดอันยอมความได้", "Compoundable Offense"],
    ["ความผิดอาญาแผ่นดิน", "Non-Compoundable Public Offense"],
    ["ป้องกันโดยชอบด้วยกฎหมาย", "Lawful Self-Defense"],
    ["อายุความ", "Prescription Period"],
    ["ข้อมูลส่วนบุคคลที่มีความอ่อนไหว", "Sensitive Personal Data"],
    ["ข้อมูลส่วนบุคคล", "Personal Data"],
    ["เจ้าของข้อมูลส่วนบุคคล", "Data Subject"],
    ["ผู้ควบคุมข้อมูลส่วนบุคคล", "Data Controller"],
    ["ผู้ประมวลผลข้อมูลส่วนบุคคล", "Data Processor"],
    ["ศาลยุติธรรม", "Court of Justice"],
    ["ศาลปกครอง", "Administrative Court"],
    ["ศาลรัฐธรรมนูญ", "Constitutional Court"],
    ["ศาลทหาร", "Military Court"],
    ["ศาลแขวง", "Kwaeng (Municipal) Court"],
    ["ศาลจังหวัด", "Provincial Court"],
    ["พนักงานอัยการ", "Public Prosecutor"],
    ["ผู้เสียหาย", "Injured Person"],
    ["ถูกทุกข้อ", "All of the above"]
  ];
  for (const [th, en] of dict) out = out.replaceAll(th, en);
  return out;
}

export async function translateToEnglish(text) {
  const src = String(text || "").trim();
  if (!src) return "";
  // Skip if already mostly ASCII/English
  if (!/[\u0E00-\u0E7F]/.test(src)) return src;
  if (memCache.has(src)) return memCache.get(src);
  if (inflight.has(src)) return inflight.get(src);

  const promise = (async () => {
    try {
      const prepared = normalizeThaiLegalForTranslate(src);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t&q=${encodeURIComponent(prepared)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const translated = Array.isArray(data?.[0])
        ? data[0].map((part) => part?.[0] || "").join("")
        : offlineFallbackTranslate(src);
      const clean = translated
        // Fix any spacing around HTML tags if present
        .replace(/<\s*\/\s*([a-zA-Z0-9]+)\s*>/g, "</$1>")
        .replace(/<\s*([a-zA-Z0-9]+)(\s[^>]*)?>/g, "<$1$2>");
      memCache.set(src, clean);
      scheduleSaveCache();
      return clean;
    } catch {
      const fallback = offlineFallbackTranslate(src);
      memCache.set(src, fallback);
      return fallback;
    } finally {
      inflight.delete(src);
    }
  })();

  inflight.set(src, promise);
  return promise;
}

// Translates an array of strings in batches using a delimiter so 20 quiz questions + 80 options translate in 1-2 requests!
const SEP = "\n[[[___SEP___]]]\n";
export async function translateBatchToEnglish(strings) {
  const list = strings.map((s) => String(s ?? ""));
  const out = [...list];
  const todoIdx = [];
  for (let i = 0; i < list.length; i++) {
    const s = list[i].trim();
    if (!s || !/[\u0E00-\u0E7F]/.test(s)) continue;
    if (memCache.has(s)) {
      out[i] = memCache.get(s);
    } else {
      todoIdx.push(i);
    }
  }
  if (!todoIdx.length) return out;

  // Group into chunks of ~3200 chars per request
  const chunks = [];
  let cur = [];
  let curLen = 0;
  for (const idx of todoIdx) {
    const len = list[idx].length;
    if (cur.length && curLen + len > 3200) {
      chunks.push(cur);
      cur = [];
      curLen = 0;
    }
    cur.push(idx);
    curLen += len + SEP.length;
  }
  if (cur.length) chunks.push(cur);

  await Promise.all(
    chunks.map(async (idxs) => {
      if (idxs.length === 1) {
        out[idxs[0]] = await translateToEnglish(list[idxs[0]]);
        return;
      }
      const joined = idxs.map((i) => normalizeThaiLegalForTranslate(list[i].trim())).join(SEP);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t&q=${encodeURIComponent(joined)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const full = Array.isArray(data?.[0]) ? data[0].map((p) => p?.[0] || "").join("") : "";
        const parts = full.split(/\s*\[\[\[\s*___SEP___\s*\]\]\]\s*/);
        if (parts.length === idxs.length) {
          idxs.forEach((origIdx, k) => {
            const clean = parts[k].trim();
            memCache.set(list[origIdx].trim(), clean);
            out[origIdx] = clean;
          });
          scheduleSaveCache();
          return;
        }
      } catch {}
      // Fallback to individual translation if split count didn't match
      await Promise.all(
        idxs.map(async (origIdx) => {
          out[origIdx] = await translateToEnglish(list[origIdx]);
        })
      );
    })
  );

  return out;
}

const LangCtx = createContext({
  lang: "th",
  setLang: () => {},
  toggleLang: () => {},
  tx: (th) => th
});

export const useLang = () => useContext(LangCtx);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_LANG_KEY) === "en" ? "en" : "th";
    } catch {
      return "th";
    }
  });

  const setLang = useCallback((next) => {
    const v = next === "en" ? "en" : "th";
    setLangState(v);
    document.documentElement.lang = v;
    try {
      localStorage.setItem(STORAGE_LANG_KEY, v);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(lang === "en" ? "th" : "en");
  }, [lang, setLang]);

  const tx = useCallback((th, en) => (lang === "en" ? (en ?? th) : th), [lang]);

  const value = useMemo(() => ({ lang, setLang, toggleLang, tx }), [lang, setLang, toggleLang, tx]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function LangToggle({ className = "" }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`lang-toggle ${className}`}
      role="group"
      aria-label="เลือกภาษา / Language switcher"
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "var(--surface-2)",
        border: "1px solid var(--line-strong)",
        borderRadius: 999,
        padding: 2,
        gap: 2
      }}
    >
      <button
        type="button"
        onClick={() => setLang("th")}
        aria-pressed={lang === "th"}
        className={`btn btn-sm ${lang === "th" ? "btn-primary" : "btn-ghost"}`}
        style={{ padding: "3px 10px", fontSize: "0.78rem", minHeight: 26, border: 0 }}
        title="ภาษาไทย (Thai)"
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`btn btn-sm ${lang === "en" ? "btn-primary" : "btn-ghost"}`}
        style={{ padding: "3px 10px", fontSize: "0.78rem", minHeight: 26, border: 0 }}
        title="ภาษาอังกฤษ (English)"
      >
        EN
      </button>
    </div>
  );
}

export function DeveloperCredits({ className = "", style = {} }) {
  const { lang } = useLang();
  return (
    <div
      className={`developer-credits ${className}`}
      style={{
        display: "inline-grid",
        gridTemplateColumns: "auto auto",
        columnGap: "0.45em",
        rowGap: 2,
        textAlign: "left",
        lineHeight: 1.5,
        fontSize: "0.85rem",
        ...style
      }}
    >
      <span>{lang === "en" ? "Developed by" : "พัฒนาโดย"}</span>
      <strong>{lang === "en" ? "Narubet Panich" : "นฤเบศ พานิชย์"}</strong>
      <span aria-hidden="true" />
      <strong>{lang === "en" ? "Atthakorn Kimsawat" : "อัฑฒกร กิมสวัสดิ์"}</strong>
      <span aria-hidden="true" />
      <strong>{lang === "en" ? "Chatchanok Nanrueang" : "ชัชนก หนันเรือง"}</strong>
    </div>
  );
}

// Translates a single HTML string when lang === 'en' by translating text nodes while preserving HTML structure
async function translateHtmlBlock(html) {
  const raw = String(html || "");
  if (!raw.trim() || !/[\u0E00-\u0E7F]/.test(raw)) return raw;
  if (memCache.has(raw)) return memCache.get(raw);

  // Parse DOM nodes and batch translate all text nodes containing Thai characters
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
    const root = doc.body.firstElementChild;
    const textNodes = [];
    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (/[\u0E00-\u0E7F]/.test(node.nodeValue || "")) {
        textNodes.push(node);
      }
    }
    if (!textNodes.length) return raw;
    const originals = textNodes.map((n) => n.nodeValue);
    const translated = await translateBatchToEnglish(originals);
    textNodes.forEach((n, i) => {
      const lead = originals[i].match(/^\s*/)?.[0] || "";
      const trail = originals[i].match(/\s*$/)?.[0] || "";
      n.nodeValue = `${lead}${translated[i].trim()}${trail}`;
    });
    const out = root.innerHTML;
    memCache.set(raw, out);
    scheduleSaveCache();
    return out;
  } catch {
    return translateToEnglish(raw);
  }
}

export async function translateDomNode(root) {
  if (!root) return;
  const textNodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (/[\u0E00-\u0E7F]/.test(node.nodeValue || "")) {
      textNodes.push(node);
    }
  }
  if (!textNodes.length) return;
  const originals = textNodes.map((n) => n.nodeValue);
  const translated = await translateBatchToEnglish(originals);
  textNodes.forEach((n, i) => {
    const lead = originals[i].match(/^\s*/)?.[0] || "";
    const trail = originals[i].match(/\s*$/)?.[0] || "";
    n.nodeValue = `${lead}${translated[i].trim()}${trail}`;
  });
}

export function BilingualHtml({ html, enHtml, as = "div", ...props }) {
  const { lang } = useLang();
  const [translated, setTranslated] = useState(() => (enHtml ? enHtml : memCache.get(String(html || "")) || null));

  useEffect(() => {
    if (lang !== "en") return;
    if (enHtml) {
      setTranslated(enHtml);
      return;
    }
    const raw = String(html || "");
    if (!raw.trim()) {
      setTranslated("");
      return;
    }
    if (memCache.has(raw)) {
      setTranslated(memCache.get(raw));
      return;
    }
    let cancelled = false;
    translateHtmlBlock(raw).then((res) => {
      if (!cancelled) setTranslated(res);
    });
    return () => {
      cancelled = true;
    };
  }, [lang, html, enHtml]);

  const activeHtml = lang === "en" ? (enHtml ?? translated ?? html) : html;
  return <Html as={as} html={activeHtml} {...props} />;
}

export function useTranslatedStrings(strings) {
  const { lang } = useLang();
  const key = useMemo(() => JSON.stringify(strings || []), [strings]);
  const [translated, setTranslated] = useState(null);

  useEffect(() => {
    if (lang !== "en" || !Array.isArray(strings) || !strings.length) return;
    let cancelled = false;
    translateBatchToEnglish(strings).then((res) => {
      if (!cancelled) setTranslated(res);
    });
    return () => {
      cancelled = true;
    };
  }, [lang, key]);

  return lang === "en" && translated && translated.length === (strings || []).length ? translated : strings;
}

// Hook that returns a unit object localized to the active language
export function useLocalizedUnit(unit) {
  const { lang } = useLang();
  const meta = unit ? UNIT_EN_META[unit.id] : null;
  if (!unit || lang !== "en" || !meta) return unit;
  return {
    ...unit,
    code: meta.code || unit.code,
    title: meta.title || unit.title,
    subtitle: meta.subtitle || unit.subtitle,
    pages: meta.pages || unit.pages,
    hours: meta.hours || unit.hours,
    heroQuote: meta.heroQuote || unit.heroQuote,
    summary: meta.summary || unit.summary,
    sections: (unit.sections || []).map((sec, idx) => {
      const secKey = sec.id || `u${unit.id}-s${idx + 1}`;
      const secEn = meta.sections?.[secKey];
      return {
        ...sec,
        title: secEn?.title || sec.title,
        badge: secEn?.badge || sec.badge
      };
    })
  };
}

import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BilingualHtml, useLang } from "../../i18n.jsx";
import { ErrorState, Icon, PageHead, PageSkeleton, useToast } from "../../ui.jsx";
import { Field, HtmlField, JsonFallback, LinesField, ListEditor, OptionsEditor, SaveBar, SelectField, cleanLines, useContentDoc } from "./editors.jsx";

const TABS = [
  ["units", "บทเรียน", "Learning Units"],
  ["minigames", "มินิเกม", "Minigames"],
  ["syllabus", "แผนการสอน", "Syllabus Plans"],
  ["bibliography", "บรรณานุกรม", "Bibliography"]
];

function UnitPicker({ units, value, onChange }) {
  const { tx } = useLang();
  return (
    <div className="row" style={{ gap: 6 }} role="group" aria-label={tx("เลือกหน่วย", "Select Unit")}>
      {units.map((u, i) => (
        <button key={u.id ?? i} type="button" className={`btn btn-sm ${value === i ? "btn-navy" : ""}`} onClick={() => onChange(i)} aria-pressed={value === i}>
          {tx(`หน่วยที่ ${u.id ?? u.unitId ?? i + 1}`, `Unit ${u.id ?? u.unitId ?? i + 1}`)}
        </button>
      ))}
    </div>
  );
}

function DocShell({ doc, children, toolbar, normalize, toast }) {
  const { tx } = useLang();
  if (doc.error) return <ErrorState message={doc.error} onRetry={doc.load} />;
  if (!doc.data) return <PageSkeleton rows={5} />;
  return (
    <>
      <div className="editor-toolbar">
        {toolbar}
        <span className="small muted">
          {tx("แก้ไขล่าสุด", "Last updated")} {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "–"}
        </span>
      </div>
      {children}
      <JsonFallback doc={doc} />
      <SaveBar doc={doc} normalize={normalize} toast={toast} />
    </>
  );
}

const fail = (msg) => {
  throw new Error(msg);
};

// ---------- Units ----------
function normalizeUnits(units) {
  return units.map((u, i) => {
    if (!String(u.title || "").trim()) fail(`หน่วยที่ ${i + 1}: กรอกชื่อหน่วย`);
    return {
      ...u,
      indicators: cleanLines(u.indicators),
      sections: (u.sections || []).map((s, k) => (String(s.title || "").trim() ? s : fail(`หน่วยที่ ${u.id}: หัวข้อที่ ${k + 1} ยังไม่มีชื่อ`))),
      externalResources: (u.externalResources || []).map((r) => {
        const out = { ...r };
        if (r.type === "video") out.slides = (r.slides || []).map((s) => ({ ...s, points: cleanLines(s.points) }));
        else delete out.slides;
        return out;
      })
    };
  });
}

function UnitsEditor({ onDirty, toast }) {
  const { tx } = useLang();
  const doc = useContentDoc("units", onDirty);
  const [ui, setUi] = useState(0);
  const u = doc.data?.[ui];
  const set = (path, v) => doc.set([ui, ...path], v);
  const RES_TYPES = [
    ["video", tx("วิดีโอ / สไลด์บรรยาย", "Video / Narrated Slides")],
    ["youtube", tx("วิดีโอ YouTube", "YouTube Video")],
    ["link", tx("ลิงก์แหล่งเรียนรู้", "External Link")],
    ["infographic", tx("อินโฟกราฟิก", "Infographic")]
  ];

  return (
    <DocShell
      doc={doc}
      toast={toast}
      normalize={normalizeUnits}
      toolbar={
        doc.data && (
          <>
            <UnitPicker units={doc.data} value={ui} onChange={setUi} />
            <Link className="btn btn-sm btn-sky" to={`/units/${u?.id}`} target="_blank">{tx("ดูหน้านักเรียน ↗", "Preview Student View ↗")}</Link>
          </>
        )
      }
    >
      {u && (
        <div key={ui} className="tab-enter">
          <section className="editorial-panel">
            <h2 className="editor-h">{tx("ข้อมูลหน่วย", "Unit Metadata")}</h2>
            <div className="form-grid">
              <Field label={tx("ชื่อหน่วย", "Unit Title")} value={u.title} onChange={(v) => set(["title"], v)} />
              <Field label={tx("รหัส / ป้ายหน่วย", "Unit Code")} value={u.code} onChange={(v) => set(["code"], v)} />
              <Field label={tx("หน้าในเอกสาร", "Textbook Pages")} value={u.pages} onChange={(v) => set(["pages"], v)} placeholder="หน้า 3 – 18" />
              <Field label={tx("จำนวนชั่วโมง", "Duration / Hours")} value={u.hours} onChange={(v) => set(["hours"], v)} />
            </div>
            <Field label={tx("คำอธิบายย่อ", "Subtitle")} value={u.subtitle} onChange={(v) => set(["subtitle"], v)} />
            <div className="grid-2" style={{ marginTop: 14 }}>
              <Field label={tx("สรุปภาพรวมหน่วย", "Unit Summary")} textarea rows={4} value={u.summary} onChange={(v) => set(["summary"], v)} />
              <Field label={tx("คำคมเปิดหน่วย", "Hero Quote")} textarea rows={4} value={u.heroQuote} onChange={(v) => set(["heroQuote"], v)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <LinesField label={tx("ตัวชี้วัด", "Learning Indicators")} rows={3} value={u.indicators} onChange={(v) => set(["indicators"], v)} />
            </div>
          </section>

          <section className="editorial-panel">
            <h2 className="editor-h">{tx("หัวข้อเนื้อหา", "Lesson Sections")} <span className="count-pill">{(u.sections || []).length}</span></h2>
            <ListEditor
              key={`sec-${ui}`}
              items={u.sections || []}
              onChange={(v) => set(["sections"], v)}
              itemTitle={(s) => s.title}
              addLabel={tx("เพิ่มหัวข้อ", "Add Section")}
              newItem={(n) => ({ id: `u${u.id}-s${Date.now().toString(36)}`, title: `หัวข้อที่ ${n + 1}`, badge: "", content: "<p></p>" })}
              renderItem={(s, _i, setItem) => (
                <>
                  <div className="form-grid" style={{ marginTop: 0 }}>
                    <Field label={tx("ชื่อหัวข้อ", "Section Title")} value={s.title} onChange={(v) => setItem(["title"], v)} />
                    <Field label={tx("ป้ายกำกับ (เช่น หน้า 3–5)", "Badge (e.g. Pages 3–5)")} value={s.badge} onChange={(v) => setItem(["badge"], v)} />
                  </div>
                  <HtmlField label={tx("เนื้อหา", "Content (HTML)")} value={s.content} onChange={(v) => setItem(["content"], v)} />
                </>
              )}
            />
          </section>

          <section className="editorial-panel">
            <h2 className="editor-h">{tx("สื่อ & แหล่งเรียนรู้", "Media & External Resources")} <span className="count-pill">{(u.externalResources || []).length}</span></h2>
            <ListEditor
              key={`res-${ui}`}
              items={u.externalResources || []}
              onChange={(v) => set(["externalResources"], v)}
              itemTitle={(r) => `${RES_TYPES.find(([t]) => t === r.type)?.[1] || r.type} · ${r.title || ""}`}
              addLabel={tx("เพิ่มสื่อ", "Add Resource")}
              newItem={() => ({ type: "link", title: "", source: "", summary: "", url: "" })}
              renderItem={(r, _i, setItem) => (
                <>
                  <div className="form-grid" style={{ marginTop: 0 }}>
                    <SelectField label={tx("ประเภท", "Type")} value={r.type} onChange={(v) => setItem(["type"], v)} options={RES_TYPES} />
                    <Field label={tx("ชื่อสื่อ", "Title")} value={r.title} onChange={(v) => setItem(["title"], v)} />
                    <Field label={tx("แหล่งที่มา", "Source")} value={r.source} onChange={(v) => setItem(["source"], v)} />
                    {r.type === "video" && <Field label={tx("ความยาว", "Duration")} value={r.duration} onChange={(v) => setItem(["duration"], v)} placeholder="12 นาที" />}
                  </div>
                  <Field label={tx("ลิงก์ (URL)", "URL")} type="url" value={r.url} onChange={(v) => setItem(["url"], v)} placeholder="https://" />
                  <div style={{ marginTop: 14 }}>
                    <Field label={tx("คำอธิบาย", "Summary")} textarea rows={3} value={r.summary} onChange={(v) => setItem(["summary"], v)} />
                  </div>
                  {r.type === "video" && (
                    <div className="nested-block">
                      <h3 className="editor-h small-h">{tx("สไลด์บรรยาย", "Narrated Slides")} <span className="count-pill">{(r.slides || []).length}</span></h3>
                      <ListEditor
                        items={r.slides || []}
                        onChange={(v) => setItem(["slides"], v)}
                        itemTitle={(s) => `${s.step || ""} ${s.heading || ""}`.trim()}
                        addLabel={tx("เพิ่มสไลด์", "Add Slide")}
                        newItem={(n) => ({ step: `บทที่ ${n + 1}`, heading: "", points: [""], narration: "" })}
                        renderItem={(s, _k, setSlide) => (
                          <>
                            <div className="form-grid" style={{ marginTop: 0 }}>
                              <Field label={tx("ลำดับ (เช่น บทที่ 1 · บทนำ)", "Step Label")} value={s.step} onChange={(v) => setSlide(["step"], v)} />
                              <Field label={tx("หัวเรื่อง", "Heading")} value={s.heading} onChange={(v) => setSlide(["heading"], v)} />
                            </div>
                            <LinesField label={tx("ประเด็นสำคัญ", "Key Bullet Points")} rows={4} value={s.points} onChange={(v) => setSlide(["points"], v)} />
                            <div style={{ marginTop: 14 }}>
                              <Field label={tx("บทบรรยาย (ใช้อ่านออกเสียง)", "Audio Narration Transcript")} textarea rows={3} value={s.narration} onChange={(v) => setSlide(["narration"], v)} />
                            </div>
                          </>
                        )}
                      />
                    </div>
                  )}
                </>
              )}
            />
          </section>
        </div>
      )}
    </DocShell>
  );
}

// ---------- Minigames ----------
function normalizeMinigames(mgs) {
  const out = {};
  for (const [k, m] of Object.entries(mgs)) {
    const g = { ...m };
    if (m.hierarchyItems) {
      const names = m.hierarchyItems.map((h) => String(h.name || "").trim());
      if (names.some((n) => !n)) fail(`มินิเกมหน่วยที่ ${k}: กรอกชื่อกฎหมายให้ครบทุกชั้น`);
      if (new Set(names).size !== names.length) fail(`มินิเกมหน่วยที่ ${k}: ชื่อแต่ละชั้นต้องไม่ซ้ำกัน`);
      g.hierarchyItems = m.hierarchyItems.map((h, i) => ({ ...h, name: names[i], rank: i + 1 }));
      g.historyScenarios = (m.historyScenarios || []).map((s, i) => {
        const choices = cleanLines(s.choices);
        if (choices.length < 2) fail(`มินิเกมหน่วยที่ ${k} ภารกิจที่ ${i + 1}: ต้องมีตัวเลือกอย่างน้อย 2 ข้อ`);
        if (!choices.includes(s.answer)) fail(`มินิเกมหน่วยที่ ${k} ภารกิจที่ ${i + 1}: เลือกคำตอบที่ถูก`);
        return { ...s, choices };
      });
    }
    if (m.cases) {
      g.cases = m.cases.map((c, i) => {
        if (c.options.some((o) => !String(o).trim())) fail(`มินิเกมหน่วยที่ ${k} คดีที่ ${i + 1}: กรอกตัวเลือกให้ครบ`);
        return { ...c, correct: Math.min(c.correct, c.options.length - 1) };
      });
    }
    out[k] = g;
  }
  return out;
}

function MinigamesEditor({ onDirty, toast }) {
  const { tx } = useLang();
  const doc = useContentDoc("minigames", onDirty);
  const keys = doc.data ? Object.keys(doc.data) : [];
  const [mi, setMi] = useState(0);
  const k = keys[mi];
  const m = doc.data?.[k];
  const set = (path, v) => doc.set([k, ...path], v);

  return (
    <DocShell
      doc={doc}
      toast={toast}
      normalize={normalizeMinigames}
      toolbar={
        doc.data && (
          <>
            <UnitPicker units={keys.map((kk) => ({ id: kk }))} value={mi} onChange={setMi} />
            <Link className="btn btn-sm btn-sky" to={`/units/${k}/minigame`} target="_blank">{tx("ทดลองเล่น ↗", "Test Minigame ↗")}</Link>
          </>
        )
      }
    >
      {m && (
        <div key={k} className="tab-enter">
          <section className="editorial-panel">
            <h2 className="editor-h">{tx("ข้อมูลเกม", "Minigame Info")}</h2>
            <div className="form-grid">
              <Field label={tx("ชื่อเกม", "Game Title")} value={m.title} onChange={(v) => set(["title"], v)} />
              <Field label={tx("ป้ายกำกับ", "Badge")} value={m.badge} onChange={(v) => set(["badge"], v)} />
            </div>
            <Field label={tx("คำอธิบายย่อ", "Subtitle")} value={m.subtitle} onChange={(v) => set(["subtitle"], v)} />
            <div style={{ marginTop: 14 }}>
              <Field label={tx("วิธีเล่น", "Instructions")} textarea rows={3} value={m.instructions} onChange={(v) => set(["instructions"], v)} />
            </div>
          </section>

          {m.hierarchyItems && (
            <>
              <section className="editorial-panel">
                <h2 className="editor-h">{tx("ด่านที่ 1 · เรียงลำดับศักดิ์", "Stage 1 · Hierarchy of Laws")} <span className="count-pill">{m.hierarchyItems.length}</span></h2>
                <p className="field-hint" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={14} /> {tx("ลำดับในรายการนี้คือคำตอบที่ถูก (บนสุด = ศักดิ์สูงสุด) นักเรียนจะเห็นแบบสลับตำแหน่ง", "The order in this list is the correct answer key (top = highest tier). Students see a scrambled list.")}
                </p>
                <ListEditor
                  key={`h-${k}`}
                  items={m.hierarchyItems}
                  onChange={(v) => set(["hierarchyItems"], v)}
                  itemTitle={(h) => h.name}
                  addLabel={tx("เพิ่มชั้นกฎหมาย", "Add Legal Tier")}
                  newItem={() => ({ rank: 0, name: "", desc: "" })}
                  renderItem={(h, _i, setItem) => (
                    <div className="form-grid" style={{ marginTop: 0 }}>
                      <Field label={tx("ชื่อชั้น / กฎหมาย", "Tier / Law Name")} value={h.name} onChange={(v) => setItem(["name"], v)} />
                      <Field label={tx("คำอธิบาย", "Description")} value={h.desc} onChange={(v) => setItem(["desc"], v)} />
                    </div>
                  )}
                />
              </section>
              <section className="editorial-panel">
                <h2 className="editor-h">{tx("ด่านที่ 2 · จับคู่ยุคสมัย", "Stage 2 · Historical Eras")} <span className="count-pill">{(m.historyScenarios || []).length}</span></h2>
                <ListEditor
                  key={`s-${k}`}
                  items={m.historyScenarios || []}
                  onChange={(v) => set(["historyScenarios"], v)}
                  itemTitle={(s) => s.prompt}
                  addLabel={tx("เพิ่มภารกิจ", "Add Scenario")}
                  newItem={() => ({ prompt: "", choices: ["", ""], answer: "" })}
                  renderItem={(s, _i, setItem) => {
                    const choices = cleanLines(s.choices);
                    return (
                      <>
                        <Field label={tx("โจทย์", "Scenario Prompt")} textarea rows={2} value={s.prompt} onChange={(v) => setItem(["prompt"], v)} />
                        <div className="grid-2" style={{ marginTop: 14 }}>
                          <LinesField label={tx("ตัวเลือก", "Choices")} rows={4} value={s.choices} onChange={(v) => setItem(["choices"], v)} />
                          <SelectField
                            label={tx("คำตอบที่ถูก", "Correct Answer")}
                            value={choices.includes(s.answer) ? s.answer : ""}
                            onChange={(v) => setItem(["answer"], v)}
                            options={[["", tx("— เลือก —", "— Select —")], ...choices.map((c) => [c, c])]}
                          />
                        </div>
                      </>
                    );
                  }}
                />
              </section>
            </>
          )}

          {m.cases && (
            <section className="editorial-panel">
              <h2 className="editor-h">{tx("สำนวนคดี", "Legal Cases")} <span className="count-pill">{m.cases.length}</span></h2>
              <ListEditor
                key={`c-${k}`}
                items={m.cases}
                onChange={(v) => set(["cases"], v)}
                itemTitle={(c) => `${c.caseNo || ""} ${c.question || ""}`.trim()}
                addLabel={tx("เพิ่มคดี", "Add Case")}
                newItem={(n) => ({ caseNo: `คดีที่ ${n + 1}`, scenario: "", question: "", options: ["", "", "", ""], correct: 0, reason: "" })}
                renderItem={(c, _i, setItem) => (
                  <>
                    <div className="form-grid" style={{ marginTop: 0 }}>
                      <Field label={tx("เลขคดี", "Case No.")} value={c.caseNo} onChange={(v) => setItem(["caseNo"], v)} />
                      <Field label={tx("คำถาม", "Question")} value={c.question} onChange={(v) => setItem(["question"], v)} />
                    </div>
                    <Field label={tx("ข้อเท็จจริง", "Case Facts")} textarea rows={3} value={c.scenario} onChange={(v) => setItem(["scenario"], v)} />
                    <div style={{ marginTop: 14 }}>
                      <OptionsEditor options={c.options} correct={c.correct} onChange={({ options, correct }) => setItem([], { ...c, options, correct })} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Field label={tx("คำวินิจฉัย (แสดงหลังส่งคำตอบ)", "Legal Ruling (shown after submit)")} textarea rows={3} value={c.reason} onChange={(v) => setItem(["reason"], v)} />
                    </div>
                  </>
                )}
              />
            </section>
          )}
        </div>
      )}
    </DocShell>
  );
}

// ---------- Syllabus ----------
function normalizeSyllabus(rows) {
  return rows.map((r, i) => {
    if (!String(r.topic || "").trim()) fail(`แผนที่ ${i + 1}: กรอกเรื่อง`);
    return { ...r, planNo: Number(r.planNo) || i + 1, hours: Number(r.hours) || 0, unit: Number(r.unit) || 1, indicators: cleanLines(String((r.indicators || []).join(",")).split(",")) };
  });
}

function SyllabusEditor({ onDirty, toast }) {
  const { tx } = useLang();
  const doc = useContentDoc("syllabus", onDirty);
  const rows = doc.data || [];
  const set = (i, f, v) => doc.set([i, f], v);
  const total = rows.reduce((a, r) => a + (Number(r.hours) || 0), 0);

  return (
    <DocShell doc={doc} toast={toast} normalize={normalizeSyllabus} toolbar={<span className="seal-badge seal-info num">{rows.length} {tx("แผน", "Plans")} · {total} {tx("ชั่วโมง", "Hours")}</span>}>
      <section className="editorial-panel">
        <div className="table-wrap">
          <table className="legal-table stack-mobile edit-table">
            <thead>
              <tr>
                <th>{tx("เรื่อง", "Topic")}</th>
                <th style={{ width: 90 }}>{tx("สัปดาห์", "Week")}</th>
                <th style={{ width: 80 }}>{tx("แผนที่", "Plan #")}</th>
                <th style={{ width: 100 }}>{tx("หน่วย", "Unit")}</th>
                <th style={{ width: 80 }}>{tx("ชั่วโมง", "Hours")}</th>
                <th>{tx("ตัวชี้วัด (คั่นด้วย ,)", "Indicators (comma-separated)")}</th>
                <th style={{ width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input className="form-input" value={r.topic ?? ""} onChange={(e) => set(i, "topic", e.target.value)} aria-label={`เรื่อง แผนที่ ${i + 1}`} /></td>
                  <td data-label={tx("สัปดาห์", "Week")}><input className="form-input num" value={r.week ?? ""} onChange={(e) => set(i, "week", e.target.value)} aria-label="สัปดาห์" /></td>
                  <td data-label={tx("แผนที่", "Plan #")}><input className="form-input num" type="number" value={r.planNo ?? ""} onChange={(e) => set(i, "planNo", e.target.value)} aria-label="แผนที่" /></td>
                  <td data-label={tx("หน่วย", "Unit")}>
                    <select className="form-select" value={r.unit} onChange={(e) => set(i, "unit", Number(e.target.value))} aria-label="หน่วย">
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td data-label={tx("ชั่วโมง", "Hours")}><input className="form-input num" type="number" min="0" value={r.hours ?? ""} onChange={(e) => set(i, "hours", e.target.value)} aria-label="ชั่วโมง" /></td>
                  <td data-label={tx("ตัวชี้วัด", "Indicators")}><input className="form-input" value={(r.indicators || []).join(",")} onChange={(e) => set(i, "indicators", e.target.value.split(","))} aria-label="ตัวชี้วัด" /></td>
                  <td className="cell-action">
                    <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => window.confirm(tx(`ลบแผนที่ ${r.planNo}?`, `Delete Plan #${r.planNo}?`)) && doc.setData(rows.filter((_, k) => k !== i))} aria-label={`ลบแผนที่ ${i + 1}`}>
                      <Icon name="trash" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="btn btn-sm"
          style={{ marginTop: 12 }}
          onClick={() => doc.setData([...rows, { week: "", planNo: rows.length + 1, hours: 1, topic: "", unit: rows.at(-1)?.unit || 1, indicators: [] }])}
        >
          <Icon name="plus" size={14} /> {tx("เพิ่มแผน", "Add Lesson Plan")}
        </button>
      </section>
    </DocShell>
  );
}

// ---------- Bibliography ----------
function BibliographyEditor({ onDirty, toast }) {
  const { tx } = useLang();
  const doc = useContentDoc("bibliography", onDirty);
  return (
    <DocShell doc={doc} toast={toast} normalize={(list) => list.map((s) => String(s).trim()).filter(Boolean)} toolbar={<span className="seal-badge seal-info num">{(doc.data || []).length} {tx("รายการ", "Entries")}</span>}>
      <section className="editorial-panel">
        {doc.data && (
          <ListEditor
            items={doc.data}
            onChange={doc.setData}
            defaultOpen
            confirmDelete={false}
            itemTitle={(b) => String(b).replace(/<[^>]*>/g, "").slice(0, 70)}
            addLabel={tx("เพิ่มรายการ", "Add Reference")}
            newItem={() => ""}
            renderItem={(b, i) => (
              <>
                <Field label={tx("รายการอ้างอิง", "Reference Entry")} textarea rows={2} value={b} onChange={(v) => doc.setData(doc.data.map((x, k) => (k === i ? v : x)))} />
                <BilingualHtml className="field-hint" html={b} />
              </>
            )}
          />
        )}
      </section>
    </DocShell>
  );
}

const EDITORS = { units: UnitsEditor, minigames: MinigamesEditor, syllabus: SyllabusEditor, bibliography: BibliographyEditor };

export default function ContentEditor() {
  const { lang, tx } = useLang();
  const [params, setParams] = useSearchParams();
  const tab = EDITORS[params.get("tab")] ? params.get("tab") : "units";
  const [dirty, setDirty] = useState({});
  const [toast, setToast] = useToast();
  const onDirty = useCallback((key, v) => setDirty((d) => (d[key] === v ? d : { ...d, [key]: v })), []);

  return (
    <>
      <PageHead
        title={tx("เนื้อหา & มินิเกม", "Content & Minigames Editor")}
        subtitle={tx(
          "แก้ไขบทเรียน มินิเกม แผนการสอน และบรรณานุกรม · มีผลกับหน้านักเรียนทันทีหลังบันทึก",
          "Edit learning units, minigames, syllabus plans, and bibliography · Changes take effect immediately upon saving."
        )}
      />
      <nav className="unit-mode-bar" aria-label={tx("ประเภทเนื้อหา", "Content Categories")}>
        {TABS.map(([k, thLabel, enLabel]) => (
          <button key={k} type="button" className={`mode-tab ${tab === k ? "active" : ""}`} onClick={() => setParams({ tab: k }, { replace: true })}>
            {lang === "en" ? enLabel : thLabel}
            {dirty[k] && <span className="tab-dot" title={tx("ยังไม่บันทึก", "Unsaved changes")} />}
          </button>
        ))}
      </nav>
      {Object.entries(EDITORS).map(([k, Editor]) => (
        <div key={k} hidden={tab !== k} className={tab === k ? "tab-enter" : ""}>
          <Editor onDirty={onDirty} toast={setToast} />
        </div>
      ))}
      {toast}
    </>
  );
}

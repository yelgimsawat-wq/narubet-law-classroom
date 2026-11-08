import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ErrorState, Html, Icon, PageHead, PageSkeleton, useToast } from "../../ui.jsx";
import { Field, HtmlField, JsonFallback, LinesField, ListEditor, OptionsEditor, SaveBar, SelectField, cleanLines, useContentDoc } from "./editors.jsx";

const TABS = [
  ["units", "บทเรียน"],
  ["minigames", "มินิเกม"],
  ["syllabus", "แผนการสอน"],
  ["bibliography", "บรรณานุกรม"]
];

function UnitPicker({ units, value, onChange }) {
  return (
    <div className="row" style={{ gap: 6 }} role="group" aria-label="เลือกหน่วย">
      {units.map((u, i) => (
        <button key={u.id ?? i} type="button" className={`btn btn-sm ${value === i ? "btn-navy" : ""}`} onClick={() => onChange(i)} aria-pressed={value === i}>
          หน่วยที่ {u.id ?? u.unitId ?? i + 1}
        </button>
      ))}
    </div>
  );
}

function DocShell({ doc, children, toolbar, normalize, toast }) {
  if (doc.error) return <ErrorState message={doc.error} onRetry={doc.load} />;
  if (!doc.data) return <PageSkeleton rows={5} />;
  return (
    <>
      <div className="editor-toolbar">
        {toolbar}
        <span className="small muted">แก้ไขล่าสุด {doc.updatedAt ? new Date(doc.updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "–"}</span>
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
const RES_TYPES = [["video", "วิดีโอ / สไลด์บรรยาย"], ["link", "ลิงก์แหล่งเรียนรู้"], ["infographic", "อินโฟกราฟิก"]];

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
  const doc = useContentDoc("units", onDirty);
  const [ui, setUi] = useState(0);
  const u = doc.data?.[ui];
  const set = (path, v) => doc.set([ui, ...path], v);

  return (
    <DocShell
      doc={doc}
      toast={toast}
      normalize={normalizeUnits}
      toolbar={
        doc.data && (
          <>
            <UnitPicker units={doc.data} value={ui} onChange={setUi} />
            <Link className="btn btn-sm btn-sky" to={`/units/${u?.id}`} target="_blank">ดูหน้านักเรียน ↗</Link>
          </>
        )
      }
    >
      {u && (
        <div key={ui} className="tab-enter">
          <section className="editorial-panel">
            <h2 className="editor-h">ข้อมูลหน่วย</h2>
            <div className="form-grid">
              <Field label="ชื่อหน่วย" value={u.title} onChange={(v) => set(["title"], v)} />
              <Field label="รหัส / ป้ายหน่วย" value={u.code} onChange={(v) => set(["code"], v)} />
              <Field label="หน้าในเอกสาร" value={u.pages} onChange={(v) => set(["pages"], v)} placeholder="หน้า 3 – 18" />
              <Field label="จำนวนชั่วโมง" value={u.hours} onChange={(v) => set(["hours"], v)} />
            </div>
            <Field label="คำอธิบายย่อ" value={u.subtitle} onChange={(v) => set(["subtitle"], v)} />
            <div className="grid-2" style={{ marginTop: 14 }}>
              <Field label="สรุปภาพรวมหน่วย" textarea rows={4} value={u.summary} onChange={(v) => set(["summary"], v)} />
              <Field label="คำคมเปิดหน่วย" textarea rows={4} value={u.heroQuote} onChange={(v) => set(["heroQuote"], v)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <LinesField label="ตัวชี้วัด" rows={3} value={u.indicators} onChange={(v) => set(["indicators"], v)} />
            </div>
          </section>

          <section className="editorial-panel">
            <h2 className="editor-h">หัวข้อเนื้อหา <span className="count-pill">{(u.sections || []).length}</span></h2>
            <ListEditor
              key={`sec-${ui}`}
              items={u.sections || []}
              onChange={(v) => set(["sections"], v)}
              itemTitle={(s) => s.title}
              addLabel="เพิ่มหัวข้อ"
              newItem={(n) => ({ id: `u${u.id}-s${Date.now().toString(36)}`, title: `หัวข้อที่ ${n + 1}`, badge: "", content: "<p></p>" })}
              renderItem={(s, _i, setItem) => (
                <>
                  <div className="form-grid" style={{ marginTop: 0 }}>
                    <Field label="ชื่อหัวข้อ" value={s.title} onChange={(v) => setItem(["title"], v)} />
                    <Field label="ป้ายกำกับ (เช่น หน้า 3–5)" value={s.badge} onChange={(v) => setItem(["badge"], v)} />
                  </div>
                  <HtmlField label="เนื้อหา" value={s.content} onChange={(v) => setItem(["content"], v)} />
                </>
              )}
            />
          </section>

          <section className="editorial-panel">
            <h2 className="editor-h">สื่อ & แหล่งเรียนรู้ <span className="count-pill">{(u.externalResources || []).length}</span></h2>
            <ListEditor
              key={`res-${ui}`}
              items={u.externalResources || []}
              onChange={(v) => set(["externalResources"], v)}
              itemTitle={(r) => `${RES_TYPES.find(([t]) => t === r.type)?.[1] || r.type} · ${r.title || ""}`}
              addLabel="เพิ่มสื่อ"
              newItem={() => ({ type: "link", title: "", source: "", summary: "", url: "" })}
              renderItem={(r, _i, setItem) => (
                <>
                  <div className="form-grid" style={{ marginTop: 0 }}>
                    <SelectField label="ประเภท" value={r.type} onChange={(v) => setItem(["type"], v)} options={RES_TYPES} />
                    <Field label="ชื่อสื่อ" value={r.title} onChange={(v) => setItem(["title"], v)} />
                    <Field label="แหล่งที่มา" value={r.source} onChange={(v) => setItem(["source"], v)} />
                    {r.type === "video" && <Field label="ความยาว" value={r.duration} onChange={(v) => setItem(["duration"], v)} placeholder="12 นาที" />}
                  </div>
                  <Field label="ลิงก์ (URL)" type="url" value={r.url} onChange={(v) => setItem(["url"], v)} placeholder="https://" />
                  <div style={{ marginTop: 14 }}>
                    <Field label="คำอธิบาย" textarea rows={3} value={r.summary} onChange={(v) => setItem(["summary"], v)} />
                  </div>
                  {r.type === "video" && (
                    <div className="nested-block">
                      <h3 className="editor-h small-h">สไลด์บรรยาย <span className="count-pill">{(r.slides || []).length}</span></h3>
                      <ListEditor
                        items={r.slides || []}
                        onChange={(v) => setItem(["slides"], v)}
                        itemTitle={(s) => `${s.step || ""} ${s.heading || ""}`.trim()}
                        addLabel="เพิ่มสไลด์"
                        newItem={(n) => ({ step: `บทที่ ${n + 1}`, heading: "", points: [""], narration: "" })}
                        renderItem={(s, _k, setSlide) => (
                          <>
                            <div className="form-grid" style={{ marginTop: 0 }}>
                              <Field label="ลำดับ (เช่น บทที่ 1 · บทนำ)" value={s.step} onChange={(v) => setSlide(["step"], v)} />
                              <Field label="หัวเรื่อง" value={s.heading} onChange={(v) => setSlide(["heading"], v)} />
                            </div>
                            <LinesField label="ประเด็นสำคัญ" rows={4} value={s.points} onChange={(v) => setSlide(["points"], v)} />
                            <div style={{ marginTop: 14 }}>
                              <Field label="บทบรรยาย (ใช้อ่านออกเสียง)" textarea rows={3} value={s.narration} onChange={(v) => setSlide(["narration"], v)} />
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
      g.hierarchyItems = m.hierarchyItems.map((h, i) => ({ ...h, name: names[i], rank: i + 1 })); // list order = correct answer
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
            <Link className="btn btn-sm btn-sky" to={`/units/${k}/minigame`} target="_blank">ทดลองเล่น ↗</Link>
          </>
        )
      }
    >
      {m && (
        <div key={k} className="tab-enter">
          <section className="editorial-panel">
            <h2 className="editor-h">ข้อมูลเกม</h2>
            <div className="form-grid">
              <Field label="ชื่อเกม" value={m.title} onChange={(v) => set(["title"], v)} />
              <Field label="ป้ายกำกับ" value={m.badge} onChange={(v) => set(["badge"], v)} />
            </div>
            <Field label="คำอธิบายย่อ" value={m.subtitle} onChange={(v) => set(["subtitle"], v)} />
            <div style={{ marginTop: 14 }}>
              <Field label="วิธีเล่น" textarea rows={3} value={m.instructions} onChange={(v) => set(["instructions"], v)} />
            </div>
          </section>

          {m.hierarchyItems && (
            <>
              <section className="editorial-panel">
                <h2 className="editor-h">ด่านที่ 1 · เรียงลำดับศักดิ์ <span className="count-pill">{m.hierarchyItems.length}</span></h2>
                <p className="field-hint" style={{ marginBottom: 12 }}>
                  <Icon name="info" size={14} /> ลำดับในรายการนี้คือคำตอบที่ถูก (บนสุด = ศักดิ์สูงสุด) นักเรียนจะเห็นแบบสลับตำแหน่ง
                </p>
                <ListEditor
                  key={`h-${k}`}
                  items={m.hierarchyItems}
                  onChange={(v) => set(["hierarchyItems"], v)}
                  itemTitle={(h) => h.name}
                  addLabel="เพิ่มชั้นกฎหมาย"
                  newItem={() => ({ rank: 0, name: "", desc: "" })}
                  renderItem={(h, _i, setItem) => (
                    <div className="form-grid" style={{ marginTop: 0 }}>
                      <Field label="ชื่อชั้น / กฎหมาย" value={h.name} onChange={(v) => setItem(["name"], v)} />
                      <Field label="คำอธิบาย" value={h.desc} onChange={(v) => setItem(["desc"], v)} />
                    </div>
                  )}
                />
              </section>
              <section className="editorial-panel">
                <h2 className="editor-h">ด่านที่ 2 · จับคู่ยุคสมัย <span className="count-pill">{(m.historyScenarios || []).length}</span></h2>
                <ListEditor
                  key={`s-${k}`}
                  items={m.historyScenarios || []}
                  onChange={(v) => set(["historyScenarios"], v)}
                  itemTitle={(s) => s.prompt}
                  addLabel="เพิ่มภารกิจ"
                  newItem={() => ({ prompt: "", choices: ["", ""], answer: "" })}
                  renderItem={(s, _i, setItem) => {
                    const choices = cleanLines(s.choices);
                    return (
                      <>
                        <Field label="โจทย์" textarea rows={2} value={s.prompt} onChange={(v) => setItem(["prompt"], v)} />
                        <div className="grid-2" style={{ marginTop: 14 }}>
                          <LinesField label="ตัวเลือก" rows={4} value={s.choices} onChange={(v) => setItem(["choices"], v)} />
                          <SelectField
                            label="คำตอบที่ถูก"
                            value={choices.includes(s.answer) ? s.answer : ""}
                            onChange={(v) => setItem(["answer"], v)}
                            options={[["", "— เลือก —"], ...choices.map((c) => [c, c])]}
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
              <h2 className="editor-h">สำนวนคดี <span className="count-pill">{m.cases.length}</span></h2>
              <ListEditor
                key={`c-${k}`}
                items={m.cases}
                onChange={(v) => set(["cases"], v)}
                itemTitle={(c) => `${c.caseNo || ""} ${c.question || ""}`.trim()}
                addLabel="เพิ่มคดี"
                newItem={(n) => ({ caseNo: `คดีที่ ${n + 1}`, scenario: "", question: "", options: ["", "", "", ""], correct: 0, reason: "" })}
                renderItem={(c, _i, setItem) => (
                  <>
                    <div className="form-grid" style={{ marginTop: 0 }}>
                      <Field label="เลขคดี" value={c.caseNo} onChange={(v) => setItem(["caseNo"], v)} />
                      <Field label="คำถาม" value={c.question} onChange={(v) => setItem(["question"], v)} />
                    </div>
                    <Field label="ข้อเท็จจริง" textarea rows={3} value={c.scenario} onChange={(v) => setItem(["scenario"], v)} />
                    <div style={{ marginTop: 14 }}>
                      <OptionsEditor options={c.options} correct={c.correct} onChange={({ options, correct }) => setItem([], { ...c, options, correct })} />
                    </div>
                    <div style={{ marginTop: 14 }}>
                      <Field label="คำวินิจฉัย (แสดงหลังส่งคำตอบ)" textarea rows={3} value={c.reason} onChange={(v) => setItem(["reason"], v)} />
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
  const doc = useContentDoc("syllabus", onDirty);
  const rows = doc.data || [];
  const set = (i, f, v) => doc.set([i, f], v);
  const total = rows.reduce((a, r) => a + (Number(r.hours) || 0), 0);

  return (
    <DocShell doc={doc} toast={toast} normalize={normalizeSyllabus} toolbar={<span className="seal-badge seal-info num">{rows.length} แผน · {total} ชั่วโมง</span>}>
      <section className="editorial-panel">
        <div className="table-wrap">
          <table className="legal-table stack-mobile edit-table">
            <thead>
              <tr><th>เรื่อง</th><th style={{ width: 90 }}>สัปดาห์</th><th style={{ width: 80 }}>แผนที่</th><th style={{ width: 100 }}>หน่วย</th><th style={{ width: 80 }}>ชั่วโมง</th><th>ตัวชี้วัด (คั่นด้วย ,)</th><th style={{ width: 44 }}></th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td><input className="form-input" value={r.topic ?? ""} onChange={(e) => set(i, "topic", e.target.value)} aria-label={`เรื่อง แผนที่ ${i + 1}`} /></td>
                  <td data-label="สัปดาห์"><input className="form-input num" value={r.week ?? ""} onChange={(e) => set(i, "week", e.target.value)} aria-label="สัปดาห์" /></td>
                  <td data-label="แผนที่"><input className="form-input num" type="number" value={r.planNo ?? ""} onChange={(e) => set(i, "planNo", e.target.value)} aria-label="แผนที่" /></td>
                  <td data-label="หน่วย">
                    <select className="form-select" value={r.unit} onChange={(e) => set(i, "unit", Number(e.target.value))} aria-label="หน่วย">
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td data-label="ชั่วโมง"><input className="form-input num" type="number" min="0" value={r.hours ?? ""} onChange={(e) => set(i, "hours", e.target.value)} aria-label="ชั่วโมง" /></td>
                  <td data-label="ตัวชี้วัด"><input className="form-input" value={(r.indicators || []).join(",")} onChange={(e) => set(i, "indicators", e.target.value.split(","))} aria-label="ตัวชี้วัด" /></td>
                  <td className="cell-action">
                    <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => window.confirm(`ลบแผนที่ ${r.planNo}?`) && doc.setData(rows.filter((_, k) => k !== i))} aria-label={`ลบแผนที่ ${i + 1}`}>
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
          <Icon name="plus" size={14} /> เพิ่มแผน
        </button>
      </section>
    </DocShell>
  );
}

// ---------- Bibliography ----------
function BibliographyEditor({ onDirty, toast }) {
  const doc = useContentDoc("bibliography", onDirty);
  return (
    <DocShell doc={doc} toast={toast} normalize={(list) => list.map((s) => String(s).trim()).filter(Boolean)} toolbar={<span className="seal-badge seal-info num">{(doc.data || []).length} รายการ</span>}>
      <section className="editorial-panel">
        {doc.data && (
          <ListEditor
            items={doc.data}
            onChange={doc.setData}
            defaultOpen
            confirmDelete={false}
            itemTitle={(b) => String(b).replace(/<[^>]*>/g, "").slice(0, 70)}
            addLabel="เพิ่มรายการ"
            newItem={() => ""}
            renderItem={(b, i) => (
              <>
                <Field label="รายการอ้างอิง" textarea rows={2} value={b} onChange={(v) => doc.setData(doc.data.map((x, k) => (k === i ? v : x)))} />
                <Html className="field-hint" html={b} />
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
  const [params, setParams] = useSearchParams();
  const tab = EDITORS[params.get("tab")] ? params.get("tab") : "units";
  const [dirty, setDirty] = useState({});
  const [toast, setToast] = useToast();
  const onDirty = useCallback((key, v) => setDirty((d) => (d[key] === v ? d : { ...d, [key]: v })), []);

  return (
    <>
      <PageHead title="เนื้อหา & มินิเกม" subtitle="แก้ไขบทเรียน มินิเกม แผนการสอน และบรรณานุกรม · มีผลกับหน้านักเรียนทันทีหลังบันทึก" />
      <nav className="unit-mode-bar" aria-label="ประเภทเนื้อหา">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" className={`mode-tab ${tab === k ? "active" : ""}`} onClick={() => setParams({ tab: k }, { replace: true })}>
            {label}
            {dirty[k] && <span className="tab-dot" title="ยังไม่บันทึก" />}
          </button>
        ))}
      </nav>
      {/* all editors stay mounted so switching tabs keeps unsaved edits */}
      {Object.entries(EDITORS).map(([k, Editor]) => (
        <div key={k} hidden={tab !== k} className={tab === k ? "tab-enter" : ""}>
          <Editor onDirty={onDirty} toast={setToast} />
        </div>
      ))}
      {toast}
    </>
  );
}

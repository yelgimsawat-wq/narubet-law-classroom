import { useEffect, useState } from "react";
import { useAuth } from "../auth.jsx";
import { Html, Icon, PageHead, downloadFile } from "../ui.jsx";
import { UnitVisuals } from "./Unit.jsx";

const BOOK_PDF = "/study.pdf";
const BOOK_NAME = "เอกสารประกอบการเรียนสังคมศึกษา6_ครูนฤเบศ.pdf";

function standaloneDoc(units, title) {
  const body = units
    .map(
      (u) => `<section style="margin-bottom:36px; page-break-after:always;">
  <h1 style="color:#3730a3; border-bottom:2px solid #c9ccfb; padding-bottom:8px;">หน่วยที่ ${u.id}: ${u.title} (${u.pages})</h1>
  <p><strong>${u.subtitle}</strong> · ${u.hours} · ตัวชี้วัด: ${u.indicators.join(", ")}</p>
  ${u.sections.map((s) => `<div style="margin-top:18px;"><h2>${s.title} (${s.badge})</h2>${s.content}</div>`).join("")}
</section>`
    )
    .join("");
  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;600;700&display=swap" rel="stylesheet">
<style>body{font-family:'IBM Plex Sans Thai',sans-serif;color:#111827;max-width:980px;margin:0 auto;padding:36px;line-height:1.65}
table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid #d4d8e3;padding:10px;text-align:left;vertical-align:top}th{background:#f1f2ff}
.legal-box{border:1px solid #e6e8ef;background:#f8f9fc;padding:14px;margin:10px 0;border-radius:10px}.legal-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}</style></head>
<body><header style="border-bottom:3px solid #4f46e5;padding-bottom:12px;margin-bottom:28px;"><h1 style="margin:0;">เอกสารประกอบการเรียน รายวิชาสังคมศึกษา 6 กฎหมายที่ประชาชนควรรู้</h1>
<p style="margin:4px 0 0;color:#4b5563;">ห้องเรียนกฎหมายของครูนฤเบศ</p></header>${body}</body></html>`;
}

export default function Documents() {
  const { content } = useAuth();
  const [filter, setFilter] = useState("all");
  const [pdf, setPdf] = useState(null); // { url, name }
  useEffect(() => () => pdf?.url.startsWith("blob:") && URL.revokeObjectURL(pdf.url), [pdf]);

  const units = filter === "all" ? content.units : content.units.filter((u) => String(u.id) === filter);
  const unitFile = (u) => `เอกสารประกอบการเรียน_ส33102_หน่วยที่_${u.id}.html`;
  const bookFile = "เอกสารประกอบการเรียน_ส33102_ครบทั้ง_5_หน่วย_ครูนฤเบศ.html";

  return (
    <>
      <PageHead
        title="คลังเอกสารประกอบการเรียน (ส33102)"
        subtitle="กฎหมายที่ประชาชนควรรู้ ชั้นมัธยมศึกษาปีที่ 6 · 82 หน้า ครบ 5 หน่วย อ่านออนไลน์หรือดาวน์โหลดได้ทันที"
        actions={
          <>
            <a className="btn btn-primary" href={BOOK_PDF} download={BOOK_NAME}><Icon name="download" /> PDF 82 หน้า</a>
            <button type="button" className="btn btn-sky" onClick={() => setPdf({ url: BOOK_PDF, name: "เอกสารประกอบการเรียน (82 หน้า)" })}><Icon name="book" /> เปิดดู PDF</button>
            <button type="button" className="btn" onClick={() => downloadFile(standaloneDoc(content.units, bookFile), bookFile)}><Icon name="download" /> ฉบับดิจิทัล (.html)</button>
          </>
        }
      >
        <div className="row between">
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className={`btn btn-sm ${filter === "all" ? "btn-navy" : ""}`} onClick={() => setFilter("all")}>ทั้ง 5 หน่วย</button>
            {content.units.map((u) => (
              <button key={u.id} type="button" className={`btn btn-sm ${filter === String(u.id) ? "btn-navy" : ""}`} onClick={() => setFilter(String(u.id))}>หน่วยที่ {u.id}</button>
            ))}
          </div>
          <label className="btn btn-sm" style={{ cursor: "pointer" }}>
            เปิดไฟล์ PDF จากเครื่อง
            <input
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPdf({ url: URL.createObjectURL(f), name: f.name });
              }}
            />
          </label>
        </div>
      </PageHead>

      {pdf && (
        <section className="editorial-panel">
          <div className="panel-header">
            <h2>{pdf.name}</h2>
            <div className="row">
              <a className="btn btn-sm" href={pdf.url} download={pdf.name}><Icon name="download" size={15} /> ดาวน์โหลด</a>
              <button type="button" className="btn btn-sm" onClick={() => setPdf(null)}>ปิด</button>
            </div>
          </div>
          <div className="frame-box">
            <div className="sk" aria-hidden="true" />
            <iframe key={pdf.url} src={pdf.url} title="PDF Viewer" onLoad={(e) => e.currentTarget.classList.add("loaded")} />
          </div>
        </section>
      )}

      {units.map((u) => (
        <section key={u.id}>
          <div className="unit-section-block">
            <div className="unit-section-header">
              <h2>หน่วยที่ {u.id}: {u.title} <span className="muted small">({u.pages})</span></h2>
              <button type="button" className="btn btn-sky btn-sm" onClick={() => downloadFile(standaloneDoc([u], unitFile(u)), unitFile(u))}><Icon name="download" size={15} /> ดาวน์โหลดหน่วยนี้</button>
            </div>
            {u.sections.map((s) => (
              <div key={s.id || s.title} style={{ marginBottom: 18 }}>
                <h4>{s.title} <span className="seal-badge">{s.badge}</span></h4>
                <Html className="legal-prose" html={s.content} />
              </div>
            ))}
          </div>
          <UnitVisuals unitId={u.id} />
        </section>
      ))}

      <section className="editorial-panel">
        <h2 style={{ marginBottom: 10 }}>บรรณานุกรมและแหล่งเรียนรู้ทางกฎหมาย</h2>
        <ol style={{ marginLeft: "1.4rem" }}>
          {content.bibliography.map((b, i) => <Html as="li" key={i} html={b} style={{ marginBottom: 6 }} />)}
        </ol>
      </section>
    </>
  );
}

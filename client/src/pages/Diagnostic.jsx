import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { PageHead } from "../ui.jsx";
import { QuizRunner } from "../Quiz.jsx";

export default function Diagnostic() {
  const { user, content, setProgress } = useAuth();
  const qs = content.diagnostic;
  const saved = user.progress.diagnostic.answers || {};

  async function onSubmit(ans) {
    const answers = Object.fromEntries(qs.map((q, i) => [q.id, ans[i]]));
    const { progress, key } = await api("/me/diagnostic", { method: "POST", body: { answers } });
    setProgress(progress);
    return { score: progress.diagnostic.totalScore, key: qs.map((q) => key[q.id]) };
  }

  return (
    <>
      <PageHead
        title="แบบประเมินเส้นทางการเรียนรู้แรกเข้า (25 ข้อ)"
        subtitle="ประเมินความรู้พื้นฐานครอบคลุม 5 หน่วยการเรียนรู้ (หน่วยละ 5 ข้อ) เพื่อวิเคราะห์จุดแข็ง-จุดอ่อนและจัดลำดับเส้นทางการเรียนบนแดชบอร์ด"
      />
      <QuizRunner
        items={qs.map((q) => ({
          badge: (n, total) => <span className="seal-badge seal-info">ข้อ {n} / {total} · {q.unitTitle}</span>,
          meta: `ประเด็น: ${q.subtopic}`,
          title: q.question,
          options: q.options
        }))}
        initial={qs.map((q) => saved[q.id])}
        onSubmit={onSubmit}
        submitLabel="ส่งคำตอบและวิเคราะห์ผล"
        explanationLabel="เฉลย"
        resultExtra={<Link className="btn btn-primary" to="/">ดูแดชบอร์ดวิเคราะห์ผล</Link>}
      />
    </>
  );
}

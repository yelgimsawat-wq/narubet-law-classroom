import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { api } from "../api.js";
import { UNIT_EN_META, useLang } from "../i18n.jsx";
import { PageHead } from "../ui.jsx";
import { QuizRunner } from "../Quiz.jsx";

export default function Diagnostic() {
  const { user, content, setProgress } = useAuth();
  const { lang, tx } = useLang();
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
        title={tx("แบบประเมินเส้นทางการเรียนรู้แรกเข้า (25 ข้อ)", "Diagnostic Learning Path Assessment (25 Questions)")}
        subtitle={tx(
          "ประเมินความรู้พื้นฐานครอบคลุม 5 หน่วยการเรียนรู้ (หน่วยละ 5 ข้อ) เพื่อวิเคราะห์จุดแข็ง-จุดอ่อนและจัดลำดับเส้นทางการเรียนบนแดชบอร์ด",
          "Assess baseline legal knowledge across all 5 learning units (5 questions per unit) to analyze your strengths and prioritize your personalized study path."
        )}
      />
      <QuizRunner
        items={qs.map((q) => {
          const uTitle = lang === "en" && UNIT_EN_META[q.unitId] ? `Unit ${q.unitId}: ${UNIT_EN_META[q.unitId].title}` : q.unitTitle;
          return {
            badge: (n, total) => (
              <span className="seal-badge seal-info">
                {tx(`ข้อ ${n} / ${total}`, `Q ${n} / ${total}`)} · {uTitle}
              </span>
            ),
            meta: `${tx("ประเด็น", "Topic")}: ${q.subtopic}`,
            title: q.question,
            options: q.options
          };
        })}
        initial={qs.map((q) => saved[q.id])}
        onSubmit={onSubmit}
        submitLabel={tx("ส่งคำตอบและวิเคราะห์ผล", "Submit & Analyze Results")}
        explanationLabel={tx("เฉลย", "Explanation")}
        resultExtra={<Link className="btn btn-primary" to="/">{tx("ดูแดชบอร์ดวิเคราะห์ผล", "View Analytics Dashboard")}</Link>}
      />
    </>
  );
}

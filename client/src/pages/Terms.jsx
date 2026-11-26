import { useNavigate } from "react-router-dom";
import { BilingualHtml, DeveloperCredits, useLang } from "../i18n.jsx";
import { renderTermsView } from "../legacy.js";

const html = renderTermsView();

export default function Terms() {
  const nav = useNavigate();
  const { tx } = useLang();
  const onClick = (e) => {
    const t = e.target.closest("[data-nav]");
    if (t) nav(t.dataset.nav === "dashboard" ? "/" : `/${t.dataset.nav}`);
  };
  return (
    <>
      <BilingualHtml html={html} onClick={onClick} />
      <article className="unit-section-block" style={{ marginTop: 18 }}>
        <div className="unit-section-header">
          <h3>{tx("4. คณะผู้พัฒนาเว็บแอปพลิเคชัน (Development Team)", "4. Application Development Team")}</h3>
          <span className="seal-badge seal-info">{tx("คณะผู้พัฒนา", "DEVELOPERS")}</span>
        </div>
        <div className="legal-box" style={{ padding: "16px 20px" }}>
          <DeveloperCredits style={{ fontSize: "1rem" }} />
        </div>
      </article>
    </>
  );
}

import { useNavigate } from "react-router-dom";
import { Html } from "../ui.jsx";
import { renderTermsView } from "../legacy.js";

const html = renderTermsView();

export default function Terms() {
  const nav = useNavigate();
  const onClick = (e) => {
    const t = e.target.closest("[data-nav]");
    if (t) nav(t.dataset.nav === "dashboard" ? "/" : `/${t.dataset.nav}`);
  };
  return <Html html={html} onClick={onClick} />;
}

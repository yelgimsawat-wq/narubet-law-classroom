import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { DeveloperCredits, LangToggle, UNIT_EN_META, useLang } from "./i18n.jsx";
import { Icon, ShellSkeleton, ThemeToggle, has } from "./ui.jsx";

function Item({ to, icon, label, meta, end }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
      <Icon name={icon} />
      <span className="nav-label">{label}</span>
      {meta && <span className="nav-meta num">{meta}</span>}
    </NavLink>
  );
}

export default function Layout() {
  const { user, content, logout } = useAuth();
  const { lang, tx } = useLang();
  const [open, setOpen] = useState(false);
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [loc.pathname]);
  useEffect(() => setQ(params.get("q") || ""), [params]);

  if (!content) return <ShellSkeleton />;
  // Unit tabs share one page key so switching tabs doesn't replay the whole page entrance.
  const pageKey = loc.pathname.split("/").slice(0, 3).join("/");
  const p = user.progress || {};
  const d = p.diagnostic || {};
  const unitMeta = (id) => {
    const up = p.unitProgress?.[id] || {};
    if (has(up.postScore)) return tx(`หลัง ${up.postScore}/20`, `Post ${up.postScore}/20`);
    if (has(up.preScore)) return tx(`ก่อน ${up.preScore}/20`, `Pre ${up.preScore}/20`);
    return "";
  };
  const isTeacher = user.role === "teacher";

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label={tx("เมนูหลัก", "Main Menu")}>
        <NavLink to={isTeacher ? "/teacher" : "/"} className="brand">
          <img src="/logo.png" alt="" width="38" height="38" />
          <img className="school-emblem" src="/emblem.png" alt="ตราโรงเรียนสวนกุหลาบวิทยาลัย ธนบุรี" width="38" height="38" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <strong>{tx("ห้องเรียนกฎหมายครูนฤเบศ", "Kru Narubet's Law Classroom")}</strong>
            <span>{tx("สังคมศึกษา 6 · ส33102", "Social Studies 6 · SO33102")}</span>
          </div>
        </NavLink>

        {isTeacher && (
          <>
            <div className="nav-group">{tx("Backoffice ครู", "Teacher Backoffice")}</div>
            <Item to="/teacher" end icon="chart" label={tx("ภาพรวมชั้นเรียน", "Class Overview")} />
            <Item to="/teacher/students" icon="users" label={tx("จัดการนักเรียน", "Manage Students")} />
            <Item to="/teacher/questions" icon="edit" label={tx("คลังข้อสอบ", "Question Bank")} />
            <Item to="/teacher/content" icon="db" label={tx("เนื้อหา & มินิเกม", "Content & Minigames")} />
          </>
        )}

        <div className="nav-group">{isTeacher ? tx("มุมมองนักเรียน", "Student View") : tx("การเรียน", "Learning")}</div>
        <Item to="/" end icon="home" label={tx("แดชบอร์ด", "Dashboard")} />
        <Item to="/diagnostic" icon="compass" label={tx("ประเมินแรกเข้า 25 ข้อ", "Diagnostic Test (25 Qs)")} meta={d.completed ? `${d.totalScore}/25` : ""} />
        <Item to="/search" icon="search" label={tx("ค้นหาคำสำคัญ", "Keyword Search")} />

        <div className="nav-group">{tx("หน่วยการเรียนรู้", "Learning Units")}</div>
        {content.units.map((u) => {
          const uTitle = lang === "en" && UNIT_EN_META[u.id] ? UNIT_EN_META[u.id].title : u.title;
          return <Item key={u.id} to={`/units/${u.id}`} icon="scale" label={`${u.id}. ${uTitle}`} meta={unitMeta(u.id)} />;
        })}

        <div className="nav-group">{tx("เอกสาร", "Documents")}</div>
        <Item to="/documents" icon="book" label={tx("เอกสารประกอบการเรียน", "Study Textbook")} meta={tx("82 หน้า", "82 pp.")} />
        <Item to="/report" icon="file" label={tx("ใบรายงานผล", "Progress Report")} />
        <Item to="/terms" icon="info" label={tx("คู่มือ & เงื่อนไข", "Guide & Terms")} />

        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{user.name.slice(0, 1)}</div>
            <div className="who">
              <strong title={user.name}>{user.name}</strong>
              <span className="muted">{isTeacher ? tx("ครูผู้สอน", "Instructor") : `${user.studentClass} · ${user.username}`}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title={tx("ออกจากระบบ", "Sign Out")} aria-label={tx("ออกจากระบบ", "Sign Out")}>
              <Icon name="logout" />
            </button>
          </div>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed var(--line)", color: "var(--ink-2)" }}>
            <DeveloperCredits style={{ fontSize: "0.78rem" }} />
          </div>
        </div>
      </aside>

      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav className="bottom-nav no-print" aria-label={tx("เมนูด่วน", "Quick Menu")}>
        {(isTeacher
          ? [["/teacher", "chart", tx("ภาพรวม", "Overview")], ["/teacher/students", "users", tx("นักเรียน", "Students")], ["/teacher/questions", "edit", tx("ข้อสอบ", "Quizzes")], ["/", "home", tx("มุมนักเรียน", "Student")]]
          : [["/", "home", tx("หน้าแรก", "Home")], ["/diagnostic", "compass", tx("ประเมิน", "Diagnostic")], ["/units/1", "scale", tx("บทเรียน", "Lessons")], ["/search", "search", tx("ค้นหา", "Search")]]
        ).map(([to, icon, label]) => {
          const active = to === "/units/1" ? loc.pathname.startsWith("/units") : loc.pathname === to;
          return (
            <Link key={to + label} to={to} className={active ? "active" : ""}>
              <Icon name={icon} size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className={open ? "active" : ""}>
          <Icon name="menu" size={20} />
          <span>{tx("เมนู", "Menu")}</span>
        </button>
      </nav>

      <div className="workspace">
        <header className="topbar no-print">
          <button type="button" className="btn btn-ghost menu-btn" onClick={() => setOpen(true)} aria-label={tx("เปิดเมนู", "Open Menu")}>
            <Icon name="menu" />
          </button>
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              nav(`/search?q=${encodeURIComponent(q.trim())}`);
            }}
          >
            <Icon name="search" size={16} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx("ค้นหาคำสำคัญ เช่น สมรสเท่าเทียม, มรดก, อายุความ...", "Search keywords e.g. Marriage Equality, Inheritance, PDPA...")}
              aria-label={tx("ค้นหาคำสำคัญ", "Search keywords")}
            />
          </form>
          <div className="row" style={{ gap: 8, flexWrap: "nowrap" }}>
            <LangToggle />
            <ThemeToggle className="topbar-theme" />
          </div>
        </header>
        <main className="main">
          <div key={pageKey} className="page-enter">
            <Outlet />
          </div>
          <footer className="no-print" style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, color: "var(--ink-2)", fontSize: "0.85rem" }}>
            <div>
              <strong>{tx("ห้องเรียนกฎหมายของครูนฤเบศ", "Kru Narubet's Law Classroom")}</strong> · {tx("รายวิชาสังคมศึกษา 6 (ส33102) โรงเรียนสวนกุหลาบวิทยาลัย ธนบุรี", "Social Studies 6 (SO33102) · Suankularb Wittayalai Thonburi School")}
            </div>
            <DeveloperCredits />
          </footer>
        </main>
      </div>
    </div>
  );
}

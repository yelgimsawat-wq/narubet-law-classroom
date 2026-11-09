import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./auth.jsx";
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
    if (has(up.postScore)) return `หลัง ${up.postScore}/20`;
    if (has(up.preScore)) return `ก่อน ${up.preScore}/20`;
    return "";
  };
  const isTeacher = user.role === "teacher";

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="เมนูหลัก">
        <NavLink to={isTeacher ? "/teacher" : "/"} className="brand">
          <img src="/logo.png" alt="" width="38" height="38" />
          <img className="school-emblem" src="/emblem.png" alt="ตราโรงเรียนสวนกุหลาบวิทยาลัย ธนบุรี" width="38" height="38" onError={(e) => (e.currentTarget.style.display = "none")} />
          <div>
            <strong>ห้องเรียนกฎหมายครูนฤเบศ</strong>
            <span>สังคมศึกษา 6 · ส33102</span>
          </div>
        </NavLink>

        {isTeacher && (
          <>
            <div className="nav-group">Backoffice ครู</div>
            <Item to="/teacher" end icon="chart" label="ภาพรวมชั้นเรียน" />
            <Item to="/teacher/students" icon="users" label="จัดการนักเรียน" />
            <Item to="/teacher/questions" icon="edit" label="คลังข้อสอบ" />
            <Item to="/teacher/content" icon="db" label="เนื้อหา & มินิเกม" />
          </>
        )}

        <div className="nav-group">{isTeacher ? "มุมมองนักเรียน" : "การเรียน"}</div>
        <Item to="/" end icon="home" label="แดชบอร์ด" />
        <Item to="/diagnostic" icon="compass" label="ประเมินแรกเข้า 25 ข้อ" meta={d.completed ? `${d.totalScore}/25` : ""} />
        <Item to="/search" icon="search" label="ค้นหาคำสำคัญ" />

        <div className="nav-group">หน่วยการเรียนรู้</div>
        {content.units.map((u) => (
          <Item key={u.id} to={`/units/${u.id}`} icon="scale" label={`${u.id}. ${u.title}`} meta={unitMeta(u.id)} />
        ))}

        <div className="nav-group">เอกสาร</div>
        <Item to="/documents" icon="book" label="เอกสารประกอบการเรียน" meta="82 หน้า" />
        <Item to="/report" icon="file" label="ใบรายงานผล" />
        <Item to="/terms" icon="info" label="คู่มือ & เงื่อนไข" />

        <div className="sidebar-foot">
          <div className="user-card">
            <div className="avatar">{user.name.slice(0, 1)}</div>
            <div className="who">
              <strong title={user.name}>{user.name}</strong>
              <span className="muted">{isTeacher ? "ครูผู้สอน" : `${user.studentClass} · ${user.username}`}</span>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout} title="ออกจากระบบ" aria-label="ออกจากระบบ">
              <Icon name="logout" />
            </button>
          </div>
        </div>
      </aside>

      {open && <div className="drawer-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />}

      <nav className="bottom-nav no-print" aria-label="เมนูด่วน">
        {(isTeacher
          ? [["/teacher", "chart", "ภาพรวม"], ["/teacher/students", "users", "นักเรียน"], ["/teacher/questions", "edit", "ข้อสอบ"], ["/", "home", "มุมนักเรียน"]]
          : [["/", "home", "หน้าแรก"], ["/diagnostic", "compass", "ประเมิน"], ["/units/1", "scale", "บทเรียน"], ["/search", "search", "ค้นหา"]]
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
          <span>เมนู</span>
        </button>
      </nav>

      <div className="workspace">
        <header className="topbar no-print">
          <button type="button" className="btn btn-ghost menu-btn" onClick={() => setOpen(true)} aria-label="เปิดเมนู">
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
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาคำสำคัญ เช่น สมรสเท่าเทียม, มรดก, อายุความ..." aria-label="ค้นหาคำสำคัญ" />
          </form>
          <ThemeToggle className="topbar-theme" />
        </header>
        <main className="main">
          <div key={pageKey} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

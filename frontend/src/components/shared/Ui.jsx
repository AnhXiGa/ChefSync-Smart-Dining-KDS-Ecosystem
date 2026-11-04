import { Link, useLocation, useNavigate } from "react-router-dom";
import { navigationGroups } from "../../data/navigationData";
import { canAccessPath, getStoredUser } from "../../auth/roleAccess";

export function StatusBadge({ children, kind = "green" }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

export function Icon({ children }) {
  return (
    <span className="nav-icon" aria-hidden="true">
      {children}
    </span>
  );
}

export function Sidebar({ role = "staff" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const visibleGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(([, , , path]) => path && canAccessPath(path, user?.roles)),
    }))
    .filter((group) => group.items.length > 0);

  const logout = () => {
    localStorage.removeItem("smart-pos-user");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <Link
        className="brand"
        to={
          role === "manager"
            ? "/manager"
            : role === "kitchen"
              ? "/kitchen"
              : "/staff/tables"
        }
      >
        <span className="brand-mark">♜</span>
        <span>Smart POS</span>
      </Link>
      <div className="restaurant-card">
        <strong>Nhà hàng An Nhiên</strong>
        <small>Chi nhánh Nguyễn Huệ</small>
      </div>
      <nav>
        {visibleGroups.map((group) => (
          <div className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>
            {group.items.map(([id, icon, label, path]) =>
              path ? (
                <Link
                  className={`nav-item ${location.pathname === path || (path !== "/manager" && location.pathname.startsWith(`${path}/`)) ? "active" : ""}`}
                  to={path}
                  key={id}
                >
                  <Icon>{icon}</Icon>
                  {label}
                </Link>
              ) : (
                <button className="nav-item" key={id}>
                  <Icon>{icon}</Icon>
                  {label}
                </button>
              ),
            )}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span>Trợ giúp</span>
        <span>·</span>
        <button type="button" onClick={logout}>Đăng xuất</button>
      </div>
    </aside>
  );
}

export function Topbar({ title = "Minh Anh · Quản lý", onLogout }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        Nhà hàng An Nhiên <span>/</span> Ca trưa
      </div>
      <div className="topbar-right">
        <span>18/10/2026 · Ca trưa</span>
        <span className="bell">♧</span>
        <span className="notice">3 thông báo</span>
        <span className="avatar">MH</span>
        <strong>{title}</strong>
        <button className="topbar-logout" type="button" onClick={onLogout}>Đăng xuất</button>
      </div>
    </header>
  );
}

export function BackofficeLayout({ children, role = "staff", title }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const logout = () => {
    localStorage.removeItem("smart-pos-user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <div className="main-shell">
        <Topbar title={user?.fullName ?? title} onLogout={logout} />
        {children}
      </div>
    </div>
  );
}

export function PageTitle({ eyebrow, title, description, action }) {
  return (
    <div className="page-title">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

export function FoodImage({ tone }) {
  return (
    <div className={`food-image ${tone}`}>
      <span>{tone === "tea" || tone === "juice" ? "◒" : "✦"}</span>
    </div>
  );
}

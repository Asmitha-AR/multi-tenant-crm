import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../app/auth-store";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isProPlan = user?.organization?.subscription_plan === "PRO";

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-kicker">Workspace</p>
          <h1>CRM</h1>
          <p className="sidebar-org">{user?.organization?.name}</p>
        </div>

        <div className="sidebar-status">
          <div className="sidebar-status-row">
            <span>Plan</span>
            <strong>{user?.organization?.subscription_plan}</strong>
          </div>
          <div className="sidebar-status-row">
            <span>User</span>
            <strong>{user?.username}</strong>
          </div>
          <div className="sidebar-status-row">
            <span>Role</span>
            <strong>{user?.role}</strong>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`} to="/">
            Dashboard
          </NavLink>
          <NavLink className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`} to="/companies">
            Companies
          </NavLink>
          {isProPlan ? (
            <NavLink className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`} to="/activity-logs">
              Activity Logs
            </NavLink>
          ) : null}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          Sign out
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

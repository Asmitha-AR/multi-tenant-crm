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

        <div className="sidebar-plan">
          <span className="sidebar-plan-label">Subscription</span>
          <strong>{user?.organization?.subscription_plan}</strong>
          <p>{isProPlan ? "Audit visibility and logo uploads are unlocked." : "Core CRM access with essentials only."}</p>
        </div>

        <div className="sidebar-user">
          <span>Signed in as</span>
          <strong>{user?.username}</strong>
          <p>{user?.role}</p>
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
          Logout
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Outlet } from "react-router-dom";
import { useAuthStore } from "../app/auth-store";

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>CRM</h1>
        <p>{user?.organization?.name}</p>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/companies">Companies</Link>
          <Link to="/activity-logs">Activity Logs</Link>
        </nav>
        <button onClick={logout}>Logout</button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}


import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "../app/auth-store";

function MenuIcon({ type }: { type: "dashboard" | "services" | "companies" | "contacts" | "activity" | "logout" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "dashboard") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="11" width="7" height="10" rx="1.5" />
        <rect x="3" y="13" width="7" height="8" rx="1.5" />
      </svg>
    );
  }

  if (type === "companies") {
    return (
      <svg {...common}>
        <path d="M4 20h16" />
        <path d="M6 20V8l6-4 6 4v12" />
        <path d="M10 20v-4h4v4" />
        <path d="M9 10h.01" />
        <path d="M15 10h.01" />
      </svg>
    );
  }

  if (type === "services") {
    return (
      <svg {...common}>
        <path d="M4 7h16" />
        <path d="M7 7v10" />
        <path d="M17 7v10" />
        <path d="M4 17h16" />
        <path d="M10 12h4" />
      </svg>
    );
  }

  if (type === "contacts") {
    return (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M17 8h4" />
        <path d="M19 6v4" />
      </svg>
    );
  }

  if (type === "activity") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2.5-6 5 12 2.5-6H21" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

type NavItem = {
  to: string;
  label: string;
  icon: "dashboard" | "services" | "companies" | "contacts" | "activity";
};

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navItems: NavItem[] = [
    { to: "/", label: "Dashboard", icon: "dashboard" as const },
    { to: "/services", label: "Services", icon: "services" as const },
    { to: "/companies", label: "Companies", icon: "companies" as const },
    { to: "/contacts", label: "Contacts", icon: "contacts" as const },
  ];
  if (isProPlan) {
    navItems.push({ to: "/activity-logs", label: "Activity Logs", icon: "activity" as const });
  }

  return (
    <div className={`shell ${sidebarOpen ? "" : "shell-collapsed"}`}>
      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
        <div className="sidebar-top">
          <button
            className="sidebar-toggle sidebar-toggle-inline"
            type="button"
            onClick={() => setSidebarOpen((current) => !current)}
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            title={sidebarOpen ? "Hide menu" : "Show menu"}
          >
            <span className="sidebar-toggle-icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>

          <div className="sidebar-brand">
            <h1>{sidebarOpen ? "CRM" : "C"}</h1>
            {sidebarOpen ? <p className="sidebar-org">{user?.organization?.name}</p> : null}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} className={({ isActive }) => `nav-pill ${isActive ? "active" : ""}`} to={item.to}>
              <span className="nav-pill-icon">
                <MenuIcon type={item.icon} />
              </span>
              {sidebarOpen ? <span className="nav-pill-label">{item.label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          {sidebarOpen ? (
            "Sign out"
          ) : (
            <>
              <span className="nav-pill-icon">
                <MenuIcon type="logout" />
              </span>
              <span className="sr-only">Sign out</span>
            </>
          )}
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

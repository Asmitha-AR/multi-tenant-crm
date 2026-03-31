import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [metrics, setMetrics] = useState({
    companies: 0,
    contacts: 0,
    activities: 0,
  });

  useEffect(() => {
    async function loadMetrics() {
      const [companies, contacts, activities] = await Promise.all([
        apiClient.get("/companies/"),
        apiClient.get("/contacts/"),
        apiClient.get("/activity-logs/"),
      ]);
      setMetrics({
        companies: companies.data.data.count,
        contacts: contacts.data.data.count,
        activities: activities.data.data.count,
      });
    }

    void loadMetrics();
  }, []);

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-kicker">Organization Dashboard</p>
          <h2>Operate your client portfolio with clarity and control.</h2>
          <p className="dashboard-description">
            Track account growth, team access, and customer activity from a workspace scoped to{" "}
            {user?.organization?.name}.
          </p>
        </div>

        <div className="dashboard-hero-card">
          <span className="dashboard-hero-label">Current plan</span>
          <strong>{user?.organization?.subscription_plan}</strong>
          <p>{isProPlan ? "Premium activity visibility is active for this workspace." : "Upgrade to Pro for activity logs and logo uploads."}</p>
        </div>
      </div>

      <div className="dashboard-metrics">
        <article className="metric-card metric-accent">
          <span className="metric-label">Workspace User</span>
          <h3>{user?.username}</h3>
          <p>{user?.role}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Companies</span>
          <h3>{metrics.companies}</h3>
          <p>Active organization accounts</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Contacts</span>
          <h3>{metrics.contacts}</h3>
          <p>Customer relationships in pipeline</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Audit Entries</span>
          <h3>{metrics.activities}</h3>
          <p>{isProPlan ? "Recorded changes across CRM activity" : "Available after Pro upgrade"}</p>
        </article>
      </div>

      <div className="dashboard-panels">
        <article className="dashboard-panel">
          <p className="dashboard-panel-kicker">Access Model</p>
          <h3>Tenant-safe operations</h3>
          <p>
            Every company, contact, and audit record is scoped to the authenticated organization through tenant-aware
            middleware, managers, and API filtering.
          </p>
        </article>

        <article className="dashboard-panel">
          <p className="dashboard-panel-kicker">Role Controls</p>
          <h3>Action limits by responsibility</h3>
          <p>
            Admin users can delete, Managers can update, and Staff members are kept to limited write flows for safer
            day-to-day usage.
          </p>
        </article>

        <article className="dashboard-panel dashboard-panel-tint">
          <p className="dashboard-panel-kicker">Recommended Demo Flow</p>
          <h3>Show the strongest path first</h3>
          <p>
            Start with company creation, move into contact management, then open activity logs to demonstrate
            subscription-aware feature access.
          </p>
        </article>
      </div>
    </section>
  );
}

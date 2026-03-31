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
        <div className="dashboard-hero-main">
          <p className="dashboard-kicker">Organization Dashboard</p>
          <h2>Welcome back, {user?.username}.</h2>
          <p className="dashboard-description">
            Here’s a quick overview of your {user?.organization?.name} workspace.
          </p>

          <div className="dashboard-quick-row">
            <div className="dashboard-quick-chip">
              <span>Workspace</span>
              <strong>{user?.organization?.name}</strong>
            </div>
            <div className="dashboard-quick-chip">
              <span>Role</span>
              <strong>{user?.role}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-hero-card">
          <span className="dashboard-hero-label">Current plan</span>
          <strong>{user?.organization?.subscription_plan}</strong>
          <p>{isProPlan ? "Activity visibility and logo uploads are enabled." : "Upgrade to Pro for advanced workspace features."}</p>
        </div>
      </div>

      <div className="dashboard-metrics">
        <article className="metric-card metric-accent">
          <span className="metric-label">Companies</span>
          <h3>{metrics.companies}</h3>
          <p>Active company records</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Contacts</span>
          <h3>{metrics.contacts}</h3>
          <p>Customer contact records</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Activity Logs</span>
          <h3>{metrics.activities}</h3>
          <p>{isProPlan ? "Tracked changes in the workspace" : "Available on Pro plan"}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Access</span>
          <h3>{user?.role}</h3>
          <p>Role-based permission level</p>
        </article>
      </div>

      <div className="dashboard-panels">
        <article className="dashboard-panel">
          <p className="dashboard-panel-kicker">Tenant Safety</p>
          <h3>Organization data stays isolated</h3>
          <p>All records are scoped to the authenticated organization.</p>
        </article>

        <article className="dashboard-panel">
          <p className="dashboard-panel-kicker">Permissions</p>
          <h3>Actions follow user roles</h3>
          <p>Admin, Manager, and Staff access is limited by responsibility.</p>
        </article>

        <article className="dashboard-panel dashboard-panel-tint">
          <p className="dashboard-panel-kicker">Next Step</p>
          <h3>Continue from companies</h3>
          <p>Use the sidebar to manage companies, contacts, and activity records.</p>
        </article>
      </div>

      <div className="dashboard-secondary">
        <article className="dashboard-feature-card">
          <p className="dashboard-panel-kicker">Workspace Focus</p>
          <h3>What this CRM is optimized for</h3>
          <div className="dashboard-feature-list">
            <div className="dashboard-feature-item">
              <strong>Account organization</strong>
              <span>Keep company records structured and easy to review.</span>
            </div>
            <div className="dashboard-feature-item">
              <strong>Contact tracking</strong>
              <span>Store the right people against the right companies.</span>
            </div>
            <div className="dashboard-feature-item">
              <strong>Controlled access</strong>
              <span>Keep teams aligned with role-based permissions.</span>
            </div>
          </div>
        </article>

        <article className="dashboard-feature-card dashboard-feature-card-accent">
          <p className="dashboard-panel-kicker">Quick Actions</p>
          <h3>Best places to continue</h3>
          <div className="dashboard-action-grid">
            <div className="dashboard-action-tile">
              <strong>Open Companies</strong>
              <span>Review account records and update company details.</span>
            </div>
            <div className="dashboard-action-tile">
              <strong>Manage Contacts</strong>
              <span>Open a company to add or edit related contacts.</span>
            </div>
            <div className="dashboard-action-tile">
              <strong>View Activity</strong>
              <span>{isProPlan ? "Audit history is ready from the sidebar." : "Available after upgrading the workspace plan."}</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

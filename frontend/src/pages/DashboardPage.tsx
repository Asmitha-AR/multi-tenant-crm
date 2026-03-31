import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type CompanySummary = {
  id: number;
  industry: string;
};

type ContactSummary = {
  id: number;
  created_at: string;
};

type ActivitySummary = {
  id: number;
  action: string;
  created_at: string;
};

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [metrics, setMetrics] = useState({
    companies: 0,
    contacts: 0,
    activities: 0,
  });
  const [companiesData, setCompaniesData] = useState<CompanySummary[]>([]);
  const [contactsData, setContactsData] = useState<ContactSummary[]>([]);
  const [activitiesData, setActivitiesData] = useState<ActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMetrics() {
    try {
      setLoading(true);
      setError("");
      const requests = [
        apiClient.get("/companies/?page_size=100"),
        apiClient.get("/contacts/?page_size=100"),
        isProPlan
          ? apiClient.get("/activity-logs/?page_size=100")
          : Promise.resolve({ data: { data: { count: 0, results: [] } } }),
      ];
      const [companies, contacts, activities] = await Promise.all(requests);
      setMetrics({
        companies: companies.data.data.count,
        contacts: contacts.data.data.count,
        activities: activities.data.data.count,
      });
      setCompaniesData(companies.data.data.results);
      setContactsData(contacts.data.data.results);
      setActivitiesData(activities.data.data.results ?? []);
    } catch {
      setError("We couldn't load the latest dashboard summary. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
  }, [isProPlan]);

  const industryCounts = companiesData.reduce<Record<string, number>>((accumulator, company) => {
    const key = company.industry || "Other";
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
  const topIndustries = Object.entries(industryCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const maxIndustryCount = topIndustries[0]?.[1] ?? 1;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const contactsAddedThisWeek = contactsData.filter((contact) => new Date(contact.created_at) >= weekAgo).length;

  const recentActivityCounts = activitiesData.reduce<Record<string, number>>((accumulator, log) => {
    accumulator[log.action] = (accumulator[log.action] ?? 0) + 1;
    return accumulator;
  }, {});

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

      {error ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Dashboard unavailable</strong>
            <p>{error}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void loadMetrics()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="dashboard-metrics">
        <article className="metric-card metric-accent">
          <span className="metric-label">Companies</span>
          <h3>{loading ? "--" : metrics.companies}</h3>
          <p>{loading ? "Loading workspace data..." : "Active company records"}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Contacts</span>
          <h3>{loading ? "--" : metrics.contacts}</h3>
          <p>{loading ? "Loading workspace data..." : "Customer contact records"}</p>
        </article>
        <article className="metric-card">
          <span className="metric-label">Activity Logs</span>
          <h3>{loading ? "--" : metrics.activities}</h3>
          <p>{loading ? "Loading workspace data..." : isProPlan ? "Tracked changes in the workspace" : "Available on Pro plan"}</p>
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

      <div className="dashboard-analytics">
        <article className="dashboard-feature-card">
          <p className="dashboard-panel-kicker">Industry mix</p>
          <h3>Companies by industry</h3>
          <div className="dashboard-chart-list">
            {loading ? (
              <p className="page-feedback">Loading industry distribution...</p>
            ) : topIndustries.length > 0 ? (
              topIndustries.map(([industry, count]) => (
                <div className="dashboard-chart-row" key={industry}>
                  <div className="dashboard-chart-label">
                    <span>{industry}</span>
                    <strong>{count}</strong>
                  </div>
                  <div className="dashboard-chart-track">
                    <div
                      className="dashboard-chart-fill"
                      style={{ width: `${Math.max((count / maxIndustryCount) * 100, 18)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="page-feedback">Add companies to see industry distribution.</p>
            )}
          </div>
        </article>

        <article className="dashboard-feature-card dashboard-feature-card-accent">
          <p className="dashboard-panel-kicker">Recent activity</p>
          <h3>Latest audit summary</h3>
          {isProPlan ? (
            <div className="dashboard-activity-summary">
              <div className="dashboard-activity-pill">
                <span>Create</span>
                <strong>{recentActivityCounts.CREATE ?? 0}</strong>
              </div>
              <div className="dashboard-activity-pill">
                <span>Update</span>
                <strong>{recentActivityCounts.UPDATE ?? 0}</strong>
              </div>
              <div className="dashboard-activity-pill">
                <span>Delete</span>
                <strong>{recentActivityCounts.DELETE ?? 0}</strong>
              </div>
            </div>
          ) : (
            <p className="page-feedback">Upgrade to Pro to review action-level audit summaries here.</p>
          )}
        </article>

        <article className="dashboard-feature-card">
          <p className="dashboard-panel-kicker">Weekly momentum</p>
          <h3>Contacts added this week</h3>
          <div className="dashboard-weekly-stat">
            <strong>{loading ? "--" : contactsAddedThisWeek}</strong>
            <span>{contactsAddedThisWeek > 0 ? "New contact records created in the last 7 days." : "No new contacts were added in the last 7 days."}</span>
          </div>
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

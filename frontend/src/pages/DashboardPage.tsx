import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type CompanySummary = {
  id: number;
  name: string;
  industry: string;
  country: string;
};

type ContactSummary = {
  id: number;
  full_name: string;
  role: string;
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
  const topActivityAction =
    Object.entries(recentActivityCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "No activity";
  const recentContacts = [...contactsData]
    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
    .slice(0, 4);
  const featuredCompanies = [...companiesData].slice(0, 4);
  const topIndustry = topIndustries[0]?.[0] ?? "No companies yet";
  const marketCount = new Set(companiesData.map((company) => company.country).filter(Boolean)).size;
  const latestContact = recentContacts[0];

  return (
    <section className="dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-main">
          <p className="dashboard-kicker">Workspace Overview</p>
          <h2>Welcome, {user?.username}.</h2>
          <p className="dashboard-description">A live view of your companies, contacts, and workspace activity.</p>

          <div className="dashboard-quick-row">
          </div>
        </div>

        <div className="dashboard-hero-card">
          <span className="dashboard-hero-label">Current plan</span>
          <strong>{user?.organization?.subscription_plan}</strong>
          <p>{isProPlan ? "Audit visibility and logo uploads are active for this workspace." : "Core CRM access is active for this workspace."}</p>
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
            <>
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
              <div className="dashboard-activity-insights">
                <div className="dashboard-activity-insight">
                  <span>Total entries</span>
                  <strong>{metrics.activities}</strong>
                </div>
                <div className="dashboard-activity-insight">
                  <span>Most common</span>
                  <strong>{topActivityAction}</strong>
                </div>
              </div>
            </>
          ) : (
            <p className="page-feedback">Upgrade to Pro to review action-level audit summaries here.</p>
          )}
        </article>

        <article className="dashboard-feature-card">
          <p className="dashboard-panel-kicker">Weekly momentum</p>
          <h3>Contacts added this week</h3>
          <div className="dashboard-weekly-card">
            <div className="dashboard-weekly-stat">
              <strong>{loading ? "--" : contactsAddedThisWeek}</strong>
              <span>{contactsAddedThisWeek > 0 ? "New contact records created in the last 7 days." : "No new contacts were added in the last 7 days."}</span>
            </div>
            <div className="dashboard-weekly-highlight">
              <span>Latest addition</span>
              <strong>{latestContact?.full_name || "No recent contact"}</strong>
              <p>{latestContact?.role || "Waiting for new relationship activity."}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="dashboard-records">
        <article className="dashboard-feature-card">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-panel-kicker">Latest Contacts</p>
              <h3>Recent relationship updates</h3>
            </div>
            <Link className="secondary-button" to="/contacts">
              View Contacts
            </Link>
          </div>
          <div className="dashboard-record-list">
            {loading ? (
              <p className="page-feedback">Loading recent contacts...</p>
            ) : recentContacts.length > 0 ? (
              recentContacts.map((contact) => (
                <div className="dashboard-record-item" key={contact.id}>
                  <div className="dashboard-record-avatar">
                    {contact.full_name?.slice(0, 2).toUpperCase() || "CT"}
                  </div>
                  <div className="dashboard-record-copy">
                    <strong>{contact.full_name}</strong>
                    <span>
                      {contact.role || "Workspace contact"} • {new Date(contact.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="page-feedback">No contacts available yet.</p>
            )}
          </div>
        </article>

        <article className="dashboard-feature-card dashboard-feature-card-accent">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-panel-kicker">Recent Companies</p>
              <h3>Accounts in the workspace</h3>
            </div>
            <Link className="secondary-button" to="/companies">
              View Companies
            </Link>
          </div>
          <div className="dashboard-record-list">
            {loading ? (
              <p className="page-feedback">Loading companies...</p>
            ) : featuredCompanies.length > 0 ? (
              featuredCompanies.map((company) => (
                <div className="dashboard-record-item" key={company.id}>
                  <div className="dashboard-record-badge">{company.name.slice(0, 1).toUpperCase()}</div>
                  <div className="dashboard-record-copy">
                    <strong>{company.name}</strong>
                    <span>
                      {company.industry || "General"} {company.country ? `• ${company.country}` : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="page-feedback">No companies available yet.</p>
            )}
          </div>
        </article>

        <article className="dashboard-feature-card">
          <div className="dashboard-section-header">
            <div>
              <p className="dashboard-panel-kicker">Workspace Snapshot</p>
              <h3>What matters today</h3>
            </div>
          </div>
          <div className="dashboard-snapshot-grid">
            <div className="dashboard-snapshot-tile dashboard-snapshot-tile-spotlight">
              <span>Leading sector</span>
              <strong>{topIndustry}</strong>
              <p>Most represented industry in the current company mix.</p>
            </div>
            <div className="dashboard-snapshot-tile dashboard-snapshot-tile-accent">
              <span>Markets covered</span>
              <strong>{loading ? "--" : marketCount}</strong>
              <p>Active countries represented across the workspace companies.</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

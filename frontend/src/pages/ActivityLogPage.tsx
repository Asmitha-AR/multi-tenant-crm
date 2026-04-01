import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type ActivityLog = {
  id: number;
  performed_by: string;
  action: string;
  model_name: string;
  object_id: number;
  created_at: string;
};

export function ActivityLogPage() {
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    model: "",
    user: "",
    date_from: "",
    date_to: "",
  });

  async function loadLogs() {
    if (user?.organization?.subscription_plan !== "PRO") {
      setError("Activity logs are available only on the Pro plan.");
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page) });
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        }
      });
      const response = await apiClient.get(`/activity-logs/?${params.toString()}`);
      setLogs(response.data.data.results);
      setNumPages(response.data.data.num_pages);
    } catch {
      setError("We couldn't load activity logs right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLogs();
  }, [page, user?.organization?.subscription_plan, filters]);

  function updateFilter(name: keyof typeof filters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({
      action: "",
      model: "",
      user: "",
      date_from: "",
      date_to: "",
    });
  }

  return (
    <section className="activity-shell">
      <div className="page-hero">
        <div className="page-hero-copy">
          <p className="page-kicker">Audit Console</p>
          <h2>Activity Logs</h2>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Audit access</span>
          <strong>{isProPlan ? "Enabled" : "Locked"}</strong>
          <p>{isProPlan ? "This workspace can review premium audit history." : "Upgrade to Pro to unlock activity history."}</p>
        </div>
      </div>

      {loading ? <div className="feedback-card"><strong>Loading activity logs</strong><p>Please wait while we prepare the audit timeline.</p></div> : null}
      {error ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Audit feed unavailable</strong>
            <p>{error}</p>
          </div>
          {isProPlan ? (
            <button className="secondary-button" type="button" onClick={() => void loadLogs()}>
              Retry
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="filter-card">
        <div className="filter-grid filter-grid-activity">
          <label className="form-field">
            <span>Action</span>
            <select value={filters.action} onChange={(e) => updateFilter("action", e.target.value)}>
              <option value="">All actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </label>

          <label className="form-field">
            <span>Model</span>
            <select value={filters.model} onChange={(e) => updateFilter("model", e.target.value)}>
              <option value="">All models</option>
              <option value="Company">Company</option>
              <option value="Contact">Contact</option>
            </select>
          </label>

          <label className="form-field">
            <span>User</span>
            <input
              value={filters.user}
              onChange={(e) => updateFilter("user", e.target.value)}
              placeholder="Search username"
            />
          </label>

          <label className="form-field">
            <span>Date from</span>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Date to</span>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
            />
          </label>
          <div className="filter-actions">
            <button className="secondary-button" type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="activity-overview">
        <article className="activity-overview-card activity-overview-card-accent">
          <span>Entries on this page</span>
          <strong>{logs.length}</strong>
          <p>Recent audit items visible in the current timeline view.</p>
        </article>
        <article className="activity-overview-card">
          <span>Current page</span>
          <strong>{page}</strong>
          <p>Browse the audit stream page by page.</p>
        </article>
        <article className="activity-overview-card">
          <span>Coverage</span>
          <strong>{isProPlan ? "Full" : "Limited"}</strong>
          <p>{isProPlan ? "Create, update, and delete actions are visible." : "Advanced audit access depends on plan level."}</p>
        </article>
      </div>

      {!loading && !error && logs.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No activity yet</strong>
          <p>When users create, update, or delete records, those actions will appear here.</p>
        </div>
      ) : null}

      <div className="activity-grid">
        {logs.map((log) => (
          <article className="activity-card" key={log.id}>
            <div className="activity-card-top">
              <span className={`activity-badge activity-${log.action.toLowerCase()}`}>{log.action}</span>
              <span className="activity-time">{new Date(log.created_at).toLocaleString()}</span>
            </div>

            <div className="activity-entity-row">
              <div className={`activity-icon activity-${log.action.toLowerCase()}-icon`}>
                {log.model_name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3>{log.model_name}</h3>
                <p className="activity-actor">{log.performed_by}</p>
              </div>
            </div>

            <div className="activity-meta">
              <div>
                <span>Object</span>
                <strong>#{log.object_id}</strong>
              </div>
              <div>
                <span>Action</span>
                <strong>{log.action}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination-bar">
        <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          Previous
        </button>
        <span className="pagination-label">
          Page {page} of {numPages}
        </span>
        <button
          className="secondary-button"
          type="button"
          disabled={page >= numPages}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

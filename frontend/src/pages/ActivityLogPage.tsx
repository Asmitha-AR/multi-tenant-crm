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

  useEffect(() => {
    if (user?.organization?.subscription_plan !== "PRO") {
      setError("Activity logs are available only on the Pro plan.");
      setLogs([]);
      return;
    }
    async function loadLogs() {
      try {
        const response = await apiClient.get(`/activity-logs/?page=${page}`);
        setLogs(response.data.data.results);
        setNumPages(response.data.data.num_pages);
      } catch {
        setError("Failed to load activity logs.");
      }
    }

    void loadLogs();
  }, [page, user?.organization?.subscription_plan]);

  return (
    <section className="activity-shell">
      <div className="page-hero">
        <div>
          <p className="page-kicker">Audit Console</p>
          <h2>Activity Logs</h2>
          <p className="page-description">
            Review how users are creating, updating, and deleting records across your CRM workspace with a clean
            activity timeline.
          </p>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Audit access</span>
          <strong>{isProPlan ? "Enabled" : "Locked"}</strong>
          <p>{isProPlan ? "This workspace can review premium audit history." : "Upgrade to Pro to unlock activity history."}</p>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      <div className="activity-grid">
        {logs.map((log) => (
          <article className="activity-card" key={log.id}>
            <div className="activity-card-top">
              <span className={`activity-badge activity-${log.action.toLowerCase()}`}>{log.action}</span>
              <span className="activity-time">{new Date(log.created_at).toLocaleString()}</span>
            </div>
            <h3>{log.model_name}</h3>
            <p className="activity-actor">{log.performed_by}</p>
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

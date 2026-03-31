import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

type ActivityLog = {
  id: number;
  performed_by: string;
  action: string;
  model_name: string;
  object_id: number;
  created_at: string;
};

export function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, [page]);

  return (
    <section>
      <h2>Activity Logs</h2>
      {error ? <p className="error">{error}</p> : null}
      <div className="stack">
        {logs.map((log) => (
          <article className="card" key={log.id}>
            <h3>{log.action}</h3>
            <p>{log.performed_by}</p>
            <p>{log.model_name} #{log.object_id}</p>
            <p>{new Date(log.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
      <div className="actions">
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
          Previous
        </button>
        <span>
          Page {page} of {numPages}
        </span>
        <button type="button" disabled={page >= numPages} onClick={() => setPage((current) => current + 1)}>
          Next
        </button>
      </div>
    </section>
  );
}

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

  useEffect(() => {
    async function loadLogs() {
      const response = await apiClient.get("/activity-logs/");
      setLogs(response.data.data.results);
    }

    void loadLogs();
  }, []);

  return (
    <section>
      <h2>Activity Logs</h2>
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
    </section>
  );
}


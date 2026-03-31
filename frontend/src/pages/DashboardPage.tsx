import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
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
    <section>
      <h2>Organization Dashboard</h2>
      <div className="grid">
        <article className="card">
          <h3>Welcome</h3>
          <p>{user?.username}</p>
        </article>
        <article className="card">
          <h3>Role</h3>
          <p>{user?.role}</p>
        </article>
        <article className="card">
          <h3>Plan</h3>
          <p>{user?.organization?.subscription_plan}</p>
        </article>
        <article className="card">
          <h3>Companies</h3>
          <p>{metrics.companies}</p>
        </article>
        <article className="card">
          <h3>Contacts</h3>
          <p>{metrics.contacts}</p>
        </article>
        <article className="card">
          <h3>Audit Entries</h3>
          <p>{metrics.activities}</p>
        </article>
      </div>
    </section>
  );
}

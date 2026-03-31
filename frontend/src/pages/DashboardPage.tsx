import { useAuthStore } from "../app/auth-store";

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);

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
      </div>
    </section>
  );
}


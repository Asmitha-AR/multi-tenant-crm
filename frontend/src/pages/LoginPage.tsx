import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../app/auth-store";

export function LoginPage() {
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(username, password);
    } catch {
      setError("Login failed. Check your credentials.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-copy">
          <p className="auth-eyebrow">Multi-Tenant CRM</p>
          <h1>Manage every client relationship with tenant-safe control.</h1>
          <p className="auth-description">
            Built for structured sales operations, team visibility, and role-aware access across multiple
            organizations.
          </p>
          <div className="auth-highlights">
            <div className="auth-highlight-card">
              <span>01</span>
              <strong>Tenant isolation</strong>
              <p>Each organization works inside its own protected data boundary.</p>
            </div>
            <div className="auth-highlight-card">
              <span>02</span>
              <strong>Audit visibility</strong>
              <p>Track important CRM changes with structured activity history.</p>
            </div>
            <div className="auth-highlight-card">
              <span>03</span>
              <strong>Role-based control</strong>
              <p>Admin, Manager, and Staff flows align with real operational needs.</p>
            </div>
          </div>
        </div>

        <form className="auth-panel" onSubmit={handleSubmit}>
          <div className="auth-panel-header">
            <p className="auth-badge">Secure Workspace</p>
            <h2>Welcome back</h2>
            <p>Sign in to access your organization dashboard and customer workspace.</p>
          </div>

          <label className="auth-field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </label>

          {error ? <p className="error auth-error">{error}</p> : null}

          <button className="auth-submit" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="auth-footer-note">
            <span>Recommended demo:</span>
            <strong>alpha_admin / alpha12345</strong>
          </div>
        </form>
      </div>
    </div>
  );
}

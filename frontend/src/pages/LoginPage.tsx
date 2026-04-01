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
          <h1>Secure client operations for modern teams.</h1>
          <p className="auth-description">A focused CRM workspace for companies, contacts, and daily customer operations.</p>
        </div>

        <form className="auth-panel" onSubmit={handleSubmit}>
          <div className="auth-panel-header">
            <h2>Welcome</h2>
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

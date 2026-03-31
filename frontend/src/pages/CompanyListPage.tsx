import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type Company = {
  id: number;
  name: string;
  industry: string;
  country: string;
  logo_url?: string | null;
};

export function CompanyListPage() {
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [form, setForm] = useState({ name: "", industry: "", country: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadCompanies() {
      try {
        setLoading(true);
        const response = await apiClient.get(`/companies/?page=${page}&search=${encodeURIComponent(search)}`);
        setCompanies(response.data.data.results);
        setNumPages(response.data.data.num_pages);
      } catch {
        setError("Failed to load companies.");
      } finally {
        setLoading(false);
      }
    }

    void loadCompanies();
  }, [page, search]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("industry", form.industry);
      payload.append("country", form.country);
      if (logoFile) {
        payload.append("logo", logoFile);
      }
      if (editingId) {
        await apiClient.patch(`/companies/${editingId}/`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await apiClient.post("/companies/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setForm({ name: "", industry: "", country: "" });
      setEditingId(null);
      setLogoFile(null);
      const response = await apiClient.get(`/companies/?page=${page}&search=${encodeURIComponent(search)}`);
      setCompanies(response.data.data.results);
      setNumPages(response.data.data.num_pages);
    } catch (submitError: any) {
      setError(submitError.response?.data?.errors?.detail ?? "Unable to save company.");
    }
  }

  function startEdit(company: Company) {
    setEditingId(company.id);
    setForm({
      name: company.name,
      industry: company.industry,
      country: company.country,
    });
    setLogoFile(null);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this company?")) {
      return;
    }
    await apiClient.delete(`/companies/${id}/`);
    const response = await apiClient.get(`/companies/?page=${page}&search=${encodeURIComponent(search)}`);
    setCompanies(response.data.data.results);
    setNumPages(response.data.data.num_pages);
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDelete = user?.role === "ADMIN";

  return (
    <section className="companies-shell">
      <div className="page-hero">
        <div>
          <p className="page-kicker">CRM Directory</p>
          <h2>Companies</h2>
          <p className="page-description">
            Organize client accounts, keep branding assets attached to each company, and move into contact management
            from a cleaner workspace.
          </p>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Current results</span>
          <strong>{companies.length}</strong>
          <p>{loading ? "Refreshing company records..." : "Visible companies on this page."}</p>
        </div>
      </div>

      <div className="company-toolbar">
        <label className="search-field">
          <span>Search</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies" />
        </label>
        <div className="toolbar-meta">
          <span>{numPages} pages</span>
          <strong>{isProPlan ? "Pro workspace" : "Basic workspace"}</strong>
        </div>
      </div>

      <form className="company-form-card" onSubmit={handleSubmit}>
        <div className="company-form-header">
          <div>
            <p className="page-kicker">Company Editor</p>
            <h3>{editingId ? "Refine company details" : "Create a new company"}</h3>
          </div>
          <p>{editingId ? "Update identity, market, or country information." : "Add a new account and keep your client portfolio structured."}</p>
        </div>

        <div className="company-form-grid">
          <label className="form-field">
            <span>Company name</span>
            <input
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              placeholder="Atlas Trading"
              required
            />
          </label>
          <label className="form-field">
            <span>Industry</span>
            <input
              value={form.industry}
              onChange={(e) => setForm((current) => ({ ...current, industry: e.target.value }))}
              placeholder="Logistics"
              required
            />
          </label>
          <label className="form-field">
            <span>Country</span>
            <input
              value={form.country}
              onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
              placeholder="Sri Lanka"
              required
            />
          </label>
          <div className="form-field">
            <span>Logo</span>
            {isProPlan ? (
              <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
            ) : (
              <p className="plan-note">Logo upload is available on the Pro plan.</p>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="primary-button" type="submit">
            {editingId ? "Update Company" : "Create Company"}
          </button>
          {editingId ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ name: "", industry: "", country: "" });
                setLogoFile(null);
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {loading ? <p className="page-feedback">Loading companies...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="company-grid">
        {companies.map((company) => (
          <article key={company.id} className="company-card">
            <div className="company-card-top">
              <div>
                <p className="company-card-kicker">{company.industry}</p>
                <Link to={`/companies/${company.id}`}>
                  <h3>{company.name}</h3>
                </Link>
              </div>
              {company.logo_url ? (
                <img className="company-logo" src={company.logo_url} alt={`${company.name} logo`} />
              ) : (
                <div className="company-logo company-logo-placeholder">{company.name.slice(0, 2).toUpperCase()}</div>
              )}
            </div>
            <div className="company-card-meta">
              <span>Country</span>
              <strong>{company.country}</strong>
            </div>
            <div className="actions company-card-actions">
              <Link className="button-link primary-link" to={`/companies/${company.id}`}>
                View Details
              </Link>
              {canEdit ? (
                <button className="secondary-button" type="button" onClick={() => startEdit(company)}>
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button className="ghost-danger-button" type="button" onClick={() => void handleDelete(company.id)}>
                  Delete
                </button>
              ) : null}
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

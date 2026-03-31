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
    <section>
      <h2>Companies</h2>
      <div className="toolbar">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies" />
      </div>
      <form className="card stack" onSubmit={handleSubmit}>
        <h3>{editingId ? "Edit Company" : "Create Company"}</h3>
        <input
          value={form.name}
          onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
          placeholder="Company name"
          required
        />
        <input
          value={form.industry}
          onChange={(e) => setForm((current) => ({ ...current, industry: e.target.value }))}
          placeholder="Industry"
          required
        />
        <input
          value={form.country}
          onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
          placeholder="Country"
          required
        />
        {isProPlan ? (
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
        ) : (
          <p className="plan-note">Logo upload is available on the Pro plan.</p>
        )}
        <div className="actions">
          <button type="submit">{editingId ? "Update Company" : "Create Company"}</button>
          {editingId ? (
            <button
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
      {loading ? <p>Loading companies...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="stack">
        {companies.map((company) => (
          <article key={company.id} className="card">
            <Link to={`/companies/${company.id}`}>
              <h3>{company.name}</h3>
            </Link>
            {company.logo_url ? <img className="company-logo" src={company.logo_url} alt={`${company.name} logo`} /> : null}
            <p>{company.industry}</p>
            <p>{company.country}</p>
            <div className="actions">
              <Link className="button-link" to={`/companies/${company.id}`}>
                View Details
              </Link>
              {canEdit ? (
                <button type="button" onClick={() => startEdit(company)}>
                  Edit
                </button>
              ) : null}
              {canDelete ? (
                <button type="button" onClick={() => void handleDelete(company.id)}>
                  Delete
                </button>
              ) : null}
            </div>
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

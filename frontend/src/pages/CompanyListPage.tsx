import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type Company = {
  id: number;
  name: string;
  industry: string;
  country: string;
  logo_url?: string | null;
  contact_count: number;
};

export function CompanyListPage() {
  const maxLogoSizeInBytes = 5 * 1024 * 1024;
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [form, setForm] = useState({ name: "", industry: "", country: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const editingCompany = useMemo(
    () => companies.find((company) => company.id === editingId) ?? null,
    [companies, editingId],
  );
  const logoPreviewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : editingCompany?.logo_url ?? null), [
    editingCompany?.logo_url,
    logoFile,
  ]);

  useEffect(() => {
    return () => {
      if (logoFile) {
        URL.revokeObjectURL(logoPreviewUrl ?? "");
      }
    };
  }, [logoFile, logoPreviewUrl]);

  function handleLogoSelection(file: File | null) {
    if (!file) {
      setLogoFile(null);
      return;
    }
    if (file.size > maxLogoSizeInBytes) {
      setError("Logo size must be 5 MB or smaller.");
      return;
    }
    setError("");
    setRemoveLogo(false);
    setLogoFile(file);
  }

  async function loadCompanies() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ page: String(page) });
      const normalizedSearch = search.trim();
      const normalizedIndustryFilter = industryFilter.trim();
      const normalizedCountryFilter = countryFilter.trim();
      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      }
      if (normalizedIndustryFilter) {
        params.set("industry", normalizedIndustryFilter);
      }
      if (normalizedCountryFilter) {
        params.set("country", normalizedCountryFilter);
      }
      const response = await apiClient.get(`/companies/?${params.toString()}`);
      setCompanies(response.data.data.results);
      setNumPages(response.data.data.num_pages);
    } catch {
      setError("We couldn't load companies right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCompanies();
  }, [page, search, industryFilter, countryFilter]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) {
        if (logoFile) {
          const payload = new FormData();
          payload.append("name", form.name);
          payload.append("industry", form.industry);
          payload.append("country", form.country);
          payload.append("logo", logoFile);
          await apiClient.patch(`/companies/${editingId}/`, payload);
        } else if (removeLogo) {
          await apiClient.patch(`/companies/${editingId}/`, {
            ...form,
            remove_logo: true,
          });
        } else {
          await apiClient.patch(`/companies/${editingId}/`, form);
        }
      } else {
        const payload = new FormData();
        payload.append("name", form.name);
        payload.append("industry", form.industry);
        payload.append("country", form.country);
        if (logoFile) {
          payload.append("logo", logoFile);
        }
        await apiClient.post("/companies/", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setForm({ name: "", industry: "", country: "" });
      setEditingId(null);
      setLogoFile(null);
      setRemoveLogo(false);
      setShowCreateDialog(false);
      await loadCompanies();
    } catch (submitError: any) {
      const errors = submitError.response?.data?.errors;
      const firstFieldError =
        errors && typeof errors === "object"
          ? Object.values(errors).flat().find(Boolean)
          : null;
      setError(
        submitError.response?.data?.message ||
          (typeof firstFieldError === "string" ? firstFieldError : null) ||
          submitError.message ||
          "Unable to save company.",
      );
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
    setRemoveLogo(false);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this company?")) {
      return;
    }
    await apiClient.delete(`/companies/${id}/`);
    await loadCompanies();
  }

  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDelete = user?.role === "ADMIN";

  function clearCompanyFilters() {
    setPage(1);
    setSearch("");
    setIndustryFilter("");
    setCountryFilter("");
  }

  function resetEditorState() {
    setEditingId(null);
    setForm({ name: "", industry: "", country: "" });
    setLogoFile(null);
    setRemoveLogo(false);
    setShowCreateDialog(false);
  }

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
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search companies"
          />
        </label>
        <div className="toolbar-meta">
          <span>{numPages} pages</span>
          <strong>{isProPlan ? "Pro workspace" : "Basic workspace"}</strong>
        </div>
        {canEdit ? (
          <button
            className="primary-button company-toolbar-button"
            type="button"
            onClick={() => {
              setEditingId(null);
              setForm({ name: "", industry: "", country: "" });
              setLogoFile(null);
              setRemoveLogo(false);
              setShowCreateDialog(true);
            }}
          >
            Create New Company
          </button>
        ) : null}
      </div>

      <div className="filter-card">
        <div className="filter-card-header">
          <div>
            <p className="page-kicker">Company Filters</p>
            <h3>Refine the company list</h3>
          </div>
          <button className="secondary-button" type="button" onClick={clearCompanyFilters}>
            Clear Filters
          </button>
        </div>

        <div className="filter-grid filter-grid-compact">
          <label className="form-field">
            <span>Industry</span>
            <input
              value={industryFilter}
              onChange={(e) => {
                setPage(1);
                setIndustryFilter(e.target.value);
              }}
              placeholder="Filter by industry"
            />
          </label>

          <label className="form-field">
            <span>Country</span>
            <input
              value={countryFilter}
              onChange={(e) => {
                setPage(1);
                setCountryFilter(e.target.value);
              }}
              placeholder="Filter by country"
            />
          </label>
        </div>
      </div>

      {editingId ? (
        <form className="company-form-card" onSubmit={handleSubmit}>
        <div className="company-form-header">
          <div>
            <p className="page-kicker">Company Editor</p>
            <h3>Refine company details</h3>
          </div>
          <p>Update identity, market, or country information.</p>
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
          <div className="form-field logo-field">
            <span>Logo</span>
            {isProPlan ? (
              <div className="logo-uploader">
                <div className="logo-preview-card">
                  {logoPreviewUrl && !removeLogo ? (
                    <img className="company-logo logo-preview-image" src={logoPreviewUrl} alt="Selected logo preview" />
                  ) : (
                    <div className="company-logo company-logo-placeholder logo-preview-image">
                      {form.name ? form.name.slice(0, 2).toUpperCase() : "LG"}
                    </div>
                  )}
                  <div className="logo-preview-copy">
                    <strong>{logoFile ? "New logo selected" : editingCompany?.logo_url && !removeLogo ? "Current logo" : "No logo uploaded"}</strong>
                    <p>PNG or JPG up to 5 MB. Upload a new file or remove the current logo.</p>
                  </div>
                </div>
                <input type="file" accept="image/*" onChange={(e) => handleLogoSelection(e.target.files?.[0] ?? null)} />
                <div className="logo-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setRemoveLogo(false);
                    }}
                  >
                    Change Selection
                  </button>
                  {editingCompany?.logo_url || logoFile ? (
                    <button
                      className="ghost-danger-button"
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        setRemoveLogo(true);
                      }}
                    >
                      Remove Logo
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="plan-note">Logo upload is available on the Pro plan.</p>
            )}
          </div>
        </div>

        <div className="actions">
          <button className="primary-button" type="submit">
            Update Company
          </button>
          <button className="secondary-button" type="button" onClick={resetEditorState}>
            Cancel
          </button>
        </div>
      </form>
      ) : null}

      {loading ? <div className="feedback-card"><strong>Loading companies</strong><p>Please wait while we refresh the company directory.</p></div> : null}
      {error ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Companies unavailable</strong>
            <p>{error}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void loadCompanies()}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && companies.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No companies yet</strong>
          <p>{search || industryFilter || countryFilter ? "No company matched the current filters. Try adjusting the search, industry, or country values." : "Create your first company to start building the CRM workspace."}</p>
        </div>
      ) : null}

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
            <div className="company-card-stat-row">
              <div className="company-card-stat">
                <span>Contacts</span>
                <strong>{company.contact_count}</strong>
              </div>
              <div className="company-card-stat">
                <span>Workflow</span>
                <strong>{company.contact_count > 0 ? "Active" : "Ready"}</strong>
              </div>
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

      {showCreateDialog ? (
        <div className="modal-backdrop" role="presentation" onClick={resetEditorState}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-company-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-kicker">Company Editor</p>
                <h3 id="create-company-title">Create a new company</h3>
              </div>
              <button className="secondary-button" type="button" onClick={resetEditorState}>
                Close
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
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
                <div className="form-field logo-field">
                  <span>Logo</span>
                  {isProPlan ? (
                    <div className="logo-uploader">
                      <div className="logo-preview-card">
                        {logoPreviewUrl && !removeLogo ? (
                          <img className="company-logo logo-preview-image" src={logoPreviewUrl} alt="Selected logo preview" />
                        ) : (
                          <div className="company-logo company-logo-placeholder logo-preview-image">
                            {form.name ? form.name.slice(0, 2).toUpperCase() : "LG"}
                          </div>
                        )}
                        <div className="logo-preview-copy">
                          <strong>{logoFile ? "New logo selected" : "No logo uploaded"}</strong>
                          <p>PNG or JPG up to 5 MB. Upload a logo now or add it later from the company workspace.</p>
                        </div>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleLogoSelection(e.target.files?.[0] ?? null)} />
                    </div>
                  ) : (
                    <p className="plan-note">Logo upload is available on the Pro plan.</p>
                  )}
                </div>
              </div>

              <div className="actions">
                <button className="primary-button" type="submit">
                  Create Company
                </button>
                <button className="secondary-button" type="button" onClick={resetEditorState}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}

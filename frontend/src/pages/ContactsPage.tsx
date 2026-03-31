import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type CompanyOption = {
  id: number;
  name: string;
  industry: string;
};

type Contact = {
  id: number;
  company: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
};

type ContactRecord = Contact & {
  company_name: string;
  company_industry: string;
};

const initialContactForm = {
  company: "",
  full_name: "",
  email: "",
  phone: "",
  role: "",
};

export function ContactsPage() {
  const user = useAuthStore((state) => state.user);
  const canManageContacts = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDeleteContacts = user?.role === "ADMIN";
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    company: "",
  });
  const [form, setForm] = useState(initialContactForm);

  function resolveApiError(submitError: any, fallbackMessage: string) {
    const errors = submitError.response?.data?.errors;
    const firstFieldError =
      errors && typeof errors === "object"
        ? Object.values(errors).flat().find(Boolean)
        : null;

    return (
      submitError.response?.data?.message ||
      (typeof firstFieldError === "string" ? firstFieldError : null) ||
      submitError.message ||
      fallbackMessage
    );
  }

  async function loadContacts() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({ page: String(page) });
      if (filters.search) {
        params.set("search", filters.search);
      }
      if (filters.role) {
        params.set("role", filters.role);
      }
      if (filters.company) {
        params.set("company", filters.company);
      }

      const [contactResponse, companyResponse] = await Promise.all([
        apiClient.get(`/contacts/?${params.toString()}`),
        apiClient.get("/companies/?page_size=50"),
      ]);

      const companyResults = companyResponse.data.data.results as CompanyOption[];
      const companyMap = new Map(
        companyResults.map((company) => [
          company.id,
          { name: company.name, industry: company.industry },
        ]),
      );

      const contactResults = (contactResponse.data.data.results as Contact[]).map((contact) => ({
        ...contact,
        company_name: companyMap.get(contact.company)?.name ?? "Unknown company",
        company_industry: companyMap.get(contact.company)?.industry ?? "Workspace company",
      }));

      setCompanies(companyResults);
      setContacts(contactResults);
      setNumPages(contactResponse.data.data.num_pages);
    } catch {
      setError("We couldn't load contacts right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, [page, filters.search, filters.role, filters.company]);

  async function handleQuickAdd(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await apiClient.post("/contacts/", {
        ...form,
        company: Number(form.company),
      });
      setForm(initialContactForm);
      setShowQuickAdd(false);
      await loadContacts();
    } catch (submitError: any) {
      setError(resolveApiError(submitError, "Unable to save contact."));
    }
  }

  async function handleDelete(contactId: number) {
    if (!window.confirm("Delete this contact?")) {
      return;
    }
    await apiClient.delete(`/contacts/${contactId}/`);
    await loadContacts();
  }

  function clearFilters() {
    setPage(1);
    setFilters({
      search: "",
      role: "",
      company: "",
    });
  }

  return (
    <section className="contacts-shell">
      <div className="page-hero">
        <div>
          <p className="page-kicker">Relationship Directory</p>
          <h2>Contacts</h2>
          <p className="page-description">
            Review people across the workspace, filter by company or role, and add new relationships without leaving
            the daily CRM flow.
          </p>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Visible contacts</span>
          <strong>{contacts.length}</strong>
          <p>{loading ? "Refreshing the relationship directory..." : "Contacts on the current page."}</p>
        </div>
      </div>

      <div className="contacts-toolbar">
        <div className="toolbar-meta">
          <span>Workspace coverage</span>
          <strong>{companies.length} companies connected</strong>
        </div>
        {canManageContacts ? (
          <button className="primary-button" type="button" onClick={() => setShowQuickAdd(true)}>
            Quick Add Contact
          </button>
        ) : null}
      </div>

      <div className="filter-card">
        <div className="filter-card-header">
          <div>
            <p className="page-kicker">Contact Filters</p>
            <h3>Find the right relationship faster</h3>
          </div>
          <button className="secondary-button" type="button" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        <div className="filter-grid">
          <label className="form-field">
            <span>Search</span>
            <input
              value={filters.search}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({ ...current, search: event.target.value }));
              }}
              placeholder="Search name, email, or role"
            />
          </label>
          <label className="form-field">
            <span>Role</span>
            <input
              value={filters.role}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({ ...current, role: event.target.value }));
              }}
              placeholder="Filter by role"
            />
          </label>
          <label className="form-field">
            <span>Company</span>
            <select
              value={filters.company}
              onChange={(event) => {
                setPage(1);
                setFilters((current) => ({ ...current, company: event.target.value }));
              }}
            >
              <option value="">All companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="feedback-card">
          <strong>Loading contacts</strong>
          <p>Please wait while we refresh the relationship directory.</p>
        </div>
      ) : null}

      {error ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Contacts unavailable</strong>
            <p>{error}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void loadContacts()}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !error && contacts.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No contacts found</strong>
          <p>
            {filters.search || filters.role || filters.company
              ? "No contacts matched the current filters. Try another search, role, or company value."
              : "Add the first contact to begin tracking customer relationships across the workspace."}
          </p>
        </div>
      ) : null}

      <div className="contact-grid">
        {contacts.map((contact) => (
          <article className="contact-card contact-card-rich" key={contact.id}>
            <div className="contact-card-top">
              <div>
                <p className="company-card-kicker">{contact.company_industry}</p>
                <h4>{contact.full_name}</h4>
                <p className="contact-company-link">
                  <Link to={`/companies/${contact.company}`}>{contact.company_name}</Link>
                </p>
              </div>
              <div className="contact-avatar">{contact.full_name.slice(0, 2).toUpperCase()}</div>
            </div>

            <div className="contact-meta">
              <div>
                <span>Email</span>
                <strong>{contact.email}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{contact.phone || "Not provided"}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{contact.role}</strong>
              </div>
            </div>

            <div className="actions company-card-actions">
              <Link className="button-link secondary-button" to={`/companies/${contact.company}`}>
                Open Company
              </Link>
              {canDeleteContacts ? (
                <button className="ghost-danger-button" type="button" onClick={() => void handleDelete(contact.id)}>
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

      {showQuickAdd ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowQuickAdd(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-add-contact-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="page-kicker">Quick Add</p>
                <h3 id="quick-add-contact-title">Create contact</h3>
              </div>
              <button className="secondary-button" type="button" onClick={() => setShowQuickAdd(false)}>
                Close
              </button>
            </div>

            <form className="modal-form" onSubmit={handleQuickAdd}>
              <div className="company-form-grid">
                <label className="form-field">
                  <span>Company</span>
                  <select
                    value={form.company}
                    onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                    required
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Full name</span>
                  <input
                    value={form.full_name}
                    onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                    placeholder="Nimal Perera"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    placeholder="nimal@company.com"
                    required
                  />
                </label>
                <label className="form-field">
                  <span>Phone</span>
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="771234567"
                  />
                </label>
                <label className="form-field form-field-full">
                  <span>Role</span>
                  <input
                    value={form.role}
                    onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                    placeholder="Operations Manager"
                    required
                  />
                </label>
              </div>

              <div className="actions">
                <button className="primary-button" type="submit">
                  Save Contact
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setForm(initialContactForm);
                    setShowQuickAdd(false);
                  }}
                >
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

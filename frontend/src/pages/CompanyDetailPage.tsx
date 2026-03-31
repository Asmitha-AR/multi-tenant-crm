import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
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

type Contact = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
};

export function CompanyDetailPage() {
  const maxLogoSizeInBytes = 5 * 1024 * 1024;
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contactRoleFilter, setContactRoleFilter] = useState("");
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
  });
  const [companyForm, setCompanyForm] = useState({
    name: "",
    industry: "",
    country: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loading, setLoading] = useState(true);
  const logoPreviewUrl = useMemo(() => (logoFile ? URL.createObjectURL(logoFile) : company?.logo_url ?? null), [
    company?.logo_url,
    logoFile,
  ]);

  useEffect(() => {
    return () => {
      if (logoFile) {
        URL.revokeObjectURL(logoPreviewUrl ?? "");
      }
    };
  }, [logoFile, logoPreviewUrl]);

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

  async function refreshData() {
    try {
      setLoading(true);
      setError("");
      const contactParams = new URLSearchParams({ company: String(id) });
      if (contactSearch) {
        contactParams.set("search", contactSearch);
      }
      if (contactRoleFilter) {
        contactParams.set("role", contactRoleFilter);
      }
      const [companyResponse, contactResponse] = await Promise.all([
        apiClient.get(`/companies/${id}/`),
        apiClient.get(`/contacts/?${contactParams.toString()}`),
      ]);
      setCompany(companyResponse.data.data);
      setCompanyForm({
        name: companyResponse.data.data.name,
        industry: companyResponse.data.data.industry,
        country: companyResponse.data.data.country,
      });
      setContacts(contactResponse.data.data.results);
      setRemoveLogo(false);
    } catch {
      setError("We couldn't load this company right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshData();
  }, [id, contactSearch, contactRoleFilter]);

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

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      if (logoFile) {
        const payload = new FormData();
        payload.append("name", companyForm.name);
        payload.append("industry", companyForm.industry);
        payload.append("country", companyForm.country);
        payload.append("logo", logoFile);
        await apiClient.patch(`/companies/${id}/`, payload);
      } else if (removeLogo) {
        await apiClient.patch(`/companies/${id}/`, {
          ...companyForm,
          remove_logo: true,
        });
      } else {
        await apiClient.patch(`/companies/${id}/`, companyForm);
      }
      setLogoFile(null);
      setRemoveLogo(false);
      await refreshData();
    } catch (submitError: any) {
      setError(resolveApiError(submitError, "Unable to save company."));
    }
  }

  async function deleteCompany() {
    if (!window.confirm("Delete this company?")) {
      return;
    }
    await apiClient.delete(`/companies/${id}/`);
    navigate("/companies");
  }

  async function saveContact(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = { ...contactForm, company: Number(id) };
      if (editingContactId) {
        await apiClient.patch(`/contacts/${editingContactId}/`, payload);
      } else {
        await apiClient.post("/contacts/", payload);
      }
      setEditingContactId(null);
      setContactForm({ full_name: "", email: "", phone: "", role: "" });
      await refreshData();
    } catch (submitError: any) {
      setError(resolveApiError(submitError, "Unable to save contact."));
    }
  }

  function startContactEdit(contact: Contact) {
    setEditingContactId(contact.id);
    setContactForm({
      full_name: contact.full_name,
      email: contact.email,
      phone: contact.phone,
      role: contact.role,
    });
  }

  async function deleteContact(contactId: number) {
    if (!window.confirm("Delete this contact?")) {
      return;
    }
    await apiClient.delete(`/contacts/${contactId}/`);
    await refreshData();
  }

  const canEditCompany = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDeleteCompany = user?.role === "ADMIN";
  const canEditContact = user?.role === "ADMIN" || user?.role === "MANAGER";
  const canDeleteContact = user?.role === "ADMIN";

  function clearContactFilters() {
    setContactSearch("");
    setContactRoleFilter("");
  }

  return (
    <section className="company-detail-shell">
      {loading ? (
        <div className="feedback-card">
          <strong>Loading company details</strong>
          <p>Please wait while we prepare the company workspace.</p>
        </div>
      ) : null}

      {error && !company ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Company unavailable</strong>
            <p>{error}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void refreshData()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="page-hero">
        <div>
          <p className="page-kicker">Company Workspace</p>
          <h2>{company?.name}</h2>
          <p className="page-description">
            {company?.industry} • {company?.country}
          </p>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Contacts</span>
          <strong>{company?.contact_count ?? contacts.length}</strong>
          <p>Relationships currently attached to this company profile.</p>
        </div>
      </div>

      <div className="company-detail-summary">
        {company?.logo_url ? (
          <img className="company-logo company-logo-large" src={company.logo_url} alt={`${company.name} logo`} />
        ) : (
          <div className="company-logo company-logo-large company-logo-placeholder">
            {company?.name?.slice(0, 2).toUpperCase()}
          </div>
        )}

        <div className="company-summary-card">
          <p className="page-kicker">Profile Summary</p>
          <h3>{company?.name}</h3>
          <div className="company-summary-grid">
            <div>
              <span>Industry</span>
              <strong>{company?.industry}</strong>
            </div>
            <div>
              <span>Country</span>
              <strong>{company?.country}</strong>
            </div>
            <div>
              <span>Plan</span>
              <strong>{user?.organization?.subscription_plan}</strong>
            </div>
            <div>
              <span>Contacts</span>
              <strong>{company?.contact_count ?? contacts.length}</strong>
            </div>
            <div>
              <span>Role</span>
              <strong>{user?.role}</strong>
            </div>
          </div>
        </div>
      </div>

      {error && company ? <div className="feedback-card feedback-card-error"><strong>Something needs attention</strong><p>{error}</p></div> : null}
      {canEditCompany ? (
        <form className="company-form-card" onSubmit={saveCompany}>
          <div className="company-form-header">
            <div>
              <p className="page-kicker">Company Editor</p>
              <h3>Edit Company</h3>
            </div>
            <p>Adjust company identity, update market information, or refresh the logo asset for this account.</p>
          </div>

          <div className="company-form-grid">
            <label className="form-field">
              <span>Company name</span>
              <input
                value={companyForm.name}
                onChange={(e) => setCompanyForm((current) => ({ ...current, name: e.target.value }))}
                placeholder="Company name"
              />
            </label>
            <label className="form-field">
              <span>Industry</span>
              <input
                value={companyForm.industry}
                onChange={(e) => setCompanyForm((current) => ({ ...current, industry: e.target.value }))}
                placeholder="Industry"
              />
            </label>
            <label className="form-field">
              <span>Country</span>
              <input
                value={companyForm.country}
                onChange={(e) => setCompanyForm((current) => ({ ...current, country: e.target.value }))}
                placeholder="Country"
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
                        {companyForm.name ? companyForm.name.slice(0, 2).toUpperCase() : "LG"}
                      </div>
                    )}
                    <div className="logo-preview-copy">
                      <strong>{logoFile ? "New logo selected" : company?.logo_url && !removeLogo ? "Current logo" : "No logo uploaded"}</strong>
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
                    {company?.logo_url || logoFile ? (
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
              Save Company
            </button>
            {canDeleteCompany ? (
              <button className="ghost-danger-button" type="button" onClick={() => void deleteCompany()}>
                Delete Company
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="company-detail-section-header">
        <div>
          <p className="page-kicker">Contact Management</p>
          <h3>Contacts</h3>
        </div>
        <p className="page-description">Manage the people connected to this account and keep each relationship up to date.</p>
      </div>

      <div className="filter-card">
        <div className="filter-card-header">
          <div>
            <p className="page-kicker">Contact Filters</p>
            <h3>Refine this contact list</h3>
          </div>
          <button className="secondary-button" type="button" onClick={clearContactFilters}>
            Clear Filters
          </button>
        </div>

        <div className="filter-grid filter-grid-compact">
          <label className="form-field">
            <span>Search</span>
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search name, email, or role"
            />
          </label>
          <label className="form-field">
            <span>Role</span>
            <input
              value={contactRoleFilter}
              onChange={(e) => setContactRoleFilter(e.target.value)}
              placeholder="Filter by role"
            />
          </label>
        </div>
      </div>

      <form className="company-form-card" onSubmit={saveContact}>
        <div className="company-form-header">
          <div>
            <p className="page-kicker">Contact Editor</p>
            <h3>{editingContactId ? "Edit Contact" : "Add Contact"}</h3>
          </div>
          <p>{editingContactId ? "Update the selected contact's details." : "Create a new contact inside this company workspace."}</p>
        </div>

        <div className="company-form-grid">
          <label className="form-field">
            <span>Full name</span>
            <input
              value={contactForm.full_name}
              onChange={(e) => setContactForm((current) => ({ ...current, full_name: e.target.value }))}
              placeholder="Full name"
              required
            />
          </label>
          <label className="form-field">
            <span>Email</span>
            <input
              value={contactForm.email}
              onChange={(e) => setContactForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="Email"
              required
            />
          </label>
          <label className="form-field">
            <span>Phone</span>
            <input
              value={contactForm.phone}
              onChange={(e) => setContactForm((current) => ({ ...current, phone: e.target.value }))}
              placeholder="Phone"
            />
          </label>
          <label className="form-field">
            <span>Role</span>
            <input
              value={contactForm.role}
              onChange={(e) => setContactForm((current) => ({ ...current, role: e.target.value }))}
              placeholder="Role"
              required
            />
          </label>
        </div>

        <div className="actions">
          <button className="primary-button" type="submit">
            {editingContactId ? "Update Contact" : "Create Contact"}
          </button>
          {editingContactId ? (
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setEditingContactId(null);
                setContactForm({ full_name: "", email: "", phone: "", role: "" });
              }}
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {!loading && contacts.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No contacts yet</strong>
          <p>{contactSearch || contactRoleFilter ? "No contacts matched the current filters. Try another search or role value." : "Add the first contact for this company to start tracking relationships and ownership."}</p>
        </div>
      ) : null}

      <div className="contact-grid">
        {contacts.map((contact) => (
          <article className="contact-card" key={contact.id}>
            <div className="contact-card-top">
              <div>
                <p className="company-card-kicker">{contact.role}</p>
                <h4>{contact.full_name}</h4>
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
            </div>
            <div className="actions company-card-actions">
              {canEditContact ? (
                <button className="secondary-button" type="button" onClick={() => startContactEdit(contact)}>
                  Edit
                </button>
              ) : null}
              {canDeleteContact ? (
                <button className="ghost-danger-button" type="button" onClick={() => void deleteContact(contact.id)}>
                  Delete
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

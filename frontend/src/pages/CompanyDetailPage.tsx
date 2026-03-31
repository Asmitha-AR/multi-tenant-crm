import { FormEvent, useEffect, useState } from "react";
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
};

type Contact = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
};

export function CompanyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isProPlan = user?.organization?.subscription_plan === "PRO";
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState("");
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

  useEffect(() => {
    async function loadData() {
      try {
        const [companyResponse, contactResponse] = await Promise.all([
          apiClient.get(`/companies/${id}/`),
          apiClient.get(`/contacts/?company=${id}`),
        ]);
        setCompany(companyResponse.data.data);
        setCompanyForm({
          name: companyResponse.data.data.name,
          industry: companyResponse.data.data.industry,
          country: companyResponse.data.data.country,
        });
        setContacts(contactResponse.data.data.results);
      } catch {
        setError("Failed to load company details.");
      }
    }

    void loadData();
  }, [id]);

  async function refreshData() {
    const [companyResponse, contactResponse] = await Promise.all([
      apiClient.get(`/companies/${id}/`),
      apiClient.get(`/contacts/?company=${id}`),
    ]);
    setCompany(companyResponse.data.data);
    setCompanyForm({
      name: companyResponse.data.data.name,
      industry: companyResponse.data.data.industry,
      country: companyResponse.data.data.country,
    });
    setContacts(contactResponse.data.data.results);
  }

  async function saveCompany(event: FormEvent) {
    event.preventDefault();
    const payload = new FormData();
    payload.append("name", companyForm.name);
    payload.append("industry", companyForm.industry);
    payload.append("country", companyForm.country);
    if (logoFile) {
      payload.append("logo", logoFile);
    }
    await apiClient.patch(`/companies/${id}/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setLogoFile(null);
    await refreshData();
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
    const payload = { ...contactForm, company: Number(id) };
    if (editingContactId) {
      await apiClient.patch(`/contacts/${editingContactId}/`, payload);
    } else {
      await apiClient.post("/contacts/", payload);
    }
    setEditingContactId(null);
    setContactForm({ full_name: "", email: "", phone: "", role: "" });
    await refreshData();
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

  return (
    <section className="company-detail-shell">
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
          <strong>{contacts.length}</strong>
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
              <span>Role</span>
              <strong>{user?.role}</strong>
            </div>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
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

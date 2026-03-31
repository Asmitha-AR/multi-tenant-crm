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
    await apiClient.patch(`/companies/${id}/`, companyForm);
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
    <section>
      <h2>{company?.name}</h2>
      <p>
        {company?.industry} • {company?.country}
      </p>
      {error ? <p className="error">{error}</p> : null}
      {canEditCompany ? (
        <form className="card stack" onSubmit={saveCompany}>
          <h3>Edit Company</h3>
          <input
            value={companyForm.name}
            onChange={(e) => setCompanyForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="Company name"
          />
          <input
            value={companyForm.industry}
            onChange={(e) => setCompanyForm((current) => ({ ...current, industry: e.target.value }))}
            placeholder="Industry"
          />
          <input
            value={companyForm.country}
            onChange={(e) => setCompanyForm((current) => ({ ...current, country: e.target.value }))}
            placeholder="Country"
          />
          <div className="actions">
            <button type="submit">Save Company</button>
            {canDeleteCompany ? (
              <button type="button" onClick={() => void deleteCompany()}>
                Delete Company
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
      <h3>Contacts</h3>
      <form className="card stack" onSubmit={saveContact}>
        <h4>{editingContactId ? "Edit Contact" : "Add Contact"}</h4>
        <input
          value={contactForm.full_name}
          onChange={(e) => setContactForm((current) => ({ ...current, full_name: e.target.value }))}
          placeholder="Full name"
          required
        />
        <input
          value={contactForm.email}
          onChange={(e) => setContactForm((current) => ({ ...current, email: e.target.value }))}
          placeholder="Email"
          required
        />
        <input
          value={contactForm.phone}
          onChange={(e) => setContactForm((current) => ({ ...current, phone: e.target.value }))}
          placeholder="Phone"
        />
        <input
          value={contactForm.role}
          onChange={(e) => setContactForm((current) => ({ ...current, role: e.target.value }))}
          placeholder="Role"
          required
        />
        <div className="actions">
          <button type="submit">{editingContactId ? "Update Contact" : "Create Contact"}</button>
          {editingContactId ? (
            <button
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
      <div className="stack">
        {contacts.map((contact) => (
          <article className="card" key={contact.id}>
            <h4>{contact.full_name}</h4>
            <p>{contact.email}</p>
            <p>{contact.phone}</p>
            <p>{contact.role}</p>
            <div className="actions">
              {canEditContact ? (
                <button type="button" onClick={() => startContactEdit(contact)}>
                  Edit
                </button>
              ) : null}
              {canDeleteContact ? (
                <button type="button" onClick={() => void deleteContact(contact.id)}>
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

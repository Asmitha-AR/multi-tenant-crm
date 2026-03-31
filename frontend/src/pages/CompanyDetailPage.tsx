import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "../api/client";

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
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    async function loadData() {
      const [companyResponse, contactResponse] = await Promise.all([
        apiClient.get(`/companies/${id}/`),
        apiClient.get(`/contacts/?company=${id}`),
      ]);
      setCompany(companyResponse.data.data);
      setContacts(contactResponse.data.data.results);
    }

    void loadData();
  }, [id]);

  return (
    <section>
      <h2>{company?.name}</h2>
      <p>{company?.industry} • {company?.country}</p>
      <h3>Contacts</h3>
      <div className="stack">
        {contacts.map((contact) => (
          <article className="card" key={contact.id}>
            <h4>{contact.full_name}</h4>
            <p>{contact.email}</p>
            <p>{contact.phone}</p>
            <p>{contact.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}


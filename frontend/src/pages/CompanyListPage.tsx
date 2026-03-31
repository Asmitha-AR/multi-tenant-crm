import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";

type Company = {
  id: number;
  name: string;
  industry: string;
  country: string;
};

export function CompanyListPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCompanies() {
      try {
        const response = await apiClient.get("/companies/");
        setCompanies(response.data.data.results);
      } catch {
        setError("Failed to load companies.");
      } finally {
        setLoading(false);
      }
    }

    void loadCompanies();
  }, []);

  return (
    <section>
      <h2>Companies</h2>
      {loading ? <p>Loading companies...</p> : null}
      {error ? <p className="error">{error}</p> : null}
      <div className="stack">
        {companies.map((company) => (
          <Link key={company.id} className="card" to={`/companies/${company.id}`}>
            <h3>{company.name}</h3>
            <p>{company.industry}</p>
            <p>{company.country}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}


import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/client";
import { useAuthStore } from "../app/auth-store";

type CompanyRecord = {
  id: number;
  name: string;
  industry: string;
  country: string;
};

type ServiceRecord = {
  id: number;
  company: number;
  company_name: string;
  industry: string;
  country: string;
  name: string;
  status: "ACTIVE" | "PLANNED" | "PAUSED";
};

type CompanyWithServices = CompanyRecord & {
  services: ServiceRecord[];
};

const STATUS_LABELS: Record<ServiceRecord["status"], string> = {
  ACTIVE: "Active",
  PLANNED: "Planned",
  PAUSED: "Paused",
};

export function ServicesPage() {
  const user = useAuthStore((state) => state.user);
  const canManageServices = user?.role === "ADMIN" || user?.role === "MANAGER";
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [newServiceDrafts, setNewServiceDrafts] = useState<Record<number, { name: string; status: ServiceRecord["status"] }>>({});
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [editingServiceName, setEditingServiceName] = useState("");
  const [editingServiceStatus, setEditingServiceStatus] = useState<ServiceRecord["status"]>("ACTIVE");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const [companiesResponse, servicesResponse] = await Promise.all([
        apiClient.get("/companies/?page_size=100"),
        apiClient.get("/services/?page_size=300"),
      ]);

      setCompanies(companiesResponse.data.data.results);
      setServices(servicesResponse.data.data.results);
    } catch {
      setError("We couldn't load client services right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const industryOptions = useMemo(
    () => Array.from(new Set(companies.map((company) => company.industry).filter(Boolean))).sort(),
    [companies],
  );

  const countryOptions = useMemo(
    () => Array.from(new Set(companies.map((company) => company.country).filter(Boolean))).sort(),
    [companies],
  );

  const groupedCompanies = useMemo(() => {
    const servicesByCompany = new Map<number, ServiceRecord[]>();

    services.forEach((service) => {
      const current = servicesByCompany.get(service.company) ?? [];
      current.push(service);
      servicesByCompany.set(service.company, current);
    });

    const normalizedSearch = search.trim().toLowerCase();

    return companies
      .map<CompanyWithServices>((company) => ({
        ...company,
        services: (servicesByCompany.get(company.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((company) => {
        const matchesIndustry =
          !industryFilter || company.industry.toLowerCase() === industryFilter.toLowerCase();
        const matchesCountry =
          !countryFilter || company.country.toLowerCase() === countryFilter.toLowerCase();
        const matchesSearch =
          !normalizedSearch ||
          [company.name, company.industry, company.country, ...company.services.map((service) => service.name)]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(normalizedSearch));
        const matchesStatus =
          !statusFilter || company.services.some((service) => service.status === statusFilter);

        return matchesIndustry && matchesCountry && matchesSearch && matchesStatus;
      });
  }, [companies, countryFilter, industryFilter, search, services, statusFilter]);

  const visibleServiceCount = useMemo(
    () => groupedCompanies.reduce((count, company) => count + company.services.length, 0),
    [groupedCompanies],
  );

  const serviceCatalog = useMemo(() => {
    const catalog = new Map<string, number>();
    services.forEach((service) => {
      catalog.set(service.name, (catalog.get(service.name) ?? 0) + 1);
    });
    return Array.from(catalog.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [services]);

  function clearFilters() {
    setSearch("");
    setIndustryFilter("");
    setCountryFilter("");
    setStatusFilter("");
  }

  function openCompanyEditor(companyId: number) {
    setActiveCompanyId((current) => (current === companyId ? null : companyId));
    setEditingServiceId(null);
    setEditingServiceName("");
  }

  function startEditingService(service: ServiceRecord) {
    setEditingServiceId(service.id);
    setEditingServiceName(service.name);
    setEditingServiceStatus(service.status);
  }

  function cancelEditingService() {
    setEditingServiceId(null);
    setEditingServiceName("");
    setEditingServiceStatus("ACTIVE");
  }

  async function createService(event: FormEvent, companyId: number) {
    event.preventDefault();
    const draft = newServiceDrafts[companyId] ?? { name: "", status: "ACTIVE" };
    const name = draft.name.trim();
    if (!name) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await apiClient.post("/services/", { company: companyId, name, status: draft.status });
      setNewServiceDrafts((current) => ({ ...current, [companyId]: { name: "", status: "ACTIVE" } }));
      await loadData();
      setActiveCompanyId(companyId);
    } catch {
      setError("Unable to add the service right now.");
    } finally {
      setSaving(false);
    }
  }

  async function updateService(event: FormEvent, serviceId: number) {
    event.preventDefault();
    const name = editingServiceName.trim();
    if (!name) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      await apiClient.patch(`/services/${serviceId}/`, { name, status: editingServiceStatus });
      cancelEditingService();
      await loadData();
    } catch {
      setError("Unable to update the service right now.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteService(serviceId: number) {
    try {
      setSaving(true);
      setError("");
      await apiClient.delete(`/services/${serviceId}/`);
      if (editingServiceId === serviceId) {
        cancelEditingService();
      }
      await loadData();
    } catch {
      setError("Unable to remove the service right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="services-shell">
      <div className="page-hero">
        <div className="page-hero-copy">
          <p className="page-kicker">Service Management</p>
          <h2>Client Services</h2>
        </div>

        <div className="page-hero-card">
          <span className="page-hero-label">Service coverage</span>
          <strong>{loading ? services.length : visibleServiceCount}</strong>
          <p>
            {loading
              ? "Refreshing service catalog..."
              : `${groupedCompanies.length} client companies currently shown in this view.`}
          </p>
        </div>
      </div>

      <div className="filter-card">
        <div className="filter-grid filter-grid-services">
          <label className="form-field">
            <span>Search</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search companies or services"
            />
          </label>

          <label className="form-field">
            <span>Industry</span>
            <select value={industryFilter} onChange={(event) => setIndustryFilter(event.target.value)}>
              <option value="">All industries</option>
              {industryOptions.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Country</span>
            <select value={countryFilter} onChange={(event) => setCountryFilter(event.target.value)}>
              <option value="">All countries</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PLANNED">Planned</option>
              <option value="PAUSED">Paused</option>
            </select>
          </label>

          <div className="filter-actions">
            <button className="secondary-button" type="button" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {!loading && !error ? (
        <div className="service-catalog-card">
          <div className="service-catalog-header">
            <div>
              <p className="page-kicker">Service Catalog</p>
              <h3>Reusable service list</h3>
            </div>
            <span className="services-count-pill">
              {serviceCatalog.length} {serviceCatalog.length === 1 ? "service" : "services"}
            </span>
          </div>
          <div className="service-catalog-list">
            {serviceCatalog.map((service) => (
              <div className="service-catalog-item" key={service.name}>
                <span>{service.name}</span>
                <small>{service.count} companies</small>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="feedback-card feedback-card-error">
          <div>
            <strong>Services unavailable</strong>
            <p>{error}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void loadData()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="feedback-card">
          <strong>Loading services</strong>
          <p>Please wait while we prepare the service directory.</p>
        </div>
      ) : null}

      {!loading && !error && companies.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No companies available</strong>
          <p>Add a company first, then map the services your organization provides to that client.</p>
        </div>
      ) : null}

      {!loading && !error && companies.length > 0 && groupedCompanies.length === 0 ? (
        <div className="feedback-card feedback-card-empty">
          <strong>No services matched</strong>
          <p>Try another search, industry, or country value.</p>
        </div>
      ) : null}

      <div className="services-grid">
        {groupedCompanies.map((company) => {
          const isExpanded = activeCompanyId === company.id;
          const activeCount = company.services.filter((service) => service.status === "ACTIVE").length;
          const plannedCount = company.services.filter((service) => service.status === "PLANNED").length;
          const pausedCount = company.services.filter((service) => service.status === "PAUSED").length;

          return (
            <article className="services-card" key={company.id}>
              <div className="services-card-header">
                <div>
                  <p className="company-card-kicker">{company.industry}</p>
                  <h3>{company.name}</h3>
                  <p className="services-card-subtitle">{company.country}</p>
                </div>
                <div className="services-card-actions">
                  <span className="services-count-pill">
                    {company.services.length} {company.services.length === 1 ? "service" : "services"}
                  </span>
                  {canManageServices ? (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => openCompanyEditor(company.id)}
                    >
                      {isExpanded ? "Close" : "Manage"}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="services-card-summary">
                <span className="services-summary-chip services-summary-chip-active">{activeCount} active</span>
                <span className="services-summary-chip services-summary-chip-planned">{plannedCount} planned</span>
                <span className="services-summary-chip services-summary-chip-paused">{pausedCount} paused</span>
              </div>

              {company.services.length > 0 ? (
                <div className="services-records">
                  {company.services.map((service) =>
                    editingServiceId === service.id ? (
                      <form
                        className="service-record service-record-editing"
                        key={service.id}
                        onSubmit={(event) => void updateService(event, service.id)}
                      >
                        <div className="service-edit-grid">
                          <input
                            value={editingServiceName}
                            onChange={(event) => setEditingServiceName(event.target.value)}
                            placeholder="Support Maintenance"
                          />
                          <select
                            value={editingServiceStatus}
                            onChange={(event) =>
                              setEditingServiceStatus(event.target.value as ServiceRecord["status"])
                            }
                          >
                            <option value="ACTIVE">Active</option>
                            <option value="PLANNED">Planned</option>
                            <option value="PAUSED">Paused</option>
                          </select>
                        </div>
                        <div className="service-record-actions">
                          <button className="primary-button" type="submit" disabled={saving}>
                            Save
                          </button>
                          <button className="secondary-button" type="button" onClick={cancelEditingService}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="service-record" key={service.id}>
                        <div className="service-record-copy">
                          <strong className="service-record-title">{service.name}</strong>
                          <span className={`service-status service-status-${service.status.toLowerCase()}`}>
                            {STATUS_LABELS[service.status]}
                          </span>
                        </div>
                        {canManageServices ? (
                          <div className="service-record-actions">
                            <button
                              className="service-action-button"
                              type="button"
                              onClick={() => startEditingService(service)}
                            >
                              Edit
                            </button>
                            <button
                              className="service-action-button service-action-button-danger"
                              type="button"
                              onClick={() => void deleteService(service.id)}
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="page-feedback">No services have been assigned yet for this client company.</p>
              )}

              {canManageServices && isExpanded ? (
                <form className="services-inline-form" onSubmit={(event) => void createService(event, company.id)}>
                  <div className="services-inline-form-header">
                    <div>
                      <p className="page-kicker">New Service</p>
                      <h4>Add another service for this client</h4>
                    </div>
                  </div>
                  <div className="service-edit-grid">
                    <label className="form-field">
                      <span>Add a service</span>
                      <input
                        value={newServiceDrafts[company.id]?.name ?? ""}
                        onChange={(event) =>
                          setNewServiceDrafts((current) => ({
                            ...current,
                            [company.id]: {
                              name: event.target.value,
                              status: current[company.id]?.status ?? "ACTIVE",
                            },
                          }))
                        }
                        placeholder="Implementation, Support Maintenance, Training"
                      />
                    </label>
                    <label className="form-field">
                      <span>Status</span>
                      <select
                        value={newServiceDrafts[company.id]?.status ?? "ACTIVE"}
                        onChange={(event) =>
                          setNewServiceDrafts((current) => ({
                            ...current,
                            [company.id]: {
                              name: current[company.id]?.name ?? "",
                              status: event.target.value as ServiceRecord["status"],
                            },
                          }))
                        }
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="PLANNED">Planned</option>
                        <option value="PAUSED">Paused</option>
                      </select>
                    </label>
                  </div>
                  <button className="primary-button" type="submit" disabled={saving}>
                    Add Service
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

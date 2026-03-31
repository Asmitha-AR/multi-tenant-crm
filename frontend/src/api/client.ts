import axios from "axios";

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return "/api/v1";
  }

  if (typeof window === "undefined") {
    return configuredBaseUrl;
  }

  try {
    const parsed = new URL(configuredBaseUrl);
    const localHosts = new Set(["localhost", "127.0.0.1"]);
    if (localHosts.has(parsed.hostname) && localHosts.has(window.location.hostname)) {
      parsed.hostname = window.location.hostname;
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return configuredBaseUrl;
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

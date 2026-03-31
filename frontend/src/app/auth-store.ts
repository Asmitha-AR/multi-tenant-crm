import { create } from "zustand";
import { apiClient } from "../api/client";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  organization?: {
    id: number;
    name: string;
    subscription_plan: string;
  };
};

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loadMe: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  async login(username, password) {
    set({ loading: true });
    try {
      const response = await apiClient.post("/auth/login/", { username, password });
      const payload = response.data.data;
      localStorage.setItem("access_token", payload.access);
      localStorage.setItem("refresh_token", payload.refresh);
      set({ user: payload.user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    set({ user: null });
  },
  async loadMe() {
    if (!localStorage.getItem("access_token")) {
      set({ user: null, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const response = await apiClient.get("/auth/me/");
      set({ user: response.data.data, loading: false });
    } catch {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      set({ user: null, loading: false });
    }
  },
}));

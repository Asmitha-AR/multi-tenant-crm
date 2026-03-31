import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "../app/auth-store";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { CompanyListPage } from "../pages/CompanyListPage";
import { CompanyDetailPage } from "../pages/CompanyDetailPage";
import { ActivityLogPage } from "../pages/ActivityLogPage";
import { AppLayout } from "../layouts/AppLayout";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function AppRouter() {
  const loadMe = useAuthStore((state) => state.loadMe);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="companies" element={<CompanyListPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />
        <Route path="activity-logs" element={<ActivityLogPage />} />
      </Route>
    </Routes>
  );
}


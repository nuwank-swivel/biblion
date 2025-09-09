import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { useAuthStore } from "../features/auth/store";

const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const HomePage = lazy(() => import("../pages/HomePage"));

export function AppRoutes() {
  const { isAuthenticated, isInitializing } = useAuthStore();

  const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
    if (isInitializing) return <div />;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

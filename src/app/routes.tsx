import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const HomePage = lazy(() => import("../pages/HomePage"));

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app" element={<HomePage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

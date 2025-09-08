import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
export function AppRoutes() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsx(Route, { path: "/app", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login", replace: true }) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}

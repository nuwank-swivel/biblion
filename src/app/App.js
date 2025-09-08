import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { AppRoutes } from './routes';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Spinner } from '../components/Spinner';
export default function App() {
    return (_jsx(ErrorBoundary, { children: _jsx(Suspense, { fallback: _jsx(Spinner, {}), children: _jsx(AppRoutes, {}) }) }));
}

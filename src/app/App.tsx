import { Suspense } from "react";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Spinner } from "../components/Spinner";

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <AppRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}

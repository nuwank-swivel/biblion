import { Suspense } from "react";
import { AppRoutes } from "./routes";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Spinner } from "../components/Spinner";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../features/auth/firebase";
import { useEffect } from "react";
import { useAuthStore } from "../features/auth/store";

export default function App() {
  const { setUserFromFirebase, setInitializing } = useAuthStore();

  useEffect(() => {
    if (import.meta.env.MODE === "test") {
      setUserFromFirebase(null);
      setInitializing(false);
      return () => {};
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUserFromFirebase(firebaseUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, [setUserFromFirebase, setInitializing]);

  return (
    <ErrorBoundary>
      <Suspense fallback={<Spinner />}>
        <AppRoutes />
      </Suspense>
    </ErrorBoundary>
  );
}

import { AppShell } from "../components/layout/AppShell";
import { FirestoreTest } from "../components/FirestoreTest";

export default function HomePage() {
  return (
    <>
      <FirestoreTest />
      <AppShell />
    </>
  );
}

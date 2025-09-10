import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Validate required environment variables (skip strict checks in test mode)
const isTestEnv = typeof import.meta !== "undefined" && import.meta.env?.MODE === "test";
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (!isTestEnv) {
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missingVars.join(
        ", "
      )}. ` +
        "Please check your .env file and ensure all VITE_FIREBASE_* variables are set."
    );
  }
}

const firebaseConfig = isTestEnv
  ? {
      apiKey: "test-api-key",
      authDomain: "test-project.firebaseapp.com",
      projectId: "test-project",
      appId: "test-app-id",
    }
  : {
      apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
      authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
      appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
    };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request Drive App Data scope per Story 1.2
if (typeof (googleProvider as unknown as { addScope?: (s: string) => void }).addScope === "function") {
  (googleProvider as unknown as { addScope: (s: string) => void }).addScope(
    "https://www.googleapis.com/auth/drive.appdata"
  );
}
export const db = getFirestore(app);

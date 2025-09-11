import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL5ViWEjoXuvvTcMF6HAh8xzdp-bmUoNo",
  authDomain: "bibilon-1234.firebaseapp.com",
  projectId: "bibilon-1234",
  storageBucket: "bibilon-1234.firebasestorage.app",
  messagingSenderId: "388703432593",
  appId: "1:388703432593:web:5d0abf68782a5f14167430",
  measurementId: "G-4TYHF4RLG6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request Drive App Data scope per Story 1.2
if (typeof (googleProvider as unknown as { addScope?: (s: string) => void }).addScope === "function") {
  (googleProvider as unknown as { addScope: (s: string) => void }).addScope(
    "https://www.googleapis.com/auth/drive.appdata"
  );
}
export const db = getFirestore(app);

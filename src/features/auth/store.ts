import { create } from "zustand";
import type { User } from "firebase/auth";

export type AuthUserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

export type AuthState = {
  user: AuthUserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isLoading: boolean;
  error: string | null;
  setInitializing: (initializing: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  setUserFromFirebase: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,
  setInitializing: (initializing) => set({ isInitializing: initializing }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (message) => set({ error: message }),
  setUserFromFirebase: (firebaseUser) =>
    set(() => {
      if (!firebaseUser) {
        return { user: null, isAuthenticated: false };
      }
      const profile: AuthUserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? null,
        email: firebaseUser.email ?? null,
        photoURL: firebaseUser.photoURL ?? null,
      };
      return { user: profile, isAuthenticated: true };
    }),
  setAccessToken: (token) => set({ accessToken: token }),
  reset: () =>
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isInitializing: false,
      isLoading: false,
      error: null,
    }),
}));



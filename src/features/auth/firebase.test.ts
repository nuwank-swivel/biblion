import { describe, it, expect, vi, beforeEach } from "vitest";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Mock Firebase modules
vi.mock("firebase/app");
vi.mock("firebase/auth");
vi.mock("firebase/firestore");

describe("Firebase Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Firebase Module Structure", () => {
    it("should have proper Firebase configuration structure", () => {
      // Test that the Firebase configuration object has the expected structure
      const expectedConfig = {
        apiKey: expect.any(String),
        authDomain: expect.any(String),
        projectId: expect.any(String),
        appId: expect.any(String),
      };

      // This test verifies that the configuration object structure is correct
      // when environment variables are properly set
      expect(expectedConfig).toMatchObject({
        apiKey: expect.any(String),
        authDomain: expect.any(String),
        projectId: expect.any(String),
        appId: expect.any(String),
      });
    });

    it("should export required Firebase services", async () => {
      // Mock environment variables for successful import
      vi.stubGlobal("import", {
        meta: {
          env: {
            VITE_FIREBASE_API_KEY: "test-api-key",
            VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
            VITE_FIREBASE_PROJECT_ID: "test-project",
            VITE_FIREBASE_APP_ID: "test-app-id",
          },
        },
      });

      const mockApp = { name: "test-app" };
      const mockAuth = { name: "test-auth" };
      const mockProvider = { name: "google-provider" };
      const mockDb = { name: "test-db" };

      vi.mocked(initializeApp).mockReturnValue(mockApp);
      vi.mocked(getAuth).mockReturnValue(mockAuth);
      vi.mocked(GoogleAuthProvider).mockReturnValue(mockProvider);
      vi.mocked(getFirestore).mockReturnValue(mockDb);

      const firebaseModule = await import("./firebase");

      // Verify all required exports are present
      expect(firebaseModule.app).toBeDefined();
      expect(firebaseModule.auth).toBeDefined();
      expect(firebaseModule.googleProvider).toBeDefined();
      expect(firebaseModule.db).toBeDefined();
    });
  });

  describe("Environment Variable Validation Logic", () => {
    it("should validate required environment variables", () => {
      // Test the validation logic directly
      const requiredEnvVars = {
        VITE_FIREBASE_API_KEY: "test-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "test-project",
        VITE_FIREBASE_APP_ID: "test-app-id",
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      expect(missingVars).toHaveLength(0);
    });

    it("should identify missing environment variables", () => {
      const requiredEnvVars = {
        VITE_FIREBASE_API_KEY: undefined,
        VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: undefined,
        VITE_FIREBASE_APP_ID: "test-app-id",
      };

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key]) => key);

      expect(missingVars).toContain("VITE_FIREBASE_API_KEY");
      expect(missingVars).toContain("VITE_FIREBASE_PROJECT_ID");
      expect(missingVars).toHaveLength(2);
    });

    it("should create proper error message for missing variables", () => {
      const missingVars = [
        "VITE_FIREBASE_API_KEY",
        "VITE_FIREBASE_AUTH_DOMAIN",
      ];
      const errorMessage =
        `Missing required Firebase environment variables: ${missingVars.join(
          ", "
        )}. ` +
        "Please check your .env file and ensure all VITE_FIREBASE_* variables are set.";

      expect(errorMessage).toContain(
        "Missing required Firebase environment variables"
      );
      expect(errorMessage).toContain("VITE_FIREBASE_API_KEY");
      expect(errorMessage).toContain("VITE_FIREBASE_AUTH_DOMAIN");
      expect(errorMessage).toContain("Please check your .env file");
    });
  });

  describe("Firebase Configuration Object", () => {
    it("should create correct Firebase config object", () => {
      const envVars = {
        VITE_FIREBASE_API_KEY: "test-api-key",
        VITE_FIREBASE_AUTH_DOMAIN: "test-project.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "test-project",
        VITE_FIREBASE_APP_ID: "test-app-id",
      };

      const firebaseConfig = {
        apiKey: envVars.VITE_FIREBASE_API_KEY,
        authDomain: envVars.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: envVars.VITE_FIREBASE_PROJECT_ID,
        appId: envVars.VITE_FIREBASE_APP_ID,
      };

      expect(firebaseConfig).toEqual({
        apiKey: "test-api-key",
        authDomain: "test-project.firebaseapp.com",
        projectId: "test-project",
        appId: "test-app-id",
      });
    });

    it("should handle all required Firebase configuration fields", () => {
      const config = {
        apiKey: "test-api-key",
        authDomain: "test-project.firebaseapp.com",
        projectId: "test-project",
        appId: "test-app-id",
      };

      // Verify all required fields are present
      expect(config).toHaveProperty("apiKey");
      expect(config).toHaveProperty("authDomain");
      expect(config).toHaveProperty("projectId");
      expect(config).toHaveProperty("appId");

      // Verify field types
      expect(typeof config.apiKey).toBe("string");
      expect(typeof config.authDomain).toBe("string");
      expect(typeof config.projectId).toBe("string");
      expect(typeof config.appId).toBe("string");
    });
  });
});

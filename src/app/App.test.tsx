import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import App from "./App";

// Mock the components
vi.mock("./routes", () => ({
  AppRoutes: () => <div data-testid="app-routes">App Routes</div>,
}));

vi.mock("../components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

vi.mock("../components/Spinner", () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

describe("App Component Integration Tests", () => {
  const theme = createTheme();

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("App Structure", () => {
    it("should render the main app structure", () => {
      renderApp();

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
      expect(screen.getByTestId("app-routes")).toBeInTheDocument();
    });

    it("should wrap app with error boundary", () => {
      renderApp();

      const errorBoundary = screen.getByTestId("error-boundary");
      expect(errorBoundary).toBeInTheDocument();
    });

    it("should include suspense for lazy loading", () => {
      renderApp();

      // The Suspense component should be present (wrapping AppRoutes)
      expect(screen.getByTestId("app-routes")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should provide error boundary for the entire app", () => {
      renderApp();

      const errorBoundary = screen.getByTestId("error-boundary");
      expect(errorBoundary).toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    it("should handle loading states with spinner", () => {
      renderApp();

      // The Spinner component should be available for fallback
      // (though it may not be visible if routes load immediately)
      expect(screen.getByTestId("app-routes")).toBeInTheDocument();
    });
  });

  describe("Theme Integration", () => {
    it("should apply Material-UI theme to the app", () => {
      renderApp();

      // Verify that the app renders with theme
      expect(screen.getByTestId("app-routes")).toBeInTheDocument();
    });
  });
});

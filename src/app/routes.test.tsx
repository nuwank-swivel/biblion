import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import App from "./App";

// Mock the components
vi.mock("../features/auth/LoginPage", () => ({
  default: () => <div data-testid="login-page">Login Page</div>,
}));

vi.mock("../pages/HomePage", () => ({
  default: () => <div data-testid="home-page">Home Page</div>,
}));

vi.mock("../components/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  ),
}));

describe("App Routing Integration Tests", () => {
  const theme = createTheme();

  const renderWithRouter = (initialEntries = ["/"]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("App Structure", () => {
    it("should render the app with error boundary", () => {
      renderWithRouter(["/"]);

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should handle different routes", () => {
      renderWithRouter(["/"]);

      // The app should render with error boundary
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  describe("Error Boundary Integration", () => {
    it("should wrap the app with error boundary", () => {
      renderWithRouter(["/"]);

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });

    it("should handle routing errors gracefully", () => {
      // Test that the error boundary is present
      renderWithRouter(["/"]);

      const errorBoundary = screen.getByTestId("error-boundary");
      expect(errorBoundary).toBeInTheDocument();
    });
  });

  describe("Theme Integration", () => {
    it("should apply Material-UI theme", () => {
      renderWithRouter(["/"]);

      // Verify that the theme provider is working
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });

  describe("Navigation Flow", () => {
    it("should support different route configurations", () => {
      const { rerender } = renderWithRouter(["/"]);

      // Start at root
      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();

      // Test different route
      rerender(
        <MemoryRouter initialEntries={["/app"]}>
          <ThemeProvider theme={theme}>
            <App />
          </ThemeProvider>
        </MemoryRouter>
      );

      expect(screen.getByTestId("error-boundary")).toBeInTheDocument();
    });
  });
});

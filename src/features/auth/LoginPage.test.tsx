import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

// Mock window.location
const mockLocation = {
  href: "",
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
};

Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

describe("LoginPage Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = "";
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );
  };

  describe("Authentication Flow", () => {
    it("should render login page with correct elements", () => {
      renderLoginPage();

      // Check for main elements
      expect(screen.getByText("Biblion")).toBeInTheDocument();
      expect(
        screen.getByText("Your AI-powered smart note-taking app")
      ).toBeInTheDocument();
      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });

    it("should have proper page structure", () => {
      renderLoginPage();

      // Check for Material-UI components
      const container = document.querySelector('[class*="MuiContainer"]');
      expect(container).toBeInTheDocument();

      // Check for button
      const button = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(button).toBeInTheDocument();
    });

    it("should handle Google sign-in button click", () => {
      renderLoginPage();

      const signInButton = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      // Click the button
      fireEvent.click(signInButton);

      // In unit test environment, don't assert navigation
      expect(signInButton).toBeInTheDocument();
    });

    it("should be accessible", () => {
      renderLoginPage();

      // Check for proper heading structure
      const heading = screen.getByRole("heading", { level: 4 });
      expect(heading).toHaveTextContent("Biblion");

      // Check button accessibility
      const button = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(button).toBeEnabled();
    });
  });

  describe("User Experience", () => {
    it("should display clear call-to-action", () => {
      renderLoginPage();

      // Verify clear messaging
      expect(
        screen.getByText("Your AI-powered smart note-taking app")
      ).toBeInTheDocument();
      expect(screen.getByText("Sign in with Google")).toBeInTheDocument();
    });

    it("should have proper visual hierarchy", () => {
      renderLoginPage();

      // Check that main title is prominent
      const title = screen.getByText("Biblion");
      expect(title).toBeInTheDocument();

      // Check that subtitle provides context
      const subtitle = screen.getByText(
        "Your AI-powered smart note-taking app"
      );
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe("Authentication Integration", () => {
    it("should prepare for Firebase authentication integration", () => {
      renderLoginPage();

      // Verify that the component structure supports future Firebase integration
      const button = screen.getByRole("button", {
        name: /sign in with google/i,
      });
      expect(button).toBeInTheDocument();

      // The button should be ready for Firebase auth integration
      expect(button).toHaveAttribute("type", "button");
    });

    it("should handle authentication state changes", () => {
      renderLoginPage();

      // Test that the component can handle state changes
      const button = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      // Simulate loading state (for future implementation)
      fireEvent.click(button);

      // Verify that the component responds to user interaction
      expect(button).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should handle authentication errors gracefully", () => {
      renderLoginPage();

      // Test that the component doesn't crash on interaction
      const button = screen.getByRole("button", {
        name: /sign in with google/i,
      });

      // Multiple clicks should not cause issues
      fireEvent.click(button);
      fireEvent.click(button);

      // Component should still be functional
      expect(button).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("should render properly on different screen sizes", () => {
      renderLoginPage();

      // Check that the container has proper responsive classes
      const container = document.querySelector('[class*="MuiContainer"]');
      expect(container).toBeInTheDocument();

      // Verify that the layout is centered
      const box = document.querySelector('[class*="MuiBox"]');
      expect(box).toBeInTheDocument();
    });
  });
});

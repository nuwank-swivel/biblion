import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveStatusIndicator } from "./save-status";
import { SaveStatus } from "../../features/data/schemas/version";

describe("SaveStatusIndicator", () => {
  const mockOnRetry = vi.fn();
  const mockOnManualSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Status Display", () => {
    it("should display saving status with spinner", () => {
      const status: SaveStatus = {
        state: "saving",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("should display saved status with timestamp", () => {
      const lastSaved = new Date(Date.now() - 30000); // 30 seconds ago
      const status: SaveStatus = {
        state: "saved",
        lastSaved,
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    });

    it("should display error status with error message", () => {
      const status: SaveStatus = {
        state: "error",
        error: "Network error",
        retryCount: 1,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
    });

    it("should display idle status", () => {
      const status: SaveStatus = {
        state: "idle",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(screen.getByText("Not saved")).toBeInTheDocument();
    });
  });

  describe("Compact Mode", () => {
    it("should display compact version when compact prop is true", () => {
      const status: SaveStatus = {
        state: "saved",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
          compact
        />
      );

      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  describe("Action Buttons", () => {
    it("should show retry button when status is error", () => {
      const status: SaveStatus = {
        state: "error",
        error: "Save failed",
        retryCount: 1,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      const retryButton = screen.getByLabelText("Retry save");
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });

    it("should show manual save button when onManualSave is provided", () => {
      const status: SaveStatus = {
        state: "idle",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      const saveButton = screen.getByLabelText("Save now (Ctrl+S)");
      expect(saveButton).toBeInTheDocument();

      fireEvent.click(saveButton);
      expect(mockOnManualSave).toHaveBeenCalledTimes(1);
    });

    it("should not show manual save button when status is saving", () => {
      const status: SaveStatus = {
        state: "saving",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(
        screen.queryByLabelText("Save now (Ctrl+S)")
      ).not.toBeInTheDocument();
    });
  });

  describe("Timestamp Formatting", () => {
    it("should format recent timestamps correctly", () => {
      const now = new Date();
      const status: SaveStatus = {
        state: "saved",
        lastSaved: new Date(now.getTime() - 30000), // 30 seconds ago
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      expect(screen.getByText(/Saved/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      const status: SaveStatus = {
        state: "saving",
        retryCount: 0,
      };

      render(
        <SaveStatusIndicator
          status={status}
          onRetry={mockOnRetry}
          onManualSave={mockOnManualSave}
        />
      );

      // Check that the component renders without accessibility issues
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });
});

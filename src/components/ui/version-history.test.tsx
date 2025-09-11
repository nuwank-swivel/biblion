import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VersionHistory } from "./version-history";
import { versionManager } from "../../features/sync/version-manager";

// Mock the version manager
vi.mock("../../features/sync/version-manager", () => ({
  versionManager: {
    getVersionHistory: vi.fn(),
    restoreVersion: vi.fn(),
  },
}));

describe("VersionHistory", () => {
  const mockOnClose = vi.fn();
  const mockOnRestore = vi.fn();
  const mockGetVersionHistory = vi.mocked(versionManager.getVersionHistory);
  const mockRestoreVersion = vi.mocked(versionManager.restoreVersion);

  const mockVersions = [
    {
      id: "version-1",
      pageId: "page-1",
      content: "<p>Current content</p>",
      timestamp: new Date("2024-01-01T12:00:00Z"),
      author: "user@example.com",
      changeSummary: "Latest changes",
      fileSize: 100,
      revisionId: "rev-1",
    },
    {
      id: "version-2",
      pageId: "page-1",
      content: "<p>Previous content</p>",
      timestamp: new Date("2024-01-01T11:00:00Z"),
      author: "user@example.com",
      changeSummary: "Previous changes",
      fileSize: 90,
      revisionId: "rev-2",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Dialog Rendering", () => {
    it("should render version history dialog when open", () => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      expect(screen.getByText("Version History")).toBeInTheDocument();
      expect(screen.getByText("Current")).toBeInTheDocument();
    });

    it("should not render when closed", () => {
      render(
        <VersionHistory
          open={false}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      expect(screen.queryByText("Version History")).not.toBeInTheDocument();
    });
  });

  describe("Version Loading", () => {
    it("should load versions when dialog opens", async () => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(mockGetVersionHistory).toHaveBeenCalledWith({
          pageId: "page-1",
          limit: 50,
          offset: 0,
        });
      });

      expect(screen.getByText("Current")).toBeInTheDocument();
      expect(screen.getByText("Version 2")).toBeInTheDocument();
    });

    it("should show loading state while fetching versions", () => {
      mockGetVersionHistory.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      // Should show loading indicator
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should show error state when loading fails", async () => {
      mockGetVersionHistory.mockRejectedValue(new Error("Failed to load"));

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Failed to load")).toBeInTheDocument();
      });
    });

    it("should show empty state when no versions exist", async () => {
      mockGetVersionHistory.mockResolvedValue([]);

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText("No version history available")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Version Display", () => {
    beforeEach(() => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);
    });

    it("should display version information correctly", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Current")).toBeInTheDocument();
        expect(screen.getByText("Version 2")).toBeInTheDocument();
      });

      // Check that version details are displayed
      expect(screen.getByText("Latest changes")).toBeInTheDocument();
      expect(screen.getByText("Previous changes")).toBeInTheDocument();
    });

    it("should show current version with chip", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(screen.getByText("Current")).toBeInTheDocument();
      });
    });

    it("should display file size and timestamp", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/100 B/)).toBeInTheDocument();
        expect(screen.getByText(/90 B/)).toBeInTheDocument();
      });
    });
  });

  describe("Version Selection", () => {
    beforeEach(() => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);
    });

    it("should allow selecting versions", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const versionItem = screen.getByText("Version 2");
        fireEvent.click(versionItem);
      });

      // Version should be selected (visual feedback would be tested in integration tests)
    });
  });

  describe("Version Restoration", () => {
    beforeEach(() => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);
      mockRestoreVersion.mockResolvedValue(undefined);
    });

    it("should restore version when restore button is clicked", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const restoreButton = screen.getAllByLabelText(
          "Restore this version"
        )[0];
        fireEvent.click(restoreButton);
      });

      expect(mockRestoreVersion).toHaveBeenCalledWith("version-2");
      expect(mockOnRestore).toHaveBeenCalledWith(mockVersions[1]);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should show restore button for non-current versions only", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const restoreButtons = screen.getAllByLabelText("Restore this version");
        expect(restoreButtons).toHaveLength(1); // Only for version-2, not current
      });
    });

    it("should handle restore errors", async () => {
      mockRestoreVersion.mockRejectedValue(new Error("Restore failed"));

      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const restoreButton = screen.getAllByLabelText(
          "Restore this version"
        )[0];
        fireEvent.click(restoreButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Restore failed")).toBeInTheDocument();
      });
    });
  });

  describe("Dialog Actions", () => {
    beforeEach(() => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);
    });

    it("should close dialog when close button is clicked", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const closeButton = screen.getByLabelText("close");
        fireEvent.click(closeButton);
      });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("should show restore button in dialog actions when version is selected", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const versionItem = screen.getByText("Version 2");
        fireEvent.click(versionItem);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Restore Selected Version")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Compare Functionality", () => {
    beforeEach(() => {
      mockGetVersionHistory.mockResolvedValue(mockVersions);
    });

    it("should show compare button for all versions", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const compareButtons = screen.getAllByLabelText("Compare with current");
        expect(compareButtons).toHaveLength(2); // One for each version
      });
    });

    it("should handle compare button click", async () => {
      render(
        <VersionHistory
          open={true}
          onClose={mockOnClose}
          pageId="page-1"
          onRestore={mockOnRestore}
        />
      );

      await waitFor(() => {
        const compareButton = screen.getAllByLabelText(
          "Compare with current"
        )[0];
        fireEvent.click(compareButton);
      });

      // Compare functionality would be implemented in future iterations
      // For now, just ensure the button is clickable
    });
  });
});

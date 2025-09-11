import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotebooksSidebar } from "./NotebooksSidebar";
import { useAuthStore } from "../../features/auth/store";
import { notebookService } from "../../services/notebookService";

// Mock the auth store
jest.mock("../../features/auth/store", () => ({
  useAuthStore: jest.fn(),
}));

// Mock the notebook service
jest.mock("../../services/notebookService", () => ({
  notebookService: {
    getNotebooks: jest.fn(),
    createNotebook: jest.fn(),
    updateNotebook: jest.fn(),
    deleteNotebook: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockNotebookService = notebookService as jest.Mocked<typeof notebookService>;

describe("NotebooksSidebar", () => {
  const mockUser = { uid: "test-user-id" };
  const mockNotebooks = [
    {
      id: "notebook-1",
      title: "Work Notes",
      description: "Work-related notes",
      userId: "test-user-id",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      pinned: false,
    },
    {
      id: "notebook-2",
      title: "Personal",
      description: "Personal notes",
      userId: "test-user-id",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
      pinned: true,
    },
  ];

  const mockProps = {
    selectedNotebookId: "notebook-1",
    onNotebookSelect: jest.fn(),
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockNotebookService.getNotebooks.mockResolvedValue(mockNotebooks);
    mockNotebookService.createNotebook.mockResolvedValue({
      id: "new-notebook",
      title: "New Notebook",
      description: "",
      userId: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
    });
    mockNotebookService.updateNotebook.mockResolvedValue(undefined);
    mockNotebookService.deleteNotebook.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when notebooks are being loaded", () => {
    mockNotebookService.getNotebooks.mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    render(<NotebooksSidebar {...mockProps} />);

    expect(screen.getByText("Loading notebooks...")).toBeInTheDocument();
  });

  it("renders notebooks list when loaded", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    // Check descriptions
    expect(screen.getByText("Work-related notes")).toBeInTheDocument();
    expect(screen.getByText("Personal notes")).toBeInTheDocument();
  });

  it("displays pinned notebooks with pin icon", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    // Check that pinned notebook shows pin icon
    const pinIcons = screen.getAllByTestId("PushPinIcon");
    expect(pinIcons).toHaveLength(1); // Only pinned notebook should show pin icon
  });

  it("highlights selected notebook", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Check that selected notebook has highlight styling
    const selectedNotebook = screen.getByText("Work Notes").closest("div");
    expect(selectedNotebook).toHaveStyle("background-color: rgba(255, 193, 7, 0.1)");
  });

  it("calls onNotebookSelect when notebook is clicked", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Personal"));

    expect(mockProps.onNotebookSelect).toHaveBeenCalledWith("notebook-2");
  });

  it("opens add notebook modal when + button is clicked", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add notebook/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Create New Notebook")).toBeInTheDocument();
  });

  it("shows context menu on right click", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    const notebookItem = screen.getByText("Work Notes").closest("div");
    fireEvent.contextMenu(notebookItem!);

    expect(screen.getByText("Pin")).toBeInTheDocument();
    expect(screen.getByText("Rename")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("handles pin/unpin functionality", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Right click to open context menu
    const notebookItem = screen.getByText("Work Notes").closest("div");
    fireEvent.contextMenu(notebookItem!);

    // Click pin option
    fireEvent.click(screen.getByText("Pin"));

    expect(mockNotebookService.updateNotebook).toHaveBeenCalledWith(
      "notebook-1",
      { pinned: true }
    );
  });

  it("handles delete functionality", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Right click to open context menu
    const notebookItem = screen.getByText("Work Notes").closest("div");
    fireEvent.contextMenu(notebookItem!);

    // Click delete option
    fireEvent.click(screen.getByText("Delete"));

    expect(mockNotebookService.deleteNotebook).toHaveBeenCalledWith(
      "notebook-1"
    );
  });

  it("handles rename functionality", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Right click to open context menu
    const notebookItem = screen.getByText("Work Notes").closest("div");
    fireEvent.contextMenu(notebookItem!);

    // Click rename option
    fireEvent.click(screen.getByText("Rename"));

    // Should show rename dialog or inline editing
    expect(screen.getByDisplayValue("Work Notes")).toBeInTheDocument();
  });

  it("displays empty state when no notebooks exist", async () => {
    mockNotebookService.getNotebooks.mockResolvedValue([]);

    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("No notebooks yet")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first notebook to get started")
      ).toBeInTheDocument();
    });
  });

  it("handles error state when notebooks fail to load", async () => {
    mockNotebookService.getNotebooks.mockRejectedValue(
      new Error("Failed to load notebooks")
    );

    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load notebooks")).toBeInTheDocument();
    });
  });

  it("shows navigation icons", () => {
    render(<NotebooksSidebar {...mockProps} />);

    // Check that navigation icons are present
    expect(screen.getByTestId("DescriptionIcon")).toBeInTheDocument(); // Documents icon
    expect(screen.getByTestId("PeopleIcon")).toBeInTheDocument(); // People icon
    expect(screen.getByTestId("StorageIcon")).toBeInTheDocument(); // Storage icon
  });

  it("handles notebook creation through modal", async () => {
    render(<NotebooksSidebar {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Open add modal
    const addButton = screen.getByRole("button", { name: /add notebook/i });
    fireEvent.click(addButton);

    // Fill form
    const titleInput = screen.getByLabelText(/notebook name/i);
    fireEvent.change(titleInput, { target: { value: "New Notebook" } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: "New description" } });

    // Submit form
    const createButton = screen.getByRole("button", { name: /create notebook/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockNotebookService.createNotebook).toHaveBeenCalledWith({
        title: "New Notebook",
        description: "New description",
        userId: "test-user-id",
      });
    });
  });
});

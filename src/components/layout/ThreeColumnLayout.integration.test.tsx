import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppShell } from "./AppShell";
import { useAuthStore } from "../../features/auth/store";
import { notebookService, noteService } from "../../services/notebookService";

// Mock the auth store
jest.mock("../../features/auth/store", () => ({
  useAuthStore: jest.fn(),
}));

// Mock the services
jest.mock("../../services/notebookService", () => ({
  notebookService: {
    getNotebooks: jest.fn(),
    createNotebook: jest.fn(),
    updateNotebook: jest.fn(),
    deleteNotebook: jest.fn(),
  },
  noteService: {
    getNotes: jest.fn(),
    getNote: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockNotebookService = notebookService as jest.Mocked<typeof notebookService>;
const mockNoteService = noteService as jest.Mocked<typeof noteService>;

describe("Three Column Layout Integration", () => {
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

  const mockNotes = [
    {
      id: "note-1",
      title: "Meeting Notes",
      content: "<p>Notes from today's meeting</p>",
      notebookId: "notebook-1",
      userId: "test-user-id",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      pinned: false,
      tags: ["work", "meeting"],
    },
    {
      id: "note-2",
      title: "Ideas",
      content: "<p>Random ideas and thoughts</p>",
      notebookId: "notebook-1",
      userId: "test-user-id",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
      pinned: true,
      tags: ["personal"],
    },
  ];

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockNotebookService.getNotebooks.mockResolvedValue(mockNotebooks);
    mockNoteService.getNotes.mockResolvedValue(mockNotes);
    mockNoteService.getNote.mockResolvedValue(mockNotes[0]);
    mockNoteService.createNote.mockResolvedValue({
      id: "new-note",
      title: "New Note",
      content: "",
      notebookId: "notebook-1",
      userId: "test-user-id",
      createdAt: new Date(),
      updatedAt: new Date(),
      pinned: false,
      tags: [],
    });
    mockNoteService.updateNote.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("completes full workflow: notebook selection → note filtering → note editing", async () => {
    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Step 1: Select a notebook
    fireEvent.click(screen.getByText("Work Notes"));

    // Wait for notes to load for selected notebook
    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Step 2: Select a note
    fireEvent.click(screen.getByText("Meeting Notes"));

    // Wait for note editor to load
    await waitFor(() => {
      expect(screen.getByDisplayValue("Meeting Notes")).toBeInTheDocument();
    });

    // Step 3: Edit note content
    const editor = document.getElementById("note-content-editor");
    expect(editor).toBeInTheDocument();

    // Test rich text formatting
    fireEvent.click(screen.getByTitle("Bold (Ctrl+B)"));
    fireEvent.click(screen.getByTitle("Italic (Ctrl+I)"));

    // Test keyboard shortcuts
    fireEvent.keyDown(editor!, { key: "b", ctrlKey: true });
    fireEvent.keyDown(editor!, { key: "i", ctrlKey: true });

    // Verify the editor is functional
    expect(editor).toHaveAttribute("contenteditable", "true");
  });

  it("handles notebook switching and note filtering", async () => {
    const personalNotes = [
      {
        id: "note-3",
        title: "Personal Note",
        content: "<p>Personal content</p>",
        notebookId: "notebook-2",
        userId: "test-user-id",
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
        pinned: false,
        tags: ["personal"],
      },
    ];

    // Mock different notes for different notebooks
    mockNoteService.getNotes
      .mockResolvedValueOnce(mockNotes) // First call for notebook-1
      .mockResolvedValueOnce(personalNotes); // Second call for notebook-2

    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select first notebook
    fireEvent.click(screen.getByText("Work Notes"));

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Switch to second notebook
    fireEvent.click(screen.getByText("Personal"));

    // Wait for notes to update
    await waitFor(() => {
      expect(screen.getByText("Personal Note")).toBeInTheDocument();
      expect(screen.queryByText("Meeting Notes")).not.toBeInTheDocument();
    });
  });

  it("handles note creation workflow", async () => {
    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select notebook
    fireEvent.click(screen.getByText("Work Notes"));

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Open add note modal
    const addNoteButton = screen.getByRole("button", { name: /add note/i });
    fireEvent.click(addNoteButton);

    // Fill note creation form
    const titleInput = screen.getByLabelText(/note name/i);
    fireEvent.change(titleInput, { target: { value: "New Meeting Notes" } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: "Notes for new meeting" } });

    // Create note
    const createButton = screen.getByRole("button", { name: /create note/i });
    fireEvent.click(createButton);

    // Verify note creation
    await waitFor(() => {
      expect(mockNoteService.createNote).toHaveBeenCalledWith({
        title: "New Meeting Notes",
        content: "Notes for new meeting",
        notebookId: "notebook-1",
        userId: "test-user-id",
        tags: [],
      });
    });
  });

  it("handles search functionality across notes", async () => {
    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select notebook
    fireEvent.click(screen.getByText("Work Notes"));

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Search for specific note
    const searchInput = screen.getByPlaceholderText("Q Search notes");
    fireEvent.change(searchInput, { target: { value: "meeting" } });

    // Should filter to show only matching notes
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.queryByText("Ideas")).not.toBeInTheDocument();

    // Clear search
    fireEvent.change(searchInput, { target: { value: "" } });

    // Should show all notes again
    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });
  });

  it("handles view toggle between list and grid", async () => {
    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select notebook
    fireEvent.click(screen.getByText("Work Notes"));

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Toggle to grid view
    const gridViewButton = screen.getByRole("button", { name: /grid view/i });
    fireEvent.click(gridViewButton);

    // Should still show notes but in grid layout
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.getByText("Ideas")).toBeInTheDocument();

    // Toggle back to list view
    const listViewButton = screen.getByRole("button", { name: /list view/i });
    fireEvent.click(listViewButton);

    // Should show notes in list layout
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.getByText("Ideas")).toBeInTheDocument();
  });

  it.skip("shows selected highlight parity across Notebooks and Notes columns", async () => {
    render(<AppShell />);

    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select notebook and note
    fireEvent.click(screen.getByText("Work Notes"));
    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Meeting Notes"));

    // Notebook item should show yellow border
    const selectedNotebook = screen.getByText("Work Notes").closest("div");
    expect(selectedNotebook).toHaveStyle(`border-left: 4px solid`);

    // Note item should show the same border style
    const selectedNote = screen.getByText("Meeting Notes").closest("div");
    expect(selectedNote).toHaveStyle(`border-left: 4px solid`);
  });

  it("handles pin/unpin functionality across components", async () => {
    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Select notebook
    fireEvent.click(screen.getByText("Work Notes"));

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Pin a note via context menu
    const noteItem = screen.getByText("Meeting Notes").closest("div");
    fireEvent.contextMenu(noteItem!);

    fireEvent.click(screen.getByText("Pin"));

    // Verify pin action
    expect(mockNoteService.updateNote).toHaveBeenCalledWith("note-1", {
      pinned: true,
    });
  });

  it("handles responsive layout behavior", async () => {
    // Mock mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<AppShell />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Work Notes")).toBeInTheDocument();
    });

    // Should still show all three columns but with responsive behavior
    expect(screen.getByText("Work Notes")).toBeInTheDocument();
  });

  it("handles error states gracefully", async () => {
    // Mock service errors
    mockNotebookService.getNotebooks.mockRejectedValue(
      new Error("Failed to load notebooks")
    );

    render(<AppShell />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText("Failed to load notebooks")).toBeInTheDocument();
    });
  });
});

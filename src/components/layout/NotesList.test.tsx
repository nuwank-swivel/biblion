import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NotesList } from "./NotesList";
import { useAuthStore } from "../../features/auth/store";
import { noteService, notebookService } from "../../services/notebookService";

// Mock the auth store
jest.mock("../../features/auth/store", () => ({
  useAuthStore: jest.fn(),
}));

// Mock the services
jest.mock("../../services/notebookService", () => ({
  noteService: {
    getNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
  },
  notebookService: {
    getNotebooks: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockNoteService = noteService as jest.Mocked<typeof noteService>;
const mockNotebookService = notebookService as jest.Mocked<typeof notebookService>;

describe("NotesList", () => {
  const mockUser = { uid: "test-user-id" };
  const mockNotes = [
    {
      id: "note-1",
      title: "Meeting Notes",
      content: "Notes from today's meeting",
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
      content: "Random ideas and thoughts",
      notebookId: "notebook-1",
      userId: "test-user-id",
      createdAt: new Date("2024-01-02"),
      updatedAt: new Date("2024-01-02"),
      pinned: true,
      tags: ["personal"],
    },
  ];

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
  ];

  const mockProps = {
    selectedNotebookId: "notebook-1",
    selectedNoteId: "note-1",
    onNoteSelect: jest.fn(),
    notebooks: mockNotebooks,
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockNoteService.getNotes.mockResolvedValue(mockNotes);
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
    mockNoteService.deleteNote.mockResolvedValue(undefined);
    mockNotebookService.getNotebooks.mockResolvedValue(mockNotebooks);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when notes are being loaded", () => {
    mockNoteService.getNotes.mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    render(<NotesList {...mockProps} />);

    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("renders notes list when loaded", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Check content previews
    expect(screen.getByText("Notes from today's meeting")).toBeInTheDocument();
    expect(screen.getByText("Random ideas and thoughts")).toBeInTheDocument();
  });

  it("displays pinned notes with pin icon", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Check that pinned note shows pin icon
    const pinIcons = screen.getAllByTestId("PushPinIcon");
    expect(pinIcons).toHaveLength(1); // Only pinned note should show pin icon
  });

  it("highlights selected note", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Check that selected note has highlight styling
    const selectedNote = screen.getByText("Meeting Notes").closest("div");
    expect(selectedNote).toHaveStyle("background-color: rgba(255, 193, 7, 0.1)");
  });

  it("calls onNoteSelect when note is clicked", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Ideas"));

    expect(mockProps.onNoteSelect).toHaveBeenCalledWith("note-2");
  });

  it("opens add note modal when + button is clicked", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /add note/i });
    fireEvent.click(addButton);

    expect(screen.getByText("Create New Note")).toBeInTheDocument();
  });

  it("handles search functionality", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Q Search notes");
    fireEvent.change(searchInput, { target: { value: "meeting" } });

    // Should filter notes based on search
    expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    expect(screen.queryByText("Ideas")).not.toBeInTheDocument();
  });

  it("toggles between list and grid view", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Check initial view (list view)
    const listViewButton = screen.getByRole("button", { name: /list view/i });
    const gridViewButton = screen.getByRole("button", { name: /grid view/i });

    expect(listViewButton).toHaveAttribute("aria-pressed", "true");
    expect(gridViewButton).toHaveAttribute("aria-pressed", "false");

    // Switch to grid view
    fireEvent.click(gridViewButton);

    expect(listViewButton).toHaveAttribute("aria-pressed", "false");
    expect(gridViewButton).toHaveAttribute("aria-pressed", "true");
  });

  it("shows context menu on right click", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    const noteItem = screen.getByText("Meeting Notes").closest("div");
    fireEvent.contextMenu(noteItem!);

    expect(screen.getByText("Pin")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("handles pin/unpin functionality", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Right click to open context menu
    const noteItem = screen.getByText("Meeting Notes").closest("div");
    fireEvent.contextMenu(noteItem!);

    // Click pin option
    fireEvent.click(screen.getByText("Pin"));

    expect(mockNoteService.updateNote).toHaveBeenCalledWith("note-1", {
      pinned: true,
    });
  });

  it("handles delete functionality", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Right click to open context menu
    const noteItem = screen.getByText("Meeting Notes").closest("div");
    fireEvent.contextMenu(noteItem!);

    // Click delete option
    fireEvent.click(screen.getByText("Delete"));

    expect(mockNoteService.deleteNote).toHaveBeenCalledWith("note-1");
  });

  it("displays note tags", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Check that tags are displayed
    expect(screen.getByText("work")).toBeInTheDocument();
    expect(screen.getByText("meeting")).toBeInTheDocument();
    expect(screen.getByText("personal")).toBeInTheDocument();
  });

  it("displays empty state when no notes exist", async () => {
    mockNoteService.getNotes.mockResolvedValue([]);

    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("No notes yet")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first note to get started")
      ).toBeInTheDocument();
    });
  });

  it("handles error state when notes fail to load", async () => {
    mockNoteService.getNotes.mockRejectedValue(
      new Error("Failed to load notes")
    );

    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load notes")).toBeInTheDocument();
    });
  });

  it("handles note creation through modal", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Open add modal
    const addButton = screen.getByRole("button", { name: /add note/i });
    fireEvent.click(addButton);

    // Fill form
    const titleInput = screen.getByLabelText(/note name/i);
    fireEvent.change(titleInput, { target: { value: "New Note" } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: "New description" } });

    // Submit form
    const createButton = screen.getByRole("button", { name: /create note/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockNoteService.createNote).toHaveBeenCalledWith({
        title: "New Note",
        content: "New description",
        notebookId: "notebook-1",
        userId: "test-user-id",
        tags: [],
      });
    });
  });

  it("filters notes by selected notebook", async () => {
    const notesFromDifferentNotebook = [
      ...mockNotes,
      {
        id: "note-3",
        title: "Other Note",
        content: "Note from different notebook",
        notebookId: "notebook-2",
        userId: "test-user-id",
        createdAt: new Date("2024-01-03"),
        updatedAt: new Date("2024-01-03"),
        pinned: false,
        tags: [],
      },
    ];

    mockNoteService.getNotes.mockResolvedValue(notesFromDifferentNotebook);

    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
      expect(screen.getByText("Ideas")).toBeInTheDocument();
    });

    // Should not show note from different notebook
    expect(screen.queryByText("Other Note")).not.toBeInTheDocument();
  });

  it("shows last modified time", async () => {
    render(<NotesList {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText("Meeting Notes")).toBeInTheDocument();
    });

    // Check that last modified time is displayed
    expect(screen.getByText(/Last modified:/)).toBeInTheDocument();
  });
});

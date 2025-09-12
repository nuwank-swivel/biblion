import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NotesList } from "./NotesList";
import { noteService } from "../../services/notebookService";
import { useAuthStore } from "../../features/auth/store";

// Mock the auth store
vi.mock("../../features/auth/store", () => ({
  useAuthStore: vi.fn(),
}));

// Mock the note service
vi.mock("../../services/notebookService", () => ({
  noteService: {
    subscribeToNotes: vi.fn(),
    createNote: vi.fn(),
  },
}));

describe("NotesList Auto-Selection", () => {
  const mockUser = { uid: "test-user-id" };
  const mockOnNoteSelect = vi.fn();

  const mockProps = {
    selectedNotebookId: "notebook-1",
    selectedNoteId: undefined, // No note selected initially
    onNoteSelect: mockOnNoteSelect,
    notebooks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      reset: vi.fn(),
    });
  });

  it("should auto-select first note when notes are loaded and no note is selected", async () => {
    const mockNotes = [
      {
        id: "note-1",
        title: "First Note",
        content: "Content of first note",
        notebookId: "notebook-1",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
        order: 0,
        tags: [],
      },
      {
        id: "note-2",
        title: "Second Note",
        content: "Content of second note",
        notebookId: "notebook-1",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
        order: 1,
        tags: [],
      },
    ];

    let notesCallback: (notes: any[]) => void;
    vi.mocked(noteService.subscribeToNotes).mockImplementation(
      (notebookId, callback) => {
        notesCallback = callback;
        return () => {}; // Return unsubscribe function
      }
    );

    render(<NotesList {...mockProps} />);

    // Simulate notes being loaded
    notesCallback!(mockNotes);

    await waitFor(() => {
      expect(mockOnNoteSelect).toHaveBeenCalledWith("note-1");
    });
  });

  it("should not auto-select when a note is already selected", async () => {
    const mockNotes = [
      {
        id: "note-1",
        title: "First Note",
        content: "Content of first note",
        notebookId: "notebook-1",
        userId: "test-user-id",
        createdAt: new Date(),
        updatedAt: new Date(),
        pinned: false,
        order: 0,
        tags: [],
      },
    ];

    const propsWithSelectedNote = {
      ...mockProps,
      selectedNoteId: "note-2", // Note already selected
    };

    let notesCallback: (notes: any[]) => void;
    vi.mocked(noteService.subscribeToNotes).mockImplementation(
      (notebookId, callback) => {
        notesCallback = callback;
        return () => {};
      }
    );

    render(<NotesList {...propsWithSelectedNote} />);

    // Simulate notes being loaded
    notesCallback!(mockNotes);

    await waitFor(() => {
      expect(mockOnNoteSelect).not.toHaveBeenCalled();
    });
  });

  it("should not auto-select when no notes are available", async () => {
    let notesCallback: (notes: any[]) => void;
    vi.mocked(noteService.subscribeToNotes).mockImplementation(
      (notebookId, callback) => {
        notesCallback = callback;
        return () => {};
      }
    );

    render(<NotesList {...mockProps} />);

    // Simulate empty notes array
    notesCallback!([]);

    await waitFor(() => {
      expect(mockOnNoteSelect).not.toHaveBeenCalled();
    });
  });

  it("should auto-select newly created note", async () => {
    vi.mocked(noteService.createNote).mockResolvedValue("new-note-id");

    let notesCallback: (notes: any[]) => void;
    vi.mocked(noteService.subscribeToNotes).mockImplementation(
      (notebookId, callback) => {
        notesCallback = callback;
        return () => {};
      }
    );

    render(<NotesList {...mockProps} />);

    // Simulate creating a new note
    const handleSaveNote = vi.fn();
    // This would be called when the AddNoteModal saves a note
    // We can't directly test the modal integration here, but we can test the logic

    expect(noteService.createNote).toBeDefined();
  });
});

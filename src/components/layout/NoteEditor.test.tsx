import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NoteEditor } from "./NoteEditor";
import { useAuthStore } from "../../features/auth/store";
import { noteService } from "../../services/notebookService";

// Mock the auth store
jest.mock("../../features/auth/store", () => ({
  useAuthStore: jest.fn(),
}));

// Mock the note service
jest.mock("../../services/notebookService", () => ({
  noteService: {
    getNote: jest.fn(),
    updateNote: jest.fn(),
  },
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockNoteService = noteService as jest.Mocked<typeof noteService>;

describe("NoteEditor", () => {
  const mockUser = { uid: "test-user-id" };
  const mockNote = {
    id: "test-note-id",
    title: "Test Note",
    content: "<p>Test content</p>",
    notebookId: "test-notebook-id",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    tags: ["test"],
  };

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    mockNoteService.getNote.mockResolvedValue(mockNote);
    mockNoteService.updateNote.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state when note is being loaded", () => {
    mockNoteService.getNote.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<NoteEditor selectedNoteId="test-note-id" />);

    expect(screen.getByText("Loading note...")).toBeInTheDocument();
  });

  it("renders error state when note loading fails", async () => {
    mockNoteService.getNote.mockRejectedValue(new Error("Failed to load"));

    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load note")).toBeInTheDocument();
    });
  });

  it("renders empty state when no note is selected", () => {
    render(<NoteEditor />);

    expect(
      screen.getByText("Select a note to view and edit")
    ).toBeInTheDocument();
  });

  it("renders note content when note is loaded", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
    });

    // Check that the content editor is rendered
    const editor = document.getElementById("note-content-editor");
    expect(editor).toBeInTheDocument();
    expect(editor).toHaveAttribute("contenteditable", "true");
  });

  it("handles title changes", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test Note")).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue("Test Note");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    expect(titleInput).toHaveValue("Updated Title");
  });

  it("handles content changes in rich text editor", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      const editor = document.getElementById("note-content-editor");
      expect(editor).toBeInTheDocument();
    });

    const editor = document.getElementById("note-content-editor");
    fireEvent.input(editor!, {
      target: { innerHTML: "<p>Updated content</p>" },
    });

    expect(editor).toContainHTML("<p>Updated content</p>");
  });

  it("handles keyboard shortcuts for formatting", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      const editor = document.getElementById("note-content-editor");
      expect(editor).toBeInTheDocument();
    });

    const editor = document.getElementById("note-content-editor");

    // Test Ctrl+B for bold
    fireEvent.keyDown(editor!, { key: "b", ctrlKey: true });

    // Test Ctrl+I for italic
    fireEvent.keyDown(editor!, { key: "i", ctrlKey: true });

    // Test Ctrl+U for underline
    fireEvent.keyDown(editor!, { key: "u", ctrlKey: true });

    // Test Ctrl+Z for undo
    fireEvent.keyDown(editor!, { key: "z", ctrlKey: true });

    // Test Ctrl+Shift+Z for redo
    fireEvent.keyDown(editor!, { key: "z", ctrlKey: true, shiftKey: true });
  });

  it("handles toolbar button clicks for formatting", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      const editor = document.getElementById("note-content-editor");
      expect(editor).toBeInTheDocument();
    });

    // Test bold button
    const boldButton = screen.getByTitle("Bold (Ctrl+B)");
    fireEvent.click(boldButton);

    // Test italic button
    const italicButton = screen.getByTitle("Italic (Ctrl+I)");
    fireEvent.click(italicButton);

    // Test underline button
    const underlineButton = screen.getByTitle("Underline (Ctrl+U)");
    fireEvent.click(underlineButton);

    // Test alignment buttons
    const alignLeftButton = screen.getByTitle("Align Left");
    fireEvent.click(alignLeftButton);

    const alignCenterButton = screen.getByTitle("Align Center");
    fireEvent.click(alignCenterButton);

    const alignRightButton = screen.getByTitle("Align Right");
    fireEvent.click(alignRightButton);

    // Test list buttons
    const bulletListButton = screen.getByTitle("Bullet List");
    fireEvent.click(bulletListButton);

    const numberedListButton = screen.getByTitle("Numbered List");
    fireEvent.click(numberedListButton);

    // Test special formatting buttons
    const quoteButton = screen.getByTitle("Quote");
    fireEvent.click(quoteButton);

    const codeButton = screen.getByTitle("Code Block");
    fireEvent.click(codeButton);

    // Test undo button
    const undoButton = screen.getByTitle("Undo (Ctrl+Z)");
    fireEvent.click(undoButton);
  });

  it("displays note metadata correctly", async () => {
    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      expect(screen.getByText("Test Note")).toBeInTheDocument();
    });

    // Check that tags are displayed
    expect(screen.getByText("test")).toBeInTheDocument();

    // Check that last modified time is displayed
    expect(screen.getByText(/Last modified:/)).toBeInTheDocument();
  });

  it("auto-saves changes after delay", async () => {
    jest.useFakeTimers();

    render(<NoteEditor selectedNoteId="test-note-id" />);

    await waitFor(() => {
      const editor = document.getElementById("note-content-editor");
      expect(editor).toBeInTheDocument();
    });

    const editor = document.getElementById("note-content-editor");
    fireEvent.input(editor!, {
      target: { innerHTML: "<p>Updated content</p>" },
    });

    // Fast-forward time to trigger auto-save
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockNoteService.updateNote).toHaveBeenCalledWith("test-note-id", {
        title: "Test Note",
        content: "<p>Updated content</p>",
      });
    });

    jest.useRealTimers();
  });
});

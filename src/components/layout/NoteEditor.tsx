import React from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Toolbar,
  Divider,
  Paper,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  FormatBold as FormatBoldIcon,
  FormatItalic as FormatItalicIcon,
  FormatUnderlined as FormatUnderlinedIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  FormatAlignCenter as FormatAlignCenterIcon,
  FormatAlignRight as FormatAlignRightIcon,
  FormatListBulleted as FormatListBulletedIcon,
  FormatListNumbered as FormatListNumberedIcon,
  FormatQuote as FormatQuoteIcon,
  Code as CodeIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { Note } from "../../types/notebook";
import { noteService } from "../../services/notebookService";
import { useAuthStore } from "../../features/auth/store";

interface NoteEditorProps {
  selectedNoteId?: string;
}

export function NoteEditor({ selectedNoteId }: NoteEditorProps) {
  const { user } = useAuthStore();
  const [currentNote, setCurrentNote] = React.useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = React.useState("");
  const [noteContent, setNoteContent] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load note when selectedNoteId changes
  React.useEffect(() => {
    if (!user || !selectedNoteId) {
      setCurrentNote(null);
      setNoteTitle("");
      setNoteContent("");
      setLoading(false);
      return;
    }

    const loadNote = async () => {
      try {
        setLoading(true);
        const note = await noteService.getNote(selectedNoteId);
        if (note) {
          setCurrentNote(note);
          setNoteTitle(note.title);
          setNoteContent(note.content);
        } else {
          setCurrentNote(null);
          setNoteTitle("");
          setNoteContent("");
        }
        setError(null);
      } catch (err) {
        setError("Failed to load note");
        console.error("Error loading note:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [user, selectedNoteId]);

  // Auto-save functionality
  React.useEffect(() => {
    if (!currentNote || !user) return;

    const timeoutId = setTimeout(async () => {
      try {
        await noteService.updateNote(currentNote.id, {
          title: noteTitle,
          content: noteContent,
        });
      } catch (err) {
        console.error("Error auto-saving note:", err);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [noteTitle, noteContent, currentNote, user]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setNoteContent(target.innerHTML);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case "b":
          event.preventDefault();
          handleFormatAction("bold");
          break;
        case "i":
          event.preventDefault();
          handleFormatAction("italic");
          break;
        case "u":
          event.preventDefault();
          handleFormatAction("underline");
          break;
        case "z":
          event.preventDefault();
          if (event.shiftKey) {
            handleFormatAction("redo");
          } else {
            handleFormatAction("undo");
          }
          break;
        case "y":
          event.preventDefault();
          handleFormatAction("redo");
          break;
      }
    }
  };

  const handleFormatAction = (action: string) => {
    // Focus the content editor before applying formatting
    const editor = document.getElementById("note-content-editor");
    if (editor) {
      editor.focus();
    }

    switch (action) {
      case "bold":
        document.execCommand("bold", false);
        break;
      case "italic":
        document.execCommand("italic", false);
        break;
      case "underline":
        document.execCommand("underline", false);
        break;
      case "align-left":
        document.execCommand("justifyLeft", false);
        break;
      case "align-center":
        document.execCommand("justifyCenter", false);
        break;
      case "align-right":
        document.execCommand("justifyRight", false);
        break;
      case "bullet-list":
        document.execCommand("insertUnorderedList", false);
        break;
      case "numbered-list":
        document.execCommand("insertOrderedList", false);
        break;
      case "quote":
        document.execCommand("formatBlock", false, "blockquote");
        break;
      case "code":
        document.execCommand("formatBlock", false, "pre");
        break;
      case "undo":
        document.execCommand("undo", false);
        break;
      case "redo":
        document.execCommand("redo", false);
        break;
      default:
        console.log(`Unhandled format action: ${action}`);
    }
  };

  const formatLastModified = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading note...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!currentNote) {
    return (
      <Box
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a note to view and edit
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Note Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          variant="standard"
          value={noteTitle}
          onChange={handleTitleChange}
          placeholder="Note title..."
          InputProps={{
            disableUnderline: true,
            sx: {
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "text.primary",
            },
          }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Last modified: {formatLastModified(currentNote.updatedAt)}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {currentNote.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: "0.75rem",
                  "& .MuiChip-label": {
                    px: 0.5,
                  },
                }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* Note Content */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Box
          id="note-content-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={handleContentChange}
          onKeyDown={handleKeyDown}
          dangerouslySetInnerHTML={{ __html: noteContent }}
          sx={{
            height: "100%",
            minHeight: "200px",
            padding: 2,
            border: "1px solid transparent",
            borderRadius: 1,
            fontSize: "0.875rem",
            lineHeight: 1.6,
            fontFamily: "inherit",
            outline: "none",
            overflow: "auto",
            "&:focus": {
              border: "1px solid",
              borderColor: "primary.main",
            },
            "&:empty:before": {
              content: '"Start writing your note..."',
              color: "text.disabled",
              fontStyle: "italic",
            },
            // Rich text formatting styles
            "& strong, & b": {
              fontWeight: "bold",
            },
            "& em, & i": {
              fontStyle: "italic",
            },
            "& u": {
              textDecoration: "underline",
            },
            "& blockquote": {
              borderLeft: "4px solid",
              borderColor: "primary.main",
              paddingLeft: 2,
              marginLeft: 0,
              fontStyle: "italic",
              color: "text.secondary",
            },
            "& pre": {
              backgroundColor: "grey.100",
              padding: 1,
              borderRadius: 1,
              fontFamily: "monospace",
              fontSize: "0.75rem",
              overflow: "auto",
            },
            "& ul, & ol": {
              paddingLeft: 2,
            },
            "& li": {
              marginBottom: 0.5,
            },
          }}
        />
      </Box>

      {/* Formatting Toolbar */}
      <Paper
        elevation={1}
        sx={{
          borderTop: 1,
          borderColor: "divider",
          borderRadius: 0,
        }}
      >
        <Toolbar
          variant="dense"
          sx={{
            minHeight: 48,
            px: 2,
            gap: 0.5,
            justifyContent: "space-between",
          }}
        >
          {/* Text Formatting */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Bold (Ctrl+B)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("bold")}
                sx={{ p: 0.5 }}
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("italic")}
                sx={{ p: 0.5 }}
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline (Ctrl+U)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("underline")}
                sx={{ p: 0.5 }}
              >
                <FormatUnderlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Alignment */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Align Left">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("align-left")}
                sx={{ p: 0.5 }}
              >
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("align-center")}
                sx={{ p: 0.5 }}
              >
                <FormatAlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("align-right")}
                sx={{ p: 0.5 }}
              >
                <FormatAlignRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Lists */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Bullet List">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("bullet-list")}
                sx={{ p: 0.5 }}
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("numbered-list")}
                sx={{ p: 0.5 }}
              >
                <FormatListNumberedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Special Formatting */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Quote">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("quote")}
                sx={{ p: 0.5 }}
              >
                <FormatQuoteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code Block">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("code")}
                sx={{ p: 0.5 }}
              >
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Share">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("share")}
                sx={{ p: 0.5 }}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("undo")}
                sx={{ p: 0.5 }}
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Options">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("more")}
                sx={{ p: 0.5 }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Paper>
    </Box>
  );
}

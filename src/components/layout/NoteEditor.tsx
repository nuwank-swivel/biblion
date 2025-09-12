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
  Alert,
  Snackbar,
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
  Warning as WarningIcon,
} from "@mui/icons-material";
import { Note } from "../../types/notebook";
import { noteService } from "../../services/notebookService";
import { useAuthStore } from "../../features/auth/store";
import { autoSaveService } from "../../features/sync/auto-save";
import { versionManager } from "../../features/sync/version-manager";
import { conflictDetector } from "../../features/sync/conflict-detector";
import { conflictService } from "../../features/sync/conflict-service";
import { SaveStatusIndicator } from "../ui/save-status";
import { VersionHistory } from "../ui/version-history";
import { ConflictResolutionDialog } from "../ui/ConflictResolutionDialog";
import {
  ConflictData,
  ConflictResolution,
} from "../../features/data/schemas/conflict";

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
  const [saveStatus, setSaveStatus] = React.useState<any>({
    state: "idle",
    retryCount: 0,
  });
  const [showVersionHistory, setShowVersionHistory] = React.useState(false);
  const [lastContentHash, setLastContentHash] = React.useState<string>("");

  // Conflict resolution state
  const [activeConflict, setActiveConflict] =
    React.useState<ConflictData | null>(null);
  const [showConflictDialog, setShowConflictDialog] = React.useState(false);
  const [conflictNotification, setConflictNotification] = React.useState<
    string | null
  >(null);
  const [isMonitoringConflicts, setIsMonitoringConflicts] =
    React.useState(false);

  // Ref for the content editor to avoid React re-rendering issues
  const editorRef = React.useRef<HTMLDivElement>(null);
  const isUpdatingFromProps = React.useRef(false);

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

  // Update editor content when noteContent changes (but only if different)
  React.useEffect(() => {
    const editor = editorRef.current;
    if (
      editor &&
      currentNote &&
      !isUpdatingFromProps.current &&
      editor.innerHTML !== noteContent
    ) {
      isUpdatingFromProps.current = true;
      editor.innerHTML = noteContent;
      isUpdatingFromProps.current = false;
    }
  }, [noteContent, currentNote]);

  // Auto-save functionality with new service
  React.useEffect(() => {
    if (!currentNote || !user) {
      // Stop auto-save for current note
      if (currentNote?.id) {
        autoSaveService.stopAutoSave(currentNote.id);
      }
      return;
    }

    // Subscribe to save status changes
    const unsubscribe = autoSaveService.subscribeToSaveStatus(
      currentNote.id,
      setSaveStatus
    );

    // Start auto-save
    autoSaveService.startAutoSave(currentNote.id, noteContent, noteTitle);

    return () => {
      unsubscribe();
      autoSaveService.stopAutoSave(currentNote.id);
    };
  }, [noteTitle, noteContent, currentNote, user]);

  // Create version on significant content changes
  React.useEffect(() => {
    if (!currentNote || !user || !noteContent) return;

    const contentHash = btoa(noteContent).slice(0, 16); // Simple hash
    if (contentHash !== lastContentHash && lastContentHash !== "") {
      // Content has changed significantly, create a version
      versionManager.createVersion(
        currentNote.id,
        noteContent,
        user.email || "Unknown",
        "Auto-saved version"
      );
    }
    setLastContentHash(contentHash);
  }, [noteContent, currentNote, user, lastContentHash]);

  // Conflict detection and monitoring
  React.useEffect(() => {
    if (!currentNote || !user) {
      if (isMonitoringConflicts) {
        conflictDetector.stopConflictMonitoring(
          currentNote?.id || "",
          user?.uid || ""
        );
        setIsMonitoringConflicts(false);
      }
      return;
    }

    // Start conflict monitoring
    if (!isMonitoringConflicts) {
      conflictDetector.startConflictMonitoring(currentNote.id, user.uid);
      setIsMonitoringConflicts(true);
    }

    // Subscribe to conflict events
    const unsubscribeConflicts = conflictDetector.subscribeToConflicts(
      currentNote.id,
      (conflict: ConflictData) => {
        setActiveConflict(conflict);
        setShowConflictDialog(true);
        setConflictNotification(
          `Conflict detected with user ${
            conflict.user1Id === user.uid ? conflict.user2Id : conflict.user1Id
          }`
        );
      }
    );

    return () => {
      unsubscribeConflicts();
      if (isMonitoringConflicts) {
        conflictDetector.stopConflictMonitoring(currentNote.id, user.uid);
        setIsMonitoringConflicts(false);
      }
    };
  }, [currentNote, user, isMonitoringConflicts]);

  // Detect conflicts when content changes
  React.useEffect(() => {
    if (!currentNote || !user || !noteContent || !isMonitoringConflicts) return;

    const detectConflicts = async () => {
      try {
        const conflictResult = await conflictDetector.detectConflict(
          currentNote.id,
          noteContent,
          user.uid,
          new Date()
        );

        if (conflictResult.hasConflict && conflictResult.conflictId) {
          const conflict = conflictDetector.getActiveConflicts(
            currentNote.id
          )[0];
          if (conflict) {
            setActiveConflict(conflict);
            setShowConflictDialog(true);
            setConflictNotification(
              `Conflict detected: ${conflictResult.details}`
            );
          }
        }
      } catch (error) {
        console.error("Error detecting conflicts:", error);
      }
    };

    // Debounce conflict detection
    const timeoutId = setTimeout(detectConflicts, 1000);
    return () => clearTimeout(timeoutId);
  }, [noteContent, currentNote, user, isMonitoringConflicts]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleContentChange = (event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setNoteContent(target.innerHTML);
  };

  // Handle input changes while preserving cursor position
  const handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (isUpdatingFromProps.current) return;

    const target = event.target as HTMLDivElement;
    setNoteContent(target.innerHTML);
  };

  // Conflict resolution handlers
  const handleConflictResolve = async (resolution: ConflictResolution) => {
    try {
      await conflictService.resolveConflict(activeConflict!.id, resolution);
      setActiveConflict(null);
      setShowConflictDialog(false);
      setConflictNotification("Conflict resolved successfully");

      // Refresh the note content if needed
      if (resolution.mergedContent) {
        setNoteContent(resolution.mergedContent);
      }
    } catch (error) {
      console.error("Error resolving conflict:", error);
      setConflictNotification("Failed to resolve conflict");
    }
  };

  const handleConflictDialogClose = () => {
    setShowConflictDialog(false);
    setActiveConflict(null);
  };

  const handleConflictNotificationClose = () => {
    setConflictNotification(null);
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
        case "s":
          event.preventDefault();
          handleManualSave();
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

  const handleManualSave = async () => {
    if (!currentNote) return;

    try {
      await autoSaveService.manualSave(currentNote.id, noteContent, noteTitle);
    } catch (err) {
      console.error("Manual save failed:", err);
    }
  };

  const handleRetrySave = async () => {
    if (!currentNote) return;

    try {
      await autoSaveService.manualSave(currentNote.id, noteContent, noteTitle);
    } catch (err) {
      console.error("Retry save failed:", err);
    }
  };

  const handleVersionRestore = (version: any) => {
    setNoteContent(version.content);
    // Focus the editor to trigger auto-save
    const editor = editorRef.current;
    if (editor) {
      editor.focus();
    }
  };

  const handleFormatAction = (action: string) => {
    // Focus the content editor before applying formatting
    const editor = editorRef.current;
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Last modified: {formatLastModified(currentNote.updatedAt)}
            </Typography>
            <SaveStatusIndicator
              status={saveStatus}
              onRetry={handleRetrySave}
              onManualSave={handleManualSave}
              compact
            />
          </Box>
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
          ref={editorRef}
          id="note-content-editor"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          role="textbox"
          aria-label="Note content editor"
          aria-multiline="true"
          tabIndex={0}
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
                aria-label="Make text bold"
                role="button"
              >
                <FormatBoldIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("italic")}
                sx={{ p: 0.5 }}
                aria-label="Make text italic"
                role="button"
              >
                <FormatItalicIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline (Ctrl+U)">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("underline")}
                sx={{ p: 0.5 }}
                aria-label="Make text underlined"
                role="button"
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
                aria-label="Align text to left"
                role="button"
              >
                <FormatAlignLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("align-center")}
                sx={{ p: 0.5 }}
                aria-label="Align text to center"
                role="button"
              >
                <FormatAlignCenterIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("align-right")}
                sx={{ p: 0.5 }}
                aria-label="Align text to right"
                role="button"
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
                aria-label="Create bullet list"
                role="button"
              >
                <FormatListBulletedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("numbered-list")}
                sx={{ p: 0.5 }}
                aria-label="Create numbered list"
                role="button"
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
                aria-label="Create quote block"
                role="button"
              >
                <FormatQuoteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code Block">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("code")}
                sx={{ p: 0.5 }}
                aria-label="Create code block"
                role="button"
              >
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Conflict Status */}
          {activeConflict && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mr: 2 }}>
              <WarningIcon color="warning" fontSize="small" />
              <Typography variant="caption" color="warning.main">
                Conflict Detected
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Share">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("share")}
                sx={{ p: 0.5 }}
                aria-label="Share note"
                role="button"
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Version History">
              <IconButton
                size="small"
                onClick={() => setShowVersionHistory(true)}
                sx={{ p: 0.5 }}
                aria-label="View version history"
                role="button"
              >
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Options">
              <IconButton
                size="small"
                onClick={() => handleFormatAction("more")}
                sx={{ p: 0.5 }}
                aria-label="More formatting options"
                role="button"
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </Paper>

      {/* Version History Dialog */}
      {currentNote && (
        <VersionHistory
          open={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          pageId={currentNote.id}
          onRestore={handleVersionRestore}
        />
      )}

      {/* Conflict Resolution Dialog */}
      <ConflictResolutionDialog
        open={showConflictDialog}
        conflict={activeConflict}
        onClose={handleConflictDialogClose}
        onResolve={handleConflictResolve}
        currentUserId={user?.uid || ""}
      />

      {/* Conflict Notifications */}
      <Snackbar
        open={!!conflictNotification}
        autoHideDuration={6000}
        onClose={handleConflictNotificationClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleConflictNotificationClose}
          severity={
            conflictNotification?.includes("resolved") ? "success" : "warning"
          }
          sx={{ width: "100%" }}
        >
          {conflictNotification}
        </Alert>
      </Snackbar>
    </Box>
  );
}

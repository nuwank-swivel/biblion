import React, { useMemo, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon as MenuListItemIcon,
  ListItemText as MenuListItemText,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  MoreVert as MoreVertIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { AddNoteModal } from "../ui/AddNoteModal";
import { Note, Notebook } from "../../types/notebook";
import { noteService, notebookService } from "../../services/notebookService";
import { useAuthStore } from "../../features/auth/store";

interface NotesListProps {
  selectedNotebookId?: string;
  selectedNoteId?: string;
  onNoteSelect?: (noteId: string) => void;
  notebooks?: Notebook[];
}

export const NotesList = React.memo(function NotesList({
  selectedNotebookId,
  selectedNoteId,
  onNoteSelect,
  notebooks = [],
}: NotesListProps) {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    noteId: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [draggedNoteId, setDraggedNoteId] = React.useState<string | null>(null);

  // Use ref to track selected note without causing re-renders
  const selectedNoteIdRef = useRef(selectedNoteId);
  selectedNoteIdRef.current = selectedNoteId;

  // Track if we've loaded notes for the current notebook
  const loadedNotebookRef = useRef<string | null>(null);

  // Memoize the callback to prevent unnecessary re-subscriptions
  const handleNotesUpdate = useCallback(
    (notes: Note[]) => {
      setNotes(notes);
      setLoading(false);
      setError(null);

      // Auto-select first note if no note is currently selected
      // Only do this once when notes are first loaded, not on every update
      if (notes.length > 0 && !selectedNoteIdRef.current && onNoteSelect) {
        onNoteSelect(notes[0].id);
      }
    },
    [onNoteSelect] // Remove selectedNoteId from dependencies to prevent re-subscriptions
  );

  // Load notes when selectedNotebookId changes
  React.useEffect(() => {
    if (!user || !selectedNotebookId) return;

    // Only show loading if we haven't loaded notes for this notebook yet
    if (loadedNotebookRef.current !== selectedNotebookId) {
      setLoading(true);
      loadedNotebookRef.current = selectedNotebookId;
    }

    const unsubscribe = noteService.subscribeToNotes(
      selectedNotebookId,
      handleNotesUpdate
    );

    return () => unsubscribe();
  }, [user, selectedNotebookId, handleNotesUpdate]);

  const handleNoteClick = useCallback(
    (noteId: string) => {
      if (onNoteSelect) {
        onNoteSelect(noteId);
      }
    },
    [onNoteSelect]
  );

  const handleAddNote = useCallback(() => {
    setAddModalOpen(true);
  }, []);

  const handleSaveNote = useCallback(
    async (
      title: string,
      content: string,
      tags: string[],
      notebookId: string
    ) => {
      if (!user) return;

      try {
        const newNoteId = await noteService.createNote(user.uid, {
          title,
          content,
          notebookId,
          pinned: false,
          tags,
        });

        // Auto-select the newly created note
        if (onNoteSelect && newNoteId) {
          onNoteSelect(newNoteId);
        }
      } catch (err) {
        setError("Failed to create note");
        console.error("Error creating note:", err);
      }
      // Remove loading state - real-time subscription will handle updates
    },
    [user, onNoteSelect]
  );

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: "list" | "grid" | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, noteId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      noteId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleTogglePin = async (noteId: string, pinned: boolean) => {
    try {
      await noteService.toggleNotePin(noteId, !pinned);
    } catch (err) {
      setError("Failed to toggle pin");
      console.error("Error toggling pin:", err);
    }
    handleCloseContextMenu();
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      await noteService.deleteNote(noteId);
    } catch (err) {
      setError("Failed to delete note");
      console.error("Error deleting note:", err);
    }
    handleCloseContextMenu();
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

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();

    if (!draggedNoteId || draggedNoteId === targetNoteId) {
      setDraggedNoteId(null);
      return;
    }

    try {
      // Get current order of notes
      const noteIds = filteredNotes.map((note) => note.id);
      const draggedIndex = noteIds.indexOf(draggedNoteId);
      const targetIndex = noteIds.indexOf(targetNoteId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      // Reorder the array
      const newOrder = [...noteIds];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedNoteId);

      // Update order in Firestore
      await noteService.reorderNotes(newOrder);
    } catch (err) {
      setError("Failed to reorder notes");
      console.error("Error reordering notes:", err);
    } finally {
      setDraggedNoteId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
  };

  // Memoize filtered notes to prevent unnecessary recalculations
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Filter by search query if provided
      const matchesSearch =
        searchQuery === "" ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      return matchesSearch;
    });
  }, [notes, searchQuery]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notes
          </Typography>
          <IconButton
            onClick={handleAddNote}
            sx={{
              backgroundColor: "primary.main",
              color: "text.primary",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
              width: 32,
              height: 32,
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Search Bar */}
        <TextField
          fullWidth
          size="small"
          placeholder="Q Search notes"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: "background.paper",
            },
          }}
        />

        {/* View Toggle */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {filteredNotes.length} notes
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
          >
            <ToggleButton value="list">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Notes List */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Loading notes...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        ) : viewMode === "list" ? (
          <List sx={{ p: 0 }}>
            {filteredNotes.map((note, index) => (
              <React.Fragment key={note.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleNoteClick(note.id)}
                    selected={selectedNoteId === note.id}
                    onContextMenu={(e) => handleContextMenu(e, note.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, note.id)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      px: 2,
                      py: 1.5,
                      cursor: "grab",
                      "&:active": {
                        cursor: "grabbing",
                      },
                      "&.Mui-selected": {
                        backgroundColor: "#FFD700", // Yellow accent color
                        "&:hover": {
                          backgroundColor: "#E6C200",
                        },
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          backgroundColor: "#FFD700",
                        },
                      },
                      opacity: draggedNoteId === note.id ? 0.5 : 1,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight:
                                selectedNoteId === note.id ? 600 : 400,
                              color:
                                selectedNoteId === note.id
                                  ? "text.primary"
                                  : "text.primary",
                              mb: 0.5,
                            }}
                          >
                            {note.title}
                          </Typography>
                          {note.pinned && (
                            <PushPinIcon
                              fontSize="small"
                              sx={{ color: "#FFD700", fontSize: "1rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              mb: 1,
                            }}
                          >
                            {note.content}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontSize: "0.75rem" }}
                            >
                              {formatLastModified(note.updatedAt)}
                            </Typography>
                            {note.tags.map((tag) => (
                              <Chip
                                key={tag}
                                label={tag}
                                size="small"
                                variant="outlined"
                                sx={{
                                  height: 16,
                                  fontSize: "0.65rem",
                                  "& .MuiChip-label": {
                                    px: 0.5,
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      }
                    />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContextMenu(e, note.id);
                      }}
                      sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
                {index < filteredNotes.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {filteredNotes.map((note) => (
                <Grid item xs={12} sm={6} md={4} key={note.id}>
                  <Card
                    sx={{
                      cursor: "grab",
                      "&:active": {
                        cursor: "grabbing",
                      },
                      border: selectedNoteId === note.id ? 2 : 1,
                      borderColor:
                        selectedNoteId === note.id ? "#FFD700" : "divider",
                      backgroundColor:
                        selectedNoteId === note.id
                          ? "#FFF9C4"
                          : "background.paper",
                      "&:hover": {
                        boxShadow: 2,
                      },
                      opacity: draggedNoteId === note.id ? 0.5 : 1,
                    }}
                    onClick={() => handleNoteClick(note.id)}
                    onContextMenu={(e) => handleContextMenu(e, note.id)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, note.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, note.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            flexGrow: 1,
                            display: "-webkit-box",
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {note.title}
                        </Typography>
                        {note.pinned && (
                          <PushPinIcon
                            fontSize="small"
                            sx={{ color: "#FFD700", fontSize: "1rem" }}
                          />
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, note.id);
                          }}
                          sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mb: 1,
                        }}
                      >
                        {note.content}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {formatLastModified(note.updatedAt)}
                        </Typography>
                        {note.tags.slice(0, 2).map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 16,
                              fontSize: "0.65rem",
                              "& .MuiChip-label": {
                                px: 0.5,
                              },
                            }}
                          />
                        ))}
                        {note.tags.length > 2 && (
                          <Typography variant="caption" color="text.secondary">
                            +{note.tags.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {contextMenu && (
          <>
            <MenuItem
              onClick={() => {
                const note = notes.find((n) => n.id === contextMenu.noteId);
                if (note) {
                  handleTogglePin(note.id, note.pinned);
                }
              }}
            >
              <MenuListItemIcon>
                {notes.find((n) => n.id === contextMenu.noteId)?.pinned ? (
                  <PushPinOutlinedIcon fontSize="small" />
                ) : (
                  <PushPinIcon fontSize="small" />
                )}
              </MenuListItemIcon>
              <MenuListItemText>
                {notes.find((n) => n.id === contextMenu.noteId)?.pinned
                  ? "Unpin"
                  : "Pin"}
              </MenuListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                const note = notes.find((n) => n.id === contextMenu.noteId);
                if (note) {
                  handleDeleteNote(note.id);
                }
              }}
              sx={{ color: "error.main" }}
            >
              <MenuListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </MenuListItemIcon>
              <MenuListItemText>Delete</MenuListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      <AddNoteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveNote}
        notebooks={notebooks.map((notebook) => ({
          id: notebook.id,
          title: notebook.title,
        }))}
        selectedNotebookId={selectedNotebookId}
      />
    </Box>
  );
});

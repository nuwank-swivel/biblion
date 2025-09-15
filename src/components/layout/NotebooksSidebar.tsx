import React from "react";
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon as MenuListItemIcon,
  ListItemText as MenuListItemText,
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  MoreVert as MoreVertIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon,
  Delete as DeleteIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { CircularProgress } from "@mui/material";
import { AddNotebookModal } from "../ui/AddNotebookModal";
import { Notebook } from "../../types/notebook";
import { notebookService } from "../../services/notebookService";
import { useAuthStore } from "../../features/auth/store";

interface NotebooksSidebarProps {
  onClose?: () => void;
  selectedNotebookId?: string;
  onNotebookSelect?: (notebookId: string) => void;
  isCollapsible?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const NotebooksSidebar = React.memo(function NotebooksSidebar({
  onClose,
  selectedNotebookId,
  onNotebookSelect,
  isCollapsible = false,
  isCollapsed = false,
  onToggleCollapse,
}: NotebooksSidebarProps) {
  const { user } = useAuthStore();
  const [notebooks, setNotebooks] = React.useState<Notebook[]>([]);
  const [addModalOpen, setAddModalOpen] = React.useState(false);
  const [contextMenu, setContextMenu] = React.useState<{
    mouseX: number;
    mouseY: number;
    notebookId: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load notebooks on component mount
  React.useEffect(() => {
    if (!user) {
      console.log("NotebooksSidebar: No user found");
      return;
    }

    console.log("NotebooksSidebar: Loading notebooks for user:", user.uid);
    setLoading(true);

    // Try real-time listener first
    const unsubscribe = notebookService.subscribeToNotebooks(
      user.uid,
      (notebooks) => {
        console.log(
          "NotebooksSidebar: Received notebooks from real-time listener:",
          notebooks
        );
        setNotebooks(notebooks);
        setLoading(false);
        setError(null);
      }
    );

    // Also try a one-time fetch as fallback
    const fetchNotebooks = async () => {
      try {
        console.log("NotebooksSidebar: Fetching notebooks as fallback");
        const fetchedNotebooks = await notebookService.getNotebooks(user.uid);
        console.log("NotebooksSidebar: Fetched notebooks:", fetchedNotebooks);

        // Only update if we don't have notebooks from real-time listener
        if (notebooks.length === 0 && fetchedNotebooks.length > 0) {
          setNotebooks(fetchedNotebooks);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        console.error("NotebooksSidebar: Error fetching notebooks:", err);
        setError("Failed to load notebooks");
        setLoading(false);
      }
    };

    // Run fallback fetch after a short delay
    const timeoutId = setTimeout(fetchNotebooks, 2000);

    return () => {
      console.log("NotebooksSidebar: Unsubscribing from notebooks");
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [user]);

  const handleNotebookClick = (notebookId: string) => {
    if (onNotebookSelect) {
      onNotebookSelect(notebookId);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleAddNotebook = () => {
    setAddModalOpen(true);
  };

  const handleSaveNotebook = async (name: string, description: string) => {
    if (!user) {
      console.log(
        "NotebooksSidebar: No user found when trying to save notebook"
      );
      return;
    }

    console.log("NotebooksSidebar: Saving notebook for user:", user.uid);

    try {
      setLoading(true);
      await notebookService.createNotebook(user.uid, {
        name,
        description,
        pinned: false,
      });
      console.log("NotebooksSidebar: Notebook saved successfully");
    } catch (err) {
      setError("Failed to create notebook");
      console.error("Error creating notebook:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenu = (event: React.MouseEvent, notebookId: string) => {
    event.preventDefault();
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      notebookId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleTogglePin = async (notebookId: string, pinned: boolean) => {
    try {
      await notebookService.toggleNotebookPin(notebookId, !pinned);
    } catch (err) {
      setError("Failed to toggle pin");
      console.error("Error toggling pin:", err);
    }
    handleCloseContextMenu();
  };

  const handleDeleteNotebook = async (notebookId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this notebook? This will also delete all notes in it."
      )
    ) {
      return;
    }

    try {
      await notebookService.deleteNotebook(notebookId);
    } catch (err) {
      setError("Failed to delete notebook");
      console.error("Error deleting notebook:", err);
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

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {isCollapsible && (
            <IconButton
              onClick={onToggleCollapse}
              size="small"
              aria-label={
                isCollapsed
                  ? "Expand notebooks column"
                  : "Collapse notebooks column"
              }
              sx={{
                mr: 1,
                color: "text.secondary",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              {isCollapsed ? (
                <ChevronRightIcon fontSize="small" />
              ) : (
                <ChevronLeftIcon fontSize="small" />
              )}
            </IconButton>
          )}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Notebooks
          </Typography>
          {loading && (
            <CircularProgress size={16} sx={{ color: "text.secondary" }} />
          )}
        </Box>
      </Box>

      {/* Notebook List */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        {error ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        ) : notebooks.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <FolderIcon
              sx={{
                fontSize: 48,
                color: "text.disabled",
                mb: 2,
              }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No notebooks yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first notebook to get started organizing your notes
            </Typography>
            <IconButton
              onClick={handleAddNotebook}
              sx={{
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                px: 3,
                py: 1,
              }}
            >
              <AddIcon sx={{ mr: 1 }} />
              Create Notebook
            </IconButton>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notebooks.map((notebook) => (
              <ListItem key={notebook.id} disablePadding>
                <ListItemButton
                  onClick={() => handleNotebookClick(notebook.id)}
                  selected={selectedNotebookId === notebook.id}
                  onContextMenu={(e) => handleContextMenu(e, notebook.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    transition: "all 0.2s ease-in-out",
                    "&.Mui-selected": {
                      backgroundColor: "#F5F5F5", // Subtle grey background
                      "&:hover": {
                        backgroundColor: "#EEEEEE",
                      },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3, // 2-3px width as specified
                        backgroundColor: "#FFD700", // Yellow left border
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {selectedNotebookId === notebook.id ? (
                      <FolderOpenIcon color="primary" />
                    ) : (
                      <FolderIcon color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight:
                              selectedNotebookId === notebook.id ? 600 : 400,
                            color:
                              selectedNotebookId === notebook.id
                                ? "text.primary"
                                : "text.primary",
                          }}
                        >
                          {notebook.name}
                        </Typography>
                        {notebook.pinned && (
                          <PushPinIcon
                            fontSize="small"
                            sx={{ color: "#FFD700", fontSize: "1rem" }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        {notebook.description && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block" }}
                          >
                            {notebook.description}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: "0.75rem" }}
                        >
                          {formatLastModified(notebook.updatedAt)}
                        </Typography>
                      </Box>
                    }
                  />
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContextMenu(e, notebook.id);
                    }}
                    sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: "background.paper",
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {notebooks.length} notebook{notebooks.length !== 1 ? "s" : ""}
          </Typography>
        </Paper>
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
                const notebook = notebooks.find(
                  (n) => n.id === contextMenu.notebookId
                );
                if (notebook) {
                  handleTogglePin(notebook.id, notebook.pinned);
                }
              }}
            >
              <MenuListItemIcon>
                {notebooks.find((n) => n.id === contextMenu.notebookId)
                  ?.pinned ? (
                  <PushPinOutlinedIcon fontSize="small" />
                ) : (
                  <PushPinIcon fontSize="small" />
                )}
              </MenuListItemIcon>
              <MenuListItemText>
                {notebooks.find((n) => n.id === contextMenu.notebookId)?.pinned
                  ? "Unpin"
                  : "Pin"}
              </MenuListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                const notebook = notebooks.find(
                  (n) => n.id === contextMenu.notebookId
                );
                if (notebook) {
                  handleDeleteNotebook(notebook.id);
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

      <AddNotebookModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveNotebook}
      />
    </Box>
  );
});

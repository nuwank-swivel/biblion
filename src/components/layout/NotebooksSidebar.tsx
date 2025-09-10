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
} from "@mui/material";
import {
  Add as AddIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "@mui/icons-material";
import { AddNotebookModal } from "../ui/AddNotebookModal";

interface NotebooksSidebarProps {
  onClose?: () => void;
}

// Sample notebook data - will be replaced with real data later
const sampleNotebooks = [
  {
    id: "1",
    title: "Personal Notes",
    description: "My personal thoughts and ideas",
    lastModified: "2 hours ago",
    isActive: true,
  },
  {
    id: "2",
    title: "Work Projects",
    description: "Project notes and documentation",
    lastModified: "1 day ago",
    isActive: false,
  },
  {
    id: "3",
    title: "Learning",
    description: "Study notes and resources",
    lastModified: "3 days ago",
    isActive: false,
  },
  {
    id: "4",
    title: "Ideas",
    description: "Random ideas and inspiration",
    lastModified: "1 week ago",
    isActive: false,
  },
];

export function NotebooksSidebar({ onClose }: NotebooksSidebarProps) {
  const [selectedNotebook, setSelectedNotebook] = React.useState("1");
  const [notebooks, setNotebooks] = React.useState(sampleNotebooks);
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  const handleNotebookClick = (notebookId: string) => {
    setSelectedNotebook(notebookId);
    if (onClose) {
      onClose();
    }
  };

  const handleAddNotebook = () => {
    setAddModalOpen(true);
  };

  const handleSaveNotebook = (title: string, description: string) => {
    const newNotebook = {
      id: Date.now().toString(),
      title,
      description,
      lastModified: "Just now",
      isActive: false,
    };
    setNotebooks([...notebooks, newNotebook]);
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
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Notebooks
        </Typography>
        <IconButton
          onClick={handleAddNotebook}
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

      {/* Notebook List */}
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <List sx={{ p: 0 }}>
          {notebooks.map((notebook) => (
            <ListItem key={notebook.id} disablePadding>
              <ListItemButton
                onClick={() => handleNotebookClick(notebook.id)}
                selected={selectedNotebook === notebook.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  "&.Mui-selected": {
                    backgroundColor: "primary.light",
                    "&:hover": {
                      backgroundColor: "primary.light",
                    },
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 4,
                      backgroundColor: "primary.main",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {selectedNotebook === notebook.id ? (
                    <FolderOpenIcon color="primary" />
                  ) : (
                    <FolderIcon color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: selectedNotebook === notebook.id ? 600 : 400,
                        color: selectedNotebook === notebook.id ? "primary.main" : "text.primary",
                      }}
                    >
                      {notebook.title}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        {notebook.description}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.75rem" }}
                      >
                        {notebook.lastModified}
                      </Typography>
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
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
            {notebooks.length} notebooks
          </Typography>
        </Paper>
      </Box>

      <AddNotebookModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveNotebook}
      />
    </Box>
  );
}

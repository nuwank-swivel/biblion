import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";
import { Modal } from "./Modal";

interface AddNotebookModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export function AddNotebookModal({ open, onClose, onSave }: AddNotebookModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), description.trim());
      setTitle("");
      setDescription("");
      onClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Notebook"
      actions={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!title.trim()}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Create Notebook
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          label="Notebook Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter notebook title..."
          variant="outlined"
          autoFocus
          required
        />
        <TextField
          fullWidth
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this notebook..."
          variant="outlined"
          multiline
          rows={3}
        />
        <Typography variant="caption" color="text.secondary">
          Notebooks help you organize your notes into different categories or projects.
        </Typography>
      </Box>
    </Modal>
  );
}

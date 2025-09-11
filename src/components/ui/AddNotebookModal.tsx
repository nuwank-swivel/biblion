import React from "react";
import { TextField, Button, Box, Typography } from "@mui/material";
import { Modal } from "./Modal";

interface AddNotebookModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}

export function AddNotebookModal({
  open,
  onClose,
  onSave,
}: AddNotebookModalProps) {
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
      title="New Notebook"
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
              backgroundColor: "#FFD700", // Yellow accent color as per Figma design
              color: "text.primary",
              "&:hover": {
                backgroundColor: "#E6C200",
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
          label="Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Marketing Campaign Q3"
          variant="outlined"
          autoFocus
          required
        />
        <TextField
          fullWidth
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., A place for all assets and notes for the upcoming campaign."
          variant="outlined"
          multiline
          rows={3}
        />
      </Box>
    </Modal>
  );
}

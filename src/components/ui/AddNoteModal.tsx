import React from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from "@mui/material";
import { Modal } from "./Modal";

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    content: string,
    tags: string[],
    notebookId: string
  ) => void;
  notebooks: Array<{ id: string; title: string }>;
  selectedNotebookId?: string;
}

const commonTags = [
  "work",
  "personal",
  "ideas",
  "meeting",
  "learning",
  "project",
  "todo",
  "reference",
];

export function AddNoteModal({
  open,
  onClose,
  onSave,
  notebooks,
  selectedNotebookId,
}: AddNoteModalProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [notebookId, setNotebookId] = React.useState(selectedNotebookId || "");

  React.useEffect(() => {
    if (selectedNotebookId) {
      setNotebookId(selectedNotebookId);
    }
  }, [selectedNotebookId]);

  const handleSave = () => {
    if (title.trim() && notebookId) {
      onSave(title.trim(), content.trim(), tags, notebookId);
      setTitle("");
      setContent("");
      setTags([]);
      setNotebookId(selectedNotebookId || "");
      onClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setNotebookId(selectedNotebookId || "");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add New Note"
      maxWidth="md"
      actions={
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!title.trim() || !notebookId}
            sx={{
              backgroundColor: "primary.main",
              "&:hover": {
                backgroundColor: "primary.dark",
              },
            }}
          >
            Create Note
          </Button>
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          label="Note Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title..."
          variant="outlined"
          autoFocus
          required
        />

        <FormControl fullWidth>
          <InputLabel>Notebook</InputLabel>
          <Select
            value={notebookId}
            onChange={(e) => setNotebookId(e.target.value)}
            label="Notebook"
          >
            {notebooks.map((notebook) => (
              <MenuItem key={notebook.id} value={notebook.id}>
                {notebook.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing your note..."
          variant="outlined"
          multiline
          rows={6}
        />

        <Autocomplete
          multiple
          freeSolo
          options={commonTags}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
                key={option}
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              placeholder="Add tags to organize your note..."
              helperText="Press Enter to add custom tags"
            />
          )}
        />

        <Typography variant="caption" color="text.secondary">
          Notes can contain rich text formatting and will be automatically saved
          as you type.
        </Typography>
      </Box>
    </Modal>
  );
}

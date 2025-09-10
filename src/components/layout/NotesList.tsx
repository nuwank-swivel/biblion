import React from "react";
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
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from "@mui/icons-material";
import { AddNoteModal } from "../ui/AddNoteModal";

// Sample notes data - will be replaced with real data later
const sampleNotes = [
  {
    id: "1",
    title: "Meeting Notes - Q1 Planning",
    content: "Discussed quarterly goals and priorities for the team...",
    lastModified: "2 hours ago",
    tags: ["work", "meeting"],
    isActive: true,
  },
  {
    id: "2",
    title: "Project Ideas",
    content: "Some interesting project ideas to explore...",
    lastModified: "1 day ago",
    tags: ["ideas"],
    isActive: false,
  },
  {
    id: "3",
    title: "Learning Resources",
    content: "List of useful resources for learning React and TypeScript...",
    lastModified: "2 days ago",
    tags: ["learning", "resources"],
    isActive: false,
  },
  {
    id: "4",
    title: "Daily Standup",
    content: "Notes from today's standup meeting...",
    lastModified: "3 days ago",
    tags: ["work", "standup"],
    isActive: false,
  },
  {
    id: "5",
    title: "Book Notes - Clean Code",
    content: "Key takeaways from reading Clean Code by Robert Martin...",
    lastModified: "1 week ago",
    tags: ["books", "programming"],
    isActive: false,
  },
];

export function NotesList() {
  const [selectedNote, setSelectedNote] = React.useState("1");
  const [viewMode, setViewMode] = React.useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [notes, setNotes] = React.useState(sampleNotes);
  const [addModalOpen, setAddModalOpen] = React.useState(false);

  const handleNoteClick = (noteId: string) => {
    setSelectedNote(noteId);
  };

  const handleAddNote = () => {
    setAddModalOpen(true);
  };

  const handleSaveNote = (title: string, content: string, tags: string[]) => {
    const newNote = {
      id: Date.now().toString(),
      title,
      content,
      lastModified: "Just now",
      tags,
      isActive: false,
    };
    setNotes([newNote, ...notes]);
  };

  const handleViewModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newViewMode: "list" | "grid" | null
  ) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
    }
  };

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
        <List sx={{ p: 0 }}>
          {filteredNotes.map((note, index) => (
            <React.Fragment key={note.id}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleNoteClick(note.id)}
                  selected={selectedNote === note.id}
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
                  <ListItemText
                    primary={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: selectedNote === note.id ? 600 : 400,
                          color: selectedNote === note.id ? "primary.main" : "text.primary",
                          mb: 0.5,
                        }}
                      >
                        {note.title}
                      </Typography>
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
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.75rem" }}
                          >
                            {note.lastModified}
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
                </ListItemButton>
              </ListItem>
              {index < filteredNotes.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Box>

      <AddNoteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSave={handleSaveNote}
        notebooks={[
          { id: "1", title: "Personal Notes" },
          { id: "2", title: "Work Projects" },
          { id: "3", title: "Learning" },
          { id: "4", title: "Ideas" },
        ]}
      />
    </Box>
  );
}

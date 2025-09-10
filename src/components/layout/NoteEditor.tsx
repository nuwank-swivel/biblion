import React from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Toolbar,
  Divider,
  Paper,
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

// Sample note data - will be replaced with real data later
const sampleNote = {
  id: "1",
  title: "Meeting Notes - Q1 Planning",
  content: `# Meeting Notes - Q1 Planning

## Attendees
- John Smith (Product Manager)
- Sarah Johnson (Engineering Lead)
- Mike Chen (Design Lead)

## Key Discussion Points

### 1. Q1 Goals
- Increase user engagement by 25%
- Launch new mobile app features
- Improve performance metrics

### 2. Technical Priorities
- **High Priority**: Database optimization
- **Medium Priority**: UI/UX improvements
- **Low Priority**: New integrations

### 3. Action Items
- [ ] Complete user research by Feb 15
- [ ] Finalize mobile app design by Feb 20
- [ ] Set up performance monitoring by Feb 25

## Next Steps
- Schedule follow-up meeting for next week
- Review progress on action items
- Prepare presentation for stakeholders

---
*Created: 2 hours ago*
*Last modified: 2 hours ago*`,
  lastModified: "2 hours ago",
  tags: ["work", "meeting"],
};

export function NoteEditor() {
  const [noteTitle, setNoteTitle] = React.useState(sampleNote.title);
  const [noteContent, setNoteContent] = React.useState(sampleNote.content);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoteTitle(event.target.value);
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNoteContent(event.target.value);
  };

  const handleFormatAction = (action: string) => {
    // TODO: Implement formatting actions
    console.log(`Format action: ${action}`);
  };

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
            Last modified: {sampleNote.lastModified}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {sampleNote.tags.map((tag) => (
              <Typography
                key={tag}
                variant="caption"
                sx={{
                  px: 1,
                  py: 0.25,
                  backgroundColor: "primary.light",
                  color: "primary.main",
                  borderRadius: 1,
                  fontSize: "0.75rem",
                }}
              >
                {tag}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Note Content */}
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <TextField
          fullWidth
          multiline
          value={noteContent}
          onChange={handleContentChange}
          placeholder="Start writing your note..."
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: {
              height: "100%",
              "& .MuiInputBase-input": {
                height: "100% !important",
                overflow: "auto !important",
                resize: "none",
                fontFamily: "monospace",
                fontSize: "0.875rem",
                lineHeight: 1.6,
              },
            },
          }}
          sx={{
            height: "100%",
            "& .MuiInputBase-root": {
              height: "100%",
              alignItems: "flex-start",
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
            <IconButton
              size="small"
              onClick={() => handleFormatAction("bold")}
              sx={{ p: 0.5 }}
            >
              <FormatBoldIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("italic")}
              sx={{ p: 0.5 }}
            >
              <FormatItalicIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("underline")}
              sx={{ p: 0.5 }}
            >
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Alignment */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("align-left")}
              sx={{ p: 0.5 }}
            >
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("align-center")}
              sx={{ p: 0.5 }}
            >
              <FormatAlignCenterIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("align-right")}
              sx={{ p: 0.5 }}
            >
              <FormatAlignRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Lists */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("bullet-list")}
              sx={{ p: 0.5 }}
            >
              <FormatListBulletedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("numbered-list")}
              sx={{ p: 0.5 }}
            >
              <FormatListNumberedIcon fontSize="small" />
            </IconButton>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* Special Formatting */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("quote")}
              sx={{ p: 0.5 }}
            >
              <FormatQuoteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("code")}
              sx={{ p: 0.5 }}
            >
              <CodeIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("share")}
              sx={{ p: 0.5 }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("history")}
              sx={{ p: 0.5 }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleFormatAction("more")}
              sx={{ p: 0.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </Paper>
    </Box>
  );
}

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

// Sample notes data - will be replaced with real data later
const sampleNotes = [
  {
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
  },
  {
    id: "2",
    title: "Project Ideas",
    content: `# Project Ideas

## Mobile App Concepts
1. **Task Management App**
   - Simple, clean interface
   - Team collaboration features
   - Time tracking integration

2. **Learning Platform**
   - Interactive courses
   - Progress tracking
   - Community features

3. **Health & Fitness Tracker**
   - Workout logging
   - Nutrition tracking
   - Social challenges

## Web Applications
- E-commerce platform with AI recommendations
- Real-time collaboration tool
- Data visualization dashboard

*Last updated: 1 day ago*`,
    lastModified: "1 day ago",
    tags: ["ideas"],
  },
  {
    id: "3",
    title: "Learning Resources",
    content: `# Learning Resources

## React & TypeScript
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Design & UX
- [Material Design Guidelines](https://material.io/design)
- [Figma Community](https://www.figma.com/community)
- [UX Design Principles](https://www.nngroup.com/articles/)

## Tools & Libraries
- Vite for fast development
- Material-UI for components
- Zustand for state management
- Firebase for backend services

*Last updated: 2 days ago*`,
    lastModified: "2 days ago",
    tags: ["learning", "resources"],
  },
  {
    id: "4",
    title: "Daily Standup",
    content: `# Daily Standup - January 27, 2025

## Team Updates

### Yesterday
- Completed user authentication setup
- Fixed login page responsive issues
- Started working on note editor component

### Today
- Implement three-column layout
- Add note filtering by notebook
- Test mobile navigation

### Blockers
- None currently

## Notes
- Need to review design specs with team
- Planning to demo new features tomorrow

*Last updated: 3 days ago*`,
    lastModified: "3 days ago",
    tags: ["work", "standup"],
  },
  {
    id: "5",
    title: "Book Notes - Clean Code",
    content: `# Clean Code - Robert Martin

## Key Principles

### Meaningful Names
- Use intention-revealing names
- Avoid disinformation
- Make meaningful distinctions
- Use pronounceable names
- Use searchable names

### Functions
- Small functions are better
- Do one thing only
- Use descriptive names
- Minimize arguments
- Have no side effects

### Comments
- Don't comment bad code - rewrite it
- Explain why, not what
- Good comments: warnings, TODO, amplification

## Quotes
> "Clean code always looks like it was written by someone who cares."

*Last updated: 1 week ago*`,
    lastModified: "1 week ago",
    tags: ["books", "programming"],
  },
  {
    id: "6",
    title: "Sprint Planning",
    content: `# Sprint Planning - Sprint 3

## Sprint Goals
- Complete user interface implementation
- Implement note management features
- Add search and filtering capabilities

## User Stories
1. **As a user**, I want to create and organize notebooks
2. **As a user**, I want to add and edit notes within notebooks
3. **As a user**, I want to search through my notes
4. **As a user**, I want to use keyboard shortcuts for efficiency

## Technical Tasks
- [ ] Implement notebook CRUD operations
- [ ] Add note editor with rich text formatting
- [ ] Create search functionality
- [ ] Add keyboard shortcuts
- [ ] Write unit tests

*Last updated: 4 days ago*`,
    lastModified: "4 days ago",
    tags: ["work", "planning"],
  },
  {
    id: "7",
    title: "Random Thoughts",
    content: `# Random Thoughts

## Ideas for the Weekend
- Try that new coffee shop downtown
- Read more about machine learning
- Practice guitar - learn that new song
- Organize my desk and workspace

## Observations
- The weather has been really nice lately
- I'm enjoying working on this project
- Need to remember to take more breaks
- Should call my parents this weekend

## Random Notes
- Remember to buy groceries
- Check if the library has that book I wanted
- Plan a trip for next month
- Update my resume

*Last updated: 5 days ago*`,
    lastModified: "5 days ago",
    tags: ["personal"],
  },
];

interface NoteEditorProps {
  selectedNoteId?: string;
}

export function NoteEditor({ selectedNoteId = "1" }: NoteEditorProps) {
  // Find the note with the selected ID
  const currentNote = sampleNotes.find(note => note.id === selectedNoteId) || sampleNotes[0];
  
  const [noteTitle, setNoteTitle] = React.useState(currentNote.title);
  const [noteContent, setNoteContent] = React.useState(currentNote.content);

  // Update note content when selectedNoteId changes
  React.useEffect(() => {
    const newNote = sampleNotes.find(note => note.id === selectedNoteId) || sampleNotes[0];
    setNoteTitle(newNote.title);
    setNoteContent(newNote.content);
  }, [selectedNoteId]);

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
            Last modified: {currentNote.lastModified}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {currentNote.tags.map((tag) => (
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

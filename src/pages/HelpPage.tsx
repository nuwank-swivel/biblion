import React from "react";
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  Keyboard as KeyboardIcon,
  Help as HelpIcon,
  BugReport as BugReportIcon,
  ContactSupport as ContactSupportIcon,
  Book as BookIcon,
} from "@mui/icons-material";

export default function HelpPage() {
  const [expanded, setExpanded] = React.useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const keyboardShortcuts = [
    { key: "Ctrl + N", description: "Create new note" },
    { key: "Ctrl + S", description: "Save current note" },
    { key: "Ctrl + F", description: "Search notes" },
    { key: "Ctrl + B", description: "Toggle bold text" },
    { key: "Ctrl + I", description: "Toggle italic text" },
    { key: "Ctrl + U", description: "Toggle underline" },
    { key: "Ctrl + Z", description: "Undo last action" },
    { key: "Ctrl + Y", description: "Redo last action" },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Help & Support
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText
              primary="Getting Started"
              secondary="Learn the basics of using Biblion"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BookIcon />
            </ListItemIcon>
            <ListItemText
              primary="User Guide"
              secondary="Comprehensive guide to all features"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <BugReportIcon />
            </ListItemIcon>
            <ListItemText
              primary="Report a Bug"
              secondary="Help us improve by reporting issues"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ContactSupportIcon />
            </ListItemIcon>
            <ListItemText
              primary="Contact Support"
              secondary="Get help from our support team"
            />
          </ListItem>
        </List>
      </Paper>

      <Accordion expanded={expanded === 'keyboard'} onChange={handleChange('keyboard')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <KeyboardIcon />
            <Typography variant="h6">Keyboard Shortcuts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 2 }}>
            {keyboardShortcuts.map((shortcut) => (
              <Box key={shortcut.key} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  label={shortcut.key}
                  size="small"
                  color="primary"
                  sx={{ minWidth: 80, fontFamily: "monospace" }}
                />
                <Typography variant="body2">{shortcut.description}</Typography>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'features'} onChange={handleChange('features')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Features Overview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            Biblion is a powerful note-taking application that helps you organize your thoughts and ideas. 
            Here are some key features:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Three-Column Layout"
                secondary="Organize notebooks, notes, and editing in a clean interface"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Rich Text Editing"
                secondary="Format your notes with bold, italic, lists, and more"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Search & Filter"
                secondary="Quickly find notes using the search functionality"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Google Drive Integration"
                secondary="Sync your notes across devices using Google Drive"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'troubleshooting'} onChange={handleChange('troubleshooting')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Troubleshooting</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" paragraph>
            If you're experiencing issues, try these common solutions:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Notes not syncing"
                secondary="Check your internet connection and Google Drive permissions"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="App running slowly"
                secondary="Try refreshing the page or clearing your browser cache"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Can't sign in"
                secondary="Make sure you're using a supported browser and have JavaScript enabled"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Need more help? Contact us at support@biblion.app
        </Typography>
      </Box>
    </Box>
  );
}

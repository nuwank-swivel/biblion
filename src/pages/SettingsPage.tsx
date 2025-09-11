import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
} from "@mui/material";
import {
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Help as HelpIcon,
} from "@mui/icons-material";

export default function SettingsPage() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [autoSave, setAutoSave] = React.useState(true);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText
              primary="Appearance"
              secondary="Customize the look and feel of the app"
            />
            <Switch
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText
              primary="Notifications"
              secondary="Receive notifications for important updates"
            />
            <Switch
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <StorageIcon />
            </ListItemIcon>
            <ListItemText
              primary="Auto-save"
              secondary="Automatically save your notes as you type"
            />
            <Switch
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText
              primary="Privacy & Security"
              secondary="Manage your data and privacy settings"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <LanguageIcon />
            </ListItemIcon>
            <ListItemText
              primary="Language"
              secondary="English (US)"
            />
          </ListItem>
          <Divider />
          <ListItem>
            <ListItemIcon>
              <HelpIcon />
            </ListItemIcon>
            <ListItemText
              primary="Help & Support"
              secondary="Get help and contact support"
            />
          </ListItem>
        </List>
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
        Biblion v0.1.0
      </Typography>
    </Box>
  );
}

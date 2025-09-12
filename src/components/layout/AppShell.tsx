import React from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Menu as MenuIcon, Logout } from "@mui/icons-material";
import { NavigationSidebar } from "./NavigationSidebar";
import { NotebooksSidebar } from "./NotebooksSidebar";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import { useAuthStore } from "../../features/auth/store";
import { signOut } from "firebase/auth";
import { auth } from "../../features/auth/firebase";
import {
  useKeyboardShortcuts,
  commonShortcuts,
} from "../../hooks/useKeyboardShortcuts";
import { notebookService } from "../../services/notebookService";
import { Notebook } from "../../types/notebook";

const DRAWER_WIDTH = 280;
const NOTES_WIDTH = 320;

export function AppShell() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { user, reset } = useAuthStore();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedSection, setSelectedSection] =
    React.useState<string>("documents");
  const [selectedNotebookId, setSelectedNotebookId] = React.useState<
    string | undefined
  >(undefined);
  const [selectedNoteId, setSelectedNoteId] = React.useState<
    string | undefined
  >(undefined);
  const [notebooks, setNotebooks] = React.useState<Notebook[]>([]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts(commonShortcuts);

  // Load notebooks when user changes
  React.useEffect(() => {
    if (!user) return;

    const unsubscribe = notebookService.subscribeToNotebooks(
      user.uid,
      (notebooks) => {
        setNotebooks(notebooks);
        // Auto-select first notebook if none selected
        if (notebooks.length > 0 && !selectedNotebookId) {
          setSelectedNotebookId(notebooks[0].id);
        }
      }
    );

    return () => unsubscribe();
  }, [user, selectedNotebookId]);

  // Reset selected note when notebook changes
  React.useEffect(() => {
    setSelectedNoteId(undefined);
  }, [selectedNotebookId]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const onLogout = async () => {
    try {
      await signOut(auth);
    } finally {
      reset();
      window.location.href = "/login";
    }
    handleProfileMenuClose();
  };

  const drawer = (
    <NotebooksSidebar onClose={isMobile ? handleDrawerToggle : undefined} />
  );

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: "100%",
          backgroundColor: "background.paper",
          color: "text.primary",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Biblion
          </Typography>
          {user && (
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                src={user.photoURL ?? undefined}
                alt={user.displayName ?? undefined}
                sx={{ width: 32, height: 32 }}
              />
            </IconButton>
          )}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem onClick={onLogout}>
              <Logout sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Layout - Four Columns (Navigation + Three Columns) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "100%",
          height: "100vh",
          pt: "64px", // Account for AppBar height
        }}
      >
        {/* Navigation Sidebar */}
        <NavigationSidebar
          selectedSection={selectedSection}
          onSectionSelect={setSelectedSection}
        />

        {/* Notebooks Column */}
        <Box
          sx={{
            width: DRAWER_WIDTH,
            borderRight: 1,
            borderColor: "divider",
            height: "100%",
          }}
        >
          <NotebooksSidebar
            selectedNotebookId={selectedNotebookId}
            onNotebookSelect={setSelectedNotebookId}
          />
        </Box>

        {/* Notes List Column */}
        <Box
          sx={{
            width: NOTES_WIDTH,
            borderRight: 1,
            borderColor: "divider",
            height: "100%",
          }}
        >
          <NotesList
            selectedNotebookId={selectedNotebookId}
            selectedNoteId={selectedNoteId}
            onNoteSelect={setSelectedNoteId}
            notebooks={notebooks}
          />
        </Box>

        {/* Note Editor Column */}
        <Box
          sx={{
            flexGrow: 1,
            height: "100%",
          }}
        >
          <NoteEditor selectedNoteId={selectedNoteId} />
        </Box>
      </Box>

      {/* Mobile Layout */}
      <Box
        sx={{
          display: { xs: "block", md: "none" },
          width: "100%",
          height: "100vh",
          pt: "64px", // Account for AppBar height
        }}
      >
        {!mobileOpen && (
          <Box sx={{ display: "flex", height: "100%" }}>
            {/* Notes List Column */}
            <Box
              sx={{
                width: "50%",
                borderRight: 1,
                borderColor: "divider",
                height: "100%",
              }}
            >
              <NotesList
                selectedNotebookId={selectedNotebookId}
                selectedNoteId={selectedNoteId}
                onNoteSelect={setSelectedNoteId}
                notebooks={notebooks}
              />
            </Box>

            {/* Note Editor Column */}
            <Box
              sx={{
                flexGrow: 1,
                height: "100%",
              }}
            >
              <NoteEditor selectedNoteId={selectedNoteId} />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

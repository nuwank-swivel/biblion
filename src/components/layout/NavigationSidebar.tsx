import React from "react";
import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import {
  Description as DocumentIcon,
  People as PeopleIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

interface NavigationSidebarProps {
  selectedSection?: string;
  onSectionSelect?: (section: string) => void;
}

const navigationItems = [
  {
    id: "documents",
    icon: DocumentIcon,
    label: "Documents",
    tooltip: "View and manage your documents (Ctrl+1)",
    shortcut: "ctrl+1",
  },
  {
    id: "people",
    icon: PeopleIcon,
    label: "People",
    tooltip: "Collaborate with team members (Ctrl+2)",
    shortcut: "ctrl+2",
  },
  {
    id: "save",
    icon: SaveIcon,
    label: "Save",
    tooltip: "Save your work (Ctrl+S)",
    shortcut: "ctrl+s",
  },
];

export function NavigationSidebar({
  selectedSection = "documents",
  onSectionSelect,
}: NavigationSidebarProps) {
  const theme = useTheme();

  const handleSectionClick = (sectionId: string) => {
    if (onSectionSelect) {
      onSectionSelect(sectionId);
    }
  };

  // Set up keyboard shortcuts for navigation
  const navigationShortcuts = navigationItems.map((item) => ({
    key: item.shortcut,
    handler: () => handleSectionClick(item.id),
    description: `Navigate to ${item.label}`,
  }));

  useKeyboardShortcuts(navigationShortcuts);

  return (
    <Box
      sx={{
        width: 64,
        height: "100%",
        backgroundColor: "background.paper",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 2,
        gap: 1,
      }}
    >
      {navigationItems.map((item) => {
        const IconComponent = item.icon;
        const isSelected = selectedSection === item.id;

        return (
          <Tooltip key={item.id} title={item.tooltip} placement="right" arrow>
            <IconButton
              onClick={() => handleSectionClick(item.id)}
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: isSelected ? "primary.main" : "transparent",
                color: isSelected ? "primary.contrastText" : "text.secondary",
                "&:hover": {
                  backgroundColor: isSelected ? "primary.dark" : "action.hover",
                  color: isSelected ? "primary.contrastText" : "text.primary",
                },
                transition: theme.transitions.create(
                  ["background-color", "color", "transform"],
                  {
                    duration: theme.transitions.duration.short,
                  }
                ),
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
              aria-label={item.label}
              aria-pressed={isSelected}
            >
              <IconComponent fontSize="medium" />
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}

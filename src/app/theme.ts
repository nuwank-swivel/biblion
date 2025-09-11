import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { 
      main: "#FFD700", // Yellow for primary actions and accents
      dark: "#FFC107",
      light: "#FFF59D",
    },
    secondary: {
      main: "#1976d2", // Blue for secondary actions
    },
    background: { 
      default: "#ffffff", // Clean white background
      paper: "#fafafa", // Light grey for paper surfaces
    },
    text: {
      primary: "#212121", // Dark grey for main text
      secondary: "#757575", // Medium grey for secondary text
    },
    divider: "#e0e0e0", // Light grey for dividers
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#212121",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#212121",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      color: "#212121",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 500,
      color: "#212121",
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 500,
      color: "#212121",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
      color: "#212121",
    },
    body1: {
      fontSize: "1rem",
      color: "#212121",
    },
    body2: {
      fontSize: "0.875rem",
      color: "#757575",
    },
  },
  spacing: 8, // 8px base spacing unit
  shape: {
    borderRadius: 8, // Rounded corners for buttons and cards
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Disable uppercase transformation
          borderRadius: 8,
          fontWeight: 500,
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

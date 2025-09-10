import React from "react";
import {
  Box,
  CircularProgress,
  Typography,
  Skeleton,
} from "@mui/material";

interface LoadingStateProps {
  message?: string;
  variant?: "circular" | "skeleton";
  size?: number;
}

export function LoadingState({ 
  message = "Loading...", 
  variant = "circular",
  size = 40 
}: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2 }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        p: 4,
        gap: 2,
      }}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}

// Skeleton components for specific use cases
export function NotebookSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.5 }} />
      <Skeleton variant="text" width="40%" height={14} sx={{ mt: 0.5 }} />
    </Box>
  );
}

export function NoteSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      <Skeleton variant="text" width="90%" height={20} />
      <Skeleton variant="text" width="100%" height={16} sx={{ mt: 0.5 }} />
      <Skeleton variant="text" width="70%" height={16} sx={{ mt: 0.5 }} />
      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
        <Skeleton variant="rectangular" width={60} height={20} />
        <Skeleton variant="rectangular" width={80} height={20} />
      </Box>
    </Box>
  );
}

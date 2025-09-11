import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { SaveStatus } from "../../features/data/schemas/version";

interface SaveStatusProps {
  status: SaveStatus;
  onRetry?: () => void;
  onManualSave?: () => void;
  compact?: boolean;
}

export function SaveStatusIndicator({
  status,
  onRetry,
  onManualSave,
  compact = false,
}: SaveStatusProps) {
  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;

    const diffInDays = Math.floor(diffInSeconds / 86400);
    return `${diffInDays}d ago`;
  };

  const getStatusIcon = () => {
    switch (status.state) {
      case "saving":
        return (
          <CircularProgress
            size={compact ? 16 : 20}
            thickness={compact ? 4 : 3}
            sx={{ color: "primary.main" }}
          />
        );
      case "saved":
        return (
          <CheckCircleIcon
            fontSize={compact ? "small" : "medium"}
            sx={{ color: "success.main" }}
          />
        );
      case "error":
        return (
          <ErrorIcon
            fontSize={compact ? "small" : "medium"}
            sx={{ color: "error.main" }}
          />
        );
      default:
        return (
          <SaveIcon
            fontSize={compact ? "small" : "medium"}
            sx={{ color: "text.secondary" }}
          />
        );
    }
  };

  const getStatusText = () => {
    switch (status.state) {
      case "saving":
        return "Saving...";
      case "saved":
        return status.lastSaved
          ? `Saved ${formatLastSaved(status.lastSaved)}`
          : "Saved";
      case "error":
        return `Error: ${status.error || "Save failed"}`;
      default:
        return "Not saved";
    }
  };

  const getStatusColor = () => {
    switch (status.state) {
      case "saving":
        return "primary.main";
      case "saved":
        return "success.main";
      case "error":
        return "error.main";
      default:
        return "text.secondary";
    }
  };

  if (compact) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        {getStatusIcon()}
        <Typography
          variant="caption"
          sx={{
            color: getStatusColor(),
            fontSize: "0.75rem",
            minWidth: "fit-content",
          }}
        >
          {status.state === "saving"
            ? "Saving..."
            : status.state === "saved"
            ? "Saved"
            : status.state === "error"
            ? "Error"
            : "Unsaved"}
        </Typography>
        {status.state === "error" && onRetry && (
          <Tooltip title="Retry save">
            <IconButton size="small" onClick={onRetry} sx={{ p: 0.25 }}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {getStatusIcon()}
      <Typography
        variant="body2"
        sx={{
          color: getStatusColor(),
          fontSize: "0.875rem",
        }}
      >
        {getStatusText()}
      </Typography>

      {status.state === "error" && onRetry && (
        <Tooltip title="Retry save">
          <IconButton size="small" onClick={onRetry} sx={{ p: 0.5 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {onManualSave && status.state !== "saving" && (
        <Tooltip title="Save now (Ctrl+S)">
          <IconButton size="small" onClick={onManualSave} sx={{ p: 0.5 }}>
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}

export default SaveStatusIndicator;

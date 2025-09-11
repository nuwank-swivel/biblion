import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Chip,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Restore as RestoreIcon,
  Compare as CompareIcon,
  Close as CloseIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { VersionData } from "../../features/data/schemas/version";
import { versionManager } from "../../features/sync/version-manager";

interface VersionHistoryProps {
  open: boolean;
  onClose: () => void;
  pageId: string;
  onRestore?: (version: VersionData) => void;
}

export function VersionHistory({
  open,
  onClose,
  pageId,
  onRestore,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionData | null>(
    null
  );

  useEffect(() => {
    if (open && pageId) {
      loadVersions();
    }
  }, [open, pageId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const versionHistory = await versionManager.getVersionHistory({
        pageId,
        limit: 50,
        offset: 0,
      });
      setVersions(versionHistory);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load version history"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: VersionData) => {
    try {
      await versionManager.restoreVersion(version.id);
      onRestore?.(version);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore version"
      );
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getVersionPreview = (content: string) => {
    // Remove HTML tags and get first 100 characters
    const textContent = content.replace(/<[^>]*>/g, "");
    return textContent.length > 100
      ? `${textContent.substring(0, 100)}...`
      : textContent;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: "80vh" },
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <HistoryIcon />
        Version History
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="error">{error}</Typography>
            <Button onClick={loadVersions} sx={{ mt: 1 }}>
              Retry
            </Button>
          </Box>
        ) : versions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No version history available
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: "60vh", overflow: "auto" }}>
            {versions.map((version, index) => (
              <React.Fragment key={version.id}>
                <ListItem
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "action.hover" },
                    backgroundColor:
                      selectedVersion?.id === version.id
                        ? "action.selected"
                        : "transparent",
                  }}
                  onClick={() => setSelectedVersion(version)}
                >
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle2">
                          {index === 0
                            ? "Current"
                            : `Version ${versions.length - index}`}
                        </Typography>
                        {index === 0 && (
                          <Chip
                            label="Current"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimestamp(version.timestamp)} •{" "}
                          {formatFileSize(version.fileSize)}
                        </Typography>
                        {version.changeSummary && (
                          <Typography variant="caption" color="text.secondary">
                            {version.changeSummary}
                          </Typography>
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            fontStyle: "italic",
                            color: "text.disabled",
                          }}
                        >
                          {getVersionPreview(version.content)}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {index > 0 && (
                        <Tooltip title="Restore this version">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestore(version);
                            }}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Compare with current">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: Implement version comparison
                          }}
                        >
                          <CompareIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < versions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {selectedVersion && selectedVersion.id !== versions[0]?.id && (
          <Button
            variant="contained"
            startIcon={<RestoreIcon />}
            onClick={() => handleRestore(selectedVersion)}
          >
            Restore Selected Version
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default VersionHistory;

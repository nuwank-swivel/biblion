import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  Merge,
  Person,
  Schedule,
  Warning,
  Info,
  Close,
} from "@mui/icons-material";
import {
  ConflictData,
  ConflictResolution,
  ContentDiff,
} from "../../features/data/schemas/conflict";

interface ConflictResolutionDialogProps {
  open: boolean;
  conflict: ConflictData | null;
  onClose: () => void;
  onResolve: (resolution: ConflictResolution) => void;
  currentUserId: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`conflict-tabpanel-${index}`}
      aria-labelledby={`conflict-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export function ConflictResolutionDialog({
  open,
  conflict,
  onClose,
  onResolve,
  currentUserId,
}: ConflictResolutionDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedResolution, setSelectedResolution] = useState<string>("");
  const [mergedContent, setMergedContent] = useState<string>("");
  const [resolutionNotes, setResolutionNotes] = useState<string>("");

  useEffect(() => {
    if (conflict) {
      // Initialize merged content with current user's version
      setMergedContent(conflict.user2Content);
      setSelectedResolution("");
      setResolutionNotes("");
    }
  }, [conflict]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleResolutionSelect = (resolution: string) => {
    setSelectedResolution(resolution);
  };

  const handleMergedContentChange = (content: string) => {
    setMergedContent(content);
  };

  const handleResolve = () => {
    if (!conflict || !selectedResolution) return;

    const resolution: ConflictResolution = {
      conflictId: conflict.id,
      resolutionMethod:
        selectedResolution as ConflictResolution["resolutionMethod"],
      mergedContent:
        selectedResolution === "merge_manual" ? mergedContent : undefined,
      resolvedBy: currentUserId,
      resolvedAt: new Date(),
      notes: resolutionNotes,
    };

    onResolve(resolution);
  };

  const handleClose = () => {
    setActiveTab(0);
    setSelectedResolution("");
    setMergedContent("");
    setResolutionNotes("");
    onClose();
  };

  if (!conflict) return null;

  const isCurrentUserUser1 = conflict.user1Id === currentUserId;
  const user1Content = conflict.user1Content;
  const user2Content = conflict.user2Content;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: "80vh" },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <Warning color="warning" />
            <Typography variant="h6">Conflict Resolution Required</Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Multiple users have edited this note simultaneously. Please choose how
          to resolve the conflict.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Compare Versions" />
            <Tab label="Resolution Options" />
            <Tab label="Merge Content" />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Conflict Details:</strong> This conflict occurred when
                both users edited the same content. Review both versions below
                and choose how to resolve the conflict.
              </Typography>
            </Alert>

            <Box display="flex" gap={2} height="400px">
              {/* User 1 Version */}
              <Paper sx={{ flex: 1, p: 2, overflow: "auto" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person color="primary" />
                  <Typography variant="subtitle2">
                    {isCurrentUserUser1
                      ? "Your Version"
                      : "Other User's Version"}
                  </Typography>
                  <Chip
                    label={new Date(
                      conflict.user1Timestamp
                    ).toLocaleTimeString()}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: "grey.50",
                    minHeight: "300px",
                  }}
                >
                  {user1Content}
                </Box>
              </Paper>

              <Divider orientation="vertical" flexItem />

              {/* User 2 Version */}
              <Paper sx={{ flex: 1, p: 2, overflow: "auto" }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Person color="secondary" />
                  <Typography variant="subtitle2">
                    {isCurrentUserUser1
                      ? "Other User's Version"
                      : "Your Version"}
                  </Typography>
                  <Chip
                    label={new Date(
                      conflict.user2Timestamp
                    ).toLocaleTimeString()}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Box
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1,
                    backgroundColor: "grey.50",
                    minHeight: "300px",
                  }}
                >
                  {user2Content}
                </Box>
              </Paper>
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6" gutterBottom>
              Choose Resolution Method
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
              <Paper
                sx={{
                  p: 2,
                  border: selectedResolution === "keep_mine" ? 2 : 1,
                  borderColor:
                    selectedResolution === "keep_mine"
                      ? "primary.main"
                      : "divider",
                  cursor: "pointer",
                }}
                onClick={() => handleResolutionSelect("keep_mine")}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <CheckCircle
                    color={
                      selectedResolution === "keep_mine" ? "primary" : "action"
                    }
                  />
                  <Box>
                    <Typography variant="subtitle1">Keep My Version</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use your current changes and discard the other user's
                      changes
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  border: selectedResolution === "keep_theirs" ? 2 : 1,
                  borderColor:
                    selectedResolution === "keep_theirs"
                      ? "primary.main"
                      : "divider",
                  cursor: "pointer",
                }}
                onClick={() => handleResolutionSelect("keep_theirs")}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Cancel
                    color={
                      selectedResolution === "keep_theirs"
                        ? "primary"
                        : "action"
                    }
                  />
                  <Box>
                    <Typography variant="subtitle1">
                      Keep Their Version
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use the other user's changes and discard your changes
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  border: selectedResolution === "merge_manual" ? 2 : 1,
                  borderColor:
                    selectedResolution === "merge_manual"
                      ? "primary.main"
                      : "divider",
                  cursor: "pointer",
                }}
                onClick={() => handleResolutionSelect("merge_manual")}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Merge
                    color={
                      selectedResolution === "merge_manual"
                        ? "primary"
                        : "action"
                    }
                  />
                  <Box>
                    <Typography variant="subtitle1">Merge Manually</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manually combine both versions in the next tab
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 2,
                  border: selectedResolution === "merge_auto" ? 2 : 1,
                  borderColor:
                    selectedResolution === "merge_auto"
                      ? "primary.main"
                      : "divider",
                  cursor: "pointer",
                }}
                onClick={() => handleResolutionSelect("merge_auto")}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Merge
                    color={
                      selectedResolution === "merge_auto" ? "primary" : "action"
                    }
                  />
                  <Box>
                    <Typography variant="subtitle1">Auto-Merge</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically merge compatible changes
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                <Info
                  fontSize="small"
                  sx={{ mr: 1, verticalAlign: "middle" }}
                />
                Resolution notes (optional):
              </Typography>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Add notes about this resolution..."
                style={{
                  width: "100%",
                  minHeight: "60px",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Box display="flex" flexDirection="column" gap={2}>
            <Typography variant="h6" gutterBottom>
              Manual Content Merge
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Edit the content below to create your desired merged version. You
              can copy and paste from both versions above.
            </Typography>

            <textarea
              value={mergedContent}
              onChange={(e) => handleMergedContentChange(e.target.value)}
              style={{
                width: "100%",
                minHeight: "400px",
                padding: "12px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: "1.5",
                resize: "vertical",
              }}
              placeholder="Enter your merged content here..."
            />
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleResolve}
          variant="contained"
          disabled={!selectedResolution}
          startIcon={<CheckCircle />}
        >
          Resolve Conflict
        </Button>
      </DialogActions>
    </Dialog>
  );
}

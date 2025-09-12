/**
 * Compression statistics UI component
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
} from '@mui/material';
import {
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { compressionMonitor } from '../../features/data/monitoring/compression-monitor';
import { CompressionUtils } from '../../utils/compression-utils';

interface CompressionStatsProps {
  compact?: boolean;
  showAlerts?: boolean;
  refreshInterval?: number;
}

export function CompressionStats({ 
  compact = false, 
  showAlerts = true,
  refreshInterval = 30000 
}: CompressionStatsProps) {
  const [metrics, setMetrics] = React.useState(compressionMonitor.getPerformanceMetrics());
  const [stats, setStats] = React.useState(compressionMonitor.getCompressionStats());
  const [alerts, setAlerts] = React.useState(compressionMonitor.getActiveAlerts());
  const [lastUpdated, setLastUpdated] = React.useState(new Date());

  // Refresh data periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const refreshData = () => {
    setMetrics(compressionMonitor.getPerformanceMetrics());
    setStats(compressionMonitor.getCompressionStats());
    setAlerts(compressionMonitor.getActiveAlerts());
    setLastUpdated(new Date());
  };

  const handleResolveAlert = (alertId: string) => {
    compressionMonitor.resolveAlert(alertId);
    setAlerts(compressionMonitor.getActiveAlerts());
  };

  const handleClearResolvedAlerts = () => {
    compressionMonitor.clearResolvedAlerts();
    setAlerts(compressionMonitor.getActiveAlerts());
  };

  const handleExportData = () => {
    const data = compressionMonitor.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compression-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEfficiencyColor = (ratio: number): string => {
    if (ratio <= 0.2) return 'success';
    if (ratio <= 0.4) return 'info';
    if (ratio <= 0.6) return 'warning';
    return 'error';
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getAlertColor = (severity: string): 'error' | 'warning' | 'info' | 'success' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  if (compact) {
    return (
      <Card sx={{ minWidth: 300 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="h2">
              Compression Stats
            </Typography>
            <IconButton size="small" onClick={refreshData}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {CompressionUtils.formatCompressionRatio(stats.averageRatio)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Compression
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {stats.compressionCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Operations
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {showAlerts && alerts.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={getAlertColor(alerts[0].severity)} sx={{ mb: 1 }}>
                {alerts.length} active alert{alerts.length > 1 ? 's' : ''}
              </Alert>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Compression Statistics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={refreshData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton onClick={handleExportData}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          {alerts.length > 0 && (
            <Tooltip title="Clear Resolved Alerts">
              <IconButton onClick={handleClearResolvedAlerts}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Active Alerts ({alerts.length})
          </Typography>
          <List>
            {alerts.map((alert) => (
              <React.Fragment key={alert.id}>
                <ListItem
                  secondaryAction={
                    <Button
                      size="small"
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  }
                >
                  <ListItemIcon>
                    {getAlertIcon(alert.severity)}
                  </ListItemIcon>
                  <ListItemText
                    primary={alert.message}
                    secondary={`${alert.severity.toUpperCase()} • ${alert.timestamp.toLocaleString()}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}

      {/* Metrics Grid */}
      <Grid container spacing={3}>
        {/* Compression Ratio */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Compression Ratio</Typography>
              </Box>
              <Typography variant="h3" color="primary" sx={{ mb: 1 }}>
                {CompressionUtils.formatCompressionRatio(stats.averageRatio)}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(1 - stats.averageRatio) * 100}
                color={getEfficiencyColor(stats.averageRatio) as any}
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Average across {stats.compressionCount} operations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SpeedIcon color="secondary" sx={{ mr: 1 }} />
                <Typography variant="h6">Performance</Typography>
              </Box>
              <Typography variant="h4" color="secondary" sx={{ mb: 1 }}>
                {CompressionUtils.formatDuration(metrics.averageCompressionTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Avg Compression Time
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Throughput: {CompressionUtils.formatBytes(metrics.throughput)}/s
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MemoryIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4" color="info.main" sx={{ mb: 1 }}>
                {CompressionUtils.formatBytes(metrics.memoryUsage)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Current Usage
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cache Hit Rate: {(metrics.cacheHitRate * 100).toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Error Rate</Typography>
              </Box>
              <Typography variant="h4" color="error.main" sx={{ mb: 1 }}>
                {(metrics.errorRate * 100).toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Failure Rate
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stats.failureCount} failures out of {stats.compressionCount + stats.failureCount} operations
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Stats */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Storage Statistics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Original Size:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {CompressionUtils.formatBytes(stats.totalOriginal)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Compressed Size:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {CompressionUtils.formatBytes(stats.totalCompressed)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Space Saved:</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {CompressionUtils.formatBytes(stats.totalOriginal - stats.totalCompressed)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Last Compression:</Typography>
                <Typography variant="body2">
                  {stats.lastCompression?.toLocaleString() || 'Never'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Performance Metrics
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Avg Compression Time:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {CompressionUtils.formatDuration(stats.averageCompressionTime)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Avg Decompression Time:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {CompressionUtils.formatDuration(metrics.averageDecompressionTime)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Cache Hit Rate:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {(metrics.cacheHitRate * 100).toFixed(1)}%
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Last Updated:</Typography>
                <Typography variant="body2">
                  {lastUpdated.toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

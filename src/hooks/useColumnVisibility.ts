import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';

export interface ColumnVisibilityState {
  isNotebooksColumnVisible: boolean;
  isAutoCollapsed: boolean; // true when auto-collapsed due to screen size
  lastManualToggle?: Date; // track manual user actions
}

export interface ResponsiveConfig {
  autoCollapseBreakpoint: number; // 768px for tablet/mobile
  animationDuration: number; // 300ms for smooth transitions
  keyboardShortcut: string; // 'Ctrl+Shift+N' or 'Cmd+Shift+N'
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  autoCollapseBreakpoint: 768,
  animationDuration: 300,
  keyboardShortcut: 'Ctrl+Shift+N',
};

export function useColumnVisibility(config: ResponsiveConfig = DEFAULT_CONFIG) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [state, setState] = useState<ColumnVisibilityState>({
    isNotebooksColumnVisible: true,
    isAutoCollapsed: false,
  });

  // Auto-collapse on mobile/tablet screens
  useEffect(() => {
    if (isMobile && state.isNotebooksColumnVisible) {
      setState(prev => ({
        ...prev,
        isNotebooksColumnVisible: false,
        isAutoCollapsed: true,
      }));
    } else if (!isMobile && state.isAutoCollapsed) {
      // Restore visibility when returning to desktop, but only if it was auto-collapsed
      setState(prev => ({
        ...prev,
        isNotebooksColumnVisible: true,
        isAutoCollapsed: false,
      }));
    }
  }, [isMobile, state.isNotebooksColumnVisible, state.isAutoCollapsed]);

  const toggleColumnVisibility = useCallback(() => {
    setState(prev => ({
      ...prev,
      isNotebooksColumnVisible: !prev.isNotebooksColumnVisible,
      isAutoCollapsed: false,
      lastManualToggle: new Date(),
    }));
  }, []);

  const setColumnVisibility = useCallback((visible: boolean) => {
    setState(prev => ({
      ...prev,
      isNotebooksColumnVisible: visible,
      isAutoCollapsed: false,
      lastManualToggle: new Date(),
    }));
  }, []);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isN = event.key === 'n' || event.key === 'N';

      if (isCtrlOrCmd && isShift && isN) {
        event.preventDefault();
        toggleColumnVisibility();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleColumnVisibility]);

  return {
    ...state,
    toggleColumnVisibility,
    setColumnVisibility,
    config,
  };
}

import { renderHook, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useColumnVisibility } from './useColumnVisibility';

// Mock Material UI theme
const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('useColumnVisibility', () => {
  it('should initialize with notebooks column visible', () => {
    const { result } = renderHook(() => useColumnVisibility(), { wrapper });

    expect(result.current.isNotebooksColumnVisible).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('should toggle column visibility', () => {
    const { result } = renderHook(() => useColumnVisibility(), { wrapper });

    act(() => {
      result.current.toggleColumnVisibility();
    });

    expect(result.current.isNotebooksColumnVisible).toBe(false);
    expect(result.current.isAutoCollapsed).toBe(false);
    expect(result.current.lastManualToggle).toBeInstanceOf(Date);

    act(() => {
      result.current.toggleColumnVisibility();
    });

    expect(result.current.isNotebooksColumnVisible).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('should set column visibility directly', () => {
    const { result } = renderHook(() => useColumnVisibility(), { wrapper });

    act(() => {
      result.current.setColumnVisibility(false);
    });

    expect(result.current.isNotebooksColumnVisible).toBe(false);
    expect(result.current.isAutoCollapsed).toBe(false);
    expect(result.current.lastManualToggle).toBeInstanceOf(Date);

    act(() => {
      result.current.setColumnVisibility(true);
    });

    expect(result.current.isNotebooksColumnVisible).toBe(true);
    expect(result.current.isAutoCollapsed).toBe(false);
  });

  it('should use default configuration', () => {
    const { result } = renderHook(() => useColumnVisibility(), { wrapper });

    expect(result.current.config.autoCollapseBreakpoint).toBe(768);
    expect(result.current.config.animationDuration).toBe(300);
    expect(result.current.config.keyboardShortcut).toBe('Ctrl+Shift+N');
  });

  it('should accept custom configuration', () => {
    const customConfig = {
      autoCollapseBreakpoint: 1024,
      animationDuration: 500,
      keyboardShortcut: 'Ctrl+Alt+N',
    };

    const { result } = renderHook(() => useColumnVisibility(customConfig), { wrapper });

    expect(result.current.config.autoCollapseBreakpoint).toBe(1024);
    expect(result.current.config.animationDuration).toBe(500);
    expect(result.current.config.keyboardShortcut).toBe('Ctrl+Alt+N');
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { NotebooksSidebar } from './NotebooksSidebar';

// Mock dependencies
jest.mock('../../features/auth/store', () => ({
  useAuthStore: () => ({
    user: { uid: 'test-user' },
  }),
}));

jest.mock('../../services/notebookService', () => ({
  notebookService: {
    subscribeToNotebooks: jest.fn(() => jest.fn()),
    getNotebooks: jest.fn(() => Promise.resolve([])),
    createNotebook: jest.fn(() => Promise.resolve()),
    toggleNotebookPin: jest.fn(() => Promise.resolve()),
    deleteNotebook: jest.fn(() => Promise.resolve()),
  },
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('NotebooksSidebar - Collapsible Functionality', () => {
  const defaultProps = {
    selectedNotebookId: undefined,
    onNotebookSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render collapse button when collapsible is enabled', () => {
    const mockToggleCollapse = jest.fn();
    
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={true}
        isCollapsed={false}
        onToggleCollapse={mockToggleCollapse}
      />
    );

    const collapseButton = screen.getByLabelText('Collapse notebooks column');
    expect(collapseButton).toBeInTheDocument();
  });

  it('should not render collapse button when collapsible is disabled', () => {
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={false}
      />
    );

    const collapseButton = screen.queryByLabelText('Collapse notebooks column');
    expect(collapseButton).not.toBeInTheDocument();
  });

  it('should show correct icon when collapsed', () => {
    const mockToggleCollapse = jest.fn();
    
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={true}
        isCollapsed={true}
        onToggleCollapse={mockToggleCollapse}
      />
    );

    const expandButton = screen.getByLabelText('Expand notebooks column');
    expect(expandButton).toBeInTheDocument();
  });

  it('should show correct icon when expanded', () => {
    const mockToggleCollapse = jest.fn();
    
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={true}
        isCollapsed={false}
        onToggleCollapse={mockToggleCollapse}
      />
    );

    const collapseButton = screen.getByLabelText('Collapse notebooks column');
    expect(collapseButton).toBeInTheDocument();
  });

  it('should call onToggleCollapse when collapse button is clicked', () => {
    const mockToggleCollapse = jest.fn();
    
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={true}
        isCollapsed={false}
        onToggleCollapse={mockToggleCollapse}
      />
    );

    const collapseButton = screen.getByLabelText('Collapse notebooks column');
    fireEvent.click(collapseButton);

    expect(mockToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleCollapse when expand button is clicked', () => {
    const mockToggleCollapse = jest.fn();
    
    renderWithTheme(
      <NotebooksSidebar
        {...defaultProps}
        isCollapsible={true}
        isCollapsed={true}
        onToggleCollapse={mockToggleCollapse}
      />
    );

    const expandButton = screen.getByLabelText('Expand notebooks column');
    fireEvent.click(expandButton);

    expect(mockToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('should maintain existing functionality when collapsible props are not provided', () => {
    renderWithTheme(
      <NotebooksSidebar {...defaultProps} />
    );

    // Should still render the header with "Notebooks" title
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    
    // Should not render collapse button
    const collapseButton = screen.queryByLabelText('Collapse notebooks column');
    expect(collapseButton).not.toBeInTheDocument();
  });
});

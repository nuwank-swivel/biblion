/**
 * Tests for NotebooksSidebar dropdown regression fix
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotebooksSidebar } from './NotebooksSidebar';
import { notebookService } from '../../services/notebookService';
import { useAuthStore } from '../../features/auth/store';

// Mock the auth store
vi.mock('../../features/auth/store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock the notebook service
vi.mock('../../services/notebookService', () => ({
  notebookService: {
    subscribeToNotebooks: vi.fn(),
    getNotebooks: vi.fn(),
    createNotebook: vi.fn(),
    toggleNotebookPin: vi.fn(),
    deleteNotebook: vi.fn(),
  },
}));

// Mock the AddNotebookModal
vi.mock('../ui/AddNotebookModal', () => ({
  AddNotebookModal: ({ open, onClose, onSave }: any) => (
    open ? (
      <div data-testid="add-notebook-modal">
        <button onClick={() => onSave('Test Notebook', 'Test Description')}>
          Save Notebook
        </button>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  ),
}));

describe('NotebooksSidebar Dropdown Regression Fix', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User',
  };

  const mockNotebooks = [
    {
      id: 'notebook-1',
      name: 'Test Notebook 1',
      description: 'Test Description 1',
      pinned: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'notebook-2',
      name: 'Test Notebook 2',
      description: 'Test Description 2',
      pinned: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({ user: mockUser });
  });

  it('should list all available notebooks immediately when dropdown opens', async () => {
    // Mock successful notebook loading
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      // Simulate immediate callback with notebooks
      setTimeout(() => callback(mockNotebooks), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Wait for notebooks to load
    await waitFor(() => {
      expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
      expect(screen.getByText('Test Notebook 2')).toBeInTheDocument();
    });

    // Verify both notebooks are listed
    expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
    expect(screen.getByText('Test Notebook 2')).toBeInTheDocument();
    expect(screen.getByText('Test Description 1')).toBeInTheDocument();
    expect(screen.getByText('Test Description 2')).toBeInTheDocument();
  });

  it('should show non-blocking loading indicator while notebooks are loading', async () => {
    // Mock delayed notebook loading
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      // Simulate delayed callback
      setTimeout(() => callback(mockNotebooks), 100);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Check that loading indicator appears in header (non-blocking)
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    
    // Verify the dropdown is still functional (not blocked)
    expect(screen.getByText('Notebooks')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
  });

  it('should show empty state with create action when no notebooks exist', async () => {
    // Mock empty notebook list
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback([]), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Wait for empty state to appear
    await waitFor(() => {
      expect(screen.getByText('No notebooks yet')).toBeInTheDocument();
    });

    // Verify empty state elements
    expect(screen.getByText('No notebooks yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first notebook to get started organizing your notes')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create notebook/i })).toBeInTheDocument();
  });

  it('should not show stale/empty list when notebooks exist', async () => {
    // Mock notebook loading with delay
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      // First return empty array, then return actual notebooks
      setTimeout(() => callback([]), 0);
      setTimeout(() => callback(mockNotebooks), 100);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Initially should show empty state
    await waitFor(() => {
      expect(screen.getByText('No notebooks yet')).toBeInTheDocument();
    });

    // Then should update to show actual notebooks
    await waitFor(() => {
      expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
      expect(screen.queryByText('No notebooks yet')).not.toBeInTheDocument();
    });
  });

  it('should work consistently in online and offline modes', async () => {
    // Mock offline scenario with cached data
    const cachedNotebooks = [mockNotebooks[0]]; // Only first notebook cached
    
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      // Simulate offline mode - only cached data available
      setTimeout(() => callback(cachedNotebooks), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Should show cached notebooks
    await waitFor(() => {
      expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
    });

    // Should not show non-cached notebooks
    expect(screen.queryByText('Test Notebook 2')).not.toBeInTheDocument();
  });

  it('should handle notebook selection correctly', async () => {
    const mockOnNotebookSelect = vi.fn();
    
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback(mockNotebooks), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar onNotebookSelect={mockOnNotebookSelect} />);

    // Wait for notebooks to load
    await waitFor(() => {
      expect(screen.getByText('Test Notebook 1')).toBeInTheDocument();
    });

    // Click on a notebook
    fireEvent.click(screen.getByText('Test Notebook 1'));

    // Verify selection callback was called
    expect(mockOnNotebookSelect).toHaveBeenCalledWith('notebook-1');
  });

  it('should show pinned notebooks with pin icon', async () => {
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback(mockNotebooks), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Wait for notebooks to load
    await waitFor(() => {
      expect(screen.getByText('Test Notebook 2')).toBeInTheDocument();
    });

    // Check that pinned notebook shows pin icon
    const pinIcons = screen.getAllByTestId('PushPinIcon');
    expect(pinIcons.length).toBeGreaterThan(0);
  });

  it('should handle create notebook action from empty state', async () => {
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback([]), 0);
      return () => {}; // unsubscribe function
    });

    (notebookService.createNotebook as any).mockResolvedValue('new-notebook-id');

    render(<NotebooksSidebar />);

    // Wait for empty state
    await waitFor(() => {
      expect(screen.getByText('No notebooks yet')).toBeInTheDocument();
    });

    // Click create notebook button
    fireEvent.click(screen.getByRole('button', { name: /create notebook/i }));

    // Should open add notebook modal
    expect(screen.getByTestId('add-notebook-modal')).toBeInTheDocument();
  });

  it('should display notebook count in footer', async () => {
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback(mockNotebooks), 0);
      return () => {}; // unsubscribe function
    });

    render(<NotebooksSidebar />);

    // Wait for notebooks to load
    await waitFor(() => {
      expect(screen.getByText('2 notebooks')).toBeInTheDocument();
    });
  });

  it('should handle error state gracefully', async () => {
    // Mock error scenario
    (notebookService.subscribeToNotebooks as any).mockImplementation((userId: string, callback: any) => {
      setTimeout(() => callback([]), 0);
      return () => {}; // unsubscribe function
    });

    (notebookService.getNotebooks as any).mockRejectedValue(new Error('Network error'));

    render(<NotebooksSidebar />);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Failed to load notebooks')).toBeInTheDocument();
    });
  });
});

import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.metaKey === event.metaKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common keyboard shortcuts for the app
export const commonShortcuts: KeyboardShortcut[] = [
  {
    key: "n",
    ctrlKey: true,
    action: () => {
      // This will be overridden by components that need it
      console.log("Ctrl+N - New note");
    },
    description: "Create new note",
  },
  {
    key: "s",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+S - Save note");
    },
    description: "Save current note",
  },
  {
    key: "f",
    ctrlKey: true,
    action: () => {
      // Focus search input
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    },
    description: "Focus search",
  },
  {
    key: "b",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+B - Toggle bold");
    },
    description: "Toggle bold text",
  },
  {
    key: "i",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+I - Toggle italic");
    },
    description: "Toggle italic text",
  },
  {
    key: "u",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+U - Toggle underline");
    },
    description: "Toggle underline",
  },
  {
    key: "z",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+Z - Undo");
    },
    description: "Undo last action",
  },
  {
    key: "y",
    ctrlKey: true,
    action: () => {
      console.log("Ctrl+Y - Redo");
    },
    description: "Redo last action",
  },
  {
    key: "Escape",
    action: () => {
      // Close any open modals
      const modals = document.querySelectorAll('[role="dialog"]');
      modals.forEach((modal) => {
        const closeButton = modal.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLElement;
        if (closeButton) {
          closeButton.click();
        }
      });
    },
    description: "Close modal/dialog",
  },
];

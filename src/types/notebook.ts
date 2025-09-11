export interface Notebook {
  id: string;
  name: string;
  description?: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Owner of the notebook
  order: number; // For sorting/ordering notebooks
}

export interface Note {
  id: string;
  title: string;
  content: string;
  notebookId: string;
  pinned: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Owner of the note
  order: number; // For sorting/ordering notes within a notebook
  tags: string[];
}

export interface CreateNotebookData {
  name: string;
  description?: string;
  pinned?: boolean;
}

export interface UpdateNotebookData {
  name?: string;
  description?: string;
  pinned?: boolean;
}

export interface CreateNoteData {
  title: string;
  content: string;
  notebookId: string;
  pinned?: boolean;
  tags?: string[];
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
  pinned?: boolean;
  tags?: string[];
}

export interface NotebookWithNotes extends Notebook {
  notes: Note[];
  noteCount: number;
}

export interface SearchResult {
  notebooks: Notebook[];
  notes: Note[];
  totalResults: number;
}


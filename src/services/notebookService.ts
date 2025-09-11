import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../features/auth/firebase";
import {
  Notebook,
  Note,
  CreateNotebookData,
  UpdateNotebookData,
  CreateNoteData,
  UpdateNoteData,
} from "../types/notebook";

const NOTEBOOKS_COLLECTION = "notebooks";
const NOTES_COLLECTION = "notes";

// Notebook operations
export const notebookService = {
  // Create a new notebook
  async createNotebook(userId: string, data: CreateNotebookData): Promise<string> {
    try {
      const notebookData = {
        ...data,
        userId,
        pinned: data.pinned || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        order: 0, // Will be updated after creation
      };

      const docRef = await addDoc(collection(db, NOTEBOOKS_COLLECTION), notebookData);
      
      // Update the order to be the same as the ID for now
      await updateDoc(docRef, { order: Date.now() });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating notebook:", error);
      throw new Error("Failed to create notebook");
    }
  },

  // Get all notebooks for a user
  async getNotebooks(userId: string): Promise<Notebook[]> {
    try {
      const q = query(
        collection(db, NOTEBOOKS_COLLECTION),
        where("userId", "==", userId),
        orderBy("pinned", "desc"),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Notebook[];
    } catch (error) {
      console.error("Error fetching notebooks:", error);
      throw new Error("Failed to fetch notebooks");
    }
  },

  // Get a single notebook
  async getNotebook(notebookId: string): Promise<Notebook | null> {
    try {
      const docRef = doc(db, NOTEBOOKS_COLLECTION, notebookId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Notebook;
      }
      return null;
    } catch (error) {
      console.error("Error fetching notebook:", error);
      throw new Error("Failed to fetch notebook");
    }
  },

  // Update a notebook
  async updateNotebook(notebookId: string, data: UpdateNotebookData): Promise<void> {
    try {
      const docRef = doc(db, NOTEBOOKS_COLLECTION, notebookId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating notebook:", error);
      throw new Error("Failed to update notebook");
    }
  },

  // Delete a notebook
  async deleteNotebook(notebookId: string): Promise<void> {
    try {
      // First, delete all notes in this notebook
      const notesQuery = query(
        collection(db, NOTES_COLLECTION),
        where("notebookId", "==", notebookId)
      );
      const notesSnapshot = await getDocs(notesQuery);
      
      const batch = writeBatch(db);
      
      // Delete all notes
      notesSnapshot.docs.forEach(noteDoc => {
        batch.delete(noteDoc.ref);
      });
      
      // Delete the notebook
      batch.delete(doc(db, NOTEBOOKS_COLLECTION, notebookId));
      
      await batch.commit();
    } catch (error) {
      console.error("Error deleting notebook:", error);
      throw new Error("Failed to delete notebook");
    }
  },

  // Pin/unpin a notebook
  async toggleNotebookPin(notebookId: string, pinned: boolean): Promise<void> {
    try {
      await this.updateNotebook(notebookId, { pinned });
    } catch (error) {
      console.error("Error toggling notebook pin:", error);
      throw new Error("Failed to toggle notebook pin");
    }
  },

  // Reorder notebooks
  async reorderNotebooks(notebookIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      notebookIds.forEach((notebookId, index) => {
        const docRef = doc(db, NOTEBOOKS_COLLECTION, notebookId);
        batch.update(docRef, { order: index });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error reordering notebooks:", error);
      throw new Error("Failed to reorder notebooks");
    }
  },

  // Subscribe to notebooks changes
  subscribeToNotebooks(userId: string, callback: (notebooks: Notebook[]) => void): () => void {
    const q = query(
      collection(db, NOTEBOOKS_COLLECTION),
      where("userId", "==", userId),
      orderBy("pinned", "desc"),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const notebooks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Notebook[];
      
      callback(notebooks);
    });
  },
};

// Note operations
export const noteService = {
  // Create a new note
  async createNote(userId: string, data: CreateNoteData): Promise<string> {
    try {
      const noteData = {
        ...data,
        userId,
        pinned: data.pinned || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        order: 0, // Will be updated after creation
        tags: data.tags || [],
      };

      const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteData);
      
      // Update the order to be the same as the ID for now
      await updateDoc(docRef, { order: Date.now() });
      
      return docRef.id;
    } catch (error) {
      console.error("Error creating note:", error);
      throw new Error("Failed to create note");
    }
  },

  // Get all notes for a notebook
  async getNotes(notebookId: string): Promise<Note[]> {
    try {
      const q = query(
        collection(db, NOTES_COLLECTION),
        where("notebookId", "==", notebookId),
        orderBy("pinned", "desc"),
        orderBy("updatedAt", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Note[];
    } catch (error) {
      console.error("Error fetching notes:", error);
      throw new Error("Failed to fetch notes");
    }
  },

  // Get a single note
  async getNote(noteId: string): Promise<Note | null> {
    try {
      const docRef = doc(db, NOTES_COLLECTION, noteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Note;
      }
      return null;
    } catch (error) {
      console.error("Error fetching note:", error);
      throw new Error("Failed to fetch note");
    }
  },

  // Update a note
  async updateNote(noteId: string, data: UpdateNoteData): Promise<void> {
    try {
      const docRef = doc(db, NOTES_COLLECTION, noteId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating note:", error);
      throw new Error("Failed to update note");
    }
  },

  // Delete a note
  async deleteNote(noteId: string): Promise<void> {
    try {
      const docRef = doc(db, NOTES_COLLECTION, noteId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting note:", error);
      throw new Error("Failed to delete note");
    }
  },

  // Pin/unpin a note
  async toggleNotePin(noteId: string, pinned: boolean): Promise<void> {
    try {
      await this.updateNote(noteId, { pinned });
    } catch (error) {
      console.error("Error toggling note pin:", error);
      throw new Error("Failed to toggle note pin");
    }
  },

  // Reorder notes within a notebook
  async reorderNotes(noteIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      noteIds.forEach((noteId, index) => {
        const docRef = doc(db, NOTES_COLLECTION, noteId);
        batch.update(docRef, { order: index });
      });
      
      await batch.commit();
    } catch (error) {
      console.error("Error reordering notes:", error);
      throw new Error("Failed to reorder notes");
    }
  },

  // Search notes
  async searchNotes(userId: string, searchQuery: string, limitCount: number = 50): Promise<Note[]> {
    try {
      // Note: This is a simple implementation. For better search, consider using Algolia or similar
      const q = query(
        collection(db, NOTES_COLLECTION),
        where("userId", "==", userId),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const allNotes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Note[];
      
      // Filter by search query
      const filteredNotes = allNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      return filteredNotes;
    } catch (error) {
      console.error("Error searching notes:", error);
      throw new Error("Failed to search notes");
    }
  },

  // Subscribe to notes changes for a notebook
  subscribeToNotes(notebookId: string, callback: (notes: Note[]) => void): () => void {
    const q = query(
      collection(db, NOTES_COLLECTION),
      where("notebookId", "==", notebookId),
      orderBy("pinned", "desc"),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (querySnapshot) => {
      const notes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Note[];
      
      callback(notes);
    });
  },
};

import { VersionData, VersionHistoryQuery } from '../data/schemas/version';
import { noteService } from '../../services/notebookService';

export class VersionManager {
  private versions: Map<string, VersionData[]> = new Map();
  private maxVersionsPerPage = 50;

  /**
   * Create a new version for a page
   */
  async createVersion(
    pageId: string,
    content: string,
    author: string,
    changeSummary?: string
  ): Promise<VersionData> {
    const version: VersionData = {
      id: this.generateVersionId(),
      pageId,
      content,
      timestamp: new Date(),
      author,
      changeSummary,
      fileSize: new Blob([content]).size,
      revisionId: this.generateRevisionId(),
    };

    // Add to local cache
    if (!this.versions.has(pageId)) {
      this.versions.set(pageId, []);
    }
    
    const pageVersions = this.versions.get(pageId)!;
    pageVersions.unshift(version); // Add to beginning

    // Cleanup old versions
    this.cleanupOldVersions(pageId);

    // TODO: Save to Firestore when implemented
    // await this.saveVersionToFirestore(version);

    return version;
  }

  /**
   * Get version history for a page
   */
  async getVersionHistory(query: VersionHistoryQuery): Promise<VersionData[]> {
    const { pageId, limit, offset } = query;
    
    let pageVersions = this.versions.get(pageId) || [];
    
    // TODO: Load from Firestore if not in cache
    // if (pageVersions.length === 0) {
    //   pageVersions = await this.loadVersionsFromFirestore(pageId);
    //   this.versions.set(pageId, pageVersions);
    // }

    return pageVersions.slice(offset, offset + limit);
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string): Promise<VersionData | null> {
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        return version;
      }
    }
    return null;
  }

  /**
   * Restore a page to a specific version
   */
  async restoreVersion(versionId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Update the note with the restored content
    await noteService.updateNote(version.pageId, {
      title: '', // We'll need to get the current title
      content: version.content,
    });

    // Create a new version for this restoration
    await this.createVersion(
      version.pageId,
      version.content,
      version.author,
      `Restored from version ${versionId}`
    );
  }

  /**
   * Compare two versions and return diff information
   */
  compareVersions(version1Id: string, version2Id: string): {
    version1: VersionData;
    version2: VersionData;
    diff: {
      added: string[];
      removed: string[];
      modified: string[];
    };
  } | null {
    const version1 = this.findVersionById(version1Id);
    const version2 = this.findVersionById(version2Id);

    if (!version1 || !version2) {
      return null;
    }

    const diff = this.calculateTextDiff(version1.content, version2.content);

    return {
      version1,
      version2,
      diff,
    };
  }

  /**
   * Cleanup old versions for a page
   */
  private cleanupOldVersions(pageId: string): void {
    const pageVersions = this.versions.get(pageId);
    if (!pageVersions) return;

    if (pageVersions.length > this.maxVersionsPerPage) {
      const versionsToKeep = pageVersions.slice(0, this.maxVersionsPerPage);
      this.versions.set(pageId, versionsToKeep);
    }
  }

  /**
   * Find version by ID across all pages
   */
  private findVersionById(versionId: string): VersionData | null {
    for (const versions of this.versions.values()) {
      const version = versions.find(v => v.id === versionId);
      if (version) {
        return version;
      }
    }
    return null;
  }

  /**
   * Calculate text diff between two versions
   */
  private calculateTextDiff(text1: string, text2: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    // Simple word-level diff implementation
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Simple comparison - in a real implementation, you'd use a proper diff algorithm
    const maxLength = Math.max(words1.length, words2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const word1 = words1[i];
      const word2 = words2[i];

      if (!word1 && word2) {
        added.push(word2);
      } else if (word1 && !word2) {
        removed.push(word1);
      } else if (word1 !== word2) {
        modified.push(`${word1} → ${word2}`);
      }
    }

    return { added, removed, modified };
  }

  /**
   * Generate unique version ID
   */
  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique revision ID
   */
  private generateRevisionId(): string {
    return `rev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get version statistics for a page
   */
  getVersionStats(pageId: string): {
    totalVersions: number;
    totalSize: number;
    oldestVersion?: Date;
    newestVersion?: Date;
  } {
    const pageVersions = this.versions.get(pageId) || [];
    
    if (pageVersions.length === 0) {
      return { totalVersions: 0, totalSize: 0 };
    }

    const totalSize = pageVersions.reduce((sum, version) => sum + version.fileSize, 0);
    const timestamps = pageVersions.map(v => v.timestamp);
    
    return {
      totalVersions: pageVersions.length,
      totalSize,
      oldestVersion: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      newestVersion: new Date(Math.max(...timestamps.map(t => t.getTime()))),
    };
  }

  /**
   * Clear all versions for a page
   */
  clearVersions(pageId: string): void {
    this.versions.delete(pageId);
  }

  /**
   * Clear all cached versions
   */
  clearAllVersions(): void {
    this.versions.clear();
  }
}

// Singleton instance
export const versionManager = new VersionManager();

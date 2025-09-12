import { firestoreService } from '../firestore-service';
import { dataValidator } from '../validation/data-validator';
import { Notebook, Page, UserConfig } from '../schemas/firestore';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
  warnings: string[];
}

export interface DataCleanupResult {
  success: boolean;
  cleanedCount: number;
  errors: string[];
}

export class DataMigrator {
  private migrationVersion = '1.0.0';

  /**
   * Migrate all user data to latest schema
   */
  async migrateUserData(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Migrate notebooks
      const notebookResult = await this.migrateNotebooks(userId);
      result.migratedCount += notebookResult.migratedCount;
      result.errors.push(...notebookResult.errors);
      result.warnings.push(...notebookResult.warnings);

      // Migrate pages
      const pageResult = await this.migratePages(userId);
      result.migratedCount += pageResult.migratedCount;
      result.errors.push(...pageResult.errors);
      result.warnings.push(...pageResult.warnings);

      // Migrate user config
      const configResult = await this.migrateUserConfig(userId);
      result.migratedCount += configResult.migratedCount;
      result.errors.push(...configResult.errors);
      result.warnings.push(...configResult.warnings);

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
    }

    return result;
  }

  /**
   * Migrate notebooks to latest schema
   */
  private async migrateNotebooks(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      const notebooks = await firestoreService.getNotebooks(userId);
      
      for (const notebook of notebooks) {
        const validation = dataValidator.validateNotebook(notebook);
        
        if (!validation.isValid) {
          // Try to fix common issues
          const fixedNotebook = this.fixNotebookData(notebook);
          const fixedValidation = dataValidator.validateNotebook(fixedNotebook);
          
          if (fixedValidation.isValid) {
            await firestoreService.updateNotebook(notebook.id, fixedNotebook);
            result.migratedCount++;
            result.warnings.push(`Fixed notebook ${notebook.id}: ${validation.errors.join(', ')}`);
          } else {
            result.errors.push(`Failed to fix notebook ${notebook.id}: ${validation.errors.join(', ')}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Notebook migration error');
    }

    return result;
  }

  /**
   * Migrate pages to latest schema
   */
  private async migratePages(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      const notebooks = await firestoreService.getNotebooks(userId);
      
      for (const notebook of notebooks) {
        const pages = await firestoreService.getPages(notebook.id);
        
        for (const page of pages) {
          const validation = dataValidator.validatePage(page);
          
          if (!validation.isValid) {
            // Try to fix common issues
            const fixedPage = this.fixPageData(page);
            const fixedValidation = dataValidator.validatePage(fixedPage);
            
            if (fixedValidation.isValid) {
              await firestoreService.updatePage(page.id, fixedPage);
              result.migratedCount++;
              result.warnings.push(`Fixed page ${page.id}: ${validation.errors.join(', ')}`);
            } else {
              result.errors.push(`Failed to fix page ${page.id}: ${validation.errors.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Page migration error');
    }

    return result;
  }

  /**
   * Migrate user config to latest schema
   */
  private async migrateUserConfig(userId: string): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      const config = await firestoreService.getUserConfig(userId);
      
      if (config) {
        const validation = dataValidator.validateUserConfig(config);
        
        if (!validation.isValid) {
          // Try to fix common issues
          const fixedConfig = this.fixUserConfigData(config);
          const fixedValidation = dataValidator.validateUserConfig(fixedConfig);
          
          if (fixedValidation.isValid) {
            await firestoreService.updateUserConfig(userId, fixedConfig);
            result.migratedCount++;
            result.warnings.push(`Fixed user config: ${validation.errors.join(', ')}`);
          } else {
            result.errors.push(`Failed to fix user config: ${validation.errors.join(', ')}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'User config migration error');
    }

    return result;
  }

  /**
   * Fix common notebook data issues
   */
  private fixNotebookData(notebook: any): Partial<Notebook> {
    const fixed: any = {};

    // Fix name
    if (typeof notebook.name !== 'string' || notebook.name.trim().length === 0) {
      fixed.name = 'Untitled Notebook';
    } else {
      fixed.name = notebook.name.trim().substring(0, 200);
    }

    // Fix description
    if (notebook.description && typeof notebook.description === 'string') {
      fixed.description = notebook.description.trim().substring(0, 1000);
    }

    // Fix isPinned
    if (typeof notebook.isPinned !== 'boolean') {
      fixed.isPinned = false;
    }

    return fixed;
  }

  /**
   * Fix common page data issues
   */
  private fixPageData(page: any): Partial<Page> {
    const fixed: any = {};

    // Fix title
    if (typeof page.title !== 'string' || page.title.trim().length === 0) {
      fixed.title = 'Untitled Page';
    } else {
      fixed.title = page.title.trim().substring(0, 200);
    }

    // Fix content
    if (typeof page.content !== 'string') {
      fixed.content = '';
    } else {
      fixed.content = page.content.trim().substring(0, 1000000); // 1MB limit
    }

    // Fix isPinned
    if (typeof page.isPinned !== 'boolean') {
      fixed.isPinned = false;
    }

    // Fix parentPageId
    if (page.parentPageId && typeof page.parentPageId === 'string') {
      fixed.parentPageId = page.parentPageId.trim();
    }

    return fixed;
  }

  /**
   * Fix common user config data issues
   */
  private fixUserConfigData(config: any): Partial<UserConfig> {
    const fixed: any = {};

    if (config.selectedFolder && typeof config.selectedFolder === 'object') {
      fixed.selectedFolder = {};

      // Fix folder ID
      if (typeof config.selectedFolder.id === 'string') {
        fixed.selectedFolder.id = config.selectedFolder.id.trim();
      }

      // Fix folder name
      if (config.selectedFolder.name && typeof config.selectedFolder.name === 'string') {
        fixed.selectedFolder.name = config.selectedFolder.name.trim().substring(0, 100);
      }

      // Fix breadcrumb
      if (Array.isArray(config.selectedFolder.breadcrumb)) {
        fixed.selectedFolder.breadcrumb = config.selectedFolder.breadcrumb
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim().substring(0, 50))
          .slice(0, 10); // Max 10 items
      }
    }

    return fixed;
  }

  /**
   * Clean up orphaned data
   */
  async cleanupOrphanedData(userId: string): Promise<DataCleanupResult> {
    const result: DataCleanupResult = {
      success: true,
      cleanedCount: 0,
      errors: [],
    };

    try {
      // Get all notebooks and pages
      const notebooks = await firestoreService.getNotebooks(userId);
      const notebookIds = new Set(notebooks.map(n => n.id));
      
      let totalPages = 0;
      let orphanedPages = 0;

      for (const notebook of notebooks) {
        const pages = await firestoreService.getPages(notebook.id);
        totalPages += pages.length;
        
        // Check for orphaned pages (pages referencing non-existent notebooks)
        for (const page of pages) {
          if (!notebookIds.has(page.notebookId)) {
            await firestoreService.deletePage(page.id);
            orphanedPages++;
          }
        }
      }

      result.cleanedCount = orphanedPages;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Cleanup error');
    }

    return result;
  }

  /**
   * Validate data integrity
   */
  async validateDataIntegrity(userId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get all data
      const notebooks = await firestoreService.getNotebooks(userId);
      const allPages: Page[] = [];
      
      for (const notebook of notebooks) {
        const pages = await firestoreService.getPages(notebook.id);
        allPages.push(...pages);
      }

      // Validate data integrity
      const integrityResult = dataValidator.validateDataIntegrity(notebooks, allPages);
      errors.push(...integrityResult.errors);
      warnings.push(...integrityResult.warnings);

      // Check for duplicate revision IDs
      const allRevisionIds = [
        ...notebooks.map(n => n.revisionId),
        ...allPages.map(p => p.revisionId)
      ];
      const duplicateRevisionIds = allRevisionIds.filter((id, index) => 
        allRevisionIds.indexOf(id) !== index
      );
      
      if (duplicateRevisionIds.length > 0) {
        warnings.push(`Found ${duplicateRevisionIds.length} duplicate revision IDs`);
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Validation error');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Export user data for backup
   */
  async exportUserData(userId: string): Promise<{
    notebooks: Notebook[];
    pages: Page[];
    userConfig: UserConfig | null;
    exportDate: Date;
    version: string;
  }> {
    const notebooks = await firestoreService.getNotebooks(userId);
    const allPages: Page[] = [];
    
    for (const notebook of notebooks) {
      const pages = await firestoreService.getPages(notebook.id);
      allPages.push(...pages);
    }

    const userConfig = await firestoreService.getUserConfig(userId);

    return {
      notebooks,
      pages: allPages,
      userConfig,
      exportDate: new Date(),
      version: this.migrationVersion,
    };
  }

  /**
   * Import user data from backup
   */
  async importUserData(
    userId: string,
    data: {
      notebooks: Notebook[];
      pages: Page[];
      userConfig?: UserConfig;
    }
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
      warnings: [],
    };

    try {
      // Import notebooks
      for (const notebook of data.notebooks) {
        try {
          const validation = dataValidator.validateNotebook(notebook);
          if (validation.isValid) {
            await firestoreService.createNotebook({
              name: notebook.name,
              description: notebook.description,
              userId: userId, // Override with current user ID
              pinned: notebook.pinned,
            });
            result.migratedCount++;
          } else {
            result.errors.push(`Invalid notebook ${notebook.id}: ${validation.errors.join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`Failed to import notebook ${notebook.id}: ${error}`);
        }
      }

      // Import pages
      for (const page of data.pages) {
        try {
          const validation = dataValidator.validatePage(page);
          if (validation.isValid) {
            await firestoreService.createPage({
              title: page.title,
              content: page.content,
              notebookId: page.notebookId,
              userId: userId, // Override with current user ID
              isPinned: page.isPinned,
              parentPageId: page.parentPageId,
            });
            result.migratedCount++;
          } else {
            result.errors.push(`Invalid page ${page.id}: ${validation.errors.join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`Failed to import page ${page.id}: ${error}`);
        }
      }

      // Import user config
      if (data.userConfig) {
        try {
          const validation = dataValidator.validateUserConfig(data.userConfig);
          if (validation.isValid) {
            await firestoreService.updateUserConfig(userId, data.userConfig);
            result.migratedCount++;
          } else {
            result.errors.push(`Invalid user config: ${validation.errors.join(', ')}`);
          }
        } catch (error) {
          result.errors.push(`Failed to import user config: ${error}`);
        }
      }

      result.success = result.errors.length === 0;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Import error');
    }

    return result;
  }
}

// Singleton instance
export const dataMigrator = new DataMigrator();


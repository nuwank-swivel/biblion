import { z } from 'zod';
import {
  NotebookSchema,
  PageSchema,
  UserConfigSchema,
  SyncStatusSchema,
  ValidationResult,
  Notebook,
  Page,
  UserConfig,
  SyncStatus,
} from '../schemas/firestore';
import { VersionDataSchema, VersionData } from '../schemas/version';

export class DataValidator {
  /**
   * Validate notebook data
   */
  validateNotebook(data: any): ValidationResult {
    try {
      const validatedData = NotebookSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateNotebookWarnings(validatedData),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Validate page data
   */
  validatePage(data: any): ValidationResult {
    try {
      const validatedData = PageSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generatePageWarnings(validatedData),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Validate user config data
   */
  validateUserConfig(data: any): ValidationResult {
    try {
      const validatedData = UserConfigSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateUserConfigWarnings(validatedData),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Validate sync status data
   */
  validateSyncStatus(data: any): ValidationResult {
    try {
      const validatedData = SyncStatusSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateSyncStatusWarnings(validatedData),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Validate version data
   */
  validateVersion(data: any): ValidationResult {
    try {
      const validatedData = VersionDataSchema.parse(data);
      return {
        isValid: true,
        errors: [],
        warnings: this.generateVersionWarnings(validatedData),
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
          warnings: [],
        };
      }
      return {
        isValid: false,
        errors: ['Unknown validation error'],
        warnings: [],
      };
    }
  }

  /**
   * Validate multiple data types
   */
  validateMultiple(data: { type: string; data: any }[]): ValidationResult[] {
    return data.map(({ type, data }) => {
      switch (type) {
        case 'notebook':
          return this.validateNotebook(data);
        case 'page':
          return this.validatePage(data);
        case 'userConfig':
          return this.validateUserConfig(data);
        case 'syncStatus':
          return this.validateSyncStatus(data);
        case 'version':
          return this.validateVersion(data);
        default:
          return {
            isValid: false,
            errors: [`Unknown data type: ${type}`],
            warnings: [],
          };
      }
    });
  }

  /**
   * Sanitize notebook data
   */
  sanitizeNotebook(data: any): Partial<Notebook> {
    const sanitized: any = {};

    if (typeof data.title === 'string') {
      sanitized.title = data.title.trim().substring(0, 200); // Max 200 chars
    }

    if (typeof data.description === 'string') {
      sanitized.description = data.description.trim().substring(0, 1000); // Max 1000 chars
    }

    if (typeof data.userId === 'string') {
      sanitized.userId = data.userId.trim();
    }

    if (typeof data.isPinned === 'boolean') {
      sanitized.isPinned = data.isPinned;
    }

    return sanitized;
  }

  /**
   * Sanitize page data
   */
  sanitizePage(data: any): Partial<Page> {
    const sanitized: any = {};

    if (typeof data.title === 'string') {
      sanitized.title = data.title.trim().substring(0, 200); // Max 200 chars
    }

    if (typeof data.content === 'string') {
      sanitized.content = data.content.trim();
    }

    if (typeof data.notebookId === 'string') {
      sanitized.notebookId = data.notebookId.trim();
    }

    if (typeof data.userId === 'string') {
      sanitized.userId = data.userId.trim();
    }

    if (typeof data.isPinned === 'boolean') {
      sanitized.isPinned = data.isPinned;
    }

    if (typeof data.parentPageId === 'string') {
      sanitized.parentPageId = data.parentPageId.trim();
    }

    return sanitized;
  }

  /**
   * Sanitize user config data
   */
  sanitizeUserConfig(data: any): Partial<UserConfig> {
    const sanitized: any = {};

    if (data.selectedFolder && typeof data.selectedFolder === 'object') {
      sanitized.selectedFolder = {};

      if (typeof data.selectedFolder.id === 'string') {
        sanitized.selectedFolder.id = data.selectedFolder.id.trim();
      }

      if (typeof data.selectedFolder.name === 'string') {
        sanitized.selectedFolder.name = data.selectedFolder.name.trim().substring(0, 100);
      }

      if (Array.isArray(data.selectedFolder.breadcrumb)) {
        sanitized.selectedFolder.breadcrumb = data.selectedFolder.breadcrumb
          .filter((item: any) => typeof item === 'string')
          .map((item: string) => item.trim().substring(0, 50))
          .slice(0, 10); // Max 10 breadcrumb items
      }
    }

    return sanitized;
  }

  /**
   * Generate warnings for notebook data
   */
  private generateNotebookWarnings(notebook: Notebook): string[] {
    const warnings: string[] = [];

    if (notebook.name.length > 100) {
      warnings.push('Notebook name is quite long, consider shortening it');
    }

    if (notebook.description && notebook.description.length > 500) {
      warnings.push('Notebook description is quite long, consider shortening it');
    }

    return warnings;
  }

  /**
   * Generate warnings for page data
   */
  private generatePageWarnings(page: Page): string[] {
    const warnings: string[] = [];

    if (page.title.length > 100) {
      warnings.push('Page title is quite long, consider shortening it');
    }

    if (page.content.length > 100000) {
      warnings.push('Page content is very large, consider breaking it into smaller pages');
    }

    if (page.content.length === 0) {
      warnings.push('Page content is empty');
    }

    return warnings;
  }

  /**
   * Generate warnings for user config data
   */
  private generateUserConfigWarnings(config: UserConfig): string[] {
    const warnings: string[] = [];

    if (config.selectedFolder.breadcrumb && config.selectedFolder.breadcrumb.length > 5) {
      warnings.push('Breadcrumb path is quite deep, consider simplifying the folder structure');
    }

    return warnings;
  }

  /**
   * Generate warnings for sync status data
   */
  private generateSyncStatusWarnings(status: SyncStatus): string[] {
    const warnings: string[] = [];

    if (status.pendingOperations > 10) {
      warnings.push('High number of pending operations, sync may be slow');
    }

    if (status.state === 'error' && !status.error) {
      warnings.push('Sync status indicates error but no error message provided');
    }

    return warnings;
  }

  /**
   * Generate warnings for version data
   */
  private generateVersionWarnings(version: VersionData): string[] {
    const warnings: string[] = [];

    if (version.fileSize > 1000000) { // 1MB
      warnings.push('Version file size is quite large, consider compression');
    }

    if (version.content.length === 0) {
      warnings.push('Version content is empty');
    }

    if (!version.changeSummary) {
      warnings.push('No change summary provided for this version');
    }

    return warnings;
  }

  /**
   * Validate data integrity between related documents
   */
  validateDataIntegrity(notebooks: Notebook[], pages: Page[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for orphaned pages
    const notebookIds = new Set(notebooks.map(n => n.id));
    const orphanedPages = pages.filter(page => !notebookIds.has(page.notebookId));
    
    if (orphanedPages.length > 0) {
      errors.push(`Found ${orphanedPages.length} orphaned pages referencing non-existent notebooks`);
    }

    // Check for pages with invalid parent references
    const pageIds = new Set(pages.map(p => p.id));
    const invalidParentPages = pages.filter(page => 
      page.parentPageId && !pageIds.has(page.parentPageId)
    );
    
    if (invalidParentPages.length > 0) {
      errors.push(`Found ${invalidParentPages.length} pages with invalid parent page references`);
    }

    // Check for circular parent references
    const circularReferences = this.detectCircularReferences(pages);
    if (circularReferences.length > 0) {
      errors.push(`Found ${circularReferences.length} circular parent page references`);
    }

    // Check for duplicate revision IDs
    const allRevisionIds = [
      ...notebooks.map(n => n.revisionId),
      ...pages.map(p => p.revisionId)
    ];
    const duplicateRevisionIds = allRevisionIds.filter((id, index) => 
      allRevisionIds.indexOf(id) !== index
    );
    
    if (duplicateRevisionIds.length > 0) {
      warnings.push(`Found ${duplicateRevisionIds.length} duplicate revision IDs`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Detect circular references in page hierarchy
   */
  private detectCircularReferences(pages: Page[]): string[] {
    const circularRefs: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (pageId: string, path: string[]): void => {
      if (recursionStack.has(pageId)) {
        circularRefs.push(`Circular reference: ${path.join(' -> ')} -> ${pageId}`);
        return;
      }

      if (visited.has(pageId)) {
        return;
      }

      visited.add(pageId);
      recursionStack.add(pageId);

      const page = pages.find(p => p.id === pageId);
      if (page && page.parentPageId) {
        dfs(page.parentPageId, [...path, pageId]);
      }

      recursionStack.delete(pageId);
    };

    pages.forEach(page => {
      if (!visited.has(page.id)) {
        dfs(page.id, []);
      }
    });

    return circularRefs;
  }
}

// Singleton instance
export const dataValidator = new DataValidator();


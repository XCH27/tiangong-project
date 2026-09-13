/**
 * Projects Module
 *
 * Public exports for project management.
 */

export type {
  ProjectConfig,
  ProjectAsset,
  CreateProjectInput,
  LoadedProject,
  ProjectPromptContext,
} from './types.ts';

export {
  // Path utilities
  ensureProjectsDir,
  ensureProjectAssetsDir,
  getWorkspaceProjectsPath,
  getProjectPath,
  getProjectAssetsPath,
  getProjectMemoryPath,
  MEMORY_FILENAME,
  // Config operations
  loadProjectConfig,
  saveProjectConfig,
  // Memory operations
  loadProjectMemory,
  // Load operations
  loadProject,
  loadProjectById,
  loadWorkspaceProjects,
  // Create/update/delete
  generateProjectSlug,
  createProject,
  updateProject,
  deleteProject,
  projectExists,
  // Asset operations
  listProjectAssets,
  uploadProjectAsset,
  deleteProjectAsset,
  sanitizeAssetFilename,
} from './storage.ts';

export type { UploadProjectAssetInput } from './storage.ts';

// P6 collapse planning — see docs/design-library/20-...-remote-connections.md §5.
// Planning only: nothing here writes, so a caller can show a plan and discard it.
export {
  planNestedProjectMigration,
  isPlanUnattended,
} from './migration.ts';
export type {
  MigrationPlan,
  MigrationVerdict,
  FieldConflict,
  NestedProjectSnapshot,
  WorkspaceSnapshot,
} from './migration.ts';

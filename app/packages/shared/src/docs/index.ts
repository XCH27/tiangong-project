/**
 * Documentation Utilities
 *
 * Provides access to built-in documentation that Claude can reference
 * when performing configuration tasks (sources, agents, permissions, etc.).
 *
 * Docs are stored in the active CONFIG_DIR/docs/ and synced from bundled assets.
 * Source content lives in apps/electron/resources/docs/*.md for easier editing.
 */

import { join, relative, dirname, sep } from 'path';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, unlinkSync, copyFileSync } from 'fs';
import { CONFIG_DIR } from '../config/paths.ts';
import { getBundledAssetsDir } from '../utils/paths.ts';
import { debug } from '../utils/debug.ts';

const DOCS_DIR = join(CONFIG_DIR, 'docs');

// Track if docs have been initialized this session (prevents re-init on hot reload)
let docsInitialized = false;

// Resolve the bundled docs assets directory using the shared asset resolver.
// Handles all environments: dev (resources/docs), bundled (dist/resources/docs),
// and packaged Electron (setBundledAssetsRoot sets the base path at startup).
function getAssetsDir(): string {
  return getBundledAssetsDir('docs')
    // Fallback: development path (will fail gracefully if files don't exist)
    ?? join(process.cwd(), 'resources', 'docs');
}

/**
 * Load bundled docs from asset files.
 * Called once at module initialization.
 * Returns empty strings if files don't exist (graceful degradation).
 */
function loadBundledDocs(): Record<string, string> {
  const assetsDir = getAssetsDir();
  const docs: Record<string, string> = {};
  const files: string[] = [];

  // Keep the relative directory in the key. The official Craft docs live in
  // `docs/craft/**`; flattening them would make links and Agent references
  // collide with the small configuration guides at the root of this folder.
  const visit = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(relative(assetsDir, filePath).split(sep).join('/'));
      }
    }
  };

  if (!existsSync(assetsDir)) return docs;
  visit(assetsDir);

  for (const filename of files) {
    const filePath = join(assetsDir, filename);
    try {
      docs[filename] = readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error(`[docs] Failed to load ${filename}:`, error);
    }
  }

  return docs;
}

// Lazy-loaded bundled docs cache.
// IMPORTANT: Must NOT load at module initialization because setBundledAssetsRoot()
// hasn't been called yet. Loading eagerly causes empty docs on fresh install.
let _bundledDocs: Record<string, string> | null = null;

/**
 * Get bundled docs, loading them lazily on first access.
 * This ensures docs are loaded AFTER setBundledAssetsRoot() has been called.
 */
function getBundledDocs(): Record<string, string> {
  if (_bundledDocs === null) {
    const docs = loadBundledDocs();
    // An early caller may run before Electron registers its bundled-assets
    // root. Do not cache an incomplete result; the startup call can retry.
    if (docs['craft/index.md']) _bundledDocs = docs;
    return docs;
  }
  return _bundledDocs;
}

/**
 * Get the docs directory path
 */
export function getDocsDir(): string {
  return DOCS_DIR;
}

/**
 * Get path to a specific doc file
 */
export function getDocPath(filename: string): string {
  return join(DOCS_DIR, filename);
}

// App root retained for user-facing examples; runtime doc references must
// resolve against the active instance's configured directory.
export const APP_ROOT = '~/.craft-agent';

/**
 * Documentation file references for use in error messages and tool descriptions.
 * Use these constants instead of hardcoding paths to keep references in sync.
 */
export const DOC_REFS = {
  appRoot: APP_ROOT,
  sources: getDocPath('sources.md'),
  permissions: getDocPath('permissions.md'),
  skills: getDocPath('skills.md'),
  themes: getDocPath('themes.md'),
  statuses: getDocPath('statuses.md'),
  labels: getDocPath('labels.md'),
  toolIcons: getDocPath('tool-icons.md'),
  automations: getDocPath('automations.md'),
  hooks: getDocPath('automations.md'),
  tasks: getDocPath('automations.md'),
  pages: getDocPath('pages.md'),
  mermaid: getDocPath('mermaid.md'),
  dataTables: getDocPath('data-tables.md'),
  htmlPreview: getDocPath('html-preview.md'),
  pdfPreview: getDocPath('pdf-preview.md'),
  imagePreview: getDocPath('image-preview.md'),
  markdownPreview: getDocPath('markdown-preview.md'),
  llmTool: getDocPath('llm-tool.md'),
  browserTools: getDocPath('browser-tools.md'),
  craftCli: getDocPath('craft-cli.md'),
  docsDir: DOCS_DIR,
} as const;

/**
 * Check if docs directory exists
 */
export function docsExist(): boolean {
  return existsSync(DOCS_DIR);
}

/**
 * List available doc files
 */
export function listDocs(): string[] {
  if (!existsSync(DOCS_DIR)) return [];
  const files: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const filePath = join(dir, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(relative(DOCS_DIR, filePath).split(sep).join('/'));
      }
    }
  };
  visit(DOCS_DIR);
  return files.sort();
}

/**
 * Initialize docs directory with bundled documentation.
 * Always writes all docs on launch to ensure consistency across debug and release modes.
 */
export function initializeDocs(): void {
  // Skip if already initialized this session (prevents re-init on hot reload)
  if (docsInitialized) {
    return;
  }

  // A missing asset root is recoverable during startup. Do not retire old
  // captures or mark initialization complete until the packaged index exists.
  const bundledDocs = getBundledDocs();
  if (!bundledDocs['craft/index.md']) {
    console.warn('[docs] Local Craft documentation is not available yet; initialization will retry');
    return;
  }

  if (!existsSync(DOCS_DIR)) {
    mkdirSync(DOCS_DIR, { recursive: true });
  }

  // The prior Help experiment synced a second, unverified copy of upstream
  // website pages into user profiles. Retire only files carrying that generated
  // marker; never remove a user-authored file with the same name.
  for (const filename of readdirSync(DOCS_DIR)) {
    if (!/^official--[^/]+\.md$/.test(filename) && filename !== 'official-index.md') continue;
    const path = join(DOCS_DIR, filename);
    try {
      const body = readFileSync(path, 'utf-8');
      if (body.startsWith('# Craft Agents official documentation reference\n') ||
          /^# [^\n]+\n\n> Official Craft Agents reference captured from https:\/\/thecraftagents\.com\/docs\//.test(body)) {
        unlinkSync(path);
      }
    } catch (error) {
      console.warn(`[docs] Could not retire generated upstream copy ${filename}:`, error);
    }
  }

  // Always write bundled docs to disk on launch.
  // This ensures consistent behavior between debug and release modes —
  // docs are always up-to-date with the running version.
  for (const [filename, content] of Object.entries(bundledDocs)) {
    const docPath = join(DOCS_DIR, filename);
    mkdirSync(dirname(docPath), { recursive: true });
    writeFileSync(docPath, content, 'utf-8');
  }

  // Keep the reference index, images and OpenAPI spec beside its Markdown so
  // Agent reads do not require hosted documentation assets.
  const craftAssetsDir = join(getAssetsDir(), 'craft');
  const copyNonMarkdown = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const sourcePath = join(dir, entry.name);
      if (entry.isDirectory()) copyNonMarkdown(sourcePath);
      else if (entry.isFile() && !entry.name.endsWith('.md')) {
        const destination = join(DOCS_DIR, relative(getAssetsDir(), sourcePath));
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(sourcePath, destination);
      }
    }
  };
  copyNonMarkdown(craftAssetsDir);

  docsInitialized = true;
  debug(`[docs] Synced ${Object.keys(bundledDocs).length} docs`);
}

// Export the lazy getter for external access
export { getBundledDocs };

// Re-export legacy source-guide parsing utilities. The installed setup
// articles live under docs/craft/source-guides/ rather than this parser API.
export {
  parseSourceGuide,
  getSourceGuide,
  getSourceGuideForDomain,
  getSourceKnowledge,
  extractDomainFromSource,
  extractDomainFromUrl,
  type ParsedSourceGuide,
  type SourceGuideFrontmatter,
} from './source-guides.ts';

// Re-export doc links for contextual help popovers.
export {
  getDocUrl,
  getDocInfo,
  DOCS,
  type DocFeature,
  type DocInfo,
} from './doc-links.ts';

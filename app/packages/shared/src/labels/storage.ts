/**
 * Label Storage
 *
 * Filesystem-based storage for workspace label configurations.
 * Labels are stored at {workspaceRootPath}/labels/config.json
 *
 * Hierarchy: Labels form a nested JSON tree. IDs are simple slugs.
 * New workspaces are seeded with default labels (Development + Content groups).
 * Labels are visual by color only (colored circles in the UI).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { WorkspaceLabelConfig, LabelConfig } from './types.ts';
import { flattenLabels, findLabelById } from './tree.ts';
import { readJsonFileSync } from '../utils/files.ts';
import { migrateLabelColors } from '../colors/migrate.ts';
import { debug } from '../utils/debug.ts';

const LABEL_CONFIG_DIR = 'labels';
const LABEL_CONFIG_FILE = 'labels/config.json';

const DEFAULT_LABEL_ROOT_IDS = new Set(['development', 'content', 'priority', 'project', 'identity']);

type LabelPatch = Omit<Partial<LabelConfig>, 'children'>;

const DEFAULT_LABEL_PATCHES: Record<string, LabelPatch> = {
  development: { name: '开发', color: { light: '#3B82F6', dark: '#60A5FA' } },
  code: { name: '代码', color: { light: '#4F46E5', dark: '#818CF8' }, kind: 'identity' },
  bug: { name: '测试', color: { light: '#0EA5E9', dark: '#38BDF8' }, kind: 'identity' },
  automation: { name: '自动化', color: { light: '#06B6D4', dark: '#22D3EE' } },
  content: { name: '内容', color: { light: '#8B5CF6', dark: '#A78BFA' } },
  writing: { name: '上下文', color: { light: '#7C3AED', dark: '#C4B5FD' }, kind: 'identity' },
  research: { name: '审查', color: { light: '#A855F7', dark: '#C084FC' }, kind: 'identity', systemPromptPreset: '负责检查风险、回归和验收证据。' },
  design: { name: '设计', color: { light: '#D946EF', dark: '#E879F9' }, kind: 'identity' },
  priority: { name: '队长', color: { light: '#F59E0B', dark: '#FBBF24' }, kind: 'identity', systemPromptPreset: '负责拆分任务、分派、汇总和验收，不绕过权限。' },
  project: { name: '项目', color: 'foreground/50', valueType: 'string' },
};

/**
 * Get default label configuration.
 * Provides a starter set of labels organized into Craft's original two families.
 * Team identities reuse these existing labels instead of adding a second identity tree:
 * - Priority slot becomes 队长
 * - Code / Design / Research / Bug / Writing become role identities
 * - Project remains a regular value label; stable team sequence is derived, not written here
 *
 * Children use hue-shifted shades of their parent color to show visual hierarchy.
 */
export function getDefaultLabelConfig(): WorkspaceLabelConfig {
  return {
    version: 1,
    labels: [
      {
        id: 'development',
        name: '开发',
        color: { light: '#3B82F6', dark: '#60A5FA' },
        children: [
          {
            id: 'code',
            name: '代码',
            color: { light: '#4F46E5', dark: '#818CF8' }, // indigo shift
            kind: 'identity',
          },
          {
            id: 'bug',
            name: '测试',
            color: { light: '#0EA5E9', dark: '#38BDF8' }, // sky shift
            kind: 'identity',
          },
          {
            id: 'automation',
            name: '自动化',
            color: { light: '#06B6D4', dark: '#22D3EE' }, // cyan shift
          },
        ],
      },
      {
        id: 'content',
        name: '内容',
        color: { light: '#8B5CF6', dark: '#A78BFA' },
        children: [
          {
            id: 'writing',
            name: '上下文',
            color: { light: '#7C3AED', dark: '#C4B5FD' }, // deeper violet
            kind: 'identity',
          },
          {
            id: 'research',
            name: '审查',
            color: { light: '#A855F7', dark: '#C084FC' }, // lighter purple
            kind: 'identity',
            systemPromptPreset: '负责检查风险、回归和验收证据。',
          },
          {
            id: 'design',
            name: '设计',
            color: { light: '#D946EF', dark: '#E879F9' }, // fuchsia shift
            kind: 'identity',
          },
        ],
      },
      {
        id: 'priority',
        name: '队长',
        color: { light: '#F59E0B', dark: '#FBBF24' },
        kind: 'identity',
        systemPromptPreset: '负责拆分任务、分派、汇总和验收，不绕过权限。',
      },
      {
        id: 'project',
        name: '项目',
        color: 'foreground/50',
        valueType: 'string',
      },
    ],
  };
}

function normalizeDefaultLabel(label: LabelConfig): LabelConfig {
  const children = label.children?.map(normalizeDefaultLabel);
  const patch = DEFAULT_LABEL_PATCHES[label.id];
  if (!patch) {
    return children ? { ...label, children } : label;
  }

  const next: LabelConfig = { ...label, ...patch };
  if (children) {
    next.children = children;
  }
  if (label.id === 'priority') {
    delete next.valueType;
  }
  return next;
}

function normalizeDefaultLabelConfig(config: WorkspaceLabelConfig): { config: WorkspaceLabelConfig; migrated: boolean } {
  const looksLikeDefaultSeed = config.labels.some(label => DEFAULT_LABEL_ROOT_IDS.has(label.id));
  if (!looksLikeDefaultSeed) {
    return { config, migrated: false };
  }

  // Previous migration added a separate "身份" root group. Fold identities back into Craft's original labels.
  const labels = config.labels
    .filter(label => label.id !== 'identity')
    .map(normalizeDefaultLabel);
  const normalized = { ...config, labels };
  return {
    config: normalized,
    migrated: JSON.stringify(normalized.labels) !== JSON.stringify(config.labels),
  };
}

/**
 * Load workspace label configuration.
 * Returns empty config if no file exists or parsing fails.
 * Auto-migrates old Tailwind color format to EntityColor on first load.
 */
export function loadLabelConfig(workspaceRootPath: string): WorkspaceLabelConfig {
  const configPath = join(workspaceRootPath, LABEL_CONFIG_FILE);

  // If no config file exists, seed with defaults and persist to disk.
  // This ensures existing workspaces (created before default labels existed) get populated.
  if (!existsSync(configPath)) {
    const defaults = getDefaultLabelConfig();
    debug('[loadLabelConfig] No config found, seeding with default labels');
    saveLabelConfig(workspaceRootPath, defaults);
    return defaults;
  }

  try {
    let config = readJsonFileSync<WorkspaceLabelConfig>(configPath);

    // Auto-migrate old Tailwind class colors (e.g., "text-accent") to new EntityColor format.
    // If migration occurs, write the updated config back to disk.
    let migrated = migrateLabelColors(config);
    const normalizedDefaults = normalizeDefaultLabelConfig(config);
    if (normalizedDefaults.migrated) {
      config = normalizedDefaults.config;
      migrated = true;
    }
    if (migrated) {
      debug('[loadLabelConfig] Migrated old color format, writing back');
      saveLabelConfig(workspaceRootPath, config);
    }

    return config;
  } catch (error) {
    debug('[loadLabelConfig] Failed to parse config:', error);
    return getDefaultLabelConfig();
  }
}

/**
 * Save workspace label configuration to disk.
 * Creates the labels directory if missing.
 */
export function saveLabelConfig(
  workspaceRootPath: string,
  config: WorkspaceLabelConfig
): void {
  const labelDir = join(workspaceRootPath, LABEL_CONFIG_DIR);
  const configPath = join(workspaceRootPath, LABEL_CONFIG_FILE);

  if (!existsSync(labelDir)) {
    mkdirSync(labelDir, { recursive: true });
  }

  try {
    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    debug('[saveLabelConfig] Failed to save config:', error);
    throw error;
  }
}

/**
 * Get the label tree (root-level labels with nested children).
 * Primary accessor for the UI — returns the tree structure as-is from config.
 */
export function listLabels(workspaceRootPath: string): LabelConfig[] {
  const config = loadLabelConfig(workspaceRootPath);
  return config.labels;
}

/**
 * Get all labels as a flat list (tree flattened depth-first).
 * Useful for lookups, session label validation, and non-hierarchical display.
 */
export function listLabelsFlat(workspaceRootPath: string): LabelConfig[] {
  const config = loadLabelConfig(workspaceRootPath);
  return flattenLabels(config.labels);
}

/**
 * Get a single label by ID (searches the entire tree).
 * Returns null if not found.
 */
export function getLabel(
  workspaceRootPath: string,
  labelId: string
): LabelConfig | null {
  const config = loadLabelConfig(workspaceRootPath);
  return findLabelById(config.labels, labelId) || null;
}

/**
 * Check if a label ID exists in this workspace (searches entire tree)
 */
export function isValidLabelId(
  workspaceRootPath: string,
  labelId: string
): boolean {
  const config = loadLabelConfig(workspaceRootPath);
  return !!findLabelById(config.labels, labelId);
}

/**
 * Validate label ID format.
 * Simple slug: lowercase alphanumeric + hyphens, no leading/trailing hyphens.
 * Examples: "bug", "frontend", "my-label"
 */
export function isValidLabelIdFormat(labelId: string): boolean {
  if (!labelId) return false;
  const SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return SLUG_PATTERN.test(labelId);
}

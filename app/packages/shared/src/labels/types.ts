/**
 * Label Types
 *
 * Types for configurable session labels.
 * Labels are additive tags (many-per-session), unlike statuses which are exclusive (one-per-session).
 * Stored at {workspaceRootPath}/labels/config.json
 *
 * Hierarchy: Labels form a recursive JSON tree via the `children` array.
 * Array position determines display order (no separate order field).
 * IDs are simple slugs, globally unique across the entire tree.
 *
 * Visual: Labels are identified by color only (rendered as colored circles).
 *
 * Color format: EntityColor (system color string or custom color object)
 * - System: "accent", "foreground/50", "info/80" (uses CSS variables, auto light/dark)
 * - Custom: { light: "#EF4444", dark: "#F87171" } (explicit values)
 */

import type { EntityColor } from '../colors/types.ts'

/**
 * The two kinds that may be written.
 *
 * Declared here rather than in `kind-normalize.ts` so the write-input types can
 * reference it without the data module importing its own normalizer; the
 * normalizer re-exports it, so callers still have one import site.
 */
export type NormalizedLabelKind = 'functional' | 'expert';

/**
 * Auto-label rule: regex pattern that scans user messages and automatically
 * applies labels with extracted values.
 *
 * Uses capture groups ($1, $2, etc.) in the pattern and substitutes them
 * into the valueTemplate. Rules are evaluated in order. Multiple rules on
 * the same label means multiple ways to trigger it (e.g., URL regex + bare
 * key regex for issue IDs).
 */
export interface AutoLabelRule {
  /** Regex pattern with capture groups for value extraction */
  pattern: string
  /** Regex flags (default: 'gi' for global, case-insensitive). 'g' is always enforced. */
  flags?: string
  /** Template for the label value using $1, $2, etc. for capture group substitution */
  valueTemplate?: string
  /** Human-readable description of what this rule matches */
  description?: string
}

/**
 * Label configuration (stored in labels/config.json).
 * Recursive: each label can have nested children forming a tree.
 * Array position = display order (no explicit order field needed).
 */
export interface LabelConfig {
  /** Stable identity ID used by sessions and capability bindings; never use a translated name. */
  id: string;

  /** Display name */
  name: string;

  /** Optional color. Rendered as a colored circle in the UI. */
  color?: EntityColor;

  /** Child labels forming a sub-tree. Array position = display order. */
  children?: LabelConfig[];

  /**
   * Optional value type hint for UI rendering and agent affordances.
   * When set, indicates this label carries a typed value (e.g., "priority::3").
   * Parser always infers the type from raw value, but this hint tells UI
   * what input widget to show and tells the agent what format to write.
   * Omit for boolean (presence-only) labels.
   */
  valueType?: 'string' | 'number' | 'date' | 'link';

  /**
   * Auto-label rules: regex patterns that scan user messages and automatically
   * apply this label with extracted values.
   * Multiple rules = multiple ways to trigger (evaluated in order, all matches collected).
   */
  autoRules?: AutoLabelRule[];

  /**
   * Role of this label in the catalog (Decision E10 — one label store).
   * Omit or `functional` = organize/filter/automate only.
   * `expert` = a specialist definition: prompt preset plus an `expertKit`.
   *
   * @deprecated `'identity'` — expert kits grew out of the identity-label design,
   * so stored catalogs still contain it and every read path accepts it. Do not
   * write it. Normalize on read with `normalizeLabelKind()`; anything reasoning
   * about experts should ask `isExpertLabel()` rather than comparing this field.
   */
  kind?: 'functional' | 'expert' | 'identity';

  /**
   * For expert labels: text injected when building agent context for a session
   * that carries this label id. Does not grant tools or bypass the permission path.
   */
  systemPromptPreset?: string;

  /**
   * What this expert carries: skills, sources, tools, and the permission mode it
   * *requests*.
   *
   * Previously this was the documented gap — an expert was a paragraph of text
   * and every session saw every tool regardless of its role, which is a
   * measurable accuracy cost rather than a tidiness one (Decision H13). The kit
   * narrows what the agent *sees*; it never widens what it may *do*, and the
   * permission path still decides (H14).
   *
   * Shape and budget rules: `labels/expert-kit.ts`.
   */
  expertKit?: {
    skills?: string[];
    sources?: string[];
    tools?: string[];
    requestedPermissionMode?: 'safe' | 'ask' | 'allow-all';
  };
}

/**
 * Complete label configuration for a workspace
 */
export interface WorkspaceLabelConfig {
  /** Schema version (start at 1) */
  version: number;

  /** Root-level labels. Array position = display order. May contain nested children. */
  labels: LabelConfig[];
}

/**
 * Input for creating a new label (via CRUD operations).
 * parentId determines where in the tree to insert (null/undefined = root level).
 */
export interface CreateLabelInput {
  name: string;
  color?: EntityColor;
  parentId?: string; // Target parent label ID (null = root)
  valueType?: 'string' | 'number' | 'date' | 'link';
  /**
   * Write paths accept `expert`, never `identity`.
   *
   * `LabelConfig` still reads `identity` because config files on disk contain
   * it, but nothing should be able to *create* more of it — that is what makes
   * the rename finish rather than accumulate a second spelling forever.
   */
  kind?: NormalizedLabelKind;
  systemPromptPreset?: string;
  /**
   * The kit payload: which installed skills this role carries, which sources it
   * reads, which registered tools it is offered, and the permission mode it
   * *requests*.
   *
   * Writable since 2026-09-10. It was declared on `LabelConfig` and absent from
   * both inputs, so it was readable and unwritable — the same defect the `kind`
   * rename left behind one field over, and the reason `assessExpertKit` measured
   * an always-empty value (H36). Slugs resolve against the installed skills via
   * `kit-resolve.ts`; a slug that names nothing is reported, not dropped.
   *
   * `requestedPermissionMode` stays a request. The permission path decides and
   * may return something narrower — a kit that could widen permissions would be
   * a second authority over the same decision.
   */
  expertKit?: {
    skills?: string[];
    sources?: string[];
    tools?: string[];
    requestedPermissionMode?: 'safe' | 'ask' | 'allow-all';
  };
}

/**
 * Input for updating an existing label (cannot change ID or hierarchy position).
 */
export interface UpdateLabelInput {
  name?: string;
  /** Pass null to clear color */
  color?: EntityColor | null;
  /** Pass empty string / falsy via '' to clear valueType */
  valueType?: 'string' | 'number' | 'date' | 'link' | '';
  /** Write paths accept `expert`, never `identity`. See {@link CreateLabelInput}. */
  kind?: NormalizedLabelKind;
  /** Pass empty string to clear */
  systemPromptPreset?: string;
  /**
   * Replaces the whole payload; an empty payload clears the field.
   *
   * Whole-object replace rather than a merge, because a partial merge makes
   * "remove the last skill" unexpressible — the caller would have to send a
   * sentinel to distinguish it from "leave skills alone". See {@link CreateLabelInput}.
   */
  expertKit?: {
    skills?: string[];
    sources?: string[];
    tools?: string[];
    requestedPermissionMode?: 'safe' | 'ask' | 'allow-all';
  };
}

/**
 * Parsed session label entry (after splitting on ::).
 * Session labels are stored as flat strings like "bug" or "priority::3".
 * This interface represents the parsed form for typed access.
 */
export interface ParsedLabelEntry {
  /** Label ID (the part before ::, or the entire string for boolean labels) */
  id: string;

  /** Raw string value (the part after ::), undefined for boolean labels */
  rawValue?: string;

  /**
   * Typed value inferred from rawValue:
   * - number: if rawValue parses as a finite number
   * - Date: if rawValue matches ISO date format (YYYY-MM-DD)
   * - string: otherwise
   * - undefined: for boolean labels (no :: separator)
   */
  value?: string | number | Date;
}

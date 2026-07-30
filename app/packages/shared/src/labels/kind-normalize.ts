import type { LabelConfig } from './types'

/**
 * One place that knows expert kits used to be identity labels.
 *
 * The rename was a product decision, not a data migration: catalogs written
 * before it still carry `kind: 'identity'`, and rewriting a user's label store
 * on read is how a bug in the reader becomes a bug in their data. So the old
 * value stays readable forever and is normalized here, once.
 *
 * Every other module should call these instead of comparing `kind` directly.
 * Scattered `kind === 'identity'` checks are how half the codebase keeps
 * accepting a value the other half has forgotten about.
 */

/** The vocabulary new code writes and reasons about. */
export type NormalizedLabelKind = 'functional' | 'expert'

/**
 * `undefined` means functional: the field was added after the label store
 * existed, and an unset kind has always meant "just for organizing".
 */
export function normalizeLabelKind(kind: LabelConfig['kind']): NormalizedLabelKind {
  return kind === 'expert' || kind === 'identity' ? 'expert' : 'functional'
}

export function isExpertLabel(label: LabelConfig): boolean {
  return normalizeLabelKind(label.kind) === 'expert'
}

/**
 * Rewrite a label to the current vocabulary.
 *
 * Applied when a label is *edited*, so the old value drains out through normal
 * use rather than through a migration pass that has to be correct on every
 * catalog at once. A store nobody touches keeps working unchanged.
 */
export function withNormalizedKind(label: LabelConfig): LabelConfig {
  if (label.kind !== 'identity') return label
  return { ...label, kind: 'expert' }
}

/** True when a stored catalog still holds the legacy value, for a settings hint. */
export function hasLegacyKind(labels: readonly LabelConfig[]): boolean {
  return labels.some((label) =>
    label.kind === 'identity' || (label.children ? hasLegacyKind(label.children) : false))
}

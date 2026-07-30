/**
 * Identity helpers for session labels (docs/33: identity lives on LabelConfig).
 *
 * Browser-safe: constants + pure functions only (no Node fs).
 * Catalog truth remains labels/config.json; assignment remains session.labels[].
 */

import type { LabelConfig } from './types.ts'

/** Bare label id without optional `::value` suffix. */
export function labelIdOf(rawLabel: string): string {
  return rawLabel.split('::')[0] ?? rawLabel
}

/** Recursively collect labels marked kind === 'identity'. */
export function collectIdentityLabels(labels: readonly LabelConfig[]): LabelConfig[] {
  const out: LabelConfig[] = []
  const walk = (list: readonly LabelConfig[]): void => {
    for (const label of list) {
      if (label.kind === 'identity') out.push(label)
      if (label.children?.length) walk(label.children)
    }
  }
  walk(labels)
  return out
}

/** Map id → label for a tree. */
export function indexLabelsById(labels: readonly LabelConfig[]): Map<string, LabelConfig> {
  const map = new Map<string, LabelConfig>()
  const walk = (list: readonly LabelConfig[]): void => {
    for (const label of list) {
      map.set(label.id, label)
      if (label.children?.length) walk(label.children)
    }
  }
  walk(labels)
  return map
}

/**
 * Build a prompt context block from identity labels applied to a session.
 * Only includes labels with kind=identity and a non-empty systemPromptPreset.
 */
export function formatIdentityLabelPromptBlock(
  sessionLabels: readonly string[] | undefined,
  catalog: readonly LabelConfig[],
): string | null {
  if (!sessionLabels?.length) return null
  const byId = indexLabelsById(catalog)
  const parts: string[] = []
  const seen = new Set<string>()

  for (const raw of sessionLabels) {
    const id = labelIdOf(raw)
    if (seen.has(id)) continue
    seen.add(id)
    const label = byId.get(id)
    if (!label || label.kind !== 'identity') continue
    const preset = label.systemPromptPreset?.trim()
    if (!preset) continue
    parts.push(`- #${id}${label.name ? ` (${label.name})` : ''}: ${preset}`)
  }

  if (parts.length === 0) return null
  return [
    '<identity_labels>',
    'Active identity labels for this session (role guidance only; they do not bypass permission checks):',
    ...parts,
    '</identity_labels>',
  ].join('\n')
}

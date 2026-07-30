import { describe, expect, it } from 'bun:test'
import { getDefaultLabelConfig } from '../storage.ts'
import { SYSTEM_LABELS, getSystemLabel } from '../system-labels.ts'
import { flattenLabels } from '../tree.ts'

describe('built-in label metadata', () => {
  it('matches every starter label stable ID and default name', () => {
    const starterLabels: Array<{ id: string; name: string }> = flattenLabels(getDefaultLabelConfig().labels)
      .map(({ id, name }) => ({ id, name }))
      .sort((a, b) => a.id.localeCompare(b.id))
    const catalogLabels: Array<{ id: string; name: string }> = Object.values(SYSTEM_LABELS)
      .map(({ id, defaultName }) => ({ id, name: defaultName }))
      .sort((a, b) => a.id.localeCompare(b.id))

    expect(catalogLabels).toEqual(starterLabels)
  })

  it('returns metadata only for built-in stable IDs', () => {
    expect(getSystemLabel('content')?.nameKey).toBe('labels.default.content')
    expect(getSystemLabel('user-created')).toBeUndefined()
  })

  it('does not silently turn functional starter labels into identities', () => {
    expect(flattenLabels(getDefaultLabelConfig().labels).every(
      (label) => label.kind !== 'identity' && label.systemPromptPreset === undefined,
    )).toBe(true)
  })
})

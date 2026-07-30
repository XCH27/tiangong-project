import { describe, expect, it } from 'bun:test'
import type { LabelConfig } from '../types.ts'
import {
  collectIdentityLabels,
  formatIdentityLabelPromptBlock,
  labelIdOf,
} from '../identity.ts'

const catalog: LabelConfig[] = [
  {
    id: 'development',
    name: 'Development',
    children: [
      {
        id: 'code',
        name: 'Code',
        kind: 'identity',
        systemPromptPreset: 'Write careful code.',
      },
      { id: 'automation', name: 'Automation' },
    ],
  },
  {
    id: 'research',
    name: 'Research',
    kind: 'identity',
    systemPromptPreset: 'Review risks.',
  },
]

describe('identity label helpers', () => {
  it('strips ::value from session label strings', () => {
    expect(labelIdOf('priority::3')).toBe('priority')
    expect(labelIdOf('bug')).toBe('bug')
  })

  it('collects only kind=identity nodes', () => {
    expect(collectIdentityLabels(catalog).map(l => l.id).sort()).toEqual(['code', 'research'])
  })

  it('formats prompt block for active identity labels only', () => {
    const block = formatIdentityLabelPromptBlock(['code', 'automation', 'research::x'], catalog)
    expect(block).toContain('<identity_labels>')
    expect(block).toContain('#code')
    expect(block).toContain('Write careful code.')
    expect(block).toContain('#research')
    expect(block).toContain('Review risks.')
    expect(block).not.toContain('automation')
  })

  it('returns null when no identity presets apply', () => {
    expect(formatIdentityLabelPromptBlock(['automation'], catalog)).toBeNull()
    expect(formatIdentityLabelPromptBlock([], catalog)).toBeNull()
  })
})

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { createLabel, updateLabel } from '../crud.ts'
import { loadLabelConfig, saveLabelConfig } from '../storage.ts'
import { flattenLabels } from '../tree.ts'
import { validateLabelsContent } from '../../config/validators.ts'

let workspaceRoot: string

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'labels-identity-'))
  saveLabelConfig(workspaceRoot, { version: 1, labels: [] })
})

afterEach(() => {
  rmSync(workspaceRoot, { recursive: true, force: true })
})

describe('expert-kit fields on LabelConfig', () => {
  it('create and update kind + systemPromptPreset', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Reviewer',
      kind: 'expert',
      systemPromptPreset: 'Review carefully.',
    })
    expect(created.kind).toBe('expert')
    expect(created.systemPromptPreset).toBe('Review carefully.')

    const updated = updateLabel(workspaceRoot, created.id, {
      systemPromptPreset: 'Focus on risks.',
    })
    expect(updated.systemPromptPreset).toBe('Focus on risks.')
    expect(updated.kind).toBe('expert')

    const reloaded = flattenLabels(loadLabelConfig(workspaceRoot).labels).find(
      (l) => l.id === created.id,
    )
    expect(reloaded?.systemPromptPreset).toBe('Focus on risks.')
  })

  it('clearing prompt removes field; functional clears kind', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Code',
      kind: 'expert',
      systemPromptPreset: 'Write code.',
    })
    updateLabel(workspaceRoot, created.id, { systemPromptPreset: '' })
    let label = flattenLabels(loadLabelConfig(workspaceRoot).labels).find((l) => l.id === created.id)!
    expect(label.systemPromptPreset).toBeUndefined()
    expect(label.kind).toBe('expert')

    updateLabel(workspaceRoot, created.id, { kind: 'functional' })
    label = flattenLabels(loadLabelConfig(workspaceRoot).labels).find((l) => l.id === created.id)!
    expect(label.kind).toBeUndefined()
  })

  it('config_validate accepts expert-kit fields', () => {
    const json = JSON.stringify({
      version: 1,
      labels: [
        {
          id: 'research',
          name: 'Research',
          kind: 'expert',
          systemPromptPreset: 'Review risks.',
        },
      ],
    })
    const result = validateLabelsContent(json)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('expertKit payload write path', () => {
  it('creates a kit payload and reloads it from disk', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Corporate legal',
      kind: 'expert',
      expertKit: {
        skills: ['compliance-review', 'draft-contract'],
        sources: ['pkulaw'],
        tools: ['read_file'],
        requestedPermissionMode: 'ask',
      },
    })
    expect(created.expertKit?.skills).toEqual(['compliance-review', 'draft-contract'])
    expect(created.expertKit?.requestedPermissionMode).toBe('ask')

    const reloaded = flattenLabels(loadLabelConfig(workspaceRoot).labels).find(l => l.id === created.id)
    expect(reloaded?.expertKit?.skills).toEqual(['compliance-review', 'draft-contract'])
    expect(reloaded?.expertKit?.sources).toEqual(['pkulaw'])
    expect(reloaded?.expertKit?.tools).toEqual(['read_file'])
  })

  it('trims, deduplicates and drops blank entries', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Reviewer',
      kind: 'expert',
      expertKit: { skills: ['  compliance-review  ', 'compliance-review', '', '   '] },
    })
    expect(created.expertKit?.skills).toEqual(['compliance-review'])
  })

  it('writes no field at all when the payload carries nothing', () => {
    // Absence is what keeps a plain functional label a plain record on disk —
    // an empty object would read as "this kit carries nothing", a different claim.
    const created = createLabel(workspaceRoot, {
      name: 'Plain',
      expertKit: { skills: [], sources: [], tools: [] },
    })
    expect(created.expertKit).toBeUndefined()
    expect('expertKit' in created).toBe(false)
  })

  it('replaces the whole payload on update rather than merging', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Analyst',
      kind: 'expert',
      expertKit: { skills: ['a', 'b'], sources: ['s1'] },
    })
    const updated = updateLabel(workspaceRoot, created.id, { expertKit: { skills: ['c'] } })
    expect(updated.expertKit?.skills).toEqual(['c'])
    // A merge would have kept sources, making "remove the last source" unexpressible.
    expect(updated.expertKit?.sources).toBeUndefined()
  })

  it('clears the payload when an empty one is written', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Temp',
      kind: 'expert',
      expertKit: { skills: ['a'] },
    })
    const cleared = updateLabel(workspaceRoot, created.id, { expertKit: {} })
    expect(cleared.expertKit).toBeUndefined()

    const reloaded = flattenLabels(loadLabelConfig(workspaceRoot).labels).find(l => l.id === created.id)
    expect(reloaded?.expertKit).toBeUndefined()
  })

  it('leaves an existing payload untouched when the update omits it', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Keeper',
      kind: 'expert',
      expertKit: { skills: ['a'] },
    })
    const updated = updateLabel(workspaceRoot, created.id, { name: 'Renamed' })
    expect(updated.name).toBe('Renamed')
    expect(updated.expertKit?.skills).toEqual(['a'])
  })

  it('keeps a written payload valid against the labels validator', () => {
    createLabel(workspaceRoot, {
      name: 'Validated',
      kind: 'expert',
      expertKit: { skills: ['compliance-review'], requestedPermissionMode: 'safe' },
    })
    const raw = JSON.stringify(loadLabelConfig(workspaceRoot))
    expect(validateLabelsContent(raw).valid).toBe(true)
  })
})

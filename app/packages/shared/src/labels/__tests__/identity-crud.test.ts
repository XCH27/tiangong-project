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

describe('identity fields on LabelConfig', () => {
  it('create and update kind + systemPromptPreset', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Reviewer',
      kind: 'identity',
      systemPromptPreset: 'Review carefully.',
    })
    expect(created.kind).toBe('identity')
    expect(created.systemPromptPreset).toBe('Review carefully.')

    const updated = updateLabel(workspaceRoot, created.id, {
      systemPromptPreset: 'Focus on risks.',
    })
    expect(updated.systemPromptPreset).toBe('Focus on risks.')
    expect(updated.kind).toBe('identity')

    const reloaded = flattenLabels(loadLabelConfig(workspaceRoot).labels).find(
      (l) => l.id === created.id,
    )
    expect(reloaded?.systemPromptPreset).toBe('Focus on risks.')
  })

  it('clearing prompt removes field; functional clears kind', () => {
    const created = createLabel(workspaceRoot, {
      name: 'Code',
      kind: 'identity',
      systemPromptPreset: 'Write code.',
    })
    updateLabel(workspaceRoot, created.id, { systemPromptPreset: '' })
    let label = flattenLabels(loadLabelConfig(workspaceRoot).labels).find((l) => l.id === created.id)!
    expect(label.systemPromptPreset).toBeUndefined()
    expect(label.kind).toBe('identity')

    updateLabel(workspaceRoot, created.id, { kind: 'functional' })
    label = flattenLabels(loadLabelConfig(workspaceRoot).labels).find((l) => l.id === created.id)!
    expect(label.kind).toBeUndefined()
  })

  it('config_validate accepts identity fields', () => {
    const json = JSON.stringify({
      version: 1,
      labels: [
        {
          id: 'research',
          name: 'Research',
          kind: 'identity',
          systemPromptPreset: 'Review risks.',
        },
      ],
    })
    const result = validateLabelsContent(json)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

import { describe, expect, it } from 'bun:test'
import type { InternalActionDefinition } from '@craft-agent/shared/protocol'
import { createAllInternalActions, createFilesInternalActions, InternalActionRegistryService } from './internal-action-registry'

function makeDef(overrides: Partial<InternalActionDefinition> = {}): InternalActionDefinition {
  return {
    id: 'files.move_entry',
    contractVersion: 1,
    surface: 'files',
    verb: 'mutate',
    title: 'Move file entry',
    description: 'Move or rename a file entry inside the workspace.',
    inputSchema: {
      type: 'object',
      required: ['fromPath', 'toPath'],
      properties: {
        fromPath: { type: 'string' },
        toPath: { type: 'string' },
      },
    },
    outputSchema: {
      type: 'object',
      required: ['patchId'],
      properties: { patchId: { type: 'string' } },
    },
    permissionLevel: 'L2',
    timelineEvent: 'file_entry_moved',
    undoHandle: { type: 'inverse-patch' },
    humanEntryPoints: ['FilesListPanel.rename'],
    agentCallable: true,
    locality: 'LOCAL_ONLY',
    replayPolicy: 'semantic',
    redactionPolicy: ['fromPath', 'toPath'],
    contextSummary: { reads: ['workspace.entry'], writes: ['workspace.fileTree'], tokenHint: 'tiny' },
    ...overrides,
  }
}

describe('InternalActionRegistryService', () => {
  it('rejects duplicate id + contractVersion and returns latest version when omitted', () => {
    const registry = new InternalActionRegistryService()
    registry.register(makeDef({ contractVersion: 1, title: 'v1' }))
    registry.register(makeDef({ contractVersion: 2, title: 'v2' }))

    expect(registry.get('files.move_entry')?.title).toBe('v2')
    expect(registry.get('files.move_entry', 1)?.title).toBe('v1')
    expect(() => registry.register(makeDef({ contractVersion: 1 }))).toThrow(/duplicate/i)
  })

  it('registers spine actions alongside files actions', () => {
    const registry = new InternalActionRegistryService(createAllInternalActions())
    expect(registry.list().length).toBe(12)
    expect(registry.list({ surface: 'team' }).map((def) => def.id)).toEqual([
      'team.get_projection',
      'team.send_message',
      'team.assign_task',
    ])
  })

  it('lists low-token summaries by surface and verb', () => {
    const registry = new InternalActionRegistryService(createFilesInternalActions())

    const files = registry.list({ surface: 'files' })
    expect(files.map((def) => def.id)).toEqual([
      'files.inspect_workspace',
      'files.select_entry',
      'files.move_entry',
      'files.undo_last_edit',
    ])

    expect(registry.summarize({ surface: 'files', verb: 'mutate' })).toEqual([
      expect.objectContaining({
        id: 'files.move_entry',
        contractVersion: 1,
        permissionLevel: 'L2',
      }),
    ])
  })

  it('enforces load-bearing definition invariants', () => {
    const registry = new InternalActionRegistryService()

    expect(() => registry.register(makeDef({ undoHandle: { type: 'none' } }))).toThrow(/noneReason/i)
    expect(() => registry.register(makeDef({ humanEntryPoints: [], agentCallable: false }))).toThrow(/entry point|agent/i)
    expect(() => registry.register(makeDef({ locality: 'REMOTE_ELIGIBLE' }))).toThrow(/LOCAL_ONLY/i)
  })
})

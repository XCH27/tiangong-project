import { describe, expect, test } from 'bun:test'
import { modelForNewProjectConversation } from '../conversation-model.ts'

describe('modelForNewProjectConversation', () => {
  test('a new conversation with no project history uses the workspace default', () => {
    expect(modelForNewProjectConversation({
      workspaceDefaultModel: 'claude-sonnet-4-6',
      conversations: [],
    })).toBe('claude-sonnet-4-6')
  })

  test('an empty project and no workspace default leaves the connection default seam', () => {
    expect(modelForNewProjectConversation({
      workspaceDefaultModel: '  ',
      conversations: [{ id: 'hidden-mini', model: 'claude-haiku', hidden: true }],
    })).toBeUndefined()
  })

  test('a later project conversation reuses the newest visible model', () => {
    expect(modelForNewProjectConversation({
      workspaceDefaultModel: 'workspace-default',
      conversations: [
        { id: 'newer', model: 'claude-opus-4-6' },
        { id: 'older', model: 'claude-sonnet-4-6' },
        { id: 'mini', model: 'claude-haiku', hidden: true },
        { id: 'tier', model: 'fast' },
      ],
    })).toBe('claude-opus-4-6')
  })

  test('an explicit model, including a tier hint, wins over the project model', () => {
    const conversations = [{ id: 's1', model: 'claude-opus-4-6' }]
    expect(modelForNewProjectConversation({
      explicitModel: 'claude-sonnet-4-6',
      workspaceDefaultModel: 'workspace-default',
      conversations,
    })).toBe('claude-sonnet-4-6')
    expect(modelForNewProjectConversation({
      explicitModel: 'fast',
      conversations,
    })).toBe('fast')
  })

  test('a branch reuses the parent model even when a newer conversation differs', () => {
    expect(modelForNewProjectConversation({
      branchFromSessionId: 'older',
      workspaceDefaultModel: 'workspace-default',
      conversations: [
        { id: 'newer', model: 'claude-opus-4-6' },
        { id: 'older', model: 'claude-sonnet-4-6', hidden: true },
      ],
    })).toBe('claude-sonnet-4-6')
  })
})

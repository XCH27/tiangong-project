import { describe, expect, it } from 'bun:test'
import { SessionManager, resolveInitialSessionThinkingLevel } from './SessionManager.ts'
import type { LlmConnection } from '@craft-agent/shared/config'

describe('session model and connection switch guard', () => {
  it('leaves a started session untouched when another connection is requested', async () => {
    const manager = new SessionManager()
    const session = {
      id: 'model-switch-locked',
      model: 'current-model',
      llmConnection: 'original-connection',
      connectionLocked: true,
      messages: [{ id: 'already-sent' }],
      workspace: { id: 'workspace', rootPath: '/tmp/fleet-model-switch-unconfigured' },
    }
    // The guard must reject before disk writes or live-agent updates.
    ;(manager as any).sessions.set(session.id, session)
    await expect(manager.updateSessionModel(session.id, 'workspace', 'other-model', 'other-connection'))
      .rejects.toThrow('Cannot change connection after session has started')
    expect(session.model).toBe('current-model')
    expect(session.llmConnection).toBe('original-connection')
  })
})

describe('new session model effort', () => {
  const connection = {
    models: [
      { id: 'pi/no-reasoning', supportsThinking: false },
      { id: 'pi/reasoning', supportsThinking: true, reasoningEfforts: ['low', 'high'] },
    ],
  } as LlmConnection

  it('reconciles an inherited default to the selected model', () => {
    expect(resolveInitialSessionThinkingLevel('medium', 'pi/no-reasoning', connection, false)).toBe('off')
    expect(resolveInitialSessionThinkingLevel('medium', 'pi/reasoning', connection, false)).toBe('low')
  })

  it('rejects an unsupported explicit choice and preserves a supported one', () => {
    expect(() => resolveInitialSessionThinkingLevel('medium', 'pi/reasoning', connection, true))
      .toThrow('not supported')
    expect(resolveInitialSessionThinkingLevel('high', 'pi/reasoning', connection, true)).toBe('high')
  })
})

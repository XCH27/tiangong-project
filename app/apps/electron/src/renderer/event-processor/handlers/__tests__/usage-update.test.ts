import { describe, expect, it } from 'bun:test'
import { handleUsageUpdate } from '../session'
import type { SessionState, UsageUpdateEvent } from '../../types'

function makeState(): SessionState {
  return {
    session: {
      id: 'session-1',
      messages: [],
      lastMessageAt: 0,
      isProcessing: true,
      tokenUsage: {
        inputTokens: 1_000,
        outputTokens: 250,
        totalTokens: 1_250,
        contextTokens: 0,
        costUsd: 0.01,
        cacheReadTokens: 600,
        cacheCreationTokens: 100,
        contextWindow: 200_000,
      },
    } as any,
    streaming: null,
  }
}

describe('handleUsageUpdate', () => {
  it('replaces current-request cache accounting and recomputes the live total', () => {
    const event = {
      type: 'usage_update',
      sessionId: 'session-1',
      tokenUsage: {
        inputTokens: 2_000,
        cacheReadTokens: 1_400,
        cacheCreationTokens: 200,
        contextWindow: 200_000,
      },
    } as UsageUpdateEvent

    const next = handleUsageUpdate(makeState(), event)

    expect(next.state.session.tokenUsage).toMatchObject({
      inputTokens: 2_000,
      outputTokens: 250,
      totalTokens: 2_250,
      cacheReadTokens: 1_400,
      cacheCreationTokens: 200,
      contextWindow: 200_000,
    })
  })

  it('does not retain cache accounting from a previous request when the provider omits it', () => {
    const event: UsageUpdateEvent = {
      type: 'usage_update',
      sessionId: 'session-1',
      tokenUsage: {
        inputTokens: 2_000,
        contextWindow: 200_000,
      },
    }

    const next = handleUsageUpdate(makeState(), event)

    expect(next.state.session.tokenUsage?.cacheReadTokens).toBeUndefined()
    expect(next.state.session.tokenUsage?.cacheCreationTokens).toBeUndefined()
  })
})

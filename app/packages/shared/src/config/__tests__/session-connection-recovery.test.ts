import { describe, expect, it } from 'bun:test'
import {
  planSessionConnectionNormalization,
  resolveStoredSessionConnectionSlug,
} from '../llm-connections'

describe('stored session connection recovery', () => {
  const deepSeek = {
    slug: 'deepseek',
    defaultModel: 'pi/deepseek-v4-pro',
    models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
  }

  it('keeps an existing connection slug unchanged', () => {
    expect(resolveStoredSessionConnectionSlug(
      'deepseek',
      'pi/deepseek-v4-pro',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('recovers a removed generic API slug through one matching provider model', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'pi/deepseek-v4-pro',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('matches provider-facing model ids without exposing the runtime prefix', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'deepseek-v4-flash',
      [deepSeek],
    )).toBe('deepseek')
  })

  it('does not silently choose between two accounts with the same model', () => {
    expect(resolveStoredSessionConnectionSlug(
      'pi-api-key',
      'pi/deepseek-v4-pro',
      [deepSeek, { ...deepSeek, slug: 'deepseek-2' }],
    )).toBeUndefined()
  })
})

describe('planSessionConnectionNormalization (once per session)', () => {
  const deepSeek = {
    slug: 'deepseek',
    defaultModel: 'pi/deepseek-v4-pro',
    models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
  }

  it('plans a single persist when the stored slug remaps uniquely', () => {
    expect(planSessionConnectionNormalization({
      sessionId: 's1',
      model: 'pi/deepseek-v4-pro',
      llmConnection: 'pi-api-key',
      connections: [deepSeek],
      alreadyNormalized: new Set(),
    })).toEqual({
      action: 'persist',
      sessionId: 's1',
      connectionSlug: 'deepseek',
      model: 'pi/deepseek-v4-pro',
    })
  })

  it('does not plan a second write for a session already normalized this process', () => {
    expect(planSessionConnectionNormalization({
      sessionId: 's1',
      model: 'pi/deepseek-v4-pro',
      llmConnection: 'pi-api-key',
      connections: [deepSeek],
      alreadyNormalized: new Set(['s1']),
    })).toEqual({ action: 'none' })
  })

  it('does not plan a write when two ChatPage mounts would have raced (same resolved slug)', () => {
    // Already remapped in store — main chat + side-task must not both write.
    expect(planSessionConnectionNormalization({
      sessionId: 's1',
      model: 'pi/deepseek-v4-pro',
      llmConnection: 'deepseek',
      connections: [deepSeek],
      alreadyNormalized: new Set(),
    })).toEqual({ action: 'none' })
  })
})

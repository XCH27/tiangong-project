import { describe, expect, it } from 'bun:test'
import { resolveClaudeThinkingOptions } from '../claude-agent.ts'
import { getThinkingTokens } from '../thinking-levels.ts'

describe('resolveClaudeThinkingOptions', () => {
  it('applies effort without adaptive thinking when the model reports no thinking', () => {
    expect(resolveClaudeThinkingOptions({
      thinkingLevel: 'high', model: 'claude-opus-4-8', providerType: 'anthropic',
      minimizeThinking: false, supportsThinking: false, reasoningEfforts: ['low', 'high'],
    })).toEqual({ effort: 'high' });
  })

  it('does not send effort to a model that advertises neither thinking nor effort', () => {
    expect(resolveClaudeThinkingOptions({
      thinkingLevel: 'medium', model: 'claude-opus-4-8', providerType: 'anthropic',
      minimizeThinking: false, supportsThinking: false,
    })).toEqual({});
  })

  it('uses adaptive thinking for true Anthropic backends', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'medium',
      model: 'claude-opus-4-7',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'medium',
    })
  })

  it('uses token budgets for Haiku on true Anthropic backends', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'high',
      model: 'claude-haiku-4-5-20251001',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      maxThinkingTokens: 6_000,
    })
  })

  it('uses an advertised adaptive thinking type even for a future Haiku model', () => {
    expect(resolveClaudeThinkingOptions({
      thinkingLevel: 'high', model: 'claude-haiku-5', providerType: 'anthropic',
      minimizeThinking: false, supportsThinking: true, adaptiveThinkingSupported: true,
      reasoningEfforts: ['low', 'medium', 'high'],
    })).toEqual({ thinking: { type: 'adaptive' }, effort: 'high' })
  })

  it('uses manual thinking when the provider explicitly rejects adaptive thinking', () => {
    expect(resolveClaudeThinkingOptions({
      thinkingLevel: 'medium', model: 'claude-sonnet-4-5-20250929', providerType: 'anthropic',
      minimizeThinking: false, supportsThinking: true, adaptiveThinkingSupported: false,
    })).toEqual({ maxThinkingTokens: 10_000 })
  })

  it('uses correct max budget for Haiku', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'max',
      model: 'claude-haiku-4-5-20251001',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      maxThinkingTokens: 8_000,
    })
  })

  it('disables thinking for Haiku when level is off', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'off',
      model: 'claude-haiku-4-5-20251001',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      maxThinkingTokens: 0,
    })
  })

  it('disables thinking entirely when level is off on adaptive backends', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'off',
      model: 'claude-sonnet-4-6',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'disabled' },
    })
  })

  it('passes xhigh as effort on adaptive backends (Opus 4.7+)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'xhigh',
      model: 'claude-opus-4-7',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'xhigh',
    })
  })

  it('uses xhigh token budget on Haiku (non-adaptive)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'xhigh',
      model: 'claude-haiku-4-5-20251001',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      maxThinkingTokens: 7_000,
    })
  })

  // --- Mythos-class models (Fable 5): adaptive thinking always on -----------
  // These reject `thinking: { type: 'disabled' }`, so the "off"/minimize case
  // must fall back to adaptive + lowest effort instead of disabling.

  it('uses adaptive thinking + effort for Fable 5 (normal level)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'high',
      model: 'claude-fable-5',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'high',
    })
  })

  it('never disables thinking on Fable 5 when level is off (adaptive + low instead)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'off',
      model: 'claude-fable-5',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'low',
    })
  })

  it('never disables thinking on Fable 5 when minimizeThinking is set', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'medium',
      model: 'claude-fable-5',
      providerType: 'anthropic',
      minimizeThinking: true,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'low',
    })
  })

  it('treats Fable 5.1 as Mythos-class too (adaptive + low when level is off)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'off',
      model: 'claude-fable-5-1',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'adaptive' },
      effort: 'low',
    })
  })

  it('still disables thinking on Opus 4.8 when level is off (unchanged for non-Mythos models)', () => {
    const result = resolveClaudeThinkingOptions({
      thinkingLevel: 'off',
      model: 'claude-opus-4-8',
      providerType: 'anthropic',
      minimizeThinking: false,
    })

    expect(result).toEqual({
      thinking: { type: 'disabled' },
    })
  })

  it('keeps Opus 5.5 adaptive when an old session requests off', () => {
    expect(resolveClaudeThinkingOptions({
      thinkingLevel: 'off', model: 'claude-opus-5-5', providerType: 'anthropic',
      minimizeThinking: false,
    })).toEqual({ thinking: { type: 'adaptive' }, effort: 'low' })
  })
})

describe('getThinkingTokens', () => {
  it('returns the default (non-haiku) xhigh budget', () => {
    // Any non-haiku model id — provider routing happens elsewhere.
    expect(getThinkingTokens('xhigh', 'claude-sonnet-4-6')).toBe(26_000)
  })

  it('returns the haiku xhigh budget', () => {
    expect(getThinkingTokens('xhigh', 'claude-haiku-4-5-20251001')).toBe(7_000)
  })
})

/**
 * Pure-helper coverage for the model-picker. The helpers are tiny but they
 * back both the desktop dropdown and the compact (drawer) selector — pinning
 * the behavior here so future refactors of the picker can't quietly diverge
 * the two surfaces.
 */

import { describe, test, expect } from 'bun:test'
import type { LlmConnectionWithStatus } from '@craft-agent/shared/config/llm-connections'
import {
  buildCliRuntimeModelPickerGroups,
  buildModelPickerGroups,
  filterModelPickerGroups,
  formatTokenCount,
  stripPiPrefixForDisplay,
} from '../model-picker-helpers'

// -----------------------------------------------------------------------------
// stripPiPrefixForDisplay
// -----------------------------------------------------------------------------

describe('stripPiPrefixForDisplay', () => {
  test('strips the "pi/" prefix when present', () => {
    expect(stripPiPrefixForDisplay('pi/claude-opus-4-7')).toBe(
      'claude-opus-4-7',
    )
  })

  test('returns input unchanged when prefix is absent', () => {
    expect(stripPiPrefixForDisplay('claude-opus-4-7')).toBe('claude-opus-4-7')
  })

  test('does NOT strip "pi:" (legacy other-form prefix)', () => {
    // The prefix is "pi/" — the alternative "pi:" form is intentionally not
    // collapsed because some IDs use a colon for unrelated purposes.
    expect(stripPiPrefixForDisplay('pi:claude-opus-4-7')).toBe(
      'pi:claude-opus-4-7',
    )
  })

  test('only strips at the start, not mid-string', () => {
    expect(stripPiPrefixForDisplay('foo-pi/bar')).toBe('foo-pi/bar')
  })

  test('handles empty string', () => {
    expect(stripPiPrefixForDisplay('')).toBe('')
  })
})

// -----------------------------------------------------------------------------
// formatTokenCount
// -----------------------------------------------------------------------------

describe('formatTokenCount', () => {
  test('renders zero as "0"', () => {
    expect(formatTokenCount(0)).toBe('0')
  })

  test('renders < 1k literally', () => {
    expect(formatTokenCount(42)).toBe('42')
    expect(formatTokenCount(999)).toBe('999')
  })

  test('renders 1k..<10k with one decimal', () => {
    expect(formatTokenCount(1000)).toBe('1.0k')
    expect(formatTokenCount(1500)).toBe('1.5k')
    expect(formatTokenCount(9999)).toBe('10.0k')
  })

  test('renders ≥ 10k as whole-k', () => {
    expect(formatTokenCount(10_000)).toBe('10k')
    expect(formatTokenCount(200_000)).toBe('200k')
    expect(formatTokenCount(999_999)).toBe('1000k')
  })

  test('renders ≥ 1M with one decimal', () => {
    expect(formatTokenCount(1_000_000)).toBe('1.0M')
    expect(formatTokenCount(1_500_000)).toBe('1.5M')
    expect(formatTokenCount(12_345_678)).toBe('12.3M')
  })
})

// -----------------------------------------------------------------------------
// shared provider/model projection
// -----------------------------------------------------------------------------

function conn(
  slug: string,
  providerType: LlmConnectionWithStatus['providerType'],
  extras: Partial<LlmConnectionWithStatus> = {},
): LlmConnectionWithStatus {
  return {
    slug,
    name: slug,
    providerType,
    authType: 'api_key',
    createdAt: 0,
    isAuthenticated: true,
    isDefault: false,
    ...extras,
  }
}

describe('buildModelPickerGroups', () => {
  test('projects only authenticated connections and sorts the default first', () => {
    const inactive = conn('inactive', 'anthropic', { isAuthenticated: false })
    const regular = conn('regular', 'pi', {
      piAuthProvider: 'deepseek',
      models: ['deepseek-v3'],
    })
    const preferred = conn('preferred', 'pi', {
      isDefault: true,
      piAuthProvider: 'openai',
      models: ['gpt-5'],
    })
    const result = buildModelPickerGroups([regular, inactive, preferred])
    expect(result.map((group) => group.connection.slug)).toEqual([
      'preferred',
      'regular',
    ])
    expect(result.map((group) => group.providerLabel)).toEqual([
      'OpenAI',
      'DeepSeek',
    ])
  })

  test('filters by provider, account name, model name, or model id', () => {
    const groups = buildModelPickerGroups([
      conn('work-account', 'pi', {
        name: 'Work account',
        piAuthProvider: 'openai',
        models: ['gpt-5-codex'],
      }),
    ])
    expect(filterModelPickerGroups(groups, 'openai')).toHaveLength(1)
    expect(filterModelPickerGroups(groups, 'work account')).toHaveLength(1)
    expect(filterModelPickerGroups(groups, 'codex')).toHaveLength(1)
    expect(filterModelPickerGroups(groups, 'missing')).toEqual([])
  })

  test('does not project Anthropic models into a compat provider without an explicit list', () => {
    const groups = buildModelPickerGroups([
      conn('custom-api', 'pi_compat', {
        defaultModel: 'company-model-v2',
      }),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.items.map((item) => item.modelId)).toEqual([
      'company-model-v2',
    ])
  })

  test('rehydrates first-party string model ids with their capability metadata', () => {
    const groups = buildModelPickerGroups([
      conn('anthropic-account', 'anthropic', {
        models: ['claude-opus-4-8'],
      }),
    ])

    const model = groups[0]?.items[0]?.model
    expect(typeof model).not.toBe('string')
    expect(typeof model === 'string' ? undefined : model?.supportedReasoningEfforts)
      .toContain('high')
    expect(typeof model === 'string' ? undefined : model?.supportsFastMode).toBe(true)
  })
})

describe('buildCliRuntimeModelPickerGroups', () => {
  test('projects handshake metadata into the shared picker without persisting a provider connection', () => {
    const groups = buildCliRuntimeModelPickerGroups([
      {
        id: 'codex',
        name: 'Codex',
        version: 'codex-cli 1.0',
        status: 'ready',
        checkedAt: 42,
        models: [
          {
            id: 'gpt-test',
            name: 'GPT Test',
            contextWindow: 400_000,
            supportedReasoningEfforts: ['low', 'high'],
            inputModalities: ['text', 'image'],
          },
        ],
      },
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0]?.providerLabel).toBe('Codex')
    expect(groups[0]?.sourceKind).toBe('cli')
    expect(groups[0]?.connection.slug).toBe('cli:codex')
    expect(groups[0]?.items[0]?.modelId).toBe('gpt-test')
    const model = groups[0]?.items[0]?.model
    expect(typeof model === 'string' ? undefined : model?.contextWindow).toBe(
      400_000,
    )
    expect(
      typeof model === 'string'
        ? undefined
        : model?.supportedReasoningEfforts,
    ).toEqual(['low', 'high'])
    expect(typeof model === 'string' ? undefined : model?.supportsImages).toBe(
      true,
    )
  })
})

/**
 * Pure-helper coverage for the model-picker. The helpers are tiny but they
 * back both the desktop dropdown and the compact (drawer) selector — pinning
 * the behavior here so future refactors of the picker can't quietly diverge
 * the two surfaces.
 */

import { describe, test, it, expect } from 'bun:test'
import { getConnectionDisplayName } from '@/lib/connection-labels'
import type { LlmConnectionWithStatus } from '@craft-agent/shared/config/llm-connections'
import {
  formatTokenCount,
  getModelPickerGroups,
  stripPiPrefixForDisplay,
} from '../model-picker-helpers'

// -----------------------------------------------------------------------------
// stripPiPrefixForDisplay
// -----------------------------------------------------------------------------

describe('stripPiPrefixForDisplay', () => {
  test('strips the "pi/" prefix when present', () => {
    expect(stripPiPrefixForDisplay('pi/claude-opus-4-7')).toBe('claude-opus-4-7')
  })

  test('returns input unchanged when prefix is absent', () => {
    expect(stripPiPrefixForDisplay('claude-opus-4-7')).toBe('claude-opus-4-7')
  })

  test('does NOT strip "pi:" (legacy other-form prefix)', () => {
    // The prefix is "pi/" — the alternative "pi:" form is intentionally not
    // collapsed because some IDs use a colon for unrelated purposes.
    expect(stripPiPrefixForDisplay('pi:claude-opus-4-7')).toBe('pi:claude-opus-4-7')
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

// Sources are account identities, even when their models have the same wire ID.
function conn(slug: string, extras: Partial<LlmConnectionWithStatus> = {}): LlmConnectionWithStatus {
  return { slug, name: slug, providerType: 'pi', piAuthProvider: 'deepseek',
    authType: 'api_key', createdAt: 0, isAuthenticated: true, models: ['pi/shared'], ...extras }
}

describe('getModelPickerGroups', () => {
  it('preserves separate accounts and provider order, including identical model IDs', () => {
    const sources = [conn('deepseek-1'), conn('openai', { piAuthProvider: 'openai' }), conn('deepseek-2')]
    const groups = getModelPickerGroups(sources, 'deepseek-1', true)
    expect(groups.map(group => group.connection.slug)).toEqual(['deepseek-1', 'openai', 'deepseek-2'])
    expect(groups.map(group => group.models)).toEqual([['pi/shared'], ['pi/shared'], ['pi/shared']])
  })
  it('respects hidden models for object and string catalog entries', () => {
    const source = conn('a', { models: ['hidden', { id: 'also-hidden', name: 'Hidden', shortName: 'Hidden', description: '', provider: 'pi' }, 'visible'], hiddenModelIds: ['hidden', 'also-hidden'] })
    expect(getModelPickerGroups([source], 'a', true)[0].models).toEqual(['visible'])
  })
  it('never substitutes another provider catalog for an empty or missing list', () => {
    expect(getModelPickerGroups([conn('a', { models: undefined })], 'a', true)[0].models).toEqual([])
  })
  it('respects the server connection lock after a session starts', () => {
    expect(getModelPickerGroups([conn('a'), conn('b', {providerType: 'anthropic'})], 'b', false).map(group => group.connection.slug)).toEqual(['b'])
    expect(getModelPickerGroups([conn('a')], 'deleted', false)).toEqual([])
  })
  it('allows started Pi sessions to select another Pi account or custom endpoint', () => {
    const sources = [conn('a'), conn('b'), conn('custom', { providerType: 'pi_compat' }), conn('claude', { providerType: 'anthropic' })]
    expect(getModelPickerGroups(sources, 'a', false).map(group => group.connection.slug)).toEqual(['a', 'b', 'custom'])
  })
  it('retains unauthenticated sources so the picker can explain why they cannot be selected', () => {
    expect(getModelPickerGroups([conn('a', { isAuthenticated: false })], 'a', true)[0].connection.isAuthenticated).toBe(false)
  })
})

describe('shared connection labels', () => {
  it('shows provider and stable account numbers for inherited runtime labels', () => {
    const a = conn('a', { name: 'Craft Agents Backend (deepseek)', createdAt: 1 })
    const b = conn('b', { name: 'Craft Agents Backend (deepseek) 2', createdAt: 2 })
    expect(getConnectionDisplayName(a, [b, a])).toBe('DeepSeek')
    expect(getConnectionDisplayName(b, [b, a])).toBe('DeepSeek 2')
  })
  it('keeps a user-defined alias unchanged', () => {
    const custom = conn('a', { name: 'Research account' })
    expect(getConnectionDisplayName(custom, [custom])).toBe('Research account')
  })
  it('keeps all sources reachable when the default custom connection has one model', () => {
    const sources = [conn('local', { providerType: 'pi_compat' }), conn('cloud')]
    expect(getModelPickerGroups(sources, 'local', true)).toHaveLength(2)
  })
})

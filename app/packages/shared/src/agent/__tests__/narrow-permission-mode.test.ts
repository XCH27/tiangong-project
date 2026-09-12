import { describe, expect, it } from 'bun:test'
import { narrowPermissionMode, type PermissionMode } from '../mode-types'

/**
 * "Permission in a loadout is a request, never a grant" (docs/03-NON-NEGOTIABLES.md).
 * A delegate or spawned session may only ever be narrower than its parent.
 */
describe('narrowPermissionMode', () => {
  it('inherits the parent when nothing is requested', () => {
    expect(narrowPermissionMode('ask', undefined)).toBe('ask')
    expect(narrowPermissionMode('safe', undefined)).toBe('safe')
    expect(narrowPermissionMode('allow-all', undefined)).toBe('allow-all')
  })

  it('never widens the parent', () => {
    expect(narrowPermissionMode('ask', 'allow-all')).toBe('ask')
    expect(narrowPermissionMode('safe', 'allow-all')).toBe('safe')
    expect(narrowPermissionMode('safe', 'ask')).toBe('safe')
  })

  it('honours a narrower request', () => {
    expect(narrowPermissionMode('allow-all', 'ask')).toBe('ask')
    expect(narrowPermissionMode('allow-all', 'safe')).toBe('safe')
    expect(narrowPermissionMode('ask', 'safe')).toBe('safe')
  })

  it('falls back when one side is unknown', () => {
    expect(narrowPermissionMode(undefined, 'allow-all')).toBe('allow-all')
    expect(narrowPermissionMode(undefined, undefined)).toBeUndefined()
  })

  it('is idempotent on equal modes', () => {
    for (const mode of ['safe', 'ask', 'allow-all'] as PermissionMode[]) {
      expect(narrowPermissionMode(mode, mode)).toBe(mode)
    }
  })
})

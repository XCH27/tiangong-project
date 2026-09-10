import { describe, expect, it } from 'bun:test'
import {
  buildSessionOptionCommands,
  defaultSessionOptions,
  mergeSessionOptions,
  rollbackSessionOptionUpdates,
  type SessionOptions,
} from '../useSessionOptions'

describe('buildSessionOptionCommands', () => {
  it('emits independent commands without coupling (no waterfall)', () => {
    const commands = buildSessionOptionCommands(defaultSessionOptions, {
      permissionMode: 'allow-all',
      thinkingLevel: 'high',
      fastMode: true,
      executionPermissionMode: 'allow-all',
    })
    expect(commands.map((c) => c.type).sort()).toEqual([
      'setExecutionPermissionMode',
      'setFastMode',
      'setPermissionMode',
      'setThinkingLevel',
    ])
  })

  it('emits setRuntimeMode independently of fast mode', () => {
    const commands = buildSessionOptionCommands(defaultSessionOptions, {
      runtimeMode: 'pro',
    })
    expect(commands).toEqual([{ type: 'setRuntimeMode', mode: 'pro' }])
  })

  it('fills work mode selection from previous when only mode is updated', () => {
    const previous: SessionOptions = {
      ...defaultSessionOptions,
      workModeSelection: 'manual',
      workMode: 'explore',
    }
    const commands = buildSessionOptionCommands(previous, { workMode: 'execute' })
    expect(commands).toEqual([
      { type: 'setWorkMode', selection: 'manual', mode: 'execute' },
    ])
  })
})

describe('rollbackSessionOptionUpdates', () => {
  it('rolls back only keys that still hold the attempted optimistic value', () => {
    const previous = defaultSessionOptions
    const attempted = { permissionMode: 'allow-all' as const, fastMode: true }
    const latest = mergeSessionOptions(previous, {
      ...attempted,
      // Concurrent edit after optimistic apply — must not be wiped.
      thinkingLevel: 'high',
    })
    const rolled = rollbackSessionOptionUpdates(latest, previous, attempted)
    expect(rolled.permissionMode).toBe(previous.permissionMode)
    expect(rolled.fastMode).toBe(previous.fastMode)
    expect(rolled.thinkingLevel).toBe('high')
  })

  it('does not roll back a key the user already changed again', () => {
    const previous = defaultSessionOptions
    const attempted = { permissionMode: 'allow-all' as const }
    // User flipped again to 'safe' before the failed request returned.
    const latest = mergeSessionOptions(previous, { permissionMode: 'safe' })
    const rolled = rollbackSessionOptionUpdates(latest, previous, attempted)
    expect(rolled.permissionMode).toBe('safe')
  })
})

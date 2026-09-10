import { describe, expect, it, mock } from 'bun:test'
import {
  applySessionOptionUpdates,
  runSessionOptionChange,
} from '../session-options-sync'
import {
  defaultSessionOptions,
  mergeSessionOptions,
  type SessionOptions,
  type SessionOptionUpdates,
} from '../useSessionOptions'

describe('applySessionOptionUpdates (production boundary)', () => {
  it('awaits backend commands and rolls back only rejected keys after a real failure', async () => {
    let current: SessionOptions = defaultSessionOptions
    const previous = current
    const updates: SessionOptionUpdates = {
      permissionMode: 'allow-all',
      thinkingLevel: 'high',
      fastMode: true,
    }
    current = mergeSessionOptions(previous, updates)

    const sessionCommand = mock(async (_id: string, command: { type: string }) => {
      if (command.type === 'setFastMode') {
        throw new Error('fast mode refused')
      }
    })

    const failures: string[] = []
    const result = await applySessionOptionUpdates({
      sessionId: 's1',
      previous,
      updates,
      optimistic: current,
      sessionCommand,
      getLatest: () => current,
      setOptions: (next) => {
        current = next
      },
      onFailure: (message) => {
        failures.push(message)
      },
    })

    expect(sessionCommand).toHaveBeenCalledTimes(3)
    expect(result.ok).toBe(false)
    expect(result.failedCommands).toEqual(['setFastMode'])
    expect(current.permissionMode).toBe('allow-all')
    expect(current.thinkingLevel).toBe('high')
    expect(current.fastMode).toBe(false)
    expect(failures.length).toBe(1)
    expect(failures[0]).toContain('fast mode refused')
  })

  it('does not roll back a key the user already changed after the optimistic write', async () => {
    let current: SessionOptions = mergeSessionOptions(defaultSessionOptions, {
      permissionMode: 'allow-all',
    })
    const previous = defaultSessionOptions
    const updates: SessionOptionUpdates = { permissionMode: 'allow-all' }
    current = mergeSessionOptions(current, { permissionMode: 'safe' })

    await applySessionOptionUpdates({
      sessionId: 's1',
      previous,
      updates,
      optimistic: mergeSessionOptions(previous, updates),
      sessionCommand: async () => {
        throw new Error('backend down')
      },
      getLatest: () => current,
      setOptions: (next) => {
        current = next
      },
      onFailure: () => {},
    })

    expect(current.permissionMode).toBe('safe')
  })
})

describe('runSessionOptionChange (ref-sync production path)', () => {
  it('rapid successive updates to different keys never lose the first optimistic write', async () => {
    // Simulates sessionOptionsRef: setMap updates the same map getMap reads.
    let map = new Map<string, SessionOptions>()
    const getMap = () => map
    const setMap = (next: Map<string, SessionOptions>) => {
      map = next
    }

    let releaseFirst!: () => void
    let firstEntered!: () => void
    const firstCommandEntered = new Promise<void>((r) => {
      firstEntered = r
    })

    const sessionCommand = mock(async (_id: string, command: { type: string }) => {
      if (command.type === 'setPermissionMode') {
        firstEntered()
        await new Promise<void>((r) => {
          releaseFirst = r
        })
      }
      // thinkingLevel resolves immediately
    })

    // First gesture: permissionMode (blocks in flight).
    const p1 = runSessionOptionChange({
      sessionId: 's1',
      updates: { permissionMode: 'allow-all' },
      getMap,
      setMap,
      sessionCommand,
      onFailure: () => {},
    })

    await firstCommandEntered
    // Second gesture before first paint/effect — must see optimistic permissionMode.
    const p2 = runSessionOptionChange({
      sessionId: 's1',
      updates: { thinkingLevel: 'high' },
      getMap,
      setMap,
      sessionCommand,
      onFailure: () => {},
    })

    // Map already holds both optimistic values before either finishes.
    const mid = map.get('s1')
    expect(mid?.permissionMode).toBe('allow-all')
    expect(mid?.thinkingLevel).toBe('high')

    releaseFirst()
    await Promise.all([p1, p2])

    const final = map.get('s1')
    expect(final?.permissionMode).toBe('allow-all')
    expect(final?.thinkingLevel).toBe('high')
  })

  it('failed command rolls back only its key; concurrent successful key stays', async () => {
    let map = new Map<string, SessionOptions>()
    const getMap = () => map
    const setMap = (next: Map<string, SessionOptions>) => {
      map = next
    }

    await runSessionOptionChange({
      sessionId: 's1',
      updates: { permissionMode: 'allow-all', fastMode: true },
      getMap,
      setMap,
      sessionCommand: async (_id, command) => {
        if (command.type === 'setFastMode') throw new Error('refused')
      },
      onFailure: () => {},
    })

    const final = map.get('s1')
    expect(final?.permissionMode).toBe('allow-all')
    expect(final?.fastMode).toBe(false)
  })
})

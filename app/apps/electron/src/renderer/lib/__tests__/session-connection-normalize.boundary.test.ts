import { describe, expect, it, mock } from 'bun:test'
import { normalizeSessionConnectionsOnce } from '../session-connection-normalize'

const deepSeek = {
  slug: 'deepseek',
  defaultModel: 'pi/deepseek-v4-pro',
  models: ['pi/deepseek-v4-pro', 'pi/deepseek-v4-flash'],
}

const session = {
  id: 's1',
  model: 'pi/deepseek-v4-pro',
  llmConnection: 'pi-api-key',
  workspaceId: 'ws1',
}

describe('normalizeSessionConnectionsOnce production boundary', () => {
  it('concurrent Promise.all with deferred write: only one setSessionModel', async () => {
    const alreadyNormalized = new Set<string>()
    const inFlight = new Map<string, Promise<void>>()
    let releaseWrite!: () => void
    let resolveEntered!: () => void
    const writeEntered = new Promise<void>((r) => {
      resolveEntered = r
    })
    let calls = 0
    const setSessionModel = mock(async () => {
      calls += 1
      resolveEntered()
      await new Promise<void>((r) => {
        releaseWrite = r
      })
    })

    const args = {
      sessions: [session],
      connections: [deepSeek],
      alreadyNormalized,
      inFlight,
      windowWorkspaceId: 'ws1' as string | null,
      setSessionModel,
    }

    // True concurrency: both entry points (session load + connection refresh).
    const concurrent = Promise.all([
      normalizeSessionConnectionsOnce(args),
      normalizeSessionConnectionsOnce(args),
    ])

    await writeEntered
    expect(calls).toBe(1)
    expect(inFlight.has('s1')).toBe(true)

    releaseWrite()
    const [a, b] = await concurrent
    expect(calls).toBe(1)
    expect(a.persisted + b.persisted).toBe(1)
    expect(a.joinedInFlight + b.joinedInFlight).toBe(1)
    expect(alreadyNormalized.has('s1')).toBe(true)
    expect(inFlight.has('s1')).toBe(false)
  })

  it('releases in-flight on failure so the next call can retry', async () => {
    const alreadyNormalized = new Set<string>()
    const inFlight = new Map<string, Promise<void>>()
    let attempts = 0
    const failures: string[] = []

    await normalizeSessionConnectionsOnce({
      sessions: [session],
      connections: [deepSeek],
      alreadyNormalized,
      inFlight,
      windowWorkspaceId: 'ws1',
      setSessionModel: async () => {
        attempts += 1
        throw new Error('disk full')
      },
      onFailure: (m) => {
        failures.push(m)
      },
    })
    expect(attempts).toBe(1)
    expect(alreadyNormalized.has('s1')).toBe(false)
    expect(inFlight.has('s1')).toBe(false)
    expect(failures).toEqual(['disk full'])

    await normalizeSessionConnectionsOnce({
      sessions: [session],
      connections: [deepSeek],
      alreadyNormalized,
      inFlight,
      windowWorkspaceId: 'ws1',
      setSessionModel: async () => {
        attempts += 1
      },
    })
    expect(attempts).toBe(2)
    expect(alreadyNormalized.has('s1')).toBe(true)
  })

  it('does not mark when workspaceId is missing (retryable later)', async () => {
    const alreadyNormalized = new Set<string>()
    const inFlight = new Map<string, Promise<void>>()
    const setSessionModel = mock(async () => {})
    const result = await normalizeSessionConnectionsOnce({
      sessions: [{
        id: 's1',
        model: 'pi/deepseek-v4-pro',
        llmConnection: 'pi-api-key',
      }],
      connections: [deepSeek],
      alreadyNormalized,
      inFlight,
      windowWorkspaceId: null,
      setSessionModel,
    })
    expect(setSessionModel).not.toHaveBeenCalled()
    expect(alreadyNormalized.has('s1')).toBe(false)
    expect(result.deferred).toBe(1)
  })

  it('ChatPage is not the writer; App wires this boundary with inFlight', async () => {
    const chatPage = await Bun.file(
      new URL('../../pages/ChatPage.tsx', import.meta.url),
    ).text()
    const mountWrites = [
      ...chatPage.matchAll(/React\.useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[[^\]]*\]\)/g),
    ].filter((m) => m[1]?.includes('setSessionModel'))
    expect(mountWrites).toEqual([])

    const appSource = await Bun.file(
      new URL('../../App.tsx', import.meta.url),
    ).text()
    expect(appSource).toContain('runNormalizeSessionConnections')
    expect(appSource).toContain('connectionNormalizeInFlightRef')
    expect(appSource).toContain('inFlight:')
  })
})

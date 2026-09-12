import { describe, test, expect } from 'bun:test'
import { getAllChannelValues, RPC_CHANNELS } from '../channels'
import {
  LOCAL_ONLY_CHANNELS,
  REMOTE_ELIGIBLE_CHANNELS,
  isRemoteAllowed,
  isRemoteEligible,
  remoteRefusalFor,
} from '../routing'

describe('channel routing exhaustiveness', () => {
  const all = getAllChannelValues()

  test('every channel is classified exactly once', () => {
    for (const ch of all) {
      const inLocal = LOCAL_ONLY_CHANNELS.has(ch)
      const inRemote = REMOTE_ELIGIBLE_CHANNELS.has(ch)

      if (!inLocal && !inRemote) {
        throw new Error(`Channel "${ch}" is not classified in LOCAL_ONLY or REMOTE_ELIGIBLE. Add it to one set in routing.ts.`)
      }
      if (inLocal && inRemote) {
        throw new Error(`Channel "${ch}" is in BOTH LOCAL_ONLY and REMOTE_ELIGIBLE. It must be in exactly one.`)
      }
    }
  })

  test('no extra channels in LOCAL_ONLY', () => {
    for (const ch of LOCAL_ONLY_CHANNELS) {
      expect(all).toContain(ch)
    }
  })

  test('no extra channels in REMOTE_ELIGIBLE', () => {
    for (const ch of REMOTE_ELIGIBLE_CHANNELS) {
      expect(all).toContain(ch)
    }
  })

  test('sets are non-empty', () => {
    expect(LOCAL_ONLY_CHANNELS.size).toBeGreaterThan(0)
    expect(REMOTE_ELIGIBLE_CHANNELS.size).toBeGreaterThan(0)
  })

  test('total classified equals total channels', () => {
    expect(LOCAL_ONLY_CHANNELS.size + REMOTE_ELIGIBLE_CHANNELS.size).toBe(all.length)
  })
})

describe('channel routing behavior', () => {
  test('LOCAL_ONLY and REMOTE_ELIGIBLE have zero intersection', () => {
    const intersection: string[] = []
    for (const ch of LOCAL_ONLY_CHANNELS) {
      if (REMOTE_ELIGIBLE_CHANNELS.has(ch)) {
        intersection.push(ch)
      }
    }
    expect(intersection).toEqual([])
  })

  test('all server:* channels are REMOTE_ELIGIBLE', () => {
    const serverChannels = Object.values(RPC_CHANNELS.server)
    expect(serverChannels.length).toBeGreaterThan(0)

    for (const ch of serverChannels) {
      expect(REMOTE_ELIGIBLE_CHANNELS.has(ch)).toBe(true)
    }
  })

  test('no LOCAL_ONLY channel starts with server:', () => {
    for (const ch of LOCAL_ONLY_CHANNELS) {
      if (ch.startsWith('server:')) {
        throw new Error(`server:* channel "${ch}" must be REMOTE_ELIGIBLE, not LOCAL_ONLY`)
      }
    }
  })
})

describe('remote admission is default-deny', () => {
  test('admits only what the allow-list names', () => {
    expect(isRemoteAllowed(RPC_CHANNELS.sessions.CREATE)).toBe(isRemoteEligible(RPC_CHANNELS.sessions.CREATE))
    expect(isRemoteAllowed(RPC_CHANNELS.remote.CLAIM_DEVICE_TOKEN)).toBe(true)
  })

  test('refuses a channel nobody classified, rather than exposing it', () => {
    // The shape a forgotten classification takes: present on the wire, in neither set.
    expect(isRemoteAllowed('someNewDomain:doThing')).toBe(false)
    expect(remoteRefusalFor('someNewDomain:doThing')).toBe('NOT_ADMITTED')
  })

  test('distinguishes local-only from never-admitted so a failure can be explained', () => {
    expect(remoteRefusalFor(RPC_CHANNELS.remote.CREATE_INVITE)).toBe('LOCAL_ONLY')
    expect(remoteRefusalFor(RPC_CHANNELS.window.CLOSE)).toBe('LOCAL_ONLY')
    expect(remoteRefusalFor('unknown:channel')).toBe('NOT_ADMITTED')
  })

  test('admits nothing that is also local-only', () => {
    for (const channel of LOCAL_ONLY_CHANNELS) {
      expect(isRemoteAllowed(channel)).toBe(false)
      expect(remoteRefusalFor(channel)).toBe('LOCAL_ONLY')
    }
  })

  test('every admitted channel passes the dispatch check', () => {
    for (const channel of REMOTE_ELIGIBLE_CHANNELS) {
      expect(remoteRefusalFor(channel)).toBeNull()
    }
  })
})

import { describe, expect, it } from 'bun:test'
import {
  buildRunTargets,
  defaultWorkspaceFor,
  endpointHost,
  targetActiveSessions,
  type RunTargetWorkspaceInput,
} from '../run-targets'

const localName = 'This computer'

function ws(
  id: string,
  name: string,
  remote?: { url: string; remoteWorkspaceId: string; deviceId?: string; deviceName?: string },
): RunTargetWorkspaceInput {
  return remote ? { id, name, remoteServer: remote } : { id, name }
}

describe('run targets group Workspaces by the computer they run on', () => {
  it('always puts this computer first, even with no local Workspace', () => {
    const targets = buildRunTargets([], { localName })
    expect(targets).toHaveLength(1)
    expect(targets[0]).toMatchObject({ kind: 'local', key: 'local', name: localName, workspaces: [] })
  })

  it('three projects on one remote machine are one device, not three', () => {
    const remote = { url: 'ws://10.0.0.5:9100', deviceId: 'host-a', deviceName: 'Studio Mac' }
    const targets = buildRunTargets([
      ws('l1', 'Local project'),
      ws('r1', 'Alpha', { ...remote, remoteWorkspaceId: 'ra1' }),
      ws('r2', 'Beta', { ...remote, remoteWorkspaceId: 'ra2' }),
      ws('r3', 'Gamma', { ...remote, remoteWorkspaceId: 'ra3' }),
    ], { localName })

    expect(targets).toHaveLength(2)
    expect(targets[0]!.workspaces.map(w => w.name)).toEqual(['Local project'])
    expect(targets[1]).toMatchObject({ kind: 'remote', deviceId: 'host-a', name: 'Studio Mac' })
    expect(targets[1]!.workspaces.map(w => w.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  it('keeps two different machines apart even on the same port', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio' }),
      ws('r2', 'B', { url: 'ws://10.0.0.6:9100', remoteWorkspaceId: 'rb', deviceId: 'host-b', deviceName: 'VPS' }),
    ], { localName })
    expect(targets.map(t => t.name)).toEqual([localName, 'Studio', 'VPS'])
  })

  it('a pre-device record groups by endpoint host and is still recognisable', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra' }),
      ws('r2', 'B', { url: 'WS://10.0.0.5:9100/', remoteWorkspaceId: 'rb' }),
    ], { localName })
    expect(targets).toHaveLength(2)
    expect(targets[1]).toMatchObject({ deviceId: null, key: 'host:10.0.0.5:9100', name: '10.0.0.5:9100' })
    expect(targets[1]!.workspaces).toHaveLength(2)
  })

  it('does not merge a pre-device record into a device that has an id', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio' }),
      ws('r2', 'B', { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'rb' }),
    ], { localName })
    expect(targets).toHaveLength(3)
  })

  it('remote devices are listed by name, local stays pinned first', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://a:1', remoteWorkspaceId: 'ra', deviceId: 'z', deviceName: 'Zeta' }),
      ws('r2', 'B', { url: 'ws://b:1', remoteWorkspaceId: 'rb', deviceId: 'a', deviceName: 'Alpha' }),
    ], { localName })
    expect(targets.map(t => t.name)).toEqual([localName, 'Alpha', 'Zeta'])
  })

  it('carries liveness and live session counts when something has asked', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://a:1', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio' }),
      ws('r2', 'B', { url: 'ws://a:1', remoteWorkspaceId: 'rb', deviceId: 'host-a', deviceName: 'Studio' }),
    ], { localName, online: { 'host-a': true }, activeSessions: { ra: 2, rb: 1 } })
    expect(targets[1]!.online).toBe(true)
    expect(targetActiveSessions(targets[1]!)).toBe(3)
  })

  it('reports unknown rather than zero before anything has asked', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://a:1', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio' }),
    ], { localName })
    expect(targets[1]!.online).toBeUndefined()
    expect(targetActiveSessions(targets[1]!)).toBeUndefined()
  })

  it('an unnamed device falls back to its address, never to an empty label', () => {
    const targets = buildRunTargets([
      ws('r1', 'A', { url: 'ws://10.0.0.9:9100', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: '   ' }),
    ], { localName })
    expect(targets[1]!.name).toBe('10.0.0.9:9100')
  })

  it('names the Workspace a new conversation would be created in', () => {
    const targets = buildRunTargets([
      ws('r1', 'Alpha', { url: 'ws://a:1', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio' }),
    ], { localName })
    expect(defaultWorkspaceFor(targets[1]!)?.id).toBe('r1')
    expect(defaultWorkspaceFor(targets[0]!)).toBeNull()
  })
})

describe('endpointHost', () => {
  it('normalises case and port, and survives junk', () => {
    expect(endpointHost('WS://Host.Local:9100/x')).toBe('host.local:9100')
    expect(endpointHost('not a url')).toBe('not a url')
  })
})

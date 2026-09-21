import { describe, expect, it } from 'bun:test'
import { buildRemotePeers, peerDirection, type PeerInboundInput, type PeerOutboundInput } from '../peers'

const T = '2026-09-12T10:00:00.000Z'

function grant(over: Partial<PeerInboundInput> = {}): PeerInboundInput {
  return {
    deviceId: 'dev-1', hostId: 'host-b', name: 'Studio Mac', platform: 'macos',
    createdAt: T, lastSeenAt: T, online: true, ...over,
  }
}

function link(over: Partial<PeerOutboundInput> = {}): PeerOutboundInput {
  return {
    workspaceId: 'ws-1', workspaceName: 'Alpha',
    remoteServer: { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra', deviceId: 'host-b', deviceName: 'Studio Mac' },
    ...over,
  }
}

describe('one row per computer, whichever way the links run', () => {
  it('a mutual pair is one row, not two', () => {
    const peers = buildRemotePeers([grant()], [link()])
    expect(peers).toHaveLength(1)
    expect(peers[0]!.name).toBe('Studio Mac')
    expect(peers[0]!.inbound?.deviceId).toBe('dev-1')
    expect(peers[0]!.outbound).toHaveLength(1)
    expect(peerDirection(peers[0]!)).toBe('mutual')
  })

  it('reports each one-way relationship as what it is', () => {
    expect(peerDirection(buildRemotePeers([grant()], [])[0]!)).toBe('inbound-only')
    expect(peerDirection(buildRemotePeers([], [link()])[0]!)).toBe('outbound-only')
  })

  it('a revoked grant with no link left is still shown, and says so', () => {
    const peers = buildRemotePeers([grant({ revokedAt: T, online: false })], [])
    expect(peers).toHaveLength(1)
    expect(peerDirection(peers[0]!)).toBe('revoked')
  })

  it('a revoked grant does not hide a link we still hold', () => {
    const peers = buildRemotePeers([grant({ revokedAt: T, online: false })], [link()])
    expect(peerDirection(peers[0]!)).toBe('outbound-only')
  })

  it('several Projects on one computer stay one row', () => {
    const peers = buildRemotePeers([grant()], [
      link(),
      link({ workspaceId: 'ws-2', workspaceName: 'Beta', remoteServer: { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'rb', deviceId: 'host-b', deviceName: 'Studio Mac' } }),
    ])
    expect(peers).toHaveLength(1)
    expect(peers[0]!.outbound.map(o => o.workspaceName)).toEqual(['Alpha', 'Beta'])
  })

  it('one computer controlling many is just many rows', () => {
    const peers = buildRemotePeers([], [
      link({ workspaceId: 'a', remoteServer: { url: 'ws://a:1', remoteWorkspaceId: 'r1', deviceId: 'host-a', deviceName: 'VPS' } }),
      link({ workspaceId: 'b', remoteServer: { url: 'ws://b:1', remoteWorkspaceId: 'r2', deviceId: 'host-b', deviceName: 'Studio' } }),
    ])
    expect(peers.map(p => p.name)).toEqual(['Studio', 'VPS'])
  })

  it('never guesses two machines are one when neither reported a host id', () => {
    const peers = buildRemotePeers(
      [grant({ hostId: undefined })],
      [link({ remoteServer: { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra' } })],
    )
    // A wrong merge would show one machine's revoke button against the other's grant.
    expect(peers).toHaveLength(2)
  })

  it('keeps the name the user gave a computer they reach', () => {
    const peers = buildRemotePeers(
      [grant({ name: 'macbook-pro.local' })],
      [link({ remoteServer: { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra', deviceId: 'host-b', deviceName: '工作室电脑' } })],
    )
    expect(peers[0]!.name).toBe('工作室电脑')
  })

  it('uses the machine own name when we only granted it access', () => {
    expect(buildRemotePeers([grant({ name: 'macbook-pro.local' })], [])[0]!.name).toBe('macbook-pro.local')
  })
})

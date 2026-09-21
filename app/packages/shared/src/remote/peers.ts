/**
 * One list of computers, with the direction(s) each relationship actually runs in.
 *
 * Controller and controlled are not kinds of machine — they are the two ends of one
 * link, and the same pair of computers can run a link each way. So a person should
 * see one row per computer, not the same computer twice under two headings.
 *
 * Two independent facts make up a row:
 *  - **inbound**: we issued that device a grant, so it may reach us. Revocable here.
 *  - **outbound**: we hold a grant on it (a Workspace bound to it), so we may reach it.
 *
 * They are independent because each machine decides for itself whether to accept
 * being reached — that is the one switch a device has. A pair can therefore be
 * mutual, one-way in either direction, and change without the other end doing
 * anything. Modelling it as a single "is remote" boolean is what produced two lists
 * of the same machines.
 */

import type { RemoteDevicePlatform } from './devices.ts';
import { endpointHost } from './run-targets.ts';

export interface PeerInboundGrant {
  /** Device-grant id; what `remote:revokeDevice` takes. */
  deviceId: string;
  createdAt: string;
  lastSeenAt?: string;
  revokedAt?: string;
  online: boolean;
}

export interface PeerOutboundLink {
  /** Local Workspace bound to that computer. */
  workspaceId: string;
  workspaceName: string;
  /** Workspace id on the remote side. */
  remoteWorkspaceId: string;
  url: string;
}

export interface RemotePeer {
  /** Stable host id when known, else the endpoint host, so nothing merges wrongly. */
  key: string;
  name: string;
  platform?: RemoteDevicePlatform;
  /** It may reach us. Absent when we never granted it anything. */
  inbound?: PeerInboundGrant;
  /** We may reach it. One entry per Project we opened on that computer. */
  outbound: PeerOutboundLink[];
}

export interface PeerInboundInput {
  deviceId: string;
  /** Host id this device reported, when it reported one. */
  hostId?: string;
  name: string;
  platform: RemoteDevicePlatform;
  createdAt: string;
  lastSeenAt?: string;
  revokedAt?: string;
  online: boolean;
}

export interface PeerOutboundInput {
  workspaceId: string;
  workspaceName: string;
  remoteServer: {
    url: string;
    remoteWorkspaceId: string;
    deviceId?: string;
    deviceName?: string;
  };
}

/**
 * Merge the two halves into one list.
 *
 * Matching is by host id when both sides know it. A device that paired before host
 * ids existed, or one reached by address alone, keeps its own row rather than being
 * guessed into someone else's — a wrong merge would show one machine's revoke button
 * against another machine's grant.
 */
export function buildRemotePeers(
  inbound: readonly PeerInboundInput[],
  outbound: readonly PeerOutboundInput[],
): RemotePeer[] {
  const peers = new Map<string, RemotePeer>();

  for (const entry of outbound) {
    const remote = entry.remoteServer;
    const key = remote.deviceId ?? `host:${endpointHost(remote.url)}`;
    let peer = peers.get(key);
    if (!peer) {
      peer = {
        key,
        name: remote.deviceName?.trim() || endpointHost(remote.url),
        outbound: [],
      };
      peers.set(key, peer);
    }
    peer.outbound.push({
      workspaceId: entry.workspaceId,
      workspaceName: entry.workspaceName,
      remoteWorkspaceId: remote.remoteWorkspaceId,
      url: remote.url,
    });
  }

  for (const entry of inbound) {
    // Only a reported host id can identify the same machine on both sides; the grant
    // id is ours and means nothing to the other end.
    const key = entry.hostId ?? `grant:${entry.deviceId}`;
    let peer = peers.get(key);
    if (!peer) {
      peer = { key, name: entry.name, outbound: [] };
      peers.set(key, peer);
    }
    peer.platform = entry.platform;
    // A machine we also reach keeps the name we gave it; otherwise use its own.
    if (peer.outbound.length === 0) peer.name = entry.name;
    peer.inbound = {
      deviceId: entry.deviceId,
      createdAt: entry.createdAt,
      lastSeenAt: entry.lastSeenAt,
      revokedAt: entry.revokedAt,
      online: entry.online,
    };
  }

  return [...peers.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type PeerDirection = 'mutual' | 'inbound-only' | 'outbound-only' | 'revoked';

/** What this row's relationship currently is, for one honest line of copy. */
export function peerDirection(peer: RemotePeer): PeerDirection {
  const inboundLive = peer.inbound !== undefined && peer.inbound.revokedAt === undefined;
  const outboundLive = peer.outbound.length > 0;
  if (inboundLive && outboundLive) return 'mutual';
  if (inboundLive) return 'inbound-only';
  if (outboundLive) return 'outbound-only';
  return 'revoked';
}

import type { Workspace } from '../../shared/types'
import {
  formatInviteCredential,
  isInviteOffer,
  parseAccessLink,
  raceEndpoints,
} from '@craft-agent/shared/remote'
import { slugify } from './slugify'

async function resolveUniqueSlug(baseName: string): Promise<{ slug: string; path: string }> {
  const baseSlug = slugify(baseName) || 'remote'
  let slug = baseSlug
  let attempt = 0
  while (true) {
    const result = await window.electronAPI.checkWorkspaceSlug(slug)
    if (!result.exists) return { slug, path: result.path }
    attempt += 1
    slug = attempt === 1 ? `${baseSlug}-remote` : `${baseSlug}-${attempt}`
    if (attempt > 20) {
      return { slug: `${baseSlug}-${Date.now()}`, path: result.path }
    }
  }
}

export async function attachRemoteFromAccessLink(name: string, accessLink: string): Promise<Workspace> {
  const parsed = parseAccessLink(accessLink)
  if (!parsed) {
    throw new Error('invalid-access-link')
  }
  // The link carries what the host calls itself, so pasting it is enough — a typed
  // name is an override, not a requirement.
  const label = name.trim()
    || (isInviteOffer(parsed) ? parsed.hostName ?? '' : '')
    || 'remote'
  // A v3 link carries a one-time invite; the host redeems it on first connect and
  // mints this device its own grant. A pre-v3 link carries a shared token, which
  // still works but cannot be revoked per device.
  const credential = isInviteOffer(parsed)
    ? formatInviteCredential({ enrollmentId: parsed.enrollmentId, secret: parsed.secret })
    : parsed.token

  // Candidates overlap instead of queueing behind each other's timeouts, so a dead
  // address costs no user-visible wait. On a first pairing rank does not decide the
  // winner: the invite is single-use, so whichever attempt reaches the host first
  // redeems it and every other attempt is refused — exactly one can succeed, and that
  // one is the connection we keep. `endpoints` is stored, so a later reconnect can
  // re-rank (see preferLastGood).
  const race = await raceEndpoints(
    parsed.endpoints,
    async (url) => {
      const attempt = await window.electronAPI.testRemoteConnection(url, credential)
      if (!attempt.ok) throw new Error(attempt.error || 'connect-failed')
      return attempt
    },
  )
  const connectedUrl = race.endpoint
  const result = race.value ?? null
  if (!result?.ok || !connectedUrl) {
    throw new Error(race.error || 'connect-failed')
  }

  // The host redeemed the invite during the handshake and handed back the grant it
  // minted on that same connection (the invite itself is now spent). Everything from
  // here on — and every later reconnect — uses the device's own grant.
  const deviceToken = isInviteOffer(parsed) ? result.deviceToken : parsed.token
  if (!deviceToken) throw new Error('remote-grant-not-issued')
  let remoteWorkspaceId = result.remoteWorkspaceId
  if (result.needsWorkspace || !remoteWorkspaceId) {
    if (result.remoteWorkspaces?.[0]) {
      remoteWorkspaceId = result.remoteWorkspaces[0].id
    } else {
      const created = await window.electronAPI.invokeOnServer(
        connectedUrl,
        deviceToken,
        'server:createWorkspace',
        label,
      ) as { id: string; name: string }
      remoteWorkspaceId = created.id
    }
  }
  if (!remoteWorkspaceId) {
    throw new Error('connect-failed')
  }
  const { path } = await resolveUniqueSlug(label)
  return window.electronAPI.createWorkspace(path, label, {
    url: connectedUrl,
    token: deviceToken,
    remoteWorkspaceId,
    // Identity and the full candidate list, so later projects on this same computer
    // group under one device and a network change is recoverable without re-pairing.
    deviceId: result.hostId,
    deviceName: label,
    endpoints: parsed.endpoints,
  })
}

/**
 * Connect to a Fleet/Craft server the user runs themselves — a VPS, a Docker
 * container, `packages/server` on another box — by its address and server token.
 *
 * This is Craft's own documented path (server/headless), and the only one available
 * to a machine that has no desktop app to mint an access link. It was dropped when
 * the URL+token form was replaced by the access link; a headless server has no way
 * to produce one, so without this there is no route to a self-hosted server at all.
 *
 * The access-link flow above is the one-click path between two desktop apps; this is
 * the manual path. They end in the same place: one Workspace bound to one host.
 */
export async function attachRemoteFromServerToken(
  name: string,
  serverUrl: string,
  token: string,
): Promise<Workspace> {
  const url = serverUrl.trim().replace(/\/+$/, '')
  if (!/^wss?:\/\//i.test(url)) throw new Error('invalid-server-url')
  if (!token.trim()) throw new Error('invalid-server-token')

  const attempt = await window.electronAPI.testRemoteConnection(url, token.trim())
  if (!attempt.ok) throw new Error(attempt.error || 'connect-failed')

  let remoteWorkspaceId = attempt.remoteWorkspaceId
  if (attempt.needsWorkspace || !remoteWorkspaceId) {
    if (attempt.remoteWorkspaces?.[0]) {
      remoteWorkspaceId = attempt.remoteWorkspaces[0].id
    } else {
      const created = await window.electronAPI.invokeOnServer(
        url,
        token.trim(),
        'server:createWorkspace',
        name.trim(),
      ) as { id: string; name: string }
      remoteWorkspaceId = created.id
    }
  }
  if (!remoteWorkspaceId) throw new Error('connect-failed')

  const { path } = await resolveUniqueSlug(name.trim() || 'remote')
  return window.electronAPI.createWorkspace(path, name.trim() || 'remote', {
    url,
    token: token.trim(),
    remoteWorkspaceId,
    // A server token is not a device grant: there is nothing per-device to revoke,
    // so the host id is whatever the server reports and there is no endpoint list.
    deviceId: attempt.hostId,
    deviceName: name.trim() || 'remote',
    endpoints: [url],
  })
}

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
        name.trim(),
      ) as { id: string; name: string }
      remoteWorkspaceId = created.id
    }
  }
  if (!remoteWorkspaceId) {
    throw new Error('connect-failed')
  }
  const { path } = await resolveUniqueSlug(name.trim() || 'remote')
  return window.electronAPI.createWorkspace(path, name.trim() || 'remote', {
    url: connectedUrl,
    token: deviceToken,
    remoteWorkspaceId,
    // Identity and the full candidate list, so later projects on this same computer
    // group under one device and a network change is recoverable without re-pairing.
    deviceId: result.hostId,
    deviceName: name.trim() || 'remote',
    endpoints: parsed.endpoints,
  })
}

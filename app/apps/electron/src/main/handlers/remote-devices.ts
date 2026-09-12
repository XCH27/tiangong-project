/**
 * Device-grant handlers — the 远程连接 access control for this machine.
 *
 * All four channels are LOCAL_ONLY (see `protocol/routing.ts`): minting an invite or
 * revoking a device is this machine deciding who may reach it, so a remote client
 * must never be able to do either over the link it connected on.
 */

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  assessEndpoints,
  encodeInviteLink,
  forgetRevokedDevices,
  hashRemoteSecret,
  issueEnrollment,
  loadRemoteAccessStore,
  newRemoteId,
  newRemoteSecret,
  revokeDevice,
  saveRemoteAccessStore,
  updateRemoteAccessStore,
  type RemoteDevice,
} from '@craft-agent/shared/remote'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.remote.CREATE_INVITE,
  RPC_CHANNELS.remote.LIST_DEVICES,
  RPC_CHANNELS.remote.REVOKE_DEVICE,
  RPC_CHANNELS.remote.CLEAR_REVOKED_DEVICES,
  RPC_CHANNELS.remote.CLAIM_DEVICE_TOKEN,
] as const

export interface CreateInviteInput {
  deviceName: string
  /** Empty = any Workspace on this machine. */
  workspaceIds?: string[]
}

export interface CreateInviteResult {
  /** The single pasteable blob. It carries an invite, never a standing credential. */
  accessLink: string
  expiresAt: string
  deviceName: string
  /**
   * What the addresses in this link actually reach, decided here rather than
   * discovered by the other device timing out on every candidate.
   */
  reach: 'none' | 'lan-only' | 'lan-or-overlay' | 'anywhere'
}

/**
 * What the settings page is allowed to see. Deliberately **not** `RemoteDevice`:
 * `tokenHash` and `scope` are access-control internals and never cross to the
 * renderer, which only needs to name a device, show whether it is reachable, and
 * revoke it.
 */
export interface RemoteDeviceRow {
  id: string
  name: string
  platform: RemoteDevice['platform']
  createdAt: string
  lastSeenAt?: string
  revokedAt?: string
  /** Seen within the last two minutes over the public listener. */
  online: boolean
}

const ONLINE_WINDOW_MS = 2 * 60 * 1000

/**
 * `endpoints` must come from the running listener, not from this module: only the
 * listener knows which addresses it actually bound. An empty list is a refusal with
 * a reason rather than a link that cannot work.
 */
export function registerRemoteDeviceHandlers(
  server: RpcServer,
  deps: {
    listEndpoints: () => Promise<string[]>
    /** Hands over the grant minted for a just-redeemed invite, once. */
    claimMintedToken: (enrollmentId: string) => { deviceId: string; token: string } | null
  },
): void {
  // A device that just redeemed its single-use invite exchanges it for the grant it
  // will present from now on. One claim only; a miss means pairing again.
  server.handle(RPC_CHANNELS.remote.CLAIM_DEVICE_TOKEN, async (_ctx, enrollmentId: string) => {
    if (!enrollmentId) throw new Error('REMOTE_ENROLLMENT_ID_REQUIRED')
    const minted = deps.claimMintedToken(enrollmentId)
    if (!minted) throw new Error('REMOTE_GRANT_ALREADY_CLAIMED')
    return { deviceId: minted.deviceId, deviceToken: minted.token }
  })

  server.handle(RPC_CHANNELS.remote.CREATE_INVITE, async (_ctx, input: CreateInviteInput) => {
    const deviceName = (input?.deviceName ?? '').trim()
    if (!deviceName) throw new Error('REMOTE_DEVICE_NAME_REQUIRED')

    const endpoints = await deps.listEndpoints()
    if (endpoints.length === 0) throw new Error('REMOTE_NO_REACHABLE_ADDRESS')

    const secret = newRemoteSecret()
    const id = newRemoteId()
    const store = updateRemoteAccessStore((current) => issueEnrollment(current, {
      deviceName,
      scope: { workspaceIds: input?.workspaceIds ?? [] },
      secret,
      id,
      now: Date.now(),
    }, hashRemoteSecret).store)

    const enrollment = store.enrollments.find((entry) => entry.id === id)
    if (!enrollment) throw new Error('REMOTE_ENROLLMENT_NOT_PERSISTED')

    const result: CreateInviteResult = {
      // The link carries the raw secret; the joining client turns it into the
      // credential it presents on first connect (`formatInviteCredential`).
      accessLink: encodeInviteLink({ enrollmentId: id, secret, endpoints }),
      expiresAt: enrollment.expiresAt,
      deviceName,
      reach: assessEndpoints(endpoints).verdict,
    }
    return result
  })

  server.handle(RPC_CHANNELS.remote.LIST_DEVICES, async () => {
    const now = Date.now()
    const rows: RemoteDeviceRow[] = loadRemoteAccessStore().devices.map((device) => ({
      id: device.id,
      name: device.name,
      platform: device.platform,
      createdAt: device.createdAt,
      lastSeenAt: device.lastSeenAt,
      revokedAt: device.revokedAt,
      online: !device.revokedAt
        && device.lastSeenAt !== undefined
        && now - Date.parse(device.lastSeenAt) < ONLINE_WINDOW_MS,
    }))
    return rows
  })

  server.handle(RPC_CHANNELS.remote.REVOKE_DEVICE, async (_ctx, deviceId: string) => {
    if (!deviceId) throw new Error('REMOTE_DEVICE_ID_REQUIRED')
    updateRemoteAccessStore((store) => revokeDevice(store, deviceId, Date.now()))
    return { ok: true as const }
  })

  server.handle(RPC_CHANNELS.remote.CLEAR_REVOKED_DEVICES, async () => {
    const store = updateRemoteAccessStore(forgetRevokedDevices)
    return { remaining: store.devices.length }
  })
}

/** Exported for the reset path in tests; the store is otherwise only touched above. */
export const __remoteDeviceStoreForTest = { loadRemoteAccessStore, saveRemoteAccessStore }

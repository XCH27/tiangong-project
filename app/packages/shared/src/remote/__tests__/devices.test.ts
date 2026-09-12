import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import {
  EMPTY_REMOTE_ACCESS_STORE,
  ENROLLMENT_TTL_MS,
  authenticateDevice,
  deviceMayReachWorkspace,
  forgetRevokedDevices,
  issueEnrollment,
  pruneEnrollments,
  redeemEnrollment,
  revokeDevice,
  type RemoteAccessStore,
} from '../devices'

/**
 * Real sha256 rather than a label like `h(x)`: two of the assertions below check
 * that the plaintext secret never appears in the stored record, which an
 * echoing fake hasher can never satisfy.
 */
const hash = (secret: string) => createHash('sha256').update(secret).digest('hex')

const T0 = Date.parse('2026-09-11T10:00:00.000Z')

function withInvite(now = T0) {
  return issueEnrollment(
    EMPTY_REMOTE_ACCESS_STORE,
    { deviceName: 'Studio Mac', secret: 'invite-secret', id: 'inv-1', now },
    hash,
  )
}

describe('enrollment invites are single-use and expiring', () => {
  it('never stores the secret, only its hash', () => {
    const { enrollment } = withInvite()
    expect(enrollment.secretHash).toBe(hash('invite-secret'))
    expect(JSON.stringify(enrollment)).not.toContain('invite-secret')
  })

  it('redeems exactly once', () => {
    const { store } = withInvite()
    const first = redeemEnrollment(store, {
      enrollmentId: 'inv-1', secret: 'invite-secret', deviceId: 'dev-1',
      platform: 'macos', deviceToken: 'tok-1', now: T0 + 1000,
    }, hash)
    expect('device' in first).toBe(true)
    if (!('device' in first)) return

    const second = redeemEnrollment(first.store, {
      enrollmentId: 'inv-1', secret: 'invite-secret', deviceId: 'dev-2',
      platform: 'ios', deviceToken: 'tok-2', now: T0 + 2000,
    }, hash)
    expect(second).toEqual({ failure: 'ENROLLMENT_ALREADY_REDEEMED' })
  })

  it('expires on its own when never used', () => {
    const { store } = withInvite()
    const late = redeemEnrollment(store, {
      enrollmentId: 'inv-1', secret: 'invite-secret', deviceId: 'dev-1',
      platform: 'macos', deviceToken: 'tok-1', now: T0 + ENROLLMENT_TTL_MS + 1,
    }, hash)
    expect(late).toEqual({ failure: 'ENROLLMENT_EXPIRED' })
  })

  it('a wrong secret is not distinguishable from an unknown invite', () => {
    const { store } = withInvite()
    expect(redeemEnrollment(store, {
      enrollmentId: 'inv-1', secret: 'guessed', deviceId: 'dev-1',
      platform: 'macos', deviceToken: 'tok-1', now: T0 + 1000,
    }, hash)).toEqual({ failure: 'ENROLLMENT_NOT_FOUND' })
  })

  it('does not require a name: the joining device names itself', () => {
    const { enrollment } = issueEnrollment(EMPTY_REMOTE_ACCESS_STORE, {
      secret: 's', id: 'inv-x', now: T0,
    }, hash)
    expect(enrollment.deviceName).toBe('')

    const redeemed = redeemEnrollment({ ...EMPTY_REMOTE_ACCESS_STORE, enrollments: [enrollment] }, {
      enrollmentId: 'inv-x', secret: 's', deviceId: 'dev-x',
      platform: 'linux', deviceName: '  build-box  ', deviceToken: 'tok-x', now: T0 + 1,
    }, hash)
    if (!('device' in redeemed)) throw new Error('expected a redeem')
    expect(redeemed.device.name).toBe('build-box')
  })

  it('falls back to the platform when neither side supplied a name', () => {
    const { enrollment } = issueEnrollment(EMPTY_REMOTE_ACCESS_STORE, {
      secret: 's', id: 'inv-y', now: T0,
    }, hash)
    const redeemed = redeemEnrollment({ ...EMPTY_REMOTE_ACCESS_STORE, enrollments: [enrollment] }, {
      enrollmentId: 'inv-y', secret: 's', deviceId: 'dev-y',
      platform: 'ios', deviceToken: 'tok-y', now: T0 + 1,
    }, hash)
    if (!('device' in redeemed)) throw new Error('expected a redeem')
    expect(redeemed.device.name).toBe('ios')
  })

  it('a name typed on the host is used when the joining device sends none', () => {
    const { enrollment } = issueEnrollment(EMPTY_REMOTE_ACCESS_STORE, {
      deviceName: 'Studio Mac', secret: 's', id: 'inv-z', now: T0,
    }, hash)
    const redeemed = redeemEnrollment({ ...EMPTY_REMOTE_ACCESS_STORE, enrollments: [enrollment] }, {
      enrollmentId: 'inv-z', secret: 's', deviceId: 'dev-z',
      platform: 'macos', deviceToken: 'tok-z', now: T0 + 1,
    }, hash)
    if (!('device' in redeemed)) throw new Error('expected a redeem')
    expect(redeemed.device.name).toBe('Studio Mac')
  })

  it('prunes redeemed and long-expired invites', () => {
    const { store } = withInvite()
    expect(pruneEnrollments(store.enrollments, T0 + 2 * ENROLLMENT_TTL_MS + 1)).toEqual([])
  })
})

describe('device grants authenticate and revoke', () => {
  function paired(): RemoteAccessStore {
    const { store } = withInvite()
    const result = redeemEnrollment(store, {
      enrollmentId: 'inv-1', secret: 'invite-secret', deviceId: 'dev-1',
      platform: 'macos', deviceToken: 'tok-1', now: T0 + 1000,
    }, hash)
    if (!('store' in result)) throw new Error('redeem failed')
    return result.store
  }

  it('stores only the token hash', () => {
    const store = paired()
    expect(JSON.stringify(store.devices)).not.toContain('tok-1')
    expect(store.devices[0]!.tokenHash).toBe(hash('tok-1'))
  })

  it('authenticates the device and stamps lastSeenAt', () => {
    const store = paired()
    const auth = authenticateDevice(store, 'tok-1', T0 + 5000, hash)
    expect(auth?.device.id).toBe('dev-1')
    expect(auth?.store.devices[0]!.lastSeenAt).toBe(new Date(T0 + 5000).toISOString())
  })

  it('fails closed on an unknown or empty token', () => {
    const store = paired()
    expect(authenticateDevice(store, 'other', T0, hash)).toBeNull()
    expect(authenticateDevice(store, '', T0, hash)).toBeNull()
  })

  it('a revoked device cannot authenticate but is still listed', () => {
    const store = revokeDevice(paired(), 'dev-1', T0 + 9000)
    expect(authenticateDevice(store, 'tok-1', T0 + 9001, hash)).toBeNull()
    expect(store.devices).toHaveLength(1)
    expect(store.devices[0]!.revokedAt).toBe(new Date(T0 + 9000).toISOString())
  })

  it('one device token cannot impersonate another', () => {
    const first = paired()
    const second = issueEnrollment(first, {
      deviceName: 'Phone', secret: 'invite-2', id: 'inv-2', now: T0 + 100,
    }, hash)
    const redeemed = redeemEnrollment(second.store, {
      enrollmentId: 'inv-2', secret: 'invite-2', deviceId: 'dev-2',
      platform: 'ios', deviceToken: 'tok-2', now: T0 + 200,
    }, hash)
    if (!('store' in redeemed)) throw new Error('redeem failed')
    expect(authenticateDevice(redeemed.store, 'tok-2', T0 + 300, hash)?.device.id).toBe('dev-2')
    expect(authenticateDevice(redeemed.store, 'tok-1', T0 + 300, hash)?.device.id).toBe('dev-1')
  })

  it('clear-revoked is the only thing that forgets a device', () => {
    expect(forgetRevokedDevices(revokeDevice(paired(), 'dev-1', T0 + 1)).devices).toEqual([])
    expect(forgetRevokedDevices(paired()).devices).toHaveLength(1)
  })
})

describe('scope decides which Workspace a device may reach', () => {
  const base = {
    id: 'dev-1', name: 'Studio Mac', platform: 'macos' as const,
    tokenHash: hash('tok-1'), createdAt: new Date(T0).toISOString(),
  }

  it('an empty scope means any Workspace on this machine', () => {
    const device = { ...base, scope: { workspaceIds: [] } }
    expect(deviceMayReachWorkspace(device, 'ws-1')).toBe(true)
    expect(deviceMayReachWorkspace(device, null)).toBe(true)
  })

  it('a scoped device is confined to its Workspace IDs', () => {
    const device = { ...base, scope: { workspaceIds: ['ws-1'] } }
    expect(deviceMayReachWorkspace(device, 'ws-1')).toBe(true)
    expect(deviceMayReachWorkspace(device, 'ws-2')).toBe(false)
    expect(deviceMayReachWorkspace(device, null)).toBe(false)
  })

  it('a revoked device reaches nothing, whatever its scope', () => {
    const device = { ...base, scope: { workspaceIds: [] }, revokedAt: new Date(T0).toISOString() }
    expect(deviceMayReachWorkspace(device, 'ws-1')).toBe(false)
  })
})

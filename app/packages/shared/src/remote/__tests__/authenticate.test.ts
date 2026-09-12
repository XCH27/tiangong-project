import { describe, expect, it } from 'bun:test'
import { createHash } from 'node:crypto'
import {
  authenticateRemoteCredential,
  formatInviteCredential,
  parseInviteCredential,
} from '../authenticate'
import { EMPTY_REMOTE_ACCESS_STORE, ENROLLMENT_TTL_MS, issueEnrollment, revokeDevice } from '../devices'

const hash = (s: string) => createHash('sha256').update(s).digest('hex')
const T0 = Date.parse('2026-09-11T10:00:00.000Z')

function deps(overrides: Partial<Parameters<typeof authenticateRemoteCredential>[2]> = {}) {
  return {
    hash,
    newDeviceId: () => 'dev-new',
    newDeviceToken: () => 'tok-new',
    now: T0 + 1000,
    ...overrides,
  }
}

function invited() {
  return issueEnrollment(EMPTY_REMOTE_ACCESS_STORE, {
    deviceName: 'Laptop', secret: 'sec-1', id: 'inv-1', now: T0,
  }, hash).store
}

describe('invite credential encoding', () => {
  it('round-trips, and a secret containing a colon survives', () => {
    const credential = { enrollmentId: 'inv-1', secret: 'a:b:c' }
    expect(parseInviteCredential(formatInviteCredential(credential))).toEqual(credential)
  })

  it('a plain token is not mistaken for an invite', () => {
    expect(parseInviteCredential('just-a-token')).toBeNull()
    expect(parseInviteCredential('fleet-invite:')).toBeNull()
    expect(parseInviteCredential('fleet-invite::secret')).toBeNull()
  })
})

describe('the public listener accepts exactly two credentials', () => {
  it('redeeming an invite admits the device and mints its own token', () => {
    const result = authenticateRemoteCredential(
      invited(),
      formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }),
      deps({ platform: 'ios' }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok || result.kind !== 'device') throw new Error('expected a device')
    expect(result.mintedToken).toBe('tok-new')
    expect(result.device.platform).toBe('ios')
    expect(result.device.name).toBe('Laptop')
    expect(result.store.enrollments[0]!.redeemedAt).toBeDefined()
  })

  it('the same invite cannot admit a second device', () => {
    const first = authenticateRemoteCredential(
      invited(), formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }), deps())
    if (!first.ok || first.kind !== 'device') throw new Error('expected first redeem to pass')
    const second = authenticateRemoteCredential(
      first.store, formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }), deps())
    expect(second).toEqual({ ok: false, reason: 'ENROLLMENT_ALREADY_REDEEMED' })
  })

  it('an expired invite is refused by name', () => {
    const result = authenticateRemoteCredential(
      invited(),
      formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }),
      deps({ now: T0 + ENROLLMENT_TTL_MS + 1 }),
    )
    expect(result).toEqual({ ok: false, reason: 'ENROLLMENT_EXPIRED' })
  })

  it('the minted token authenticates on the next connection', () => {
    const paired = authenticateRemoteCredential(
      invited(), formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }), deps())
    if (!paired.ok || paired.kind !== 'device') throw new Error('expected redeem')
    const again = authenticateRemoteCredential(paired.store, 'tok-new', deps({ now: T0 + 5000 }))
    expect(again.ok).toBe(true)
    if (!again.ok || again.kind !== 'device') throw new Error('expected a device')
    expect(again.device.id).toBe('dev-new')
    expect(again.mintedToken).toBeUndefined()
  })

  it('a revoked device is refused', () => {
    const paired = authenticateRemoteCredential(
      invited(), formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }), deps())
    if (!paired.ok || paired.kind !== 'device') throw new Error('expected redeem')
    const revoked = revokeDevice(paired.store, 'dev-new', T0 + 2000)
    expect(authenticateRemoteCredential(revoked, 'tok-new', deps({ now: T0 + 3000 })))
      .toEqual({ ok: false, reason: 'UNKNOWN_DEVICE' })
  })

  it('no credential and an unknown credential both fail closed', () => {
    expect(authenticateRemoteCredential(invited(), '', deps()))
      .toEqual({ ok: false, reason: 'NO_CREDENTIAL' })
    expect(authenticateRemoteCredential(invited(), 'some-other-token', deps()))
      .toEqual({ ok: false, reason: 'UNKNOWN_DEVICE' })
  })
})

describe('the configured server token stays admitted', () => {
  it('admits a client holding the server token, as not-a-device', () => {
    const result = authenticateRemoteCredential(invited(), 'server-token-abc', deps({
      serverToken: 'server-token-abc',
    }))
    expect(result).toEqual({ ok: true, kind: 'server-token' })
  })

  it('a device grant still wins over the server token', () => {
    const paired = authenticateRemoteCredential(
      invited(), formatInviteCredential({ enrollmentId: 'inv-1', secret: 'sec-1' }), deps())
    if (!paired.ok || paired.kind !== 'device') throw new Error('expected redeem')
    const again = authenticateRemoteCredential(paired.store, 'tok-new', deps({
      serverToken: 'server-token-abc', now: T0 + 5000,
    }))
    expect(again.ok && again.kind).toBe('device')
  })

  it('refuses a near-miss and an empty server token', () => {
    expect(authenticateRemoteCredential(invited(), 'server-token-ab', deps({
      serverToken: 'server-token-abc',
    }))).toEqual({ ok: false, reason: 'UNKNOWN_DEVICE' })
    expect(authenticateRemoteCredential(invited(), 'anything', deps({ serverToken: '' })))
      .toEqual({ ok: false, reason: 'UNKNOWN_DEVICE' })
  })

  it('admits nothing when this machine has no server token configured', () => {
    expect(authenticateRemoteCredential(invited(), 'server-token-abc', deps()))
      .toEqual({ ok: false, reason: 'UNKNOWN_DEVICE' })
  })
})

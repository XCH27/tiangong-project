import { describe, expect, it } from 'bun:test'
import { mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  hashRemoteSecret,
  loadRemoteAccessStore,
  newRemoteSecret,
  saveRemoteAccessStore,
  updateRemoteAccessStore,
} from '../store'
import { EMPTY_REMOTE_ACCESS_STORE, issueEnrollment, revokeDevice } from '../devices'

function scratch(): string {
  return join(mkdtempSync(join(tmpdir(), 'fleet-remote-')), 'nested', 'remote-access.json')
}

describe('remote access store', () => {
  it('a missing file reads as no authorised device, not as an error', () => {
    expect(loadRemoteAccessStore(scratch())).toEqual(EMPTY_REMOTE_ACCESS_STORE)
  })

  it('a corrupt file fails closed rather than throwing', () => {
    const path = scratch()
    saveRemoteAccessStore(EMPTY_REMOTE_ACCESS_STORE, path)
    writeFileSync(path, '{ not json')
    expect(loadRemoteAccessStore(path)).toEqual(EMPTY_REMOTE_ACCESS_STORE)
    writeFileSync(path, '{"devices":"nope"}')
    expect(loadRemoteAccessStore(path)).toEqual(EMPTY_REMOTE_ACCESS_STORE)
  })

  it('creates the directory and keeps the file owner-only', () => {
    const path = scratch()
    saveRemoteAccessStore(EMPTY_REMOTE_ACCESS_STORE, path)
    expect(statSync(path).mode & 0o777).toBe(0o600)
  })

  it('round-trips through update and never writes a plaintext secret', () => {
    const path = scratch()
    const secret = newRemoteSecret()
    updateRemoteAccessStore(
      (store) => issueEnrollment(store, {
        deviceName: 'Studio Mac', secret, id: 'inv-1', now: Date.now(),
      }, hashRemoteSecret).store,
      path,
    )
    const raw = readFileSync(path, 'utf8')
    expect(raw).not.toContain(secret)
    expect(loadRemoteAccessStore(path).enrollments[0]!.secretHash).toBe(hashRemoteSecret(secret))
  })

  it('a revoked device survives a write so the list can say why', () => {
    const path = scratch()
    const now = Date.now()
    updateRemoteAccessStore((store) => ({
      ...store,
      devices: [{
        id: 'dev-1', name: 'Phone', platform: 'ios',
        tokenHash: hashRemoteSecret('tok'), scope: { workspaceIds: [] },
        createdAt: new Date(now).toISOString(),
      }],
    }), path)
    const after = updateRemoteAccessStore((store) => revokeDevice(store, 'dev-1', now + 1), path)
    expect(after.devices[0]!.revokedAt).toBeDefined()
    expect(loadRemoteAccessStore(path).devices).toHaveLength(1)
  })

  it('secrets are long and distinct', () => {
    const a = newRemoteSecret()
    const b = newRemoteSecret()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(32)
    expect(a).toMatch(/^[0-9a-f]+$/)
  })
})

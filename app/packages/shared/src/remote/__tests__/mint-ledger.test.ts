import { describe, expect, it } from 'bun:test'
import { DeviceMintLedger, MINT_CLAIM_TTL_MS } from '../mint-ledger'

const T0 = 1_757_000_000_000

describe('device mint ledger', () => {
  it('hands a minted grant over exactly once', () => {
    const ledger = new DeviceMintLedger()
    ledger.remember('inv-1', 'dev-1', 'tok-1', T0)
    expect(ledger.claim('inv-1', T0 + 10)).toEqual({
      deviceId: 'dev-1', token: 'tok-1', expiresAt: T0 + MINT_CLAIM_TTL_MS,
    })
    expect(ledger.claim('inv-1', T0 + 20)).toBeNull()
    expect(ledger.size).toBe(0)
  })

  it('expires an unclaimed grant instead of keeping it around', () => {
    const ledger = new DeviceMintLedger()
    ledger.remember('inv-1', 'dev-1', 'tok-1', T0)
    expect(ledger.claim('inv-1', T0 + MINT_CLAIM_TTL_MS + 1)).toBeNull()
  })

  it('an unknown invite claims nothing', () => {
    expect(new DeviceMintLedger().claim('nope')).toBeNull()
  })

  it('prunes stale entries as it is used', () => {
    const ledger = new DeviceMintLedger()
    ledger.remember('inv-1', 'dev-1', 'tok-1', T0)
    ledger.remember('inv-2', 'dev-2', 'tok-2', T0 + MINT_CLAIM_TTL_MS + 1)
    expect(ledger.size).toBe(1)
    expect(ledger.claim('inv-2', T0 + MINT_CLAIM_TTL_MS + 2)?.deviceId).toBe('dev-2')
  })
})

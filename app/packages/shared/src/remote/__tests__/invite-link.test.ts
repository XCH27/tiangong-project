import { describe, expect, it } from 'bun:test'
import {
  encodeInviteLink,
  isInviteOffer,
  normalizeEndpoints,
  parseAccessLink,
} from '../invite-link'

const ENDPOINTS = ['ws://192.168.1.20:9100', 'ws://100.92.3.4:9100']

describe('v3 access link carries an invite, not a credential', () => {
  it('round-trips the invite and its endpoints', () => {
    const link = encodeInviteLink({ enrollmentId: 'inv-1', secret: 'sec-1', endpoints: ENDPOINTS })
    const parsed = parseAccessLink(link)
    expect(parsed).not.toBeNull()
    if (!parsed || !isInviteOffer(parsed)) throw new Error('expected a v3 invite')
    expect(parsed.enrollmentId).toBe('inv-1')
    expect(parsed.secret).toBe('sec-1')
    expect(parsed.endpoints).toEqual(ENDPOINTS)
  })

  it('refuses to mint a link when nothing is reachable', () => {
    expect(() => encodeInviteLink({ enrollmentId: 'i', secret: 's', endpoints: [] }))
      .toThrow('REMOTE_NO_REACHABLE_ADDRESS')
    expect(() => encodeInviteLink({ enrollmentId: 'i', secret: 's', endpoints: ['127.0.0.1:9100'] }))
      .toThrow('REMOTE_NO_REACHABLE_ADDRESS')
  })

  it('keeps endpoint order and drops duplicates and non-ws entries', () => {
    expect(normalizeEndpoints([
      'ws://a:1', 'ws://a:1/', 'WS://A:1', 'http://b:2', '  ws://c:3  ',
    ])).toEqual(['ws://a:1', 'ws://c:3'])
  })

  it('rejects a v3 payload missing the invite halves', () => {
    const half = Buffer.from(JSON.stringify({ v: 3, e: 'inv-1', endpoints: ENDPOINTS }), 'utf8').toString('base64url')
    expect(parseAccessLink(`fleet://pair?code=${half}`)).toBeNull()
  })
})

describe('older links still explain themselves', () => {
  it('parses a v2 token link as legacy, not as an invite', () => {
    const code = Buffer.from(JSON.stringify({ v: 2, token: 'shared', endpoints: ENDPOINTS }), 'utf8').toString('base64url')
    const parsed = parseAccessLink(`fleet://pair?code=${code}`)
    if (!parsed) throw new Error('expected a parse')
    expect(isInviteOffer(parsed)).toBe(false)
    expect(parsed.version).toBe(2)
  })

  it('parses the bare url#token form as legacy v1', () => {
    const parsed = parseAccessLink('ws://192.168.1.20:9100#shared-token')
    if (!parsed || isInviteOffer(parsed)) throw new Error('expected legacy')
    expect(parsed.token).toBe('shared-token')
    expect(parsed.endpoints).toEqual(['ws://192.168.1.20:9100'])
  })

  it('returns null for junk instead of guessing', () => {
    expect(parseAccessLink('')).toBeNull()
    expect(parseAccessLink('hello world')).toBeNull()
    expect(parseAccessLink('fleet://pair?code=not-base64-json')).toBeNull()
  })
})

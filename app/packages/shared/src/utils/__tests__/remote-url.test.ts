import { describe, expect, test } from 'bun:test'
import { assertAllowedRemoteWsUrl, isPrivateLanHostname } from '../remote-url.ts'

describe('assertAllowedRemoteWsUrl', () => {
  test('allows wss anywhere', () => {
    expect(() => assertAllowedRemoteWsUrl('wss://example.com:9100')).not.toThrow()
  })

  test('allows ws on LAN', () => {
    expect(() => assertAllowedRemoteWsUrl('ws://192.168.1.8:9100')).not.toThrow()
    expect(() => assertAllowedRemoteWsUrl('ws://10.0.0.2:9100')).not.toThrow()
    expect(() => assertAllowedRemoteWsUrl('ws://127.0.0.1:9100')).not.toThrow()
  })

  test('refuses ws to a public host', () => {
    expect(() => assertAllowedRemoteWsUrl('ws://8.8.8.8:9100')).toThrow(/wss/)
    expect(() => assertAllowedRemoteWsUrl('ws://example.com:9100')).toThrow(/wss/)
  })

  test('classifies private LAN', () => {
    expect(isPrivateLanHostname('192.168.0.1')).toBe(true)
    expect(isPrivateLanHostname('studio.local')).toBe(true)
    expect(isPrivateLanHostname('1.1.1.1')).toBe(false)
  })
})

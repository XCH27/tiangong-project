import { describe, expect, test } from 'bun:test'
import { formatWsUrl, rankListenAddresses } from '../listen-addresses.ts'

describe('rankListenAddresses', () => {
  test('tries public and overlay addresses before RFC1918', () => {
    expect(rankListenAddresses([
      '192.168.1.8',
      '10.0.0.2',
      '100.64.1.20',
      '203.0.113.4',
    ])).toEqual([
      '203.0.113.4',
      '100.64.1.20',
      '10.0.0.2',
      '192.168.1.8',
    ])
  })

  test('formats IPv6 hosts with brackets', () => {
    expect(formatWsUrl('ws', '2001:db8::1', 9100)).toBe('ws://[2001:db8::1]:9100')
    expect(formatWsUrl('ws', '192.168.1.8', 9100)).toBe('ws://192.168.1.8:9100')
  })
})

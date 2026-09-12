import { describe, expect, it } from 'bun:test'
import {
  assessEndpoints,
  assessReachability,
  classifyAddress,
  endpointAddress,
} from '../reachability'

describe('classifyAddress', () => {
  it('separates the ranges that matter for reach', () => {
    expect(classifyAddress('127.0.0.1')).toBe('loopback')
    expect(classifyAddress('::1')).toBe('loopback')
    expect(classifyAddress('169.254.3.4')).toBe('link-local')
    expect(classifyAddress('fe80::1')).toBe('link-local')
    expect(classifyAddress('100.92.3.4')).toBe('overlay')
    expect(classifyAddress('10.0.0.5')).toBe('private')
    expect(classifyAddress('192.168.1.20')).toBe('private')
    expect(classifyAddress('172.16.0.1')).toBe('private')
    expect(classifyAddress('172.32.0.1')).toBe('public')
    expect(classifyAddress('fd00::1')).toBe('private')
    expect(classifyAddress('203.0.113.7')).toBe('public')
    expect(classifyAddress('2001:db8::1')).toBe('public')
    expect(classifyAddress('fleet.example.com')).toBe('public')
    expect(classifyAddress('')).toBe('loopback')
  })

  it('treats 100.64/10 as overlay, not as a plain private range', () => {
    expect(classifyAddress('100.63.0.1')).toBe('public')
    expect(classifyAddress('100.64.0.1')).toBe('overlay')
    expect(classifyAddress('100.127.255.254')).toBe('overlay')
    expect(classifyAddress('100.128.0.1')).toBe('public')
  })
})

describe('assessReachability is honest about what a link can do', () => {
  it('says none when nothing is publishable', () => {
    expect(assessReachability(['127.0.0.1', 'fe80::1']).verdict).toBe('none')
    expect(assessReachability([]).verdict).toBe('none')
  })

  it('says lan-only for a machine that only has a private address', () => {
    expect(assessReachability(['192.168.1.20']).verdict).toBe('lan-only')
  })

  it('says lan-or-overlay once an overlay interface exists', () => {
    expect(assessReachability(['192.168.1.20', '100.92.3.4']).verdict).toBe('lan-or-overlay')
  })

  it('says anywhere only with a routable address', () => {
    expect(assessReachability(['192.168.1.20', '100.92.3.4', '203.0.113.7']).verdict).toBe('anywhere')
  })

  it('never counts loopback or link-local as reach', () => {
    expect(assessReachability(['127.0.0.1', '169.254.1.1', '192.168.0.2']).verdict).toBe('lan-only')
  })
})

describe('endpoint parsing', () => {
  it('pulls the address out of a ws endpoint, brackets and all', () => {
    expect(endpointAddress('ws://192.168.1.20:9100')).toBe('192.168.1.20')
    expect(endpointAddress('wss://[2001:db8::1]:9100')).toBe('2001:db8::1')
    expect(endpointAddress('garbage')).toBe('')
  })

  it('assesses a published endpoint list the way the link would be used', () => {
    expect(assessEndpoints(['ws://192.168.1.20:9100', 'ws://100.92.3.4:9100']).verdict)
      .toBe('lan-or-overlay')
    expect(assessEndpoints(['ws://127.0.0.1:9100']).verdict).toBe('none')
    expect(assessEndpoints(['nonsense']).verdict).toBe('none')
  })
})

import { describe, expect, it } from 'bun:test'
import { buildDomSnapshotScript } from './design-dom-snapshot'

describe('design dom snapshot', () => {
  it('builds an evaluator script for selector-based snapshots', () => {
    expect(buildDomSnapshotScript('#hero')).toContain('document.querySelector(selector)')
    expect(buildDomSnapshotScript('#hero')).toContain('computedStyle')
  })
})

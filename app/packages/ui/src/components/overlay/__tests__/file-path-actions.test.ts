import { describe, expect, it } from 'bun:test'
import { hasHostFilePathActions } from '../FullscreenOverlayBaseHeader'

describe('overlay file-path actions', () => {
  const open = () => {}
  const reveal = () => {}

  it('keeps virtual display paths static even when the host supports file actions', () => {
    expect(hasHostFilePathActions(false, open, reveal)).toBe(false)
  })

  it('exposes actions only for a real path with at least one host capability', () => {
    expect(hasHostFilePathActions(true, open, undefined)).toBe(true)
    expect(hasHostFilePathActions(true, undefined, reveal)).toBe(true)
    expect(hasHostFilePathActions(true, undefined, undefined)).toBe(false)
  })
})

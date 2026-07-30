import { afterEach, describe, expect, it } from 'bun:test'
import { observeOpenOverlay } from '../open-overlay-observer'

const originalDocument = globalThis.document
const originalMutationObserver = globalThis.MutationObserver

afterEach(() => {
  ;(globalThis as unknown as { document: Document | undefined }).document = originalDocument
  ;(globalThis as unknown as { MutationObserver: typeof MutationObserver | undefined }).MutationObserver =
    originalMutationObserver
})

describe('observeOpenOverlay', () => {
  it('reports renderer overlays opening and closing', () => {
    let overlayOpen = false
    const callbackHolder: { current?: MutationCallback } = {}
    let disconnected = false

    ;(globalThis as unknown as { document: object }).document = {
      body: {},
      querySelector: () => overlayOpen ? {} : null,
    }
    ;(globalThis as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver =
      class {
        constructor(callback: MutationCallback) {
          callbackHolder.current = callback
        }
        observe() {}
        disconnect() {
          disconnected = true
        }
        takeRecords() {
          return []
        }
      } as unknown as typeof MutationObserver

    const states: boolean[] = []
    const cleanup = observeOpenOverlay((open) => states.push(open))
    overlayOpen = true
    callbackHolder.current?.([], {} as MutationObserver)
    overlayOpen = false
    callbackHolder.current?.([], {} as MutationObserver)
    cleanup()

    expect(states).toEqual([false, true, false])
    expect(disconnected).toBe(true)
  })

  it('ignores a queued observer callback after cleanup', () => {
    let overlayOpen = false
    const callbackHolder: { current?: MutationCallback } = {}

    ;(globalThis as unknown as { document: object }).document = {
      body: {},
      querySelector: () => overlayOpen ? {} : null,
    }
    ;(globalThis as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver =
      class {
        constructor(callback: MutationCallback) {
          callbackHolder.current = callback
        }
        observe() {}
        disconnect() {}
        takeRecords() {
          return []
        }
      } as unknown as typeof MutationObserver

    const states: boolean[] = []
    const cleanup = observeOpenOverlay((open) => states.push(open))
    cleanup()

    overlayOpen = true
    callbackHolder.current?.([], {} as MutationObserver)

    expect(states).toEqual([false])
  })
})

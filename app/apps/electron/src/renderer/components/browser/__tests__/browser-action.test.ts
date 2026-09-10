import { describe, expect, it } from 'bun:test'
import { getBrowserActionErrorMessage, runConfirmedBrowserAction } from '../browser-action'

describe('runConfirmedBrowserAction', () => {
  it('commits renderer state only after the native action succeeds', async () => {
    const events: string[] = []
    const result = await runConfirmedBrowserAction(async () => {
      events.push('native')
    }, () => {
      events.push('renderer')
    })

    expect(result).toEqual({ ok: true })
    expect(events).toEqual(['native', 'renderer'])
  })

  it('preserves renderer state when the native action fails', async () => {
    const failure = new Error('browser host disconnected')
    let committed = false
    const result = await runConfirmedBrowserAction(
      async () => { throw failure },
      () => { committed = true },
    )

    expect(result).toEqual({ ok: false, error: failure })
    expect(committed).toBe(false)
    expect(getBrowserActionErrorMessage(failure)).toBe('browser host disconnected')
  })
})

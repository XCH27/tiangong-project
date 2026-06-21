import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type DesignAction } from '@craft-agent/shared/protocol'
import { BrowserPaneDesignDomWriter } from './design-browser-dom-writer'
import type { DomPatchBatch, DomPatchContext } from './design-dom-applier'

const SESSION = 'session-browser-dom'

function context(): DomPatchContext {
  const action: DesignAction = {
    actionId: 'action-browser-dom',
    sessionId: SESSION,
    selectionId: 'selection-browser-dom',
    actor: USER_ACTOR,
    origin: 'human_ui',
    op: { kind: 'set_style', props: { color: 'red' } },
  }
  return { sessionId: SESSION, action, selection: null }
}

function batch(): DomPatchBatch {
  return {
    kind: 'dom_batch',
    operations: [
      {
        kind: 'set_style',
        surface: 'browser',
        locator: { browserPaneId: 'pane-1', selector: '#hero' },
        props: { color: 'red', width: '240px', opacity: null },
      },
      {
        kind: 'set_text',
        surface: 'browser',
        locator: { browserPaneId: 'pane-1', selector: '#title' },
        text: 'New title',
      },
    ],
  }
}

describe('BrowserPaneDesignDomWriter', () => {
  it('applies and reverts DOM batches through BrowserPane evaluate', async () => {
    const calls: Array<{ id: string; expression: string }> = []
    const writer = new BrowserPaneDesignDomWriter({
      resolveBrowserPaneManager: () => ({
        evaluate: async (id: string, expression: string) => {
          calls.push({ id, expression })
          return { applied: 2, missing: [] }
        },
      }),
    })

    await writer.applyDomPatch(batch(), context())
    await writer.revertDomPatch(batch(), context())

    expect(calls).toHaveLength(2)
    expect(calls[0]?.id).toBe('pane-1')
    expect(calls[0]?.expression).toContain('"#hero"')
    expect(calls[0]?.expression).toContain('"set_text"')
  })

  it('groups operations by browser pane id', async () => {
    const calls: string[] = []
    const writer = new BrowserPaneDesignDomWriter({
      resolveBrowserPaneManager: () => ({
        evaluate: async (id: string) => {
          calls.push(id)
          return { applied: 1, missing: [] }
        },
      }),
    })

    await writer.applyDomPatch({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', surface: 'browser', locator: { browserPaneId: 'pane-1', selector: '#a' }, props: { color: 'red' } },
        { kind: 'set_style', surface: 'browser', locator: { browserPaneId: 'pane-2', selector: '#b' }, props: { color: 'blue' } },
      ],
    }, context())

    expect(calls.sort()).toEqual(['pane-1', 'pane-2'])
  })

  it('rejects operations without a browser pane id', async () => {
    const writer = new BrowserPaneDesignDomWriter({
      resolveBrowserPaneManager: () => ({ evaluate: async () => ({ applied: 1, missing: [] }) }),
    })

    await expect(writer.applyDomPatch({
      kind: 'dom_batch',
      operations: [
        { kind: 'set_style', surface: 'browser', locator: { selector: '#a' }, props: { color: 'red' } },
      ],
    }, context())).rejects.toThrow(/browser pane id/i)
  })

  it('rejects when the page reports missing DOM targets', async () => {
    const writer = new BrowserPaneDesignDomWriter({
      resolveBrowserPaneManager: () => ({
        evaluate: async () => ({ applied: 0, missing: ['#missing'] }),
      }),
    })

    await expect(writer.applyDomPatch(batch(), context())).rejects.toThrow(/Missing DOM targets.*#missing/)
  })
})

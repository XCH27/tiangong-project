import { describe, expect, it } from 'bun:test'
import {
  closeWorkbenchModule,
  getActiveWorkbenchBrowserResource,
  getBrowserResourceToDetachBeforeSelection,
  getVisibleWorkbenchEntries,
  getVisibleWorkbenchTabCount,
  getWorkbenchHeaderMode,
  getPersistableWorkbenchState,
  isRightWorkbenchAvailable,
  openWorkbenchModule,
  prepareWorkbenchRendererOverlay,
  restorePersistedWorkbenchState,
  type RightWorkbenchState,
} from '../right-workbench'

describe('right workbench model', () => {
  it('uses a centered panel header for one module and browser-style tabs for multiple modules', () => {
    expect(getWorkbenchHeaderMode(1)).toBe('single')
    expect(getWorkbenchHeaderMode(2)).toBe('tabs')
    expect(getWorkbenchHeaderMode(0)).toBe('empty')
  })

  it('limits the workbench to the shared project-task and conversation navigator', () => {
    expect(isRightWorkbenchAvailable({
      navigator: 'sessions',
      filter: { kind: 'projectSessions' },
      details: null,
    })).toBe(true)
    expect(isRightWorkbenchAvailable({
      navigator: 'sessions',
      filter: { kind: 'conversations' },
      details: null,
    })).toBe(true)

    expect(isRightWorkbenchAvailable({
      navigator: 'sources',
      details: null,
      rightSidebar: { type: 'workbench' },
    })).toBe(false)
    expect(isRightWorkbenchAvailable({ navigator: 'settings', subpage: null })).toBe(false)
    expect(isRightWorkbenchAvailable({ navigator: 'skills', details: null })).toBe(false)
    expect(isRightWorkbenchAvailable({ navigator: 'automations', details: null })).toBe(false)
    expect(isRightWorkbenchAvailable({ navigator: 'projects', details: null })).toBe(false)
  })

  it('opens repeatable modules and focuses the newest instance', () => {
    const initial: RightWorkbenchState = { entries: [], activeId: null }
    const one = openWorkbenchModule(initial, 'terminal')
    const two = openWorkbenchModule(one, 'terminal')

    expect(two.entries).toHaveLength(2)
    expect(two.entries[0]?.kind).toBe('terminal')
    expect(two.entries[1]?.kind).toBe('terminal')
    expect(two.activeId).toBe(two.entries[1]?.id)
  })

  it('binds a side-task module to the session created by the existing session authority', () => {
    const initial: RightWorkbenchState = { entries: [], activeId: null }
    const opened = openWorkbenchModule(initial, 'side-task', { sessionId: 'session-1' })

    expect(opened.entries).toHaveLength(1)
    expect(opened.entries[0]).toMatchObject({
      kind: 'side-task',
      sessionId: 'session-1',
    })
  })

  it('focuses the nearest surviving tab when closing the active module', () => {
    const initial: RightWorkbenchState = { entries: [], activeId: null }
    const one = openWorkbenchModule(initial, 'task-board')
    const two = openWorkbenchModule(one, 'review')
    const three = openWorkbenchModule(two, 'browser')

    const closed = closeWorkbenchModule(three, three.entries[1]!.id)
    expect(closed.entries.map((entry) => entry.kind)).toEqual(['task-board', 'browser'])
    expect(closed.activeId).toBe(three.activeId)

    const activeClosed = closeWorkbenchModule(closed, closed.activeId!)
    expect(activeClosed.entries.map((entry) => entry.kind)).toEqual(['task-board'])
    expect(activeClosed.activeId).toBe(activeClosed.entries[0]?.id)

    const lastClosed = closeWorkbenchModule(activeClosed, activeClosed.activeId!)
    expect(lastClosed).toEqual({ entries: [], activeId: null })
  })

  it('identifies the embedded browser that must detach before another module is selected', () => {
    const state: RightWorkbenchState = {
      entries: [
        { id: 'browser-tab', kind: 'browser', resourceId: 'pane-1' },
        { id: 'review-tab', kind: 'review' },
      ],
      activeId: 'browser-tab',
    }

    expect(getBrowserResourceToDetachBeforeSelection(state, 'review-tab')).toBe('pane-1')
    expect(getBrowserResourceToDetachBeforeSelection(state, 'browser-tab')).toBeNull()
    expect(getBrowserResourceToDetachBeforeSelection(state, 'missing-tab')).toBeNull()
  })

  it('does not request a detach when the active module is not an embedded browser', () => {
    const state: RightWorkbenchState = {
      entries: [
        { id: 'review-tab', kind: 'review' },
        { id: 'browser-tab', kind: 'browser', resourceId: 'pane-1' },
      ],
      activeId: 'review-tab',
    }

    expect(getBrowserResourceToDetachBeforeSelection(state, 'browser-tab')).toBeNull()
  })

  it('identifies the active embedded browser before opening a renderer menu', () => {
    const state: RightWorkbenchState = {
      entries: [
        { id: 'task-board', kind: 'task-board' },
        { id: 'browser-tab', kind: 'browser', resourceId: 'pane-1' },
      ],
      activeId: 'browser-tab',
    }

    expect(getActiveWorkbenchBrowserResource(state)).toBe('pane-1')
    expect(getActiveWorkbenchBrowserResource({ ...state, activeId: 'task-board' })).toBeNull()
  })

  it('waits for the native browser to detach before allowing a renderer menu to open', async () => {
    const events: string[] = []
    const state: RightWorkbenchState = {
      entries: [{ id: 'browser-tab', kind: 'browser', resourceId: 'pane-1' }],
      activeId: 'browser-tab',
    }

    const prepared = await prepareWorkbenchRendererOverlay(state, async (resourceId) => {
      events.push(`detach:${resourceId}`)
      await Promise.resolve()
      events.push('detached')
    })
    if (prepared) events.push('open')

    expect(events).toEqual(['detach:pane-1', 'detached', 'open'])
    expect(prepared).toBe(true)
  })

  it('keeps a renderer menu closed when native browser detach fails', async () => {
    const state: RightWorkbenchState = {
      entries: [{ id: 'browser-tab', kind: 'browser', resourceId: 'pane-1' }],
      activeId: 'browser-tab',
    }

    expect(await prepareWorkbenchRendererOverlay(state, async () => {
      throw new Error('detach failed')
    })).toBe(false)
  })

  it('keeps several module tabs visible at the minimum workbench width without scrolling', () => {
    expect(getVisibleWorkbenchTabCount(320, 5)).toBe(5)
    expect(getVisibleWorkbenchTabCount(320, 7)).toBe(5)
    expect(getVisibleWorkbenchTabCount(420, 7)).toBe(7)
  })

  it('keeps the active module visible when excess tabs move into overflow', () => {
    const entries = [
      { id: 'one', kind: 'task-board' as const },
      { id: 'two', kind: 'browser' as const },
      { id: 'three', kind: 'review' as const },
      { id: 'four', kind: 'canvas' as const },
    ]

    expect(getVisibleWorkbenchEntries(entries, 'four', 2).map((entry) => entry.id)).toEqual([
      'one',
      'four',
    ])
  })

  it('restores module tabs after a renderer reload without reviving a stale BrowserView id', () => {
    const fallback: RightWorkbenchState = {
      entries: [{ id: 'default-board', kind: 'task-board' }],
      activeId: 'default-board',
    }
    const persisted = getPersistableWorkbenchState({
      entries: [
        { id: 'board', kind: 'task-board' },
        { id: 'browser', kind: 'browser', resourceId: 'native-pane-from-old-renderer' },
        { id: 'terminal', kind: 'terminal' },
      ],
      activeId: 'browser',
    })

    expect(persisted.entries.find((entry) => entry.id === 'browser')).toEqual({
      id: 'browser',
      kind: 'browser',
    })
    expect(restorePersistedWorkbenchState(persisted, fallback)).toEqual(persisted)
  })

  it('keeps an intentional empty workbench but rejects malformed persisted entries', () => {
    const fallback: RightWorkbenchState = {
      entries: [{ id: 'default-board', kind: 'task-board' }],
      activeId: 'default-board',
    }

    expect(restorePersistedWorkbenchState({ entries: [], activeId: null }, fallback)).toEqual({
      entries: [],
      activeId: null,
    })
    expect(restorePersistedWorkbenchState({
      entries: [{ id: 'duplicate', kind: 'terminal' }, { id: 'duplicate', kind: 'review' }],
      activeId: 'missing',
    }, fallback)).toEqual({
      entries: [{ id: 'duplicate', kind: 'terminal' }],
      activeId: 'duplicate',
    })
  })
})

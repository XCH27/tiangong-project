import { atom } from 'jotai'
import { atomWithStorage, createJSONStorage } from 'jotai/utils'
import type { SyncStorage, SyncStringStorage } from 'jotai/vanilla/utils/atomWithStorage'
import type { NavigationState } from '../../shared/types'
import { getKeyString, KEYS } from '@/lib/local-storage'

export type WorkbenchModuleKind =
  | 'side-task'
  | 'task-board'
  | 'browser'
  | 'review'
  | 'terminal'
  | 'canvas'

export interface WorkbenchModuleEntry {
  id: string
  kind: WorkbenchModuleKind
  resourceId?: string
  sessionId?: string
}

export interface RightWorkbenchState {
  entries: WorkbenchModuleEntry[]
  activeId: string | null
}

export type WorkbenchHeaderMode = 'empty' | 'single' | 'tabs'

export function getWorkbenchHeaderMode(entryCount: number): WorkbenchHeaderMode {
  if (entryCount === 0) return 'empty'
  return entryCount > 1 ? 'tabs' : 'single'
}

/**
 * The workbench is task context, not global application chrome. Both folder-bound
 * project tasks and folder-less conversations use the Sessions navigator; Sources,
 * Skills, Automations, Settings, and legacy Project detail pages do not.
 */
export function isRightWorkbenchAvailable(state: NavigationState): boolean {
  return state.navigator === 'sessions'
}

export function getActiveWorkbenchBrowserResource(
  state: RightWorkbenchState,
): string | null {
  const activeEntry = state.entries.find((entry) => entry.id === state.activeId)
  return activeEntry?.kind === 'browser' ? activeEntry.resourceId ?? null : null
}

/**
 * Release the native BrowserView before a renderer-owned overlay is mounted.
 * Electron composites BrowserView above renderer DOM, so CSS stacking cannot
 * make a Radix menu or dialog cover it.
 */
export async function prepareWorkbenchRendererOverlay(
  state: RightWorkbenchState,
  detach: (resourceId: string) => Promise<unknown>,
): Promise<{ ok: true } | { ok: false; reason: string; resourceId: string }> {
  const resourceId = getActiveWorkbenchBrowserResource(state)
  if (!resourceId) return { ok: true }

  try {
    await detach(resourceId)
    return { ok: true }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { ok: false, reason: reason || 'detach failed', resourceId }
  }
}

/**
 * Return the native browser resource that must be released before the
 * renderer displays another module. BrowserView content is composited above
 * renderer DOM, so changing tabs before detaching would cover the next module.
 */
export function getBrowserResourceToDetachBeforeSelection(
  state: RightWorkbenchState,
  nextId: string,
): string | null {
  if (nextId === state.activeId || !state.entries.some((entry) => entry.id === nextId)) {
    return null
  }

  return getActiveWorkbenchBrowserResource(state)
}

const WORKBENCH_TAB_MIN_WIDTH = 44
const WORKBENCH_TAB_BAR_CHROME_WIDTH = 50
const WORKBENCH_OVERFLOW_TRIGGER_WIDTH = 28

/**
 * Match BrowserTabStrip's visible-items-plus-overflow behavior while keeping
 * the five built-in module kinds visible at the 320px workbench minimum.
 */
export function getVisibleWorkbenchTabCount(
  containerWidth: number,
  entryCount: number,
): number {
  if (entryCount <= 0) return 0

  const withoutOverflow = Math.max(
    1,
    Math.floor(
      (containerWidth - WORKBENCH_TAB_BAR_CHROME_WIDTH) / WORKBENCH_TAB_MIN_WIDTH,
    ),
  )
  if (entryCount <= withoutOverflow) return entryCount

  return Math.min(
    entryCount,
    Math.max(
      1,
      Math.floor(
        (
          containerWidth
          - WORKBENCH_TAB_BAR_CHROME_WIDTH
          - WORKBENCH_OVERFLOW_TRIGGER_WIDTH
        ) / WORKBENCH_TAB_MIN_WIDTH,
      ),
    ),
  )
}

export function getVisibleWorkbenchEntries(
  entries: WorkbenchModuleEntry[],
  activeId: string | null,
  visibleCount: number,
): WorkbenchModuleEntry[] {
  if (visibleCount <= 0) return []
  if (entries.length <= visibleCount) return entries

  const visible = entries.slice(0, visibleCount)
  const activeEntry = entries.find((entry) => entry.id === activeId)
  if (!activeEntry || visible.some((entry) => entry.id === activeEntry.id)) return visible

  return [...visible.slice(0, -1), activeEntry]
}

let nextWorkbenchModuleId = 0

const WORKBENCH_MODULE_KINDS = new Set<WorkbenchModuleKind>([
  'side-task',
  'task-board',
  'browser',
  'review',
  'terminal',
  'canvas',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * BrowserView resource ids belong to the Electron main process that created
 * them. Persisting one across a renderer reload would make a dead native pane
 * look live, so restore the browser tab without its resource binding; the
 * existing EmbeddedBrowserModule creation path then acquires a fresh pane.
 */
export function getPersistableWorkbenchState(
  state: RightWorkbenchState,
): RightWorkbenchState {
  return {
    entries: state.entries.map(({ resourceId: _resourceId, ...entry }) => entry),
    activeId: state.activeId,
  }
}

/**
 * Treat renderer preferences as untrusted input. Invalid/stale entries are
 * discarded, duplicate ids cannot create ambiguous close/select behaviour,
 * and an invalid active id falls back to the first surviving entry.
 *
 * R18 modules (including task-board / review / terminal / canvas) are restored
 * when structurally valid. The top-level Board gate is separate and must not
 * silently strip workbench projections from restored state.
 */
export function restorePersistedWorkbenchState(
  value: unknown,
  fallback: RightWorkbenchState,
): RightWorkbenchState {
  if (!isRecord(value) || !Array.isArray(value.entries)) return fallback

  const ids = new Set<string>()
  const entries: WorkbenchModuleEntry[] = []
  for (const rawEntry of value.entries) {
    if (!isRecord(rawEntry)) continue
    const { id, kind, sessionId } = rawEntry
    if (
      typeof id !== 'string'
      || !id
      || ids.has(id)
      || typeof kind !== 'string'
      || !WORKBENCH_MODULE_KINDS.has(kind as WorkbenchModuleKind)
    ) continue

    ids.add(id)
    entries.push({
      id,
      kind: kind as WorkbenchModuleKind,
      ...(typeof sessionId === 'string' && sessionId ? { sessionId } : {}),
    })
  }

  // Empty after validation: stay empty (launcher), do not invent a tab.
  if (entries.length === 0) {
    return { entries: [], activeId: null }
  }

  const activeId = typeof value.activeId === 'string' && ids.has(value.activeId)
    ? value.activeId
    : entries[0]?.id ?? null
  return { entries, activeId }
}

/**
 * Drop side-task tabs whose Session no longer exists so a deleted/archived
 * session cannot leave a falsely live workbench tab.
 */
export function reconcileWorkbenchSideTasks(
  state: RightWorkbenchState,
  sessionExists: (sessionId: string) => boolean,
): RightWorkbenchState {
  const entries = state.entries.filter((entry) => {
    if (entry.kind !== 'side-task') return true
    if (!entry.sessionId) return false
    return sessionExists(entry.sessionId)
  })
  if (entries.length === state.entries.length) return state

  if (entries.length === 0) {
    return { entries: [], activeId: null }
  }

  const activeStillPresent = entries.some((entry) => entry.id === state.activeId)
  return {
    entries,
    activeId: activeStillPresent ? state.activeId : entries[0]?.id ?? null,
  }
}

export function createWorkbenchModule(
  kind: WorkbenchModuleKind,
  options?: Pick<WorkbenchModuleEntry, 'sessionId'>,
): WorkbenchModuleEntry {
  nextWorkbenchModuleId += 1
  return {
    id: `workbench-${kind}-${nextWorkbenchModuleId}-${Date.now()}`,
    kind,
    ...options,
  }
}

export function openWorkbenchModule(
  state: RightWorkbenchState,
  kind: WorkbenchModuleKind,
  options?: Pick<WorkbenchModuleEntry, 'sessionId'>,
): RightWorkbenchState {
  const entry = createWorkbenchModule(kind, options)
  return {
    entries: [...state.entries, entry],
    activeId: entry.id,
  }
}

export function closeWorkbenchModule(
  state: RightWorkbenchState,
  id: string,
): RightWorkbenchState {
  const index = state.entries.findIndex((entry) => entry.id === id)
  if (index === -1) return state

  const entries = state.entries.filter((entry) => entry.id !== id)
  if (state.activeId !== id) {
    return { entries, activeId: state.activeId }
  }

  return {
    entries,
    activeId: entries[Math.min(index, entries.length - 1)]?.id ?? null,
  }
}

const initialEntry = createWorkbenchModule('task-board')
const initialWorkbenchState: RightWorkbenchState = {
  entries: [initialEntry],
  activeId: initialEntry.id,
}

const rightWorkbenchStorage = (() => {
  // Renderer-only preferences must still be importable in non-DOM test and
  // preload contexts. Returning a no-op string store keeps the atom's default
  // state without pretending the preference was restored.
  const unavailableStorage: SyncStringStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }
  const storage = createJSONStorage<RightWorkbenchState>(() => (
    typeof window === 'undefined' ? unavailableStorage : window.localStorage
  ))
  return {
    getItem(key: string, initialValue: RightWorkbenchState) {
      return restorePersistedWorkbenchState(
        storage.getItem(key, initialValue),
        initialValue,
      )
    },
    setItem(key: string, value: RightWorkbenchState) {
      storage.setItem(key, getPersistableWorkbenchState(value))
    },
    removeItem(key: string) {
      storage.removeItem(key)
    },
    subscribe(key: string, callback: (value: RightWorkbenchState) => void, initialValue: RightWorkbenchState) {
      return storage.subscribe?.(key, (value) => {
        callback(restorePersistedWorkbenchState(value, initialValue))
      }, initialValue)
    },
  } satisfies SyncStorage<RightWorkbenchState>
})()

export const rightWorkbenchAtom = atomWithStorage<RightWorkbenchState>(
  getKeyString(KEYS.rightWorkbench),
  initialWorkbenchState,
  rightWorkbenchStorage,
  { getOnInit: true },
)

export const openWorkbenchModuleAtom = atom(
  null,
  (
    get,
    set,
    input: WorkbenchModuleKind | {
      kind: WorkbenchModuleKind
      sessionId?: string
    },
  ) => {
    const payload = typeof input === 'string' ? { kind: input } : input
    set(
      rightWorkbenchAtom,
      openWorkbenchModule(
        get(rightWorkbenchAtom),
        payload.kind,
        { sessionId: payload.sessionId },
      ),
    )
  },
)

export const closeWorkbenchModuleAtom = atom(
  null,
  (get, set, id: string) => {
    set(rightWorkbenchAtom, closeWorkbenchModule(get(rightWorkbenchAtom), id))
  },
)

export const selectWorkbenchModuleAtom = atom(
  null,
  (get, set, id: string) => {
    const state = get(rightWorkbenchAtom)
    if (!state.entries.some((entry) => entry.id === id)) return
    set(rightWorkbenchAtom, { ...state, activeId: id })
  },
)

/** Bind a module tab to the single host resource it drives. */
export const attachWorkbenchResourceAtom = atom(
  null,
  (get, set, payload: { id: string; resourceId: string }) => {
    const state = get(rightWorkbenchAtom)
    set(rightWorkbenchAtom, {
      ...state,
      entries: state.entries.map((entry) => (
        entry.id === payload.id
          ? { ...entry, resourceId: payload.resourceId }
          : entry
      )),
    })
  },
)

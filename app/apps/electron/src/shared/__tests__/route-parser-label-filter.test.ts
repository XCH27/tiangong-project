import { describe, it, expect } from 'bun:test'
import {
  parseCompoundRoute,
  buildCompoundRoute,
  parseRouteToNavigationState,
  buildRouteFromNavigationState,
  parseRightSidebarParam,
  buildRightSidebarParam,
} from '../route-parser'
import { routes } from '../routes'
import { isSessionsNavigation } from '../types'

describe('route-parser: label filter routes', () => {
  it('parses a plain label route', () => {
    const result = parseCompoundRoute('label/task')
    expect(result).not.toBeNull()
    expect(result!.sessionFilter).toEqual({ kind: 'label', labelId: 'task' })
    expect(result!.details).toBeNull()
  })

  it('round-trips a label route with session details', () => {
    const route = routes.view.label('task', 'abc123')
    expect(route).toBe('label/task/session/abc123')
    const state = parseRouteToNavigationState(route)
    if (!state || !isSessionsNavigation(state)) throw new Error('expected sessions navigation state')
    expect(state.filter).toEqual({ kind: 'label', labelId: 'task' })
    expect(state.details).toEqual({ type: 'session', sessionId: 'abc123' })
    expect(buildRouteFromNavigationState(state)).toBe('label/task/session/abc123')
  })

  it('builds label routes without details', () => {
    expect(
      buildCompoundRoute({
        navigator: 'sessions',
        sessionFilter: { kind: 'label', labelId: 'task' },
        details: null,
      })
    ).toBe('label/task')
  })

  it('a stray query tail never leaks into the parsed labelId (slash-segment invariant)', () => {
    const result = parseCompoundRoute('label/task?stray=x')
    expect(result).not.toBeNull()
    expect(result!.sessionFilter).toEqual({ kind: 'label', labelId: 'task' })
  })

  it('session ids extracted from label routes stay clean even with a query tail', () => {
    // Mirrors parseSessionIdFromRoute's segment logic (panel-stack.ts).
    const segments = 'label/task/session/abc123?stray=x'.split('?')[0].split('/')
    expect(segments[segments.indexOf('session') + 1]).toBe('abc123')
  })
})

describe('route-parser: right workbench', () => {
  it('round-trips the workbench as the single right-sidebar route authority', () => {
    const panel = parseRightSidebarParam('workbench')
    expect(panel).toEqual({ type: 'workbench' })
    expect(buildRightSidebarParam(panel)).toBe('workbench')
  })
})

describe('route-parser: Project and Conversations routes', () => {
  it('round-trips a Project-scoped Session without losing the Workspace id', () => {
    const route = routes.view.projectSessions('session-1', 'workspace/with spaces')
    expect(route).toBe('projectSessions/ws/workspace%2Fwith%20spaces/session/session-1')

    const state = parseRouteToNavigationState(route)
    if (!state || !isSessionsNavigation(state)) throw new Error('expected sessions navigation state')
    expect(state.filter).toEqual({
      kind: 'projectSessions',
      workspaceId: 'workspace/with spaces',
    })
    expect(state.details).toEqual({ type: 'session', sessionId: 'session-1' })
    expect(buildRouteFromNavigationState(state)).toBe(route)
  })

  it('round-trips a folder-less Session under Conversations', () => {
    const route = routes.view.conversations('session-2')
    const state = parseRouteToNavigationState(route)
    if (!state || !isSessionsNavigation(state)) throw new Error('expected sessions navigation state')
    expect(state.filter).toEqual({ kind: 'conversations' })
    expect(state.details).toEqual({ type: 'session', sessionId: 'session-2' })
    expect(buildRouteFromNavigationState(state)).toBe(route)
  })
})

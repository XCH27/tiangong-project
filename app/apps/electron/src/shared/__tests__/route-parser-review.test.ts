import { describe, expect, test } from 'bun:test'
import { parseRightSidebarParam, buildRightSidebarParam, parseRouteToNavigationState, buildRouteFromNavigationState } from '../route-parser'

describe('right-side review navigation', () => {
  test('round-trips turn and change IDs without mistaking slashes or unicode for route structure', () => {
    const panel = { type: 'review' as const, sessionId: 'session-1', turnId: 'turn/with ?#中文', changeId: 'edit:/src/file.ts' }
    expect(parseRightSidebarParam(buildRightSidebarParam(panel))).toEqual(panel)
    // NavigationContext serializes route and sidebar as separate URL parameters.
    const params = new URLSearchParams({ route: 'allSessions/session/session-1', sidebar: buildRightSidebarParam(panel)! })
    const restored = new URLSearchParams(params.toString())
    const state = parseRouteToNavigationState(restored.get('route')!, restored.get('sidebar')!)!
    expect(state.rightSidebar).toEqual(panel)
    expect(parseRouteToNavigationState(buildRouteFromNavigationState(state), buildRightSidebarParam(state.rightSidebar))?.rightSidebar).toEqual(panel)
  })
  test('keeps all-changes and existing file routes, rejects corrupt review targets', () => {
    expect(parseRightSidebarParam('review')).toEqual({ type: 'review' })
    expect(parseRightSidebarParam('files')).toEqual({ type: 'files', path: undefined })
    expect(parseRightSidebarParam('review/%broken')).toBeUndefined()
    expect(parseRightSidebarParam('review/a/b/c/d')).toBeUndefined()
  })
})

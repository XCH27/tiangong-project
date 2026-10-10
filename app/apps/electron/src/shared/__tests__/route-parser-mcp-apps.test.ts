import { describe, expect, test } from 'bun:test'
import { buildRightSidebarParam, parseRightSidebarParam, parseRouteToNavigationState } from '../route-parser'

describe('mcp apps right sidebar', () => {
  test('an open pane and a focused tool round-trip through the existing sidebar param', () => {
    expect(buildRightSidebarParam({ type: 'mcp-apps' })).toBe('mcp-apps')
    expect(parseRightSidebarParam('mcp-apps')).toEqual({ type: 'mcp-apps' })

    const focused = {
      type: 'mcp-apps' as const,
      focus: { pluginId: 'mcp:docs', kind: 'tool' as const, itemId: 'search' },
    }
    const param = buildRightSidebarParam(focused)
    expect(parseRightSidebarParam(param)).toEqual(focused)
    expect(parseRouteToNavigationState('allSessions', param)?.rightSidebar).toEqual(focused)
  })

  test('history and files stay on their params and an unknown sidebar is rejected', () => {
    expect(buildRightSidebarParam({ type: 'history' })).toBe('history')
    expect(parseRightSidebarParam('files/src/main.ts')).toEqual({ type: 'files', path: 'src/main.ts' })
    expect(buildRightSidebarParam({ type: 'none' })).toBeUndefined()
    expect(parseRightSidebarParam('marketplace')).toBeUndefined()
  })
})

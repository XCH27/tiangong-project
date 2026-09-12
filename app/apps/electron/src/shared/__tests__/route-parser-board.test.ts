import { describe, expect, it } from 'bun:test'
import {
  parseCompoundRoute,
  parseRouteToNavigationState,
  buildRouteFromNavigationState,
} from '../route-parser'
import { isBoardNavigation, isSessionsNavigation } from '../types'

describe('board is not a session view mode', () => {
  it('parses /board as its own navigator', () => {
    const compound = parseCompoundRoute('board')
    expect(compound?.navigator).toBe('board')
    const state = parseRouteToNavigationState('board')
    expect(state && isBoardNavigation(state)).toBe(true)
    expect(state && isSessionsNavigation(state)).toBe(false)
  })

  it('round-trips board without becoming allSessions', () => {
    const state = parseRouteToNavigationState('board')
    expect(state).not.toBeNull()
    expect(buildRouteFromNavigationState(state!)).toBe('board')
  })
})

import { expect, test } from 'bun:test'
import { parseRouteToNavigationState } from '../route-parser'
import { SETTINGS_PAGES } from '../settings-registry'

test('legacy archive list links resolve to the single Settings archive home', () => {
  expect(parseRouteToNavigationState('archived')).toEqual(parseRouteToNavigationState('settings/archived'))
  expect(parseRouteToNavigationState('archived')).toMatchObject({ navigator: 'settings', subpage: 'archived' })
  expect(SETTINGS_PAGES.filter(page => page.id === 'archived')).toHaveLength(1)
})

test('archived conversation links still open their conversation', () => {
  expect(parseRouteToNavigationState('archived/session/session-1')).toMatchObject({
    navigator: 'sessions', filter: { kind: 'archived' }, details: { sessionId: 'session-1' },
  })
})

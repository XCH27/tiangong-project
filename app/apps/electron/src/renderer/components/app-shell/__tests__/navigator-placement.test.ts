import { expect, test } from 'bun:test'
import { navigatorPlacement } from '../navigator-placement'

test('entity lists move into one sidebar without flattening Settings', () => {
  for (const kind of ['sessions', 'sources', 'skills', 'automations', 'projects']) {
    expect(navigatorPlacement(kind, false, true)).toBe('sidebar')
    expect(navigatorPlacement(kind, true, false)).toBe('navigator')
    expect(navigatorPlacement(kind, false, false)).toBe('navigator')
  }
  expect(navigatorPlacement('settings', false, true)).toBe('navigator')
  expect(navigatorPlacement('board', false, true)).toBe('none')
  expect(navigatorPlacement('pages', false, true)).toBe('none')
})

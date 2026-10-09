import { describe, expect, test } from 'bun:test'
import { parseCompoundRoute } from '../route-parser'
import { isValidSettingsSubpage, SETTINGS_PAGES } from '../settings-registry'

describe('settings plugins route', () => {
  test('settings/plugins is one settings subpage', () => {
    expect(isValidSettingsSubpage('plugins')).toBe(true)
    expect(SETTINGS_PAGES.some((page) => page.id === 'plugins')).toBe(true)
    expect(parseCompoundRoute('settings/plugins')).toEqual({
      navigator: 'settings',
      details: { type: 'plugins', id: 'plugins' },
    })
  })

  test('an unknown settings subpage stays rejected', () => {
    expect(isValidSettingsSubpage('marketplace')).toBe(false)
    expect(parseCompoundRoute('settings/marketplace')).toBeNull()
  })
})

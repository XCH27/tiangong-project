import { describe, expect, test } from 'bun:test'

import { buildMobileMenuPages } from '../mobile-menu-pages'

describe('Craft app menu pages', () => {
  test('nests What\'s New inside Debug instead of the Craft menu root', () => {
    const pages = buildMobileMenuPages({ hasNewWindow: true, isDebugMode: true })
    const root = pages.find(page => page.id === 'root')
    const debug = pages.find(page => page.id === 'debug')

    expect(root?.rows.map(row => row.id)).not.toContain('whats-new')
    expect(debug?.rows.map(row => row.id)).toEqual([
      'checkForUpdates',
      'installUpdate',
      'whats-new',
      'toggleDevTools',
    ])
    expect(debug?.rows.find(row => row.id === 'whats-new')?.action).toEqual({
      kind: 'callback',
      key: 'openWhatsNew',
    })
  })
})

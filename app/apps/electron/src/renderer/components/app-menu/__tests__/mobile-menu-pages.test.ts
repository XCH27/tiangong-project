import { describe, expect, test } from 'bun:test'

import { buildMobileMenuPages } from '../mobile-menu-pages'

describe('Craft app menu pages', () => {
  test('keeps What\'s New in the Craft menu root instead of the sidebar', () => {
    const pages = buildMobileMenuPages({ hasNewWindow: true, isDebugMode: true })
    const root = pages.find(page => page.id === 'root')

    expect(root?.rows.map(row => row.id)).toContain('whats-new')
    expect(root?.rows.find(row => row.id === 'whats-new')?.action).toEqual({
      kind: 'callback',
      key: 'openWhatsNew',
    })
  })
})

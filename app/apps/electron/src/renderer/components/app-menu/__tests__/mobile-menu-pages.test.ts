import { describe, expect, test } from 'bun:test'

import { buildMobileMenuPages } from '../mobile-menu-pages'
import { HELP_LINKS } from '../../../../shared/menu-schema'
import { getDocsHomeUrl, getDocUrl } from '@craft-agent/shared/docs/doc-links'

describe('Craft app menu pages', () => {
  test('keeps global search reachable in compact mode', () => {
    const pages = buildMobileMenuPages({ hasNewWindow: true, isDebugMode: false })
    const root = pages.find(page => page.id === 'root')

    expect(root?.rows.find(row => row.id === 'global-search')).toEqual({
      id: 'global-search',
      iconName: 'Search',
      labelKey: 'globalSearch.open',
      action: { kind: 'callback', key: 'openGlobalSearch' },
    })
  })

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

  test('uses the canonical Help directory for every documentation entry', () => {
    const pages = buildMobileMenuPages({ hasNewWindow: true, isDebugMode: false })
    const help = pages.find(page => page.id === 'help')

    expect(help?.rows).toEqual(HELP_LINKS.map(link => ({
      id: link.id,
      iconName: link.icon,
      labelKey: link.labelKey,
      action: { kind: 'url', url: link.url },
    })))
    expect(help?.rows.map(row => row.id)).toEqual([
      'help-sources',
      'help-skills',
      'help-statuses',
      'help-permissions',
      'help-automations',
      'help-messaging',
      'help-all-documentation',
    ])
    expect(HELP_LINKS.map(link => link.url)).toEqual([
      getDocUrl('sources'),
      getDocUrl('skills'),
      getDocUrl('statuses'),
      getDocUrl('permissions'),
      getDocUrl('automations'),
      getDocUrl('messaging'),
      getDocsHomeUrl(),
    ])
  })
})

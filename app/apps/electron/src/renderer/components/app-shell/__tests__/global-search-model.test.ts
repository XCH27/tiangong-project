import { describe, expect, test } from 'bun:test'

import {
  dedupeGlobalSearchItems,
  filterGlobalSearchItems,
  groupGlobalSearchItems,
  type GlobalSearchItem,
} from '../global-search-model'

const items: GlobalSearchItem[] = [
  {
    id: 'session-1',
    group: 'sessions',
    title: 'Review project search',
    subtitle: 'My Workspace',
    icon: 'MessageSquare',
    target: { type: 'session', sessionId: '1' },
  },
  {
    id: 'file-1',
    group: 'files',
    title: 'search-index.ts',
    subtitle: 'My Workspace · src/search-index.ts',
    icon: 'File',
    target: { type: 'file', path: '/workspace/src/search-index.ts', isDirectory: false },
  },
  {
    id: 'setting-1',
    group: 'settings',
    title: 'Permissions',
    keywords: 'security approval',
    icon: 'Settings',
    target: { type: 'route', route: 'settings/permissions' },
  },
]

describe('global search model', () => {
  test('matches titles, subtitles, and keywords with the shared fuzzy search', () => {
    expect(filterGlobalSearchItems(items, 'index', 10).map(item => item.id)).toEqual(['file-1'])
    expect(filterGlobalSearchItems(items, 'workspace', 10).map(item => item.id)).toEqual([
      'file-1',
      'session-1',
    ])
    expect(filterGlobalSearchItems(items, 'approval', 10).map(item => item.id)).toEqual(['setting-1'])
  })

  test('keeps canonical group order and removes duplicate projections', () => {
    const deduped = dedupeGlobalSearchItems([items[0]!, items[0]!, items[2]!, items[1]!])
    const grouped = groupGlobalSearchItems(deduped)

    expect(deduped.map(item => item.id)).toEqual(['session-1', 'setting-1', 'file-1'])
    expect([...grouped.keys()]).toEqual(['sessions', 'files', 'settings'])
  })

  test('prefers the richer subtitle when the same id appears twice', () => {
    const richer: GlobalSearchItem = {
      ...items[0]!,
      subtitle: '…matched content snippet from the transcript…',
      keywords: 'matched content snippet from the transcript',
    }
    const deduped = dedupeGlobalSearchItems([items[0]!, richer])
    expect(deduped).toHaveLength(1)
    expect(deduped[0]?.subtitle).toContain('snippet')
  })
})

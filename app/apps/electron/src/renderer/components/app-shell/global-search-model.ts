import { fuzzyFilter } from '@craft-agent/shared/search'
import type { Route } from '../../../shared/routes'

export type GlobalSearchGroup =
  | 'sessions'
  | 'projects'
  | 'files'
  | 'settings'
  | 'navigation'

export type GlobalSearchTarget =
  | {
      type: 'session'
      sessionId: string
      workingDirectory?: string
      workspaceId?: string
    }
  | { type: 'route'; route: Route }
  | { type: 'file'; path: string; isDirectory: boolean }

export interface GlobalSearchItem {
  id: string
  group: GlobalSearchGroup
  title: string
  subtitle?: string
  keywords?: string
  icon: string
  target: GlobalSearchTarget
}

export const GLOBAL_SEARCH_GROUP_ORDER: readonly GlobalSearchGroup[] = [
  'sessions',
  'projects',
  'files',
  'settings',
  'navigation',
]

function getSearchText(item: GlobalSearchItem): string {
  return [item.title, item.subtitle, item.keywords]
    .filter((value): value is string => Boolean(value))
    .join(' ')
}

export function filterGlobalSearchItems(
  items: readonly GlobalSearchItem[],
  query: string,
  limit: number,
): GlobalSearchItem[] {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return items.slice(0, limit)

  return fuzzyFilter([...items], trimmedQuery, getSearchText)
    .slice(0, limit)
    .map(result => result.item)
}

export function groupGlobalSearchItems(
  items: readonly GlobalSearchItem[],
): Map<GlobalSearchGroup, GlobalSearchItem[]> {
  const grouped = new Map<GlobalSearchGroup, GlobalSearchItem[]>()

  for (const group of GLOBAL_SEARCH_GROUP_ORDER) {
    const groupItems = items.filter(item => item.group === group)
    if (groupItems.length > 0) grouped.set(group, groupItems)
  }

  return grouped
}

/**
 * Collapse rows that project the same target. When two hits share an id
 * (title match + content snippet for the same session), keep the richer
 * subtitle so deep search can enhance the local hit without listing twice.
 */
export function dedupeGlobalSearchItems(
  items: readonly GlobalSearchItem[],
): GlobalSearchItem[] {
  const byId = new Map<string, GlobalSearchItem>()
  const order: string[] = []

  for (const item of items) {
    const existing = byId.get(item.id)
    if (!existing) {
      byId.set(item.id, item)
      order.push(item.id)
      continue
    }
    const existingScore = (existing.subtitle?.length ?? 0) + (existing.keywords?.length ?? 0)
    const nextScore = (item.subtitle?.length ?? 0) + (item.keywords?.length ?? 0)
    if (nextScore > existingScore) byId.set(item.id, item)
  }

  return order.map(id => byId.get(id)!)
}

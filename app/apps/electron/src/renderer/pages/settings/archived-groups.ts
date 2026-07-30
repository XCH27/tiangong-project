/**
 * Archived sessions projection for Settings.
 *
 * Product rule (R1 / capability map): archive is grouped by **folder-project**
 * and **Conversations**, never by the invisible Workspace storage authority.
 *
 * - Folder-bound sessions (`workingDirectory` set) belong to a Project row —
 *   today one Workspace is one Project (AppShell `workspaceProjectItems`).
 * - Folder-less sessions belong under Conversations, even when they still carry
 *   a storage `workspaceId` of the default "My Workspace".
 */

export type ArchivedGroupKind = 'conversations' | 'project'

export interface ArchivedGroupKey {
  kind: ArchivedGroupKind
  /** Workspace id for project groups; null for conversations. */
  projectWorkspaceId: string | null
}

export interface ArchivedSessionLike {
  id: string
  workspaceId?: string
  workingDirectory?: string
  projectId?: string
  isArchived?: boolean
  archivedAt?: number
  lastMessageAt?: number
  name?: string
  preview?: string
}

export interface ResolvedArchivedGroup {
  key: string
  kind: ArchivedGroupKind
  /** Stable filter value: `conversations` | workspace id */
  filterValue: string
  /** Display name resolved by the caller (i18n + workspace names). */
  projectWorkspaceId: string | null
  sessionIds: string[]
}

export const CONVERSATIONS_FILTER = 'conversations'
export const ALL_FILTER = 'all'

export function isFolderBoundSession(session: Pick<ArchivedSessionLike, 'workingDirectory'>): boolean {
  return Boolean(session.workingDirectory?.trim())
}

export function getArchivedGroupKey(session: ArchivedSessionLike): ArchivedGroupKey {
  if (!isFolderBoundSession(session)) {
    return { kind: 'conversations', projectWorkspaceId: null }
  }
  return {
    kind: 'project',
    projectWorkspaceId: session.workspaceId ?? null,
  }
}

export function archivedGroupKeyToFilterValue(key: ArchivedGroupKey): string {
  if (key.kind === 'conversations') return CONVERSATIONS_FILTER
  return key.projectWorkspaceId ?? 'unknown-project'
}

export function groupArchivedSessions(
  sessions: readonly ArchivedSessionLike[],
  options?: {
    /** `all` | `conversations` | workspace id */
    filter?: string
  },
): ResolvedArchivedGroup[] {
  const filter = options?.filter ?? ALL_FILTER
  const groups = new Map<string, ResolvedArchivedGroup>()

  for (const session of sessions) {
    if (!session.isArchived) continue
    const key = getArchivedGroupKey(session)
    const filterValue = archivedGroupKeyToFilterValue(key)

    if (filter !== ALL_FILTER && filter !== filterValue) continue

    const mapKey = `${key.kind}:${filterValue}`
    const existing = groups.get(mapKey)
    if (existing) {
      existing.sessionIds.push(session.id)
    } else {
      groups.set(mapKey, {
        key: mapKey,
        kind: key.kind,
        filterValue,
        projectWorkspaceId: key.projectWorkspaceId,
        sessionIds: [session.id],
      })
    }
  }

  // Conversations first (honest home for folder-less), then projects by name key.
  return [...groups.values()].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'conversations' ? -1 : 1
    return a.filterValue.localeCompare(b.filterValue)
  })
}

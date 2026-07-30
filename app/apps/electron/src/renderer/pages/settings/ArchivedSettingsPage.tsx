import * as React from 'react'
import { useAtomValue } from 'jotai'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { sessionMetaMapAtom, type SessionMeta } from '@/atoms/sessions'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import {
  SettingsCard,
  SettingsInput,
  SettingsRow,
  SettingsSection,
} from '@/components/settings'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppShellContext } from '@/context/AppShellContext'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import { getSessionTitle } from '@/utils/session'
import {
  groupArchivedSessions,
  isFolderBoundSession,
} from './archived-groups'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'archived',
}

/**
 * Settings projection of archived Sessions (R1 / CORE-06).
 *
 * Simple list: optional search, group by Conversations vs project folder,
 * per-row restore / delete. No scope filter chrome or bulk-delete UI.
 */
export default function ArchivedSettingsPage() {
  const { t, i18n } = useTranslation()
  const { workspaces, onDeleteSession, onUnarchiveSession } = useAppShellContext()
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const [query, setQuery] = React.useState('')

  const workspaceById = React.useMemo(() => {
    const result = new Map<string, (typeof workspaces)[number]>()
    for (const workspace of workspaces) {
      result.set(workspace.id, workspace)
      const remoteId = workspace.remoteServer?.remoteWorkspaceId
      if (remoteId) result.set(remoteId, workspace)
    }
    return result
  }, [workspaces])

  const archivedSessions = React.useMemo(
    () => [...sessionMetaMap.values()]
      .filter(session => session.isArchived)
      .sort((a, b) => (b.archivedAt ?? b.lastMessageAt ?? 0) - (a.archivedAt ?? a.lastMessageAt ?? 0)),
    [sessionMetaMap],
  )

  const searchableSessions = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return archivedSessions

    return archivedSessions.filter(session => {
      const workspace = workspaceById.get(session.workspaceId ?? '')
      const searchable = [
        getSessionTitle(session),
        session.preview,
        isFolderBoundSession(session) ? workspace?.name : t('sidebar.conversations'),
      ].filter(Boolean).join(' ').toLocaleLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [archivedSessions, query, t, workspaceById])

  const groups = React.useMemo(() => {
    return groupArchivedSessions(searchableSessions).map(group => {
      const sessions = group.sessionIds
        .map(id => sessionMetaMap.get(id))
        .filter((session): session is SessionMeta => !!session)

      if (group.kind === 'conversations') {
        return {
          key: group.key,
          title: t('sidebar.conversations'),
          sessions,
        }
      }

      const workspace = group.projectWorkspaceId
        ? workspaceById.get(group.projectWorkspaceId)
        : undefined
      return {
        key: group.key,
        title: workspace?.name ?? t('settings.archived.unknownProject'),
        sessions,
      }
    })
  }, [searchableSessions, sessionMetaMap, t, workspaceById])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader title={t('settings.archived.title')} />
      <div className="min-h-0 flex-1 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="mx-auto max-w-3xl px-5 py-7">
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="pl-1 text-sm text-muted-foreground">
                  {t('settings.archived.description')}
                </p>
                <SettingsCard>
                  <SettingsInput
                    inCard
                    value={query}
                    onChange={setQuery}
                    placeholder={t('common.search')}
                  />
                </SettingsCard>
              </div>

              {groups.map(group => (
                <SettingsSection key={group.key} title={group.title}>
                  <SettingsCard>
                    {group.sessions.map(session => (
                      <SettingsRow
                        key={session.id}
                        label={getSessionTitle(session)}
                        description={formatArchivedDate(
                          session.archivedAt ?? session.lastMessageAt,
                          i18n.resolvedLanguage,
                        )}
                        action={(
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              aria-label={t('common.delete')}
                              onClick={() => { void onDeleteSession(session.id) }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onUnarchiveSession(session.id)}
                            >
                              {t('settings.archived.restore')}
                            </Button>
                          </div>
                        )}
                      />
                    ))}
                  </SettingsCard>
                </SettingsSection>
              ))}

              {groups.length === 0 && (
                <SettingsCard className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {archivedSessions.length === 0
                      ? t('settings.archived.emptyDescription')
                      : t('settings.archived.emptyFiltered')}
                  </p>
                </SettingsCard>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function formatArchivedDate(timestamp: number | undefined, locale: string | undefined) {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

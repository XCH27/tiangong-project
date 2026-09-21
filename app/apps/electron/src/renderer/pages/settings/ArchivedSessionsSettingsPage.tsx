import { useMemo, useState } from 'react'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { SessionList } from '@/components/app-shell/SessionList'
import { HeaderIconButton } from '@/components/ui/HeaderIconButton'
import { useActiveWorkspace, useAppShellContext } from '@/context/AppShellContext'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { navigate, routes } from '@/lib/navigate'
import type { SessionFilter } from '../../../shared/types'

const ARCHIVED_FILTER: SessionFilter = { kind: 'archived' }

/** Settings projection only: no archive store or parallel CRUD implementation. */
export default function ArchivedSessionsSettingsPage() {
  const { t } = useTranslation()
  const workspace = useActiveWorkspace()
  const ctx = useAppShellContext()
  const metadata = useAtomValue(sessionMetaMapAtom)
  const [searchActive, setSearchActive] = useState(false)
  const [query, setQuery] = useState('')
  const items = useMemo(() => Array.from(metadata.values()).filter(session =>
    !session.hidden && session.isArchived && !!workspace &&
    (session.workspaceId === workspace.id || session.workspaceId === workspace.remoteServer?.remoteWorkspaceId)
  ), [metadata, workspace])

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title={t('sidebar.archived')} actions={
        <HeaderIconButton icon={<Search className="h-4 w-4" />} tooltip={t('common.search')}
          onClick={() => setSearchActive(true)} />
      } />
      <SessionList
        items={items}
        filterOverride={ARCHIVED_FILTER}
        workspaceId={workspace?.id}
        onDelete={ctx.onDeleteSession}
        onUnarchive={ctx.onUnarchiveSession}
        onFlag={ctx.onFlagSession}
        onUnflag={ctx.onUnflagSession}
        onMarkUnread={ctx.onMarkSessionUnread}
        onRename={ctx.onRenameSession}
        onSessionStatusChange={ctx.onSessionStatusChange}
        sessionStatuses={ctx.sessionStatuses}
        labels={ctx.labels}
        onLabelsChange={ctx.onSessionLabelsChange}
        onNavigateToSession={id => navigate(routes.view.allSessions(id))}
        onOpenInNewWindow={session => {
          if (workspace) void window.electronAPI.openSessionInNewWindow(workspace.id, session.id)
        }}
        searchActive={searchActive}
        searchQuery={query}
        onSearchChange={setQuery}
        onSearchClose={() => { setSearchActive(false); setQuery('') }}
      />
    </div>
  )
}

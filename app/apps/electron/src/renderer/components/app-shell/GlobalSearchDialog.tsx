import * as React from 'react'
import { Command as CommandPrimitive } from 'cmdk'
import * as Icons from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSessionTitle } from '@/utils/session'
import { routes, type Route } from '@/lib/navigate'
import type { SessionMeta } from '@/atoms/sessions'
import { SETTINGS_ITEMS } from '../../../shared/menu-schema'
import type { FileSearchResult, Workspace } from '../../../shared/types'
import {
  dedupeGlobalSearchItems,
  filterGlobalSearchItems,
  GLOBAL_SEARCH_GROUP_ORDER,
  groupGlobalSearchItems,
  type GlobalSearchGroup,
  type GlobalSearchItem,
} from './global-search-model'

/** Local memory hits show immediately; depth search starts after this length. */
const ASYNC_QUERY_MIN_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 180

/**
 * Cap list height so the dialog always has a real scrollport. Relying on
 * flex-1 alone fails because DialogContent defaults to CSS grid.
 */
const RESULTS_MAX_HEIGHT = 'max-h-[min(52vh,440px)]'

const GROUP_LIMITS: Record<GlobalSearchGroup, number> = {
  sessions: 8,
  projects: 6,
  files: 12,
  settings: 8,
  navigation: 8,
}

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaces: Workspace[]
  sessions: SessionMeta[]
  onOpenSession: (session: SessionMeta) => void
  onOpenFile: (path: string) => void
  onNavigate: (route: Route) => void
}

interface AsyncSearchState {
  items: GlobalSearchItem[]
  isLoading: boolean
  isPartiallyUnavailable: boolean
}

const EMPTY_ASYNC_STATE: AsyncSearchState = {
  items: [],
  isLoading: false,
  isPartiallyUnavailable: false,
}

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  return (Icons[name as keyof typeof Icons] as React.ComponentType<{ className?: string }> | undefined)
    ?? Icons.Search
}

function GlobalSearchRow({
  item,
  onSelect,
}: {
  item: GlobalSearchItem
  onSelect: () => void
}) {
  const Icon = getIcon(item.icon)
  const fullTitle = item.title
  const fullSubtitle = item.subtitle

  return (
    <CommandPrimitive.Item
      value={item.id}
      onSelect={onSelect}
      className={cn(
        'mx-2 flex cursor-pointer select-none items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-[13px] outline-none',
        'data-[selected=true]:bg-foreground/[0.07]',
        'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50',
      )}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/50" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-foreground" title={fullTitle}>
          {item.title}
        </div>
        {fullSubtitle ? (
          <div
            className="mt-0.5 truncate text-xs leading-snug text-foreground/40"
            title={fullSubtitle}
          >
            {fullSubtitle}
          </div>
        ) : null}
      </div>
    </CommandPrimitive.Item>
  )
}

function KbdHint({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-foreground/10 bg-foreground/[0.05] px-1 font-sans text-[10px] font-medium text-foreground/40">
      {children}
    </kbd>
  )
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  workspaces,
  sessions,
  onOpenSession,
  onOpenFile,
  onNavigate,
}: GlobalSearchDialogProps) {
  const { t } = useTranslation()
  const [query, setQuery] = React.useState('')
  const [activeValue, setActiveValue] = React.useState('')
  const [retryNonce, setRetryNonce] = React.useState(0)
  const [asyncState, setAsyncState] = React.useState<AsyncSearchState>(EMPTY_ASYNC_STATE)
  const listRef = React.useRef<HTMLDivElement>(null)

  const workspaceNameById = React.useMemo(() => {
    const names = new Map<string, string>()
    for (const workspace of workspaces) {
      names.set(workspace.id, workspace.name)
      if (workspace.remoteServer?.remoteWorkspaceId) {
        names.set(workspace.remoteServer.remoteWorkspaceId, workspace.name)
      }
    }
    return names
  }, [workspaces])

  const sortedSessions = React.useMemo(
    () => [...sessions].sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)),
    [sessions],
  )

  const baseItems = React.useMemo<GlobalSearchItem[]>(() => {
    const sessionItems = sortedSessions.map<GlobalSearchItem>(session => ({
      id: `session:${session.id}`,
      group: 'sessions',
      title: getSessionTitle(session),
      subtitle: workspaceNameById.get(session.workspaceId),
      keywords: session.preview,
      icon: 'MessageSquare',
      target: {
        type: 'session',
        sessionId: session.id,
        workingDirectory: session.workingDirectory,
        workspaceId: session.workspaceId,
      },
    }))

    const projectItems = workspaces.map<GlobalSearchItem>(workspace => ({
      id: `project:${workspace.id}`,
      group: 'projects',
      title: workspace.name,
      subtitle: workspace.rootPath,
      keywords: `${workspace.id} ${workspace.remoteServer ? 'remote' : 'local'}`,
      icon: workspace.remoteServer ? 'Cloud' : 'Folder',
      target: {
        type: 'route',
        route: routes.view.projectSessions(
          undefined,
          workspace.remoteServer?.remoteWorkspaceId ?? workspace.id,
        ),
      },
    }))

    const settingItems = SETTINGS_ITEMS.map<GlobalSearchItem>(setting => ({
      id: `setting:${setting.id}`,
      group: 'settings',
      title: t(setting.labelKey),
      subtitle: t(setting.descriptionKey),
      keywords: setting.id,
      icon: setting.icon,
      target: { type: 'route', route: routes.view.settings(setting.id) },
    }))

    const navigationItems: GlobalSearchItem[] = [
      {
        id: 'navigation:new-task',
        group: 'navigation',
        title: t('menu.newChat'),
        keywords: 'new task create session 新建任务',
        icon: 'SquarePen',
        target: { type: 'route', route: routes.action.newSession() },
      },
      {
        id: 'navigation:projects',
        group: 'navigation',
        title: t('sidebar.projects'),
        keywords: 'projects folders 项目 文件夹',
        icon: 'FolderKanban',
        target: { type: 'route', route: routes.view.projectSessions() },
      },
      {
        id: 'navigation:conversations',
        group: 'navigation',
        title: t('sidebar.conversations'),
        keywords: 'conversations chats 对话',
        icon: 'MessagesSquare',
        target: { type: 'route', route: routes.view.conversations() },
      },
      {
        id: 'navigation:sources',
        group: 'navigation',
        title: t('sidebar.sources'),
        keywords: 'sources api mcp local data 数据源',
        icon: 'DatabaseZap',
        target: { type: 'route', route: routes.view.sources() },
      },
      {
        id: 'navigation:skills',
        group: 'navigation',
        title: t('sidebar.skills'),
        keywords: 'skills 技能',
        icon: 'Zap',
        target: { type: 'route', route: routes.view.skills() },
      },
      {
        id: 'navigation:automations',
        group: 'navigation',
        title: t('sidebar.automations'),
        keywords: 'automations schedules 自动化',
        icon: 'Webhook',
        target: { type: 'route', route: routes.view.automations() },
      },
      {
        id: 'navigation:flagged',
        group: 'navigation',
        title: t('sidebar.flagged'),
        keywords: 'flagged starred 已标记',
        icon: 'Flag',
        target: { type: 'route', route: routes.view.flagged() },
      },
      {
        id: 'navigation:archived',
        group: 'navigation',
        title: t('sidebar.archived'),
        keywords: 'archived history 已归档',
        icon: 'Archive',
        target: { type: 'route', route: routes.view.settings('archived') },
      },
    ]

    return [...sessionItems, ...projectItems, ...settingItems, ...navigationItems]
  }, [sortedSessions, t, workspaceNameById, workspaces])

  React.useEffect(() => {
    const trimmedQuery = query.trim()
    if (!open || trimmedQuery.length < ASYNC_QUERY_MIN_LENGTH) {
      setAsyncState(EMPTY_ASYNC_STATE)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setAsyncState(previous => ({
        ...previous,
        isLoading: true,
        isPartiallyUnavailable: false,
      }))

      const uniqueRoots = new Map<string, Workspace>()
      for (const workspace of workspaces) {
        if (workspace.rootPath && !uniqueRoots.has(workspace.rootPath)) {
          uniqueRoots.set(workspace.rootPath, workspace)
        }
      }

      const workspaceIds = [...new Set(sessions.map(session => session.workspaceId).filter(Boolean))]

      const [fileSearches, sessionSearches] = await Promise.all([
        Promise.allSettled(
          [...uniqueRoots.values()].map(async workspace => ({
            workspace,
            results: await window.electronAPI.searchFiles(workspace.rootPath, trimmedQuery),
          })),
        ),
        Promise.allSettled(
          workspaceIds.map(async (workspaceId, index) => ({
            workspaceId,
            results: await window.electronAPI.searchSessionContent(
              workspaceId,
              trimmedQuery,
              `global:${Date.now().toString(36)}:${index}`,
            ),
          })),
        ),
      ])

      if (cancelled) return

      const fileItems = fileSearches.flatMap<GlobalSearchItem>(result => {
        if (result.status === 'rejected') return []
        const { workspace, results } = result.value
        return results.map((file: FileSearchResult) => ({
          id: `file:${workspace.id}:${file.path}`,
          group: 'files',
          title: file.name,
          subtitle: `${workspace.name} · ${file.relativePath}`,
          keywords: `${file.relativePath} ${workspace.rootPath}`,
          icon: file.type === 'directory' ? 'Folder' : 'File',
          target: {
            type: 'file',
            path: file.path,
            isDirectory: file.type === 'directory',
          },
        }))
      })

      const sessionById = new Map(sessions.map(session => [session.id, session]))
      const contentItems = sessionSearches.flatMap<GlobalSearchItem>(result => {
        if (result.status === 'rejected') return []
        return result.value.results.flatMap(searchResult => {
          const session = sessionById.get(searchResult.sessionId)
          if (!session) return []
          const snippet = searchResult.matches[0]?.snippet.trim()
          return [{
            // Same id as the base session row so dedupe keeps one entry, but
            // content items are merged first so the snippet becomes subtitle.
            id: `session:${session.id}`,
            group: 'sessions' as const,
            title: getSessionTitle(session),
            subtitle: snippet || workspaceNameById.get(session.workspaceId),
            keywords: `${session.preview ?? ''} ${snippet ?? ''}`,
            icon: 'MessageSquare',
            target: {
              type: 'session' as const,
              sessionId: session.id,
              workingDirectory: session.workingDirectory,
              workspaceId: session.workspaceId,
            },
          }]
        })
      })

      setAsyncState({
        items: [...contentItems, ...fileItems],
        isLoading: false,
        isPartiallyUnavailable: [...fileSearches, ...sessionSearches]
          .some(result => result.status === 'rejected'),
      })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, query, retryNonce, sessions, workspaceNameById, workspaces])

  const visibleItems = React.useMemo(() => {
    // Memory hits first for instant list; async content/files override by id.
    const candidates = dedupeGlobalSearchItems([...asyncState.items, ...baseItems])
    return GLOBAL_SEARCH_GROUP_ORDER.flatMap(group =>
      filterGlobalSearchItems(
        candidates.filter(item => item.group === group),
        query,
        GROUP_LIMITS[group],
      ),
    )
  }, [asyncState.items, baseItems, query])

  const groupedItems = React.useMemo(
    () => groupGlobalSearchItems(visibleItems),
    [visibleItems],
  )

  React.useEffect(() => {
    if (visibleItems.length === 0) {
      setActiveValue('')
      return
    }
    if (!visibleItems.some(item => item.id === activeValue)) {
      setActiveValue(visibleItems[0]!.id)
    }
  }, [activeValue, visibleItems])

  // When the active item changes (keyboard), keep it in the scrollport.
  React.useEffect(() => {
    if (!activeValue || !listRef.current) return
    const selected = listRef.current.querySelector<HTMLElement>('[data-selected="true"]')
    selected?.scrollIntoView({ block: 'nearest' })
  }, [activeValue, visibleItems])

  const close = React.useCallback(() => {
    onOpenChange(false)
    setQuery('')
    setActiveValue('')
    setAsyncState(EMPTY_ASYNC_STATE)
  }, [onOpenChange])

  const selectItem = React.useCallback((item: GlobalSearchItem) => {
    close()
    const target = item.target
    switch (target.type) {
      case 'session': {
        const session = sessions.find(candidate => candidate.id === target.sessionId)
        if (session) onOpenSession(session)
        return
      }
      case 'route':
        onNavigate(target.route)
        return
      case 'file':
        onOpenFile(target.path)
        return
    }
  }, [close, onNavigate, onOpenFile, onOpenSession, sessions])

  const groupLabels: Record<GlobalSearchGroup, string> = {
    sessions: query.trim() ? t('globalSearch.sessions') : t('globalSearch.recentSessions'),
    projects: t('globalSearch.projects'),
    files: t('globalSearch.files'),
    settings: t('globalSearch.settings'),
    navigation: t('globalSearch.navigation'),
  }

  const trimmedQuery = query.trim()
  const depthSearchActive = trimmedQuery.length >= ASYNC_QUERY_MIN_LENGTH
  const showEmpty = visibleItems.length === 0 && !asyncState.isLoading
  const showLoadingPlaceholder = asyncState.isLoading && visibleItems.length === 0

  return (
    <Dialog open={open} onOpenChange={isOpen => (isOpen ? onOpenChange(true) : close())}>
      <DialogContent
        showCloseButton={false}
        // Dialog defaults to CSS grid; force a column flex shell so the list
        // can form a real max-height scrollport (Raycast/VS Code command palette).
        className={cn(
          '!flex !flex-col gap-0 overflow-hidden p-0',
          'top-[12%] translate-y-0',
          'w-full max-w-[calc(100%-2rem)] sm:max-w-[640px]',
          'max-h-[min(80vh,720px)]',
        )}
      >
        <DialogTitle className="sr-only">{t('globalSearch.open')}</DialogTitle>
        <CommandPrimitive
          shouldFilter={false}
          value={activeValue}
          onValueChange={setActiveValue}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          label={t('globalSearch.open')}
        >
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-foreground/10 px-3.5">
            {asyncState.isLoading ? (
              <Icons.LoaderCircle
                className="h-4 w-4 shrink-0 animate-spin text-foreground/50"
                aria-hidden
              />
            ) : (
              <Icons.Search className="h-4 w-4 shrink-0 text-foreground/50" aria-hidden />
            )}
            <CommandPrimitive.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={t('globalSearch.placeholder')}
              aria-label={t('globalSearch.placeholder')}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
            />
            <KbdHint>Esc</KbdHint>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 overflow-hidden"
          >
            <CommandPrimitive.List
              className={cn(
                RESULTS_MAX_HEIGHT,
                'h-full min-h-[8rem] overflow-y-auto overflow-x-hidden overscroll-contain',
                'scroll-py-1 py-1.5',
                // Prefer a visible scrollbar when content overflows (macOS overlay
                // scrollbars can hide the affordance otherwise).
                '[scrollbar-gutter:stable]',
              )}
            >
              <div
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
              >
                {asyncState.isLoading
                  ? t('common.loading')
                  : t('globalSearch.resultCount', { count: visibleItems.length })}
              </div>

              {showLoadingPlaceholder ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-foreground/50">
                  <Icons.LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />
                  <span>{t('common.loading')}</span>
                </div>
              ) : null}

              {showEmpty ? (
                <CommandPrimitive.Empty className="px-4 py-10 text-center">
                  <div className="text-sm text-foreground/70">{t('globalSearch.noResults')}</div>
                  <div className="mt-1.5 text-xs text-foreground/40">
                    {!depthSearchActive
                      ? t('globalSearch.typeMore')
                      : t('globalSearch.noResultsDescription')}
                  </div>
                </CommandPrimitive.Empty>
              ) : null}

              {GLOBAL_SEARCH_GROUP_ORDER.map(group => {
                const items = groupedItems.get(group)
                if (!items?.length) return null
                return (
                  <CommandPrimitive.Group
                    key={group}
                    heading={groupLabels[group]}
                    className={cn(
                      'pb-1.5',
                      // Sticky section labels while scrolling long result lists.
                      '[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:z-[1]',
                      '[&_[cmdk-group-heading]]:bg-popover [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5',
                      '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                      '[&_[cmdk-group-heading]]:text-foreground/50',
                    )}
                  >
                    {items.map(item => (
                      <GlobalSearchRow
                        key={item.id}
                        item={item}
                        onSelect={() => selectItem(item)}
                      />
                    ))}
                  </CommandPrimitive.Group>
                )
              })}
            </CommandPrimitive.List>
          </div>

          <div className="shrink-0 border-t border-foreground/10">
            {asyncState.isPartiallyUnavailable ? (
              <div className="flex items-center gap-2 border-b border-foreground/10 px-3 py-2 text-xs text-foreground/50">
                <Icons.AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">
                  {t('globalSearch.partialUnavailable')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 shrink-0 px-2 text-xs"
                  onClick={() => setRetryNonce(value => value + 1)}
                >
                  {t('common.retry')}
                </Button>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 px-3 py-2 text-[10px] text-foreground/40">
              <span className="min-w-0 truncate" title={t('globalSearch.scopeHint')}>
                {t('globalSearch.scopeHint')}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <KbdHint>↑</KbdHint>
                  <KbdHint>↓</KbdHint>
                  <span className="ml-0.5">{t('globalSearch.navigate')}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <KbdHint>↵</KbdHint>
                  <span className="ml-0.5">{t('globalSearch.openResult')}</span>
                </span>
              </span>
            </div>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  )
}

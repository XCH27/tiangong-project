import * as React from 'react'
import { ReviewFileTree } from './workbench/review/ReviewFileTree'
import { ONE_SHOT_CAPABILITY, admitCommand } from '@craft-agent/shared/terminal/terminal-capability'
import { filterReviewDiffs, fromGitWorkingTree } from './workbench/review/review-diff-model'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  Ban,
  Blocks,
  Brain,
  Check,
  Circle,
  CircleCheck,
  ClipboardList,
  Database,
  File,
  FileCode,
  Folder,
  GitBranch,
  Globe,
  Image,
  LayoutList,
  Link2,
  Paintbrush,
  Plus,
  RefreshCw,
  SquareTerminal,
  Tag,
  Wrench,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { LoadingIndicator, Spinner, TerminalOutput, UnifiedDiffViewer } from '@craft-agent/ui'
import { groupMessagesByTurn } from '@craft-agent/ui/chat/turn-utils'
import type { TodoItem } from '@craft-agent/ui/chat/TurnCard'
import type { Message } from '@craft-agent/core'
import type { LoadedProject } from '@craft-agent/shared/projects/types'
import {
  extractLabelId,
  flattenLabels,
  type LabelConfig,
} from '@craft-agent/shared/labels'
import type {
  GitWorkingTreeFile,
  GitWorkingTreeSnapshot,
  LoadedSkill,
  LoadedSource,
  TerminalCommandResult,
} from '../../../shared/types'
import { useSession as useSessionById } from '@/context/AppShellContext'
import {
  attachWorkbenchResourceAtom,
  closeWorkbenchModuleAtom,
  getBrowserResourceToDetachBeforeSelection,
  getVisibleWorkbenchEntries,
  getVisibleWorkbenchTabCount,
  getWorkbenchHeaderMode,
  openWorkbenchModuleAtom,
  prepareWorkbenchRendererOverlay,
  reconcileWorkbenchSideTasks,
  rightWorkbenchAtom,
  selectWorkbenchModuleAtom,
  type WorkbenchModuleEntry,
  type WorkbenchModuleKind,
} from '@/atoms/right-workbench'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { browserInstancesMapAtom, removedBrowserInstanceIdsAtom } from '@/atoms/browser-pane'
import { BrowserToolbar } from '@/components/browser/BrowserToolbar'
import { Button } from '@/components/ui/button'
import { CollapsibleGroupHeader } from '@/components/ui/entity-list'
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty'
import { EntityRow } from '@/components/ui/entity-row'
import { SourceAvatar } from '@/components/ui/source-avatar'
import { SquarePenRounded } from '@/components/icons/SquarePenRounded'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ErrorState } from '@/components/ui/surface-state'
import { TopBarButton } from '@/components/ui/TopBarButton'
import { Input } from '@/components/ui/input'
import { useFocusZone } from '@/hooks/keyboard'
import { useContainerWidth } from '@/hooks/useContainerWidth'
import { useTheme } from '@/hooks/useTheme'
import ChatPage from '@/pages/ChatPage'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  StyledDropdownMenuContent,
  StyledDropdownMenuItem,
} from '@/components/ui/styled-dropdown'
import { cn } from '@/lib/utils'
import { isWorkbenchModuleOpenable } from '@/lib/product-surface'
import { observeOpenOverlay } from '@/lib/open-overlay-observer'
import { isExpertLabel } from '@craft-agent/shared/labels/kind-normalize'
import { getLocalizedLabelName } from '@/utils/label-display-name'
import { RADIUS_EDGE, RADIUS_INNER } from './panel-constants'
import { PanelHeader } from './PanelHeader'
import {
  getInitialTaskBoardSections,
  resolveTaskBoardSections,
  shouldUseEqualHeightTaskBoardLayout,
  toggleTaskBoardSection,
  type TaskBoardContentState,
  type TaskBoardSectionKey,
} from './task-board-state'

const MODULE_ICONS: Record<WorkbenchModuleKind, React.ComponentType<{ className?: string }>> = {
  'side-task': SquarePenRounded,
  'task-board': LayoutList,
  browser: Globe,
  review: FileCode,
  terminal: SquareTerminal,
  canvas: Paintbrush,
}

/** R18 launcher catalog — top-level Board stays gated elsewhere; task-board is the session projection. */
const WORKBENCH_MODULE_ORDER: WorkbenchModuleKind[] = [
  'task-board',
  'browser',
  'review',
  'terminal',
  'side-task',
  'canvas',
]

/** Open menu follows product-surface openable set (all R18 modules, Canvas display-only). */
const WORKBENCH_ADD_MODULE_ORDER: WorkbenchModuleKind[] = WORKBENCH_MODULE_ORDER.filter(
  (kind) => isWorkbenchModuleOpenable(kind),
)

const READ_ONLY_ENTITY_BUTTON_PROPS = {
  disabled: true,
  className: 'cursor-default disabled:opacity-100 disabled:hover:bg-transparent',
} as const

interface RightWorkbenchProps {
  sessionId: string | null
  workingDirectory?: string
  sources: LoadedSource[]
  skills: LoadedSkill[]
  projects: LoadedProject[]
  labels: LabelConfig[]
  onCreateSideTask: () => Promise<string | null>
}

function getLatestTodos(messages: Message[] | undefined): TodoItem[] {
  if (!messages?.length) return []
  const turns = groupMessagesByTurn(messages)
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index]
    if (turn?.type === 'assistant' && turn.todos?.length) return turn.todos
  }
  return []
}

function Section({
  sectionKey,
  title,
  children,
  open,
  itemCount,
  fillAvailable,
  onToggle,
}: {
  sectionKey: TaskBoardSectionKey
  title: string
  children: React.ReactNode
  open: boolean
  itemCount: number
  fillAvailable: boolean
  onToggle: (section: TaskBoardSectionKey) => void
}) {
  return (
    <section className={cn(
      fillAvailable && open && 'flex min-h-0 flex-1 flex-col',
    )}>
      <CollapsibleGroupHeader
        label={title}
        isCollapsed={!open}
        itemCount={itemCount}
        onToggle={() => onToggle(sectionKey)}
      />
      {open && (
        <div className={cn(fillAvailable && 'flex min-h-0 flex-1')}>
          {children}
        </div>
      )}
    </section>
  )
}

function SectionEmpty({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <EntityListEmptyScreen
      icon={icon}
      title={title}
      description={description}
      className="min-h-40 flex-1 py-6"
    />
  )
}

function TaskBoardRows({ children }: { children: React.ReactNode }) {
  return <div className="pb-2 pt-1">{children}</div>
}

function TodoStatusIcon({ status }: { status: TodoItem['status'] }) {
  switch (status) {
    case 'pending':
      return <Circle className="text-muted-foreground/50" />
    case 'in_progress':
      return <Spinner />
    case 'completed':
      return <CircleCheck className="text-accent" />
    case 'interrupted':
      return <Ban className="text-muted-foreground/50" />
  }
}

/** Keep task-board helper lines short; full text remains available via title where needed. */
function shortTaskBoardNote(text: string, maxLength = 48): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function comparableFolderPath(value: string | undefined): string {
  return (value ?? '').trim().replaceAll('\\', '/').replace(/\/+$/, '')
}

function TaskBoardModule({
  active,
  sessionId,
  sources,
  skills,
  projects,
  labels,
}: Pick<RightWorkbenchProps, 'sessionId' | 'sources' | 'skills' | 'projects' | 'labels'> & { active: boolean }) {
  const { t } = useTranslation()
  const session = useSessionById(sessionId ?? '__right-workbench-empty__')
  const todos = React.useMemo(() => getLatestTodos(session?.messages), [session?.messages])
  const badges = React.useMemo(
    () => session?.messages.flatMap((message) => message.badges ?? []) ?? [],
    [session?.messages],
  )
  const usedSkillNames = React.useMemo(
    () => [...new Set(badges.filter((badge) => badge.type === 'skill').map((badge) => badge.label))],
    [badges],
  )
  const enabledSources = React.useMemo(() => {
    const enabled = new Set(session?.enabledSourceSlugs ?? [])
    return sources.filter((source) => enabled.has(source.config.slug))
  }, [session?.enabledSourceSlugs, sources])
  const activeExpertKits = React.useMemo(() => {
    const byId = new Map(flattenLabels(labels).map((label) => [label.id, label]))
    return [...new Set((session?.labels ?? []).map(extractLabelId))]
      .map((id) => byId.get(id))
      // `isExpertLabel`, not `kind === 'identity'`. The direct comparison was
      // written before `expert` existed and silently excluded every kit created
      // after the rename — the panel stayed empty and looked like the session
      // simply had no kits on it.
      .filter((label): label is LabelConfig => label !== undefined && isExpertLabel(label))
  }, [labels, session?.labels])
  const referencedSources = React.useMemo(() => {
    const items = new Map<string, {
      label: string
      detail?: string
      kind: 'file' | 'folder' | 'source' | 'image' | 'url'
    }>()
    for (const message of session?.messages ?? []) {
      for (const attachment of message.attachments ?? []) {
        items.set(`file:${attachment.storedPath}`, {
          label: attachment.name,
          detail: attachment.storedPath,
          kind: attachment.mimeType?.startsWith('image/') ? 'image' : 'file',
        })
      }
      for (const badge of message.badges ?? []) {
        if (badge.type === 'file' || badge.type === 'folder' || badge.type === 'source') {
          items.set(`${badge.type}:${badge.rawText}`, {
            label: badge.label,
            detail: badge.rawText,
            kind: badge.type,
          })
        }
      }
      for (const match of message.content.matchAll(/https?:\/\/[^\s<>()]+/g)) {
        const url = match[0].replace(/[.,;:!?]+$/, '')
        items.set(`url:${url}`, { label: url, kind: 'url' })
      }
    }
    return [...items.values()]
  }, [session?.messages])
  const sessionFolder = comparableFolderPath(session?.workingDirectory)
  const sessionProject = projects.find((project) => project.config.id === session?.projectId)
    ?? projects.find((project) => (
      sessionFolder.length > 0
      && comparableFolderPath(project.folderPath) === sessionFolder
    ))
  const memoryPath = sessionProject ? `${sessionProject.folderPath}/MEMORY.md` : null
  const [memory, setMemory] = React.useState<string | null>(null)
  const [memoryLoading, setMemoryLoading] = React.useState(false)
  const memoryPreview = React.useMemo(
    () => memory
      ?.split('\n')
      .map((line) => line.replace(/^#+\s*/, '').trim())
      .find(Boolean),
    [memory],
  )
  const contentState = React.useMemo<TaskBoardContentState>(() => ({
    todos: todos.length > 0,
    extensions:
      usedSkillNames.length > 0
      || enabledSources.length > 0
      || activeExpertKits.length > 0,
    memory: Boolean(memory),
    sources: referencedSources.length > 0,
  }), [
    enabledSources.length,
    activeExpertKits.length,
    memory,
    referencedSources.length,
    todos.length,
    usedSkillNames.length,
  ])
  const [openSections, setOpenSections] = React.useState<Set<TaskBoardSectionKey>>(
    () => getInitialTaskBoardSections(contentState),
  )
  const useEqualHeightLayout = shouldUseEqualHeightTaskBoardLayout(
    contentState,
    openSections,
  )
  const previousContentRef = React.useRef(contentState)
  const previousSessionIdRef = React.useRef(sessionId)

  React.useEffect(() => {
    let cancelled = false
    if (!active) return
    if (!memoryPath) {
      setMemory(null)
      setMemoryLoading(false)
      return
    }
    setMemoryLoading(true)
    window.electronAPI.readFile(memoryPath)
      .then((content) => {
        if (!cancelled) setMemory(content.trim() || null)
      })
      .catch(() => {
        if (!cancelled) setMemory(null)
      })
      .finally(() => {
        if (!cancelled) setMemoryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active, memoryPath])

  React.useEffect(() => {
    setOpenSections((current) => resolveTaskBoardSections({
      current,
      previousContent: previousContentRef.current,
      nextContent: contentState,
      sessionChanged: previousSessionIdRef.current !== sessionId,
    }))
    previousContentRef.current = contentState
    previousSessionIdRef.current = sessionId
  }, [contentState, sessionId])

  const handleSectionToggle = React.useCallback((section: TaskBoardSectionKey) => {
    setOpenSections((current) => toggleTaskBoardSection(current, section))
  }, [])

  if (!sessionId || !session) {
    return (
      <EntityListEmptyScreen
        icon={<LayoutList />}
        title={t('rightWorkbench.modules.task-board')}
        description={t('rightWorkbench.taskBoard.noSession')}
      />
    )
  }

  const sections = (
    <>
      <Section
        sectionKey="todos"
        title={t('rightWorkbench.taskBoard.todos')}
        open={openSections.has('todos')}
        itemCount={todos.length}
        fillAvailable={useEqualHeightLayout}
        onToggle={handleSectionToggle}
      >
        {todos.length === 0 ? (
          <SectionEmpty
            icon={<ClipboardList />}
            title={t('rightWorkbench.taskBoard.todos')}
            description={t('rightWorkbench.taskBoard.noTodos')}
          />
        ) : (
          <TaskBoardRows>
            {todos.map((todo, index) => (
              <EntityRow
                key={`${todo.content}-${index}`}
                icon={<TodoStatusIcon status={todo.status} />}
                title={(
                  <span className={todo.status === 'completed' ? 'text-foreground/50 line-through' : ''}>
                    {todo.status === 'in_progress' && todo.activeForm ? todo.activeForm : todo.content}
                  </span>
                )}
                subtitle={
                  todo.status === 'in_progress'
                  && todo.activeForm
                  && todo.activeForm !== todo.content
                    ? todo.content
                    : undefined
                }
                showSeparator={index > 0}
                buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
              />
            ))}
          </TaskBoardRows>
        )}
      </Section>

      <Section
        sectionKey="extensions"
        title={t('rightWorkbench.taskBoard.extensions')}
        open={openSections.has('extensions')}
        itemCount={usedSkillNames.length + enabledSources.length + activeExpertKits.length}
        fillAvailable={useEqualHeightLayout}
        onToggle={handleSectionToggle}
      >
        {usedSkillNames.length === 0
          && enabledSources.length === 0
          && activeExpertKits.length === 0 ? (
          <SectionEmpty
            icon={<Blocks />}
            title={t('rightWorkbench.taskBoard.extensions')}
            description={t('rightWorkbench.taskBoard.noExtensions')}
          />
        ) : (
          <TaskBoardRows>
            {usedSkillNames.map((name, index) => {
              const skill = skills.find((item) => item.slug === name || item.metadata.name === name)
              return (
                <EntityRow
                  key={`skill:${name}`}
                  icon={<Wrench className="text-foreground/50" />}
                  title={skill?.metadata.name || name}
                  subtitle={shortTaskBoardNote(
                    skill?.metadata.description || t('rightWorkbench.taskBoard.skillUsed'),
                  )}
                  showSeparator={index > 0}
                  buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
                />
              )
            })}
            {enabledSources.map((source, index) => (
              <EntityRow
                key={`source:${source.config.slug}`}
                icon={<SourceAvatar source={source} size="sm" />}
                title={source.config.name || source.config.slug}
                subtitle={shortTaskBoardNote([
                  source.config.type === 'mcp'
                    ? t('rightWorkbench.taskBoard.mcpConnection')
                    : t('rightWorkbench.taskBoard.apiSource'),
                  source.config.tagline,
                ].filter(Boolean).join(' · '))}
                showSeparator={usedSkillNames.length + index > 0}
                buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
              />
            ))}
            {activeExpertKits.map((label, index) => (
              <EntityRow
                key={`identity:${label.id}`}
                icon={<Tag className="text-foreground/50" />}
                title={getLocalizedLabelName(t, label)}
                subtitle={shortTaskBoardNote(
                  label.systemPromptPreset
                    || t('rightWorkbench.taskBoard.identityLabel'),
                )}
                showSeparator={
                  usedSkillNames.length + enabledSources.length + index > 0
                }
                buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
              />
            ))}
          </TaskBoardRows>
        )}
      </Section>

      <Section
        sectionKey="memory"
        title={t('rightWorkbench.taskBoard.memory')}
        open={openSections.has('memory')}
        itemCount={memory ? 1 : 0}
        fillAvailable={useEqualHeightLayout}
        onToggle={handleSectionToggle}
      >
        {memoryLoading ? (
          <LoadingIndicator label={t('common.loading')} />
        ) : memory ? (
          <TaskBoardRows>
            <EntityRow
              icon={<Brain className="text-foreground/50" />}
              title={memoryPreview || 'MEMORY.md'}
              subtitle={memoryPath || 'MEMORY.md'}
              buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
            />
          </TaskBoardRows>
        ) : (
          <SectionEmpty
            icon={<Brain />}
            title={t('rightWorkbench.taskBoard.memory')}
            description={sessionProject
              ? t('rightWorkbench.taskBoard.noMemory')
              : t('rightWorkbench.taskBoard.memoryNeedsProject')}
          />
        )}
      </Section>

      <Section
        sectionKey="sources"
        title={t('rightWorkbench.taskBoard.sources')}
        open={openSections.has('sources')}
        itemCount={referencedSources.length}
        fillAvailable={useEqualHeightLayout}
        onToggle={handleSectionToggle}
      >
        {referencedSources.length === 0 ? (
          <SectionEmpty
            icon={<Link2 />}
            title={t('rightWorkbench.taskBoard.sources')}
            description={t('rightWorkbench.taskBoard.noSources')}
          />
        ) : (
          <TaskBoardRows>
            {referencedSources.map((item, index) => (
              <EntityRow
                key={`${item.label}-${item.detail ?? ''}`}
                icon={item.kind === 'folder'
                  ? <Folder className="text-foreground/50" />
                  : item.kind === 'image'
                    ? <Image className="text-foreground/50" />
                    : item.kind === 'url'
                      ? <Globe className="text-foreground/50" />
                      : item.kind === 'source'
                        ? <Database className="text-foreground/50" />
                        : <File className="text-foreground/50" />}
                title={item.label}
                subtitle={item.detail && item.detail !== item.label ? item.detail : undefined}
                showSeparator={index > 0}
                buttonProps={READ_ONLY_ENTITY_BUTTON_PROPS}
              />
            ))}
          </TaskBoardRows>
        )}
      </Section>
    </>
  )

  return useEqualHeightLayout ? (
    <div className="flex h-full min-h-0 flex-col">
      {sections}
    </div>
  ) : (
    <ScrollArea className="h-full">
      {sections}
    </ScrollArea>
  )
}

function EmbeddedBrowserModule({
  entry,
  active,
  onRemoved,
}: {
  entry: WorkbenchModuleEntry
  active: boolean
  onRemoved: (entry: WorkbenchModuleEntry) => void
}) {
  const { t } = useTranslation()
  const attachResource = useSetAtom(attachWorkbenchResourceAtom)
  const instances = useAtomValue(browserInstancesMapAtom)
  const removedInstanceIds = useAtomValue(removedBrowserInstanceIdsAtom)
  const hostRef = React.useRef<HTMLDivElement>(null)
  const creatingRef = React.useRef(false)
  const [creationFailed, setCreationFailed] = React.useState(false)
  const [creationAttempt, setCreationAttempt] = React.useState(0)
  const instanceInfo = entry.resourceId ? instances.get(entry.resourceId) ?? null : null

  // BrowserTabStrip and this embedded module are two projections of the same
  // main-process BrowserView authority. Closing it from either projection must
  // close the workbench entry too; silently creating a replacement would undo
  // the user's close action and create an orphan native resource.
  React.useEffect(() => {
    if (entry.resourceId && removedInstanceIds.has(entry.resourceId)) {
      onRemoved(entry)
    }
  }, [entry, onRemoved, removedInstanceIds])

  React.useEffect(() => {
    if (entry.resourceId || creatingRef.current) return
    let cancelled = false
    creatingRef.current = true
    setCreationFailed(false)
    window.electronAPI.browserPane.create({ show: false })
      .then((resourceId) => {
        if (cancelled) {
          void window.electronAPI.browserPane.destroy(resourceId)
          return
        }
        attachResource({ id: entry.id, resourceId })
      })
      .catch(() => {
        if (!cancelled) setCreationFailed(true)
      })
      .finally(() => {
        creatingRef.current = false
      })
    return () => {
      cancelled = true
    }
  }, [attachResource, creationAttempt, entry.id, entry.resourceId])

  React.useEffect(() => {
    const element = hostRef.current
    const resourceId = entry.resourceId
    if (!element || !resourceId || !active) return

    let frame = 0
    const syncBounds = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = element.getBoundingClientRect()
        if (rect.width < 1 || rect.height < 1) return
        void window.electronAPI.browserPane.embed(resourceId, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        })
      })
    }

    const observer = new ResizeObserver(syncBounds)
    observer.observe(element)
    window.addEventListener('resize', syncBounds)
    // Double-rAF after tab/overlay reactivation so layout has settled (Electron
    // BrowserView can paint blank if bounds are applied while the host is still 0×0).
    syncBounds()
    const settleFrame = requestAnimationFrame(() => syncBounds())

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(settleFrame)
      observer.disconnect()
      window.removeEventListener('resize', syncBounds)
      void window.electronAPI.browserPane.detach(resourceId)
    }
  }, [active, entry.resourceId])

  const invoke = (action: (id: string) => Promise<unknown>) => {
    if (entry.resourceId) void action(entry.resourceId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <BrowserToolbar
        instanceInfo={instanceInfo}
        onNavigate={(url) => invoke((id) => window.electronAPI.browserPane.navigate(id, url))}
        onGoBack={() => invoke((id) => window.electronAPI.browserPane.goBack(id))}
        onGoForward={() => invoke((id) => window.electronAPI.browserPane.goForward(id))}
        onReload={() => invoke((id) => window.electronAPI.browserPane.reload(id))}
        onStop={() => invoke((id) => window.electronAPI.browserPane.stop(id))}
        compact
      />
      <div ref={hostRef} className="relative min-h-0 flex-1 bg-background">
        {!entry.resourceId && !creationFailed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingIndicator label={t('rightWorkbench.browser.starting')} />
          </div>
        )}
        {creationFailed && (
          <div className="absolute inset-0 flex">
            <ErrorState
              description={t('rightWorkbench.browser.failed')}
              action={{
                label: t('common.retry'),
                onClick: () => setCreationAttempt((attempt) => attempt + 1),
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function getGitFileStatusKey(file: GitWorkingTreeFile): string {
  const status = `${file.indexStatus}${file.workingTreeStatus}`
  if (status.includes('?')) return 'rightWorkbench.review.status.untracked'
  if (status.includes('D')) return 'rightWorkbench.review.status.deleted'
  if (status.includes('R')) return 'rightWorkbench.review.status.renamed'
  if (status.includes('A')) return 'rightWorkbench.review.status.added'
  return 'rightWorkbench.review.status.modified'
}

function ReviewModule({
  active,
  sessionId,
  workingDirectory,
}: {
  sessionId: string | null
  workingDirectory?: string
  active: boolean
}) {
  const { t } = useTranslation()
  const { isDark, shikiTheme } = useTheme()
  const [snapshot, setSnapshot] = React.useState<GitWorkingTreeSnapshot | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loaded, setLoaded] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const [filter, setFilter] = React.useState('')
  const [activePath, setActivePath] = React.useState<string | null>(null)
  const [fileDiff, setFileDiff] = React.useState<{ diff: string; truncated: boolean } | null>(null)
  const [diffLoading, setDiffLoading] = React.useState(false)
  const requestIdRef = React.useRef(0)
  const diffRequestIdRef = React.useRef(0)

  const selectFile = React.useCallback((path: string) => {
    if (!sessionId) return
    const requestId = ++diffRequestIdRef.current
    setActivePath(path)
    setFileDiff(null)
    setDiffLoading(true)
    window.electronAPI.getGitFileDiff(sessionId, path)
      .then((nextDiff) => {
        if (requestId === diffRequestIdRef.current) setFileDiff(nextDiff)
      })
      .catch((error) => {
        if (requestId === diffRequestIdRef.current) setFileDiff(null)
        toast.error(t('rightWorkbench.review.diffFailed', {
          defaultValue: 'Could not load the file diff: {{reason}}',
          reason: error instanceof Error ? error.message : String(error),
        }))
      })
      .finally(() => {
        if (requestId === diffRequestIdRef.current) setDiffLoading(false)
      })
  }, [sessionId, t])

  // The panel renders one normalized shape and never branches on where a diff
  // came from; today that is the working tree, and session snapshots join the
  // same list when they exist (Decision H1 line in review-diff-model).
  const reviewDiffs = React.useMemo(
    () => filterReviewDiffs(fromGitWorkingTree(snapshot?.files ?? []), filter),
    [snapshot, filter],
  )

  const refresh = React.useCallback(() => {
    const requestId = ++requestIdRef.current
    if (!sessionId || !workingDirectory) {
      setSnapshot(null)
      setLoaded(true)
      setLoading(false)
      setFailed(false)
      return
    }
    setSnapshot(null)
    setActivePath(null)
    setFileDiff(null)
    setLoaded(false)
    setLoading(true)
    setFailed(false)
    window.electronAPI.getGitWorkingTree(sessionId)
      .then((nextSnapshot) => {
        if (requestId !== requestIdRef.current) return
        setSnapshot(nextSnapshot)
        const firstPath = nextSnapshot?.files[0]?.path
        if (firstPath) selectFile(firstPath)
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return
        setSnapshot(null)
        setFailed(true)
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return
        setLoading(false)
        setLoaded(true)
      })
  }, [selectFile, sessionId, workingDirectory])

  React.useEffect(() => {
    if (active) refresh()
  }, [active, refresh])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title={snapshot?.branch ?? t('rightWorkbench.review.uncommitted')}
        badge={snapshot?.files.length
          ? (
            <span className="text-xs font-normal text-foreground/40">
              {snapshot.files.length}
              {snapshot.totals.additions > 0 && <span className="ml-2 text-success">+{snapshot.totals.additions}</span>}
              {snapshot.totals.deletions > 0 && <span className="ml-1 text-destructive">−{snapshot.totals.deletions}</span>}
            </span>
          )
          : undefined}
        actions={(
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={refresh}
            disabled={loading}
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </Button>
        )}
        className="border-b border-foreground/10"
      />
      {loading && !loaded ? (
        <div className="flex flex-1 items-center justify-center text-xs text-foreground/50">
          <LoadingIndicator label={t('common.loading')} />
        </div>
      ) : !workingDirectory ? (
        <EntityListEmptyScreen
          icon={<GitBranch />}
          title={t('rightWorkbench.modules.review')}
          description={t('rightWorkbench.review.noFolder')}
        />
      ) : failed ? (
        <ErrorState
          description={t('rightWorkbench.review.failed')}
          action={{ label: t('common.retry'), onClick: refresh }}
        />
      ) : loaded && !snapshot ? (
        <EntityListEmptyScreen
          icon={<GitBranch />}
          title={t('rightWorkbench.modules.review')}
          description={t('rightWorkbench.review.notRepository')}
        />
      ) : snapshot?.files.length === 0 ? (
        <EntityListEmptyScreen
          icon={<Check />}
          title={t('rightWorkbench.modules.review')}
          description={t('rightWorkbench.review.clean')}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-foreground/10 p-2">
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={t('rightWorkbench.review.filter')}
              className="h-7 text-xs"
            />
          </div>
          <ScrollArea className="max-h-52 shrink-0 border-b border-foreground/10">
            <ReviewFileTree
              diffs={reviewDiffs}
              selectedPath={activePath}
              onSelect={selectFile}
              emptyLabel={t('rightWorkbench.review.clean')}
            />
          </ScrollArea>
          <div className="min-h-0 flex-1 bg-background">
            {diffLoading ? (
              <div className="flex h-full items-center justify-center">
                <LoadingIndicator label={t('common.loading')} />
              </div>
            ) : fileDiff?.diff ? (
              <UnifiedDiffViewer
                unifiedDiff={fileDiff.diff}
                diffStyle="unified"
                theme={isDark ? 'dark' : 'light'}
                shikiTheme={shikiTheme}
                className="h-full"
              />
            ) : (
              <EntityListEmptyScreen
                icon={<FileCode />}
                title={t('rightWorkbench.modules.review')}
                description={t('rightWorkbench.review.untrackedOnly')}
              />
            )}
            {fileDiff?.truncated && (
              <div className="border-t border-foreground/10 p-3 text-xs text-info">
                {t('rightWorkbench.review.truncated')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface TerminalHistoryItem {
  command: string
  result: TerminalCommandResult
}

function TerminalModule({
  sessionId,
  workingDirectory,
}: {
  sessionId: string | null
  workingDirectory?: string
}) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const [command, setCommand] = React.useState('')
  const [history, setHistory] = React.useState<TerminalHistoryItem[]>([])
  const [running, setRunning] = React.useState(false)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const contextGenerationRef = React.useRef(0)

  // Reset on the session too, not just the folder: two tasks in the same
  // Project share a working directory, so keying on the folder alone would
  // carry one task's command output into the next.
  React.useEffect(() => {
    contextGenerationRef.current += 1
    setCommand('')
    setHistory([])
    setRunning(false)
  }, [sessionId, workingDirectory])

  const run = async () => {
    const value = command.trim()
    if (!value || !sessionId || !workingDirectory || running) return

    // The backend is `execFile` with a 30s timeout and no PTY, so an interactive
    // program blocks until it is killed and a long build is killed before it can
    // print anything. Both used to present as thirty seconds of nothing followed
    // by an empty result. Classify first and say which boundary was hit
    // (Decision H9).
    const admission = admitCommand(value, ONE_SHOT_CAPABILITY)
    if (!admission.admitted) {
      setCommand('')
      setHistory((items) => [...items, {
        command: value,
        result: {
          output: t(`rightWorkbench.terminal.refused.${admission.reason}`),
          exitCode: -1,
          timedOut: false,
        },
      }])
      return
    }

    const contextGeneration = contextGenerationRef.current
    setCommand('')
    setRunning(true)
    try {
      const result = await window.electronAPI.runTerminalCommand(sessionId, value)
      if (contextGeneration !== contextGenerationRef.current) return
      setHistory((items) => [...items, { command: value, result }])
    } catch {
      if (contextGeneration !== contextGenerationRef.current) return
      setHistory((items) => [...items, {
        command: value,
        result: {
          output: t('rightWorkbench.terminal.failed'),
          exitCode: -1,
          timedOut: false,
        },
      }])
    } finally {
      if (contextGeneration === contextGenerationRef.current) setRunning(false)
    }
  }

  React.useEffect(() => {
    viewportRef.current?.scrollTo({ top: viewportRef.current.scrollHeight })
  }, [history, running])

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <PanelHeader
        title={workingDirectory?.split('/').filter(Boolean).pop() ?? t('rightWorkbench.terminal.noFolder')}
        badge={<SquareTerminal className="h-3.5 w-3.5 text-foreground/40" />}
        className="border-b border-foreground/10"
      />
      <ScrollArea viewportRef={viewportRef} className="min-h-0 flex-1">
        {history.length === 0 && (
          <EntityListEmptyScreen
            icon={<SquareTerminal />}
            title={t('rightWorkbench.modules.terminal')}
            description={t('rightWorkbench.terminal.empty')}
            className="min-h-full"
          />
        )}
        {history.map((item, index) => (
          <TerminalOutput
            key={`${item.command}-${index}`}
            command={item.command}
            output={item.result.output}
            exitCode={item.result.exitCode}
            description={item.result.timedOut ? t('rightWorkbench.terminal.timedOut') : undefined}
            theme={isDark ? 'dark' : 'light'}
            className="h-auto border-b border-foreground/10 px-4 py-3 text-xs"
          />
        ))}
        {running && <LoadingIndicator label={t('rightWorkbench.terminal.running')} />}
      </ScrollArea>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-foreground/10 px-3 py-2"
        onSubmit={(event) => {
          event.preventDefault()
          void run()
        }}
      >
        <span className="text-xs text-foreground/40">$</span>
        <Input
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          disabled={!sessionId || !workingDirectory || running}
          placeholder={t('rightWorkbench.terminal.placeholder')}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
        />
      </form>
    </div>
  )
}

export function RightWorkbench({
  sessionId,
  workingDirectory,
  sources,
  skills,
  projects,
  labels,
  onCreateSideTask,
}: RightWorkbenchProps) {
  const { t } = useTranslation()
  const [state, setWorkbenchState] = useAtom(rightWorkbenchAtom)
  const selectModule = useSetAtom(selectWorkbenchModuleAtom)
  const openModule = useSetAtom(openWorkbenchModuleAtom)
  const closeModule = useSetAtom(closeWorkbenchModuleAtom)
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)
  const [rendererOverlayOpen, setRendererOverlayOpen] = React.useState(false)
  const [browserInteractionSuspended, setBrowserInteractionSuspended] = React.useState(false)
  const [addMenuOpen, setAddMenuOpen] = React.useState(false)
  const [overflowMenuOpen, setOverflowMenuOpen] = React.useState(false)
  const selectionTokenRef = React.useRef(0)
  const overlayMenuTokenRef = React.useRef(0)
  const tabsHeaderRef = React.useRef<HTMLDivElement>(null)
  const tabsHeaderWidth = useContainerWidth(tabsHeaderRef)
  const { zoneRef } = useFocusZone({
    zoneId: 'right-workbench',
    focusFirst: () => {
      zoneRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex="0"]',
      )?.focus()
    },
  })

  React.useEffect(() => observeOpenOverlay(setRendererOverlayOpen), [])

  // Reconcile side-task tabs against the live Session authority so deleted
  // sessions never leave a falsely live workbench tab.
  React.useEffect(() => {
    const reconciled = reconcileWorkbenchSideTasks(
      state,
      (sessionId) => sessionMetaMap.has(sessionId),
    )
    if (reconciled !== state) setWorkbenchState(reconciled)
  }, [sessionMetaMap, setWorkbenchState, state])

  const handleOverlayMenuOpenChange = async (
    menu: 'add' | 'overflow',
    open: boolean,
  ) => {
    const token = ++overlayMenuTokenRef.current
    const setOpen = menu === 'add' ? setAddMenuOpen : setOverflowMenuOpen
    if (!open) {
      setOpen(false)
      setBrowserInteractionSuspended(false)
      return
    }

    if (menu === 'add') setOverflowMenuOpen(false)
    else setAddMenuOpen(false)

    setBrowserInteractionSuspended(true)
    const prepared = await prepareWorkbenchRendererOverlay(
      state,
      (resourceId) => window.electronAPI.browserPane.detach(resourceId),
    )
    if (token !== overlayMenuTokenRef.current) return
    if (!prepared.ok) {
      setBrowserInteractionSuspended(false)
      toast.error(t('rightWorkbench.browser.detachFailed', {
        defaultValue: 'Could not release the browser surface: {{reason}}',
        reason: prepared.reason,
      }))
      return
    }
    setOpen(true)
  }

  const handleSelectModule = async (id: string) => {
    const token = ++selectionTokenRef.current
    const resourceId = getBrowserResourceToDetachBeforeSelection(state, id)
    if (resourceId) {
      setBrowserInteractionSuspended(true)
      try {
        await window.electronAPI.browserPane.detach(resourceId)
      } catch (error) {
        // A stale native id must not trap the user on an uncloseable tab.
        try {
          await window.electronAPI.browserPane.destroy(resourceId)
        } catch (destroyError) {
          toast.error(t('rightWorkbench.browser.detachFailed', {
            defaultValue: 'Could not release the browser surface: {{reason}}',
            reason: destroyError instanceof Error ? destroyError.message : String(error),
          }))
          if (token === selectionTokenRef.current) setBrowserInteractionSuspended(false)
          return
        }
      }
    }
    if (token !== selectionTokenRef.current) return
    selectModule(id)
    setBrowserInteractionSuspended(false)
  }

  const handleCloseModule = React.useCallback(async (entry: WorkbenchModuleEntry) => {
    if (entry.kind === 'browser' && entry.resourceId) {
      if (entry.id === state.activeId) {
        try {
          await window.electronAPI.browserPane.detach(entry.resourceId)
        } catch (error) {
          toast.error(t('rightWorkbench.browser.detachFailed', {
            defaultValue: 'Could not release the browser surface: {{reason}}',
            reason: error instanceof Error ? error.message : String(error),
          }))
          // Continue with destroy/close so a stale native resource cannot make
          // the renderer tab permanently uncloseable.
        }
      }
      try {
        await window.electronAPI.browserPane.destroy(entry.resourceId)
      } catch (error) {
        toast.error(t('rightWorkbench.browser.closeFailed', {
          defaultValue: 'Could not close the browser surface: {{reason}}',
          reason: error instanceof Error ? error.message : String(error),
        }))
      }
    }
    closeModule(entry.id)
  }, [closeModule, state.activeId, t])

  const handleOpenModule = async (kind: WorkbenchModuleKind) => {
    // Refuse half-built modules so the "+" menu cannot open a dead surface.
    if (!isWorkbenchModuleOpenable(kind)) {
      toast.error(t('rightWorkbench.moduleNotOpenable', {
        defaultValue: 'This workbench module is not available.',
      }))
      return
    }

    if (kind !== 'side-task') {
      openModule(kind)
      return
    }

    try {
      const createdSessionId = await onCreateSideTask()
      if (!createdSessionId) {
        toast.error(t('toast.failedToCreateSession'))
        return
      }
      openModule({ kind, sessionId: createdSessionId })
    } catch (error) {
      toast.error(t('toast.failedToCreateSession'))
      console.error('[RightWorkbench] side-task create failed:', error)
    }
  }

  const moduleLabel = (kind: WorkbenchModuleKind) => t(`rightWorkbench.modules.${kind}`)
  const moduleMenuItems = WORKBENCH_ADD_MODULE_ORDER.map((kind) => {
    const Icon = MODULE_ICONS[kind]
    return (
      <StyledDropdownMenuItem
        key={kind}
        onClick={() => {
          void handleOpenModule(kind)
        }}
      >
        <Icon className="h-3.5 w-3.5" />
        {moduleLabel(kind)}
      </StyledDropdownMenuItem>
    )
  })
  const addModuleMenu = (
    <DropdownMenu
      open={addMenuOpen}
      onOpenChange={(open) => {
        void handleOverlayMenuOpenChange('add', open)
      }}
    >
      <DropdownMenuTrigger asChild>
        <TopBarButton
          aria-label={t('rightWorkbench.addModule')}
          className="h-[26px] w-[26px] shrink-0 rounded-lg"
        >
          <Plus className="h-3.5 w-3.5 text-foreground/50" />
        </TopBarButton>
      </DropdownMenuTrigger>
      <StyledDropdownMenuContent align="end" minWidth="min-w-44">
        {moduleMenuItems}
      </StyledDropdownMenuContent>
    </DropdownMenu>
  )
  const headerMode = getWorkbenchHeaderMode(state.entries.length)
  const activeEntry = state.entries.find((entry) => entry.id === state.activeId) ?? state.entries[0]
  const visibleTabCount = tabsHeaderWidth > 0
    ? getVisibleWorkbenchTabCount(tabsHeaderWidth, state.entries.length)
    : Math.min(5, state.entries.length)
  const visibleEntries = getVisibleWorkbenchEntries(
    state.entries,
    state.activeId,
    visibleTabCount,
  )
  const visibleEntryIds = new Set(visibleEntries.map((entry) => entry.id))
  const overflowEntries = state.entries.filter((entry) => !visibleEntryIds.has(entry.id))

  return (
    <aside
      ref={zoneRef}
      className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-background shadow-middle"
      data-focus-zone="right-workbench"
      style={{
        // Match the navigator ("对话") surface under the shared top edge inset.
        // Right-side corners that meet the window edge use RADIUS_EDGE; the
        // left seam against the main panel stays RADIUS_INNER.
        borderTopLeftRadius: RADIUS_INNER,
        borderTopRightRadius: RADIUS_EDGE,
        borderBottomLeftRadius: RADIUS_INNER,
        borderBottomRightRadius: RADIUS_EDGE,
      }}
    >
      {headerMode === 'single' ? (
        <PanelHeader
          title={activeEntry ? moduleLabel(activeEntry.kind) : undefined}
          titleMenu={moduleMenuItems}
          titleMenuOpen={addMenuOpen}
          onTitleMenuOpenChange={(open) => {
            void handleOverlayMenuOpenChange('add', open)
          }}
          titleTrailingAction={activeEntry ? (
            <button
              type="button"
              onClick={() => {
                void handleCloseModule(activeEntry)
              }}
              aria-label={t('common.close')}
              className="flex h-6 w-6 items-center justify-center rounded-[6px] text-foreground/40 transition-colors hover:bg-sidebar-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <X className="h-3 w-3" />
            </button>
          ) : undefined}
        />
      ) : headerMode === 'tabs' ? (
        <div
          ref={tabsHeaderRef}
          className="flex h-10 shrink-0 items-center gap-1 border-b border-foreground/10 px-2"
        >
          <div
            className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
            role="tablist"
            aria-label={t('rightWorkbench.toggle')}
          >
            {visibleEntries.map((entry) => {
              const Icon = MODULE_ICONS[entry.kind]
              const active = entry.id === state.activeId
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'group relative flex h-[26px] min-w-0 max-w-[160px] flex-1 basis-0 items-center rounded-[6px] text-[13px] leading-tight transition-colors',
                    active
                      ? 'bg-foreground/[0.07] text-foreground'
                      : 'text-foreground/60 hover:bg-sidebar-hover hover:text-foreground',
                  )}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      void handleSelectModule(entry.id)
                    }}
                    title={moduleLabel(entry.kind)}
                    className={cn(
                      'flex h-full min-w-0 flex-1 items-center gap-1 px-1.5',
                      active ? 'pr-7' : 'group-hover:pr-7',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="min-w-0 truncate">{moduleLabel(entry.kind)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleCloseModule(entry)
                    }}
                    aria-label={t('common.close')}
                    className={cn(
                      'absolute right-0 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-foreground/40 transition-colors hover:bg-sidebar-hover hover:text-foreground focus:opacity-100',
                      active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                    )}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
          {overflowEntries.length > 0 && (
            <DropdownMenu
              open={overflowMenuOpen}
              onOpenChange={(open) => {
                void handleOverlayMenuOpenChange('overflow', open)
              }}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="h-[26px] shrink-0 rounded-[6px] px-1.5 text-[11px] text-foreground/50 transition-colors hover:bg-sidebar-hover hover:text-foreground"
                  aria-label={`${t('rightWorkbench.toggle')} +${overflowEntries.length}`}
                >
                  +{overflowEntries.length}
                </button>
              </DropdownMenuTrigger>
              <StyledDropdownMenuContent align="end" minWidth="min-w-44">
                {overflowEntries.map((entry) => {
                  const Icon = MODULE_ICONS[entry.kind]
                  return (
                    <StyledDropdownMenuItem
                      key={entry.id}
                      onClick={() => {
                        void handleSelectModule(entry.id)
                      }}
                      className="pr-1"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="min-w-0 flex-1 truncate">{moduleLabel(entry.kind)}</span>
                      {entry.id === state.activeId && <Check className="h-3 w-3" />}
                      <button
                        type="button"
                        aria-label={t('common.close')}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-foreground/40 hover:bg-sidebar-hover hover:text-foreground"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setOverflowMenuOpen(false)
                          void handleCloseModule(entry)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </StyledDropdownMenuItem>
                  )
                })}
              </StyledDropdownMenuContent>
            </DropdownMenu>
          )}
          {addModuleMenu}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {state.entries.length === 0 && (
          <nav
            className="flex h-full items-center justify-center px-4"
            aria-label={t('rightWorkbench.addModule')}
          >
            <div className="flex w-full max-w-[240px] flex-col gap-1">
              {WORKBENCH_MODULE_ORDER.map((kind) => {
                const Icon = MODULE_ICONS[kind]
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => {
                      void handleOpenModule(kind)
                    }}
                    className="flex w-full items-center gap-2 rounded-[6px] px-2 py-[5px] text-[13px] text-foreground/80 outline-none transition-colors hover:bg-sidebar-hover hover:text-foreground focus-visible:bg-foreground/[0.07] focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
                    <span>{moduleLabel(kind)}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        )}
        {state.entries.map((entry) => {
          const active = entry.id === state.activeId
          return (
            <div key={entry.id} className={cn('absolute inset-0', !active && 'invisible pointer-events-none')}>
              {entry.kind === 'side-task' && entry.sessionId && (
                <ChatPage sessionId={entry.sessionId} hideHeader />
              )}
              {entry.kind === 'task-board' && (
                <TaskBoardModule
                  active={active}
                  sessionId={sessionId}
                  sources={sources}
                  skills={skills}
                  projects={projects}
                  labels={labels}
                />
              )}
              {entry.kind === 'browser' && (
                <EmbeddedBrowserModule
                  entry={entry}
                  active={
                    active
                    && !rendererOverlayOpen
                    && !browserInteractionSuspended
                  }
                  onRemoved={handleCloseModule}
                />
              )}
              {entry.kind === 'review' && (
                <ReviewModule active={active} sessionId={sessionId} workingDirectory={workingDirectory} />
              )}
              {entry.kind === 'terminal' && (
                <TerminalModule sessionId={sessionId} workingDirectory={workingDirectory} />
              )}
              {entry.kind === 'canvas' && (
                <CanvasModule />
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

/** R18 Canvas entry — honest display-only; no canvas document or execution authority. */
function CanvasModule() {
  const { t } = useTranslation()
  return (
    <EntityListEmptyScreen
      icon={<Paintbrush />}
      title={t('rightWorkbench.modules.canvas')}
      description={t('rightWorkbench.canvas.displayOnly', {
        defaultValue: 'Canvas is display-only in this release. It does not own a document or run workflows.',
      })}
    />
  )
}

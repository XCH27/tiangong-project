import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Command as CommandPrimitive } from 'cmdk'
import { useAtomValue } from 'jotai'
import { Check, FolderPlus, MessageCircle, X } from 'lucide-react'
import { Icon_Folder } from '@craft-agent/ui'
import { projectsAtom } from '@/atoms/projects'

import { ServerDirectoryBrowser } from '@/components/ServerDirectoryBrowser'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { PATH_SEP, getPathBasename } from '@/lib/platform'
import { useWorkingDirectoryState } from './use-working-directory-state'

/**
 * Format a path for display with the home directory shortened, e.g.
 * "in Workspace/kanban-view". Returns "" for an empty path.
 */
export function formatPathForDisplay(path: string | undefined, homeDir: string): string {
  if (!path) return ''
  let displayPath = path
  if (homeDir && path.startsWith(homeDir)) {
    const relativePath = path.slice(homeDir.length)
    // Remove leading separator if present, show root separator if empty
    displayPath = relativePath.startsWith(PATH_SEP)
      ? relativePath.slice(1)
      : (relativePath || PATH_SEP)
  }
  return `in ${displayPath}`
}

/** State handed to {@link WorkingDirectorySelectorProps.renderTrigger}. */
export interface WorkingDirectoryTriggerState {
  /** Whether the popover is currently open. */
  open: boolean
  /** A non-session-root folder is selected. */
  hasFolder: boolean
  /** Basename of the selected folder, or undefined when nothing is selected. */
  folderName: string | undefined
  /** The raw selected path (for tooltips / path display). */
  workingDirectory: string | undefined
  /** Home directory, for shortening displayed paths. */
  homeDir: string
  /** Current git branch of the selected folder, or null. */
  gitBranch: string | null
}

export interface WorkingDirectorySelectorProps {
  workingDirectory?: string
  onWorkingDirectoryChange: (path: string) => void
  /** Session root, offered as the "Reset" target. Undefined disables reset. */
  sessionFolderPath?: string
  workspaceId?: string
  /**
   * Renders the popover trigger. The returned element is wrapped in
   * `<PopoverTrigger asChild>`, so it must forward a ref (a DOM element or a
   * ref-forwarding component).
   */
  renderTrigger: (state: WorkingDirectoryTriggerState) => React.ReactElement
  /** Popover side/align — defaults match the chat input badge. */
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

/**
 * WorkingDirectorySelector — trigger-agnostic working-directory picker.
 *
 * Owns the folder state machine ({@link useWorkingDirectoryState}), the Radix
 * popover with its cmdk recent-folders list, and the ServerDirectoryBrowser.
 * The trigger itself is supplied by the consumer via `renderTrigger` so the same
 * picker backs both the chat input badge and the Tasks editor field.
 */
export function WorkingDirectorySelector({
  workingDirectory,
  onWorkingDirectoryChange,
  sessionFolderPath,
  workspaceId,
  renderTrigger,
  side = 'top',
  align = 'start',
  sideOffset = 8,
}: WorkingDirectorySelectorProps) {
  const { t } = useTranslation()
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const closePopover = React.useCallback(() => setPopoverOpen(false), [])

  const {
    homeDir,
    gitBranch,
    filter,
    setFilter,
    sortedRecent: filteredRecent,
    hasFolder,
    folderName,
    handleSelectRecent,
    handleReset,
    handleRemoveRecent,
    handleChooseFolder,
    serverBrowser: {
      showServerBrowser,
      serverBrowserMode,
      cancelServerBrowser,
      confirmServerBrowser,
    },
  } = useWorkingDirectoryState({
    workingDirectory,
    onWorkingDirectoryChange,
    sessionFolderPath,
    workspaceId,
    isOpen: popoverOpen,
    onClose: closePopover,
  })

  // A Project is one folder (ZCode's project picker): list the workspace's projects
  // first, then legacy recent folders that have not become a project yet. Choosing
  // either sets the session folder; the server binds the folder's project.
  const projects = useAtomValue(projectsAtom)
  const projectEntries = React.useMemo(() => projects
    .filter(project => project.config.workingDirectory && !project.config.archivedAt)
    .sort((a, b) => (b.config.updatedAt ?? 0) - (a.config.updatedAt ?? 0))
    .map(project => ({ path: project.config.workingDirectory!, name: project.config.name })), [projects])
  const projectFolders = React.useMemo(() => new Set(projectEntries.map(entry => entry.path)), [projectEntries])
  const entries = React.useMemo(() => [
    ...projectEntries,
    ...filteredRecent
      .filter(path => !projectFolders.has(path))
      .map(path => ({ path, name: getPathBasename(path) || 'Folder' })),
  ], [projectEntries, projectFolders, filteredRecent])
  const currentName = projectEntries.find(entry => entry.path === workingDirectory)?.name ?? folderName

  // Autofocus the filter input on popover open. Lives in the consumer (not
  // the hook) because the compact drawer surface has no autofocus.
  React.useEffect(() => {
    if (popoverOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [popoverOpen])

  // Styles matching todo-filter-menu.tsx for consistency
  const MENU_CONTAINER_STYLE = 'min-w-[200px] max-w-[400px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small p-0'
  const MENU_LIST_STYLE = 'max-h-[200px] overflow-y-auto p-1 [&_[cmdk-list-sizer]]:space-y-px'
  const MENU_ITEM_STYLE = 'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-1.5 text-[13px] outline-none'

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          {renderTrigger({ open: popoverOpen, hasFolder, folderName: currentName, workingDirectory, homeDir, gitBranch })}
        </PopoverTrigger>
        <PopoverContent side={side} align={align} sideOffset={sideOffset} className={MENU_CONTAINER_STYLE}>
          <CommandPrimitive>
            <div className="border-b border-border/50 px-3 py-2">
              <CommandPrimitive.Input
                ref={inputRef}
                value={filter}
                onValueChange={setFilter}
                placeholder={t('chat.searchProjects')}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 placeholder:select-none"
              />
            </div>

            <CommandPrimitive.List className={MENU_LIST_STYLE}>
              {entries.map(({ path, name }) => {
                const selected = hasFolder && path === workingDirectory
                const isProject = projectFolders.has(path)
                return (
                  <CommandPrimitive.Item
                    key={path}
                    value={`${name} ${path}`}
                    onSelect={() => { if (selected) closePopover(); else handleSelectRecent(path) }}
                    className={cn(MENU_ITEM_STYLE, 'group/item data-[selected=true]:bg-foreground/5')}
                  >
                    <Icon_Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 min-w-0 truncate">
                      <span>{name}</span>
                      <span className="text-muted-foreground ml-1.5">{formatPathForDisplay(path, homeDir)}</span>
                    </span>
                    {selected ? (
                      <Check className="h-4 w-4 shrink-0" />
                    ) : !isProject && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, path)}
                        data-touch-reveal="true"
                        className="shrink-0 h-3 w-3 rounded-[3px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </CommandPrimitive.Item>
                )
              })}

              <CommandPrimitive.Empty className="py-3 text-center text-sm text-muted-foreground">
                {t('chat.noProjectsFound')}
              </CommandPrimitive.Empty>
            </CommandPrimitive.List>

            {/* Bottom actions - always visible, outside scrollable area */}
            <div className="border-t border-border/50 p-1">
              <button
                type="button"
                onClick={handleChooseFolder}
                className={cn(MENU_ITEM_STYLE, 'w-full hover:bg-foreground/5')}
              >
                <FolderPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-left">{t('chat.openFolder')}</span>
              </button>
              {sessionFolderPath && (
                <button
                  type="button"
                  onClick={() => { if (hasFolder) handleReset(); else closePopover() }}
                  className={cn(MENU_ITEM_STYLE, 'w-full hover:bg-foreground/5')}
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left">{t('chat.workOutsideProject')}</span>
                  {!hasFolder && <Check className="h-4 w-4 shrink-0" />}
                </button>
              )}
            </div>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
      <ServerDirectoryBrowser
        open={showServerBrowser}
        mode={serverBrowserMode}
        onSelect={confirmServerBrowser}
        onCancel={cancelServerBrowser}
        initialPath={workingDirectory}
      />
    </>
  )
}

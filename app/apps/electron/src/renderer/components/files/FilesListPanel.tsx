import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronLeft, File, FileCode, FileText, Folder, FolderOpen, Image, Pencil, RotateCcw, Search, X } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import type { FilesystemEntryListingResult } from '../../../shared/types'

type FilesystemEntry = FilesystemEntryListingResult['entries'][number]

interface FilesListPanelProps {
  rootPath?: string | null
  selectedFilePath?: string | null
  sessionId?: string | null
  onFileClick: (path: string) => void
  title?: string
  hideSearch?: boolean
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.split('/').filter(Boolean).pop() || path
}

function formatSize(bytes?: number): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function getEntryIcon(entry: FilesystemEntry) {
  const iconClass = 'h-3.5 w-3.5 text-muted-foreground'
  if (entry.type === 'directory') {
    return <Folder className={iconClass} />
  }

  const ext = entry.name.split('.').pop()?.toLowerCase()
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    return <FileText className={iconClass} />
  }
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext || '')) {
    return <Image className={iconClass} />
  }
  if (['ts', 'tsx', 'js', 'jsx', 'json', 'yaml', 'yml', 'py', 'rb', 'go', 'rs', 'css', 'html'].includes(ext || '')) {
    return <FileCode className={iconClass} />
  }
  return <File className={iconClass} />
}

function siblingPath(path: string, nextName: string): string {
  const slash = path.lastIndexOf('/')
  const backslash = path.lastIndexOf('\\')
  const idx = Math.max(slash, backslash)
  if (idx < 0) return nextName
  return `${path.slice(0, idx + 1)}${nextName}`
}

export function FilesListPanel({
  rootPath,
  selectedFilePath,
  sessionId,
  onFileClick,
  title,
  hideSearch = false,
}: FilesListPanelProps) {
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = React.useState(rootPath ?? '')
  const [listing, setListing] = React.useState<FilesystemEntryListingResult | null>(null)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [mutatingPath, setMutatingPath] = React.useState<string | null>(null)
  const [renamingPath, setRenamingPath] = React.useState<string | null>(null)
  const [renameDraft, setRenameDraft] = React.useState('')
  const [listingError, setListingError] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [reloadTick, setReloadTick] = React.useState(0)

  React.useEffect(() => {
    if (rootPath && !currentPath) setCurrentPath(rootPath)
  }, [rootPath, currentPath])

  React.useEffect(() => {
    if (!currentPath) {
      setListing(null)
      return
    }

    let stale = false
    setLoading(true)
    setListingError(null)
    window.electronAPI.listFilesystemEntries(currentPath)
      .then((nextListing) => {
        if (stale) return
        setListing(nextListing)
        setCurrentPath(nextListing.currentPath)
      })
      .catch((err) => {
        if (stale) return
        setListingError(err instanceof Error ? err.message : String(err))
        setListing(null)
      })
      .finally(() => {
        if (!stale) setLoading(false)
      })

    return () => { stale = true }
  }, [currentPath, reloadTick])

  const reloadCurrentPath = React.useCallback(() => {
    setReloadTick((value) => value + 1)
  }, [])

  const startRenameEntry = React.useCallback((entry: FilesystemEntry) => {
    if (!sessionId || mutatingPath) return
    setRenamingPath(entry.path)
    setRenameDraft(entry.name)
    setActionError(null)
  }, [mutatingPath, sessionId])

  const cancelRenameEntry = React.useCallback(() => {
    setRenamingPath(null)
    setRenameDraft('')
  }, [])

  const commitRenameEntry = React.useCallback(async (entry: FilesystemEntry) => {
    if (!sessionId || mutatingPath) return
    const nextName = renameDraft.trim()
    if (!nextName || nextName === entry.name) return
    if (/[\\/]/.test(nextName)) {
      setActionError(t('files.invalidName'))
      return
    }

    const nextPath = siblingPath(entry.path, nextName)
    setMutatingPath(entry.path)
    setActionError(null)
    try {
      await window.electronAPI.invokeInternalAction(sessionId, {
        actionDefinitionId: 'files.move_entry',
        contractVersion: 1,
        actor: USER_ACTOR,
        input: {
          fromPath: entry.path,
          toPath: nextPath,
        },
        idempotencyKey: `files-rename:${entry.path}->${nextPath}`,
      })
      if (selectedFilePath === entry.path) onFileClick(nextPath)
      setRenamingPath(null)
      setRenameDraft('')
      reloadCurrentPath()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setActionError(message)
      if (message.toLowerCase().includes('permission denied')) {
        setRenamingPath(null)
        setRenameDraft('')
        reloadCurrentPath()
      }
    } finally {
      setMutatingPath(null)
    }
  }, [mutatingPath, onFileClick, reloadCurrentPath, renameDraft, selectedFilePath, sessionId, t])

  const undoLastFileEdit = React.useCallback(async () => {
    if (!sessionId || mutatingPath) return
    setMutatingPath('__undo__')
    setActionError(null)
    try {
      await window.electronAPI.invokeInternalAction(sessionId, {
        actionDefinitionId: 'files.undo_last_edit',
        contractVersion: 1,
        actor: USER_ACTOR,
        input: {},
      })
      reloadCurrentPath()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setMutatingPath(null)
    }
  }, [mutatingPath, reloadCurrentPath, sessionId])

  const filteredEntries = React.useMemo(() => {
    const entries = listing?.entries ?? []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return entries
    return entries.filter((entry) => entry.name.toLowerCase().includes(normalized))
  }, [listing?.entries, query])

  if (!rootPath) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {t('files.noWorkspaceFolder')}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 px-3 py-2 border-b border-border/60 space-y-2">
        <div className="flex items-center gap-2 min-w-0 text-xs text-muted-foreground">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            {title ? (
              <>
                <span className="shrink-0 font-semibold text-foreground">{title}</span>
                <span className="text-muted-foreground/45">·</span>
                <span className="truncate" title={listing?.currentPath ?? currentPath}>
                  {basename(listing?.currentPath ?? currentPath)}
                </span>
              </>
            ) : (
              <span className="truncate" title={listing?.currentPath ?? currentPath}>
                {basename(listing?.currentPath ?? currentPath)}
              </span>
            )}
          </div>
          {sessionId && (
            <button
              type="button"
              onClick={undoLastFileEdit}
              disabled={Boolean(mutatingPath)}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              title={t('menu.undo')}
              aria-label={t('menu.undo')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {!hideSearch && (
          <div className="h-8 rounded-[7px] bg-muted/50 border border-border/60 flex items-center gap-2 px-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('files.searchPlaceholder')}
              className="w-full bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {listing?.parentPath && (
            <button
              type="button"
              onClick={() => setCurrentPath(listing.parentPath!)}
              className="w-full h-9 px-2 rounded-[7px] flex items-center gap-2 text-left text-[13px] text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {t('files.parentFolder')}
            </button>
          )}

          {loading ? (
            <div className="h-28 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Spinner className="text-base" />
              <span className="text-xs">{t('files.loading')}</span>
            </div>
          ) : listingError ? (
            <div className="px-3 py-8 text-center text-xs text-destructive">
              {listingError}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-muted-foreground">
              {t('files.empty')}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredEntries.map((entry) => {
                const isSelected = selectedFilePath === entry.path
                return (
                  <div
                    key={entry.path}
                    className={cn(
                      'group/file-row flex min-h-9 items-center gap-1 rounded-[7px] hover:bg-muted',
                      isSelected && 'bg-muted'
                    )}
                  >
                    {renamingPath === entry.path ? (
                      <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]">
                        <span className="shrink-0">{getEntryIcon(entry)}</span>
                        <input
                          value={renameDraft}
                          autoFocus
                          onFocus={(event) => event.currentTarget.select()}
                          onChange={(event) => setRenameDraft(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              void commitRenameEntry(entry)
                            } else if (event.key === 'Escape') {
                              event.preventDefault()
                              cancelRenameEntry()
                            }
                          }}
                          className="h-7 min-w-0 flex-1 rounded-[6px] border border-border bg-background px-2 text-[13px] text-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/25"
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (entry.type === 'directory') {
                            setCurrentPath(entry.path)
                          } else {
                            onFileClick(entry.path)
                          }
                        }}
                        className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]"
                      >
                        <span className="shrink-0">{getEntryIcon(entry)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-foreground">{entry.name}</span>
                          {entry.type === 'file' && (
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {formatSize(entry.size)}
                            </span>
                          )}
                        </span>
                      </button>
                    )}
                    {sessionId && renamingPath === entry.path ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void commitRenameEntry(entry)}
                          disabled={Boolean(mutatingPath)}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                          title={t('common.rename')}
                          aria-label={t('common.rename')}
                        >
                          {mutatingPath === entry.path ? (
                            <Spinner className="text-xs" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelRenameEntry}
                          disabled={Boolean(mutatingPath)}
                          className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                          title={t('common.close')}
                          aria-label={t('common.close')}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : sessionId && (
                      <button
                        type="button"
                        onClick={() => startRenameEntry(entry)}
                        disabled={Boolean(mutatingPath)}
                        className="mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-muted-foreground opacity-0 hover:bg-background hover:text-foreground group-hover/file-row:opacity-100 focus:opacity-100 disabled:cursor-not-allowed disabled:opacity-30"
                        title={t('common.rename')}
                        aria-label={t('common.rename')}
                      >
                        {mutatingPath === entry.path ? (
                          <Spinner className="text-xs" />
                        ) : (
                          <Pencil className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {actionError && (
        <div className="shrink-0 border-t border-border/60 px-3 py-2 text-[11px] text-destructive">
          {actionError}
        </div>
      )}

      {listing?.truncated && (
        <div className="shrink-0 px-3 py-2 border-t border-border/60 text-[11px] text-muted-foreground">
          {t('files.truncated', { count: listing.totalEntries })}
        </div>
      )}
    </div>
  )
}

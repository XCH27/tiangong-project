import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, File, FileCode, FileText, Folder, FolderOpen, Image, Search } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { FilesystemEntryListingResult } from '../../../shared/types'

type FilesystemEntry = FilesystemEntryListingResult['entries'][number]

interface FilesListPanelProps {
  rootPath?: string | null
  selectedFilePath?: string | null
  onFileClick: (path: string) => void
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

export function FilesListPanel({
  rootPath,
  selectedFilePath,
  onFileClick,
}: FilesListPanelProps) {
  const { t } = useTranslation()
  const [currentPath, setCurrentPath] = React.useState(rootPath ?? '')
  const [listing, setListing] = React.useState<FilesystemEntryListingResult | null>(null)
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
    setError(null)
    window.electronAPI.listFilesystemEntries(currentPath)
      .then((nextListing) => {
        if (stale) return
        setListing(nextListing)
        setCurrentPath(nextListing.currentPath)
      })
      .catch((err) => {
        if (stale) return
        setError(err instanceof Error ? err.message : String(err))
        setListing(null)
      })
      .finally(() => {
        if (!stale) setLoading(false)
      })

    return () => { stale = true }
  }, [currentPath])

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
        <div className="flex items-center gap-1.5 min-w-0 text-xs text-muted-foreground">
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate" title={listing?.currentPath ?? currentPath}>
            {basename(listing?.currentPath ?? currentPath)}
          </span>
        </div>
        <div className="h-8 rounded-[7px] bg-muted/50 border border-border/60 flex items-center gap-2 px-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('files.searchPlaceholder')}
            className="w-full bg-transparent outline-none text-[13px] placeholder:text-muted-foreground"
          />
        </div>
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
          ) : error ? (
            <div className="px-3 py-8 text-center text-xs text-destructive">
              {error}
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
                  <button
                    key={entry.path}
                    type="button"
                    onClick={() => {
                      if (entry.type === 'directory') {
                        setCurrentPath(entry.path)
                      } else {
                        onFileClick(entry.path)
                      }
                    }}
                    className={cn(
                      'w-full min-h-9 px-2 py-1.5 rounded-[7px] flex items-center gap-2 text-left text-[13px] hover:bg-muted',
                      isSelected && 'bg-muted'
                    )}
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
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {listing?.truncated && (
        <div className="shrink-0 px-3 py-2 border-t border-border/60 text-[11px] text-muted-foreground">
          {t('files.truncated', { count: listing.totalEntries })}
        </div>
      )}
    </div>
  )
}

import * as React from 'react'
import { AlertCircle, CheckCircle2, FileCode2, GitBranch, Github, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@craft-agent/ui'
import { cn } from '@/lib/utils'
import type { GitFileStatus, GitReviewState } from '../../../shared/types'

interface GitReviewPanelProps {
  rootPath?: string | null
  compact?: boolean
  onOpenFile?: (path: string) => void
}

const STATUS_LABEL: Record<GitFileStatus['kind'], string> = {
  added: 'A',
  modified: 'M',
  deleted: 'D',
  renamed: 'R',
  copied: 'C',
  untracked: 'U',
  conflicted: '!',
  unknown: '?',
}

export function GitReviewPanel({ rootPath, compact = false, onOpenFile }: GitReviewPanelProps) {
  const { t } = useTranslation()
  const [state, setState] = React.useState<GitReviewState | null>(null)
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null)
  const [diff, setDiff] = React.useState<string>('')
  const [diffMessage, setDiffMessage] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [loadingDiff, setLoadingDiff] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!rootPath || !window.electronAPI?.getGitReview) {
      setState(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const next = await window.electronAPI.getGitReview(rootPath)
      setState(next)
      setSelectedPath((current) => {
        if (current && next.files.some((file) => file.path === current)) return current
        return next.files[0]?.path ?? null
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setState(null)
    } finally {
      setLoading(false)
    }
  }, [rootPath])

  React.useEffect(() => {
    load()
  }, [load])

  React.useEffect(() => {
    let cancelled = false
    const loadDiff = async () => {
      if (!rootPath || !selectedPath || !window.electronAPI?.getGitFileDiff) {
        setDiff('')
        setDiffMessage(null)
        return
      }
      setLoadingDiff(true)
      setDiffMessage(null)
      try {
        const result = await window.electronAPI.getGitFileDiff(rootPath, selectedPath)
        if (cancelled) return
        setDiff(result.diff)
        if (result.tooLarge) {
          setDiffMessage(t('review.diffTooLarge'))
        } else if (result.binary) {
          setDiffMessage(t('review.binaryDiff'))
        } else if (!result.diff.trim()) {
          setDiffMessage(t('review.noInlineDiff'))
        }
      } catch (err) {
        if (!cancelled) {
          setDiff('')
          setDiffMessage(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) setLoadingDiff(false)
      }
    }
    loadDiff()
    return () => {
      cancelled = true
    }
  }, [rootPath, selectedPath, t])

  if (!rootPath) {
    return (
      <EmptyState
        icon={GitBranch}
        title={t('review.noWorkspace')}
        description={t('review.noWorkspaceDesc')}
      />
    )
  }

  if (loading && !state) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <Spinner className="text-base" />
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t('review.loadFailed')}
        description={error}
        action={<button className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted" onClick={load}>{t('common.refresh')}</button>}
      />
    )
  }

  if (!state?.isGitRepository) {
    return (
      <EmptyState
        icon={GitBranch}
        title={t('review.notGitRepo')}
        description={t('review.notGitRepoDesc')}
      />
    )
  }

  const selectedAbsolutePath = selectedPath && state.repositoryRoot
    ? `${state.repositoryRoot}/${selectedPath}`
    : null
  const githubRepo = state.remotes.find((remote) => remote.githubRepository)?.githubRepository

  return (
    <div className="flex h-full min-h-0 flex-col text-[12px]">
      <div className="shrink-0 space-y-2 border-b border-border/50 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-foreground">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">{state.currentBranch ?? t('review.detachedHead')}</span>
            </div>
            <div className="mt-1 truncate text-[11px] text-muted-foreground">
              {githubRepo ?? state.remotes[0]?.url ?? t('review.noRemote')}
            </div>
          </div>
          <button
            type="button"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={load}
            aria-label={t('common.refresh')}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <Metric label={t('review.changedFiles')} value={state.totals.files} />
          <Metric label={t('review.additions')} value={`+${state.totals.additions}`} tone="green" />
          <Metric label={t('review.deletions')} value={`-${state.totals.deletions}`} tone="red" />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <StatusPill ok={state.github.ghInstalled && state.github.authenticated} icon={Github}>
            {state.github.ghInstalled
              ? state.github.authenticated
                ? (state.github.username ? `GitHub: ${state.github.username}` : t('review.githubConnected'))
                : t('review.githubNotLoggedIn')
              : t('review.githubCliMissing')}
          </StatusPill>
          {!compact && state.branches.slice(0, 4).map((branch) => (
            <span
              key={branch.name}
              className={cn(
                'rounded-full border border-border/60 px-2 py-0.5',
                branch.current && 'border-primary/30 bg-primary/10 text-primary',
              )}
            >
              {branch.name}
            </span>
          ))}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(120px,0.95fr)_minmax(120px,1.05fr)]">
        <div className="min-h-0 overflow-auto border-b border-border/50 px-2 py-2">
          {state.files.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              {t('review.clean')}
            </div>
          ) : (
            <div className="space-y-1">
              {state.files.map((file) => (
                <button
                  key={`${file.oldPath ?? ''}:${file.path}`}
                  type="button"
                  className={cn(
                    'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted',
                    selectedPath === file.path && 'bg-muted text-foreground',
                  )}
                  onClick={() => setSelectedPath(file.path)}
                  onDoubleClick={() => {
                    if (state.repositoryRoot) onOpenFile?.(`${state.repositoryRoot}/${file.path}`)
                  }}
                >
                  <span className={cn(
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-semibold',
                    file.kind === 'deleted' && 'bg-red-500/10 text-red-600 dark:text-red-400',
                    file.kind === 'added' || file.kind === 'untracked' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : '',
                    file.kind === 'modified' && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                    file.kind === 'renamed' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
                    file.kind === 'conflicted' && 'bg-destructive/10 text-destructive',
                  )}>
                    {STATUS_LABEL[file.kind]}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px]" title={file.path}>
                    {file.path}
                  </span>
                  {(file.additions !== undefined || file.deletions !== undefined) && (
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                      <span className="text-green-600 dark:text-green-400">+{file.additions ?? 0}</span>
                      {' '}
                      <span className="text-red-600 dark:text-red-400">-{file.deletions ?? 0}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 overflow-hidden">
          <div className="flex h-8 items-center justify-between gap-2 border-b border-border/50 px-3">
            <div className="flex min-w-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <FileCode2 className="h-3.5 w-3.5" />
              <span className="truncate">{selectedPath ?? t('review.noFileSelected')}</span>
            </div>
            {selectedAbsolutePath && (
              <button
                type="button"
                className="shrink-0 rounded px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onOpenFile?.(selectedAbsolutePath)}
              >
                {t('review.openPreview')}
              </button>
            )}
          </div>
          <div className="h-[calc(100%-2rem)] overflow-auto bg-muted/20 p-3">
            {loadingDiff ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Spinner className="text-base" />
              </div>
            ) : diffMessage ? (
              <div className="flex h-full items-center justify-center px-3 text-center text-[12px] text-muted-foreground">
                {diffMessage}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground">
                {diff}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'green' | 'red' }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 px-2 py-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={cn(
        'font-mono text-[12px] font-semibold text-foreground',
        tone === 'green' && 'text-green-600 dark:text-green-400',
        tone === 'red' && 'text-red-600 dark:text-red-400',
      )}>
        {value}
      </div>
    </div>
  )
}

function StatusPill({
  ok,
  icon: Icon,
  children,
}: {
  ok: boolean
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5',
      ok ? 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300' : 'border-border/60 bg-muted/30',
    )}>
      {ok ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <Icon className="h-3 w-3 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mt-1 text-xs leading-relaxed">{description}</div>
      </div>
      {action}
    </div>
  )
}

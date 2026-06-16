import * as React from 'react'
import { AlertTriangle, Check, CheckCircle2, Loader2, Plus, RefreshCw, Terminal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CliRuntimeDetectResult, CliRuntimeProbeResult } from '../../../shared/types'
import { navigate, routes } from '@/lib/navigate'
import { getCliRuntimeIconComponent } from '@/lib/cli-runtime-icons'
import {
  CLI_RUNTIME_DETECTED_EVENT,
  formatCliRuntimeVersion,
  mergeSupportedCliRuntimeTools,
  readCachedCliRuntimeDetectResult,
  writeCachedCliRuntimeDetectResult,
} from '@/lib/cli-runtime-cache'

function failureReasonLabel(reason: CliRuntimeProbeResult['failureReason']): string {
  switch (reason) {
    case 'not_found':
      return '未安装'
    case 'broken_link':
      return '入口损坏'
    case 'timeout':
      return '检测超时'
    case 'version_failed':
      return '版本检测失败'
    case 'unsupported_platform':
      return '平台不支持'
    case 'unknown':
    default:
      return '检测失败'
  }
}

interface CliRuntimePanelProps {
  compact?: boolean
  className?: string
  variant?: 'card' | 'popover'
  showCustom?: boolean
  showSettingsLink?: boolean
  selectedRuntimeId?: CliRuntimeProbeResult['id'] | null
  onSelectRuntime?: (tool: CliRuntimeProbeResult) => void
  onClearRuntime?: () => void
}

function formatCheckedAt(checkedAt: number): string {
  if (!checkedAt) return ''
  return new Intl.DateTimeFormat(undefined, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(checkedAt))
}

function statusLabel(tool: CliRuntimeProbeResult, hasResult: boolean): string {
  if (!hasResult) return '待检测'
  if (tool.available) return formatCliRuntimeVersion(tool.version) ?? '可用'
  return failureReasonLabel(tool.failureReason)
}

function CliRuntimeBrandIcon({
  id,
  muted,
}: {
  id: CliRuntimeProbeResult['id']
  muted: boolean
}) {
  const Icon = getCliRuntimeIconComponent(id)

  return (
    <span className={cn('flex size-4 shrink-0 items-center justify-center', muted && 'grayscale opacity-45')}>
      <Icon aria-hidden="true" className="size-4" size={16} />
    </span>
  )
}

export function CliRuntimePanel({
  compact = false,
  className,
  variant = 'card',
  showCustom = true,
  showSettingsLink = false,
  selectedRuntimeId,
  onSelectRuntime,
  onClearRuntime,
}: CliRuntimePanelProps) {
  const cachedResult = React.useMemo(() => readCachedCliRuntimeDetectResult(), [])
  const [state, setState] = React.useState<'idle' | 'loading' | 'ready' | 'error'>(cachedResult ? 'ready' : 'idle')
  const [result, setResult] = React.useState<CliRuntimeDetectResult | null>(cachedResult)
  const [error, setError] = React.useState<string | null>(null)
  const [customName, setCustomName] = React.useState('')
  const [customPath, setCustomPath] = React.useState('')

  const tools = React.useMemo(() => mergeSupportedCliRuntimeTools(result), [result])
  const availableCount = tools.filter(tool => tool.available).length
  const isPopover = variant === 'popover'
  const hasResult = result !== null
  const visibleTools = React.useMemo(
    () => (isPopover && hasResult ? tools.filter(tool => tool.available) : tools),
    [hasResult, isPopover, tools],
  )
  const hasCustomDraft = customName.trim().length > 0 || customPath.trim().length > 0

  const detect = React.useCallback(async () => {
    setState('loading')
    setError(null)

    try {
      const next = await window.electronAPI.detectCliRuntimes()
      writeCachedCliRuntimeDetectResult(next)
      setResult(next)
      setState('ready')
    } catch (err) {
      setError(err instanceof Error ? err.message : '检测本机 CLI 失败')
      setState('error')
    }
  }, [])

  React.useEffect(() => {
    const handleDetected = (event: Event) => {
      const next = (event as CustomEvent<CliRuntimeDetectResult>).detail
      if (!next) return
      setResult(next)
      setError(null)
      setState('ready')
    }

    window.addEventListener(CLI_RUNTIME_DETECTED_EVENT, handleDetected)
    return () => window.removeEventListener(CLI_RUNTIME_DETECTED_EVENT, handleDetected)
  }, [])

  const summary = (() => {
    if (state === 'ready' && availableCount > 0) return isPopover ? `${availableCount} 个可用` : `已检测到 ${availableCount} 个可用 CLI。`
    if (state === 'ready') return '没有在 PATH 中检测到常见 CLI。可以安装后重新检测，或手动填写可执行文件路径。'
    if (state === 'error') return '探测失败。'
    return '启动软件会自动检测；也可以手动刷新。'
  })()
  const checkedAtLabel = result ? formatCheckedAt(result.checkedAt) : ''
  const title = isPopover ? 'CLI' : '本机 CLI'

  return (
    <div
      className={cn(
        isPopover
          ? 'overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small'
          : 'rounded-xl bg-foreground-2 shadow-minimal',
        className,
      )}
    >
      <div className={cn('flex items-start gap-3', compact ? 'p-3' : 'p-4')}>
        <div className={cn('flex shrink-0 items-center justify-center bg-muted text-muted-foreground', isPopover ? 'size-8 rounded-[8px]' : 'size-10 rounded-lg')}>
          <Terminal className={cn(isPopover ? 'size-4' : 'size-5')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium">{title}</h3>
            {state === 'ready' && availableCount > 0 && <CheckCircle2 className="size-4 shrink-0 text-success" />}
            {state === 'ready' && availableCount === 0 && <AlertTriangle className="size-4 shrink-0 text-muted-foreground" />}
            {state === 'error' && <AlertTriangle className="size-4 shrink-0 text-destructive" />}
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {summary}
            {checkedAtLabel && <span className="ml-1">{isPopover ? `· ${checkedAtLabel}` : `上次检测 ${checkedAtLabel}`}</span>}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={detect}
          disabled={state === 'loading'}
          title="重新检测"
          className={cn('h-8 shrink-0 rounded-lg bg-background shadow-minimal', isPopover ? 'w-8 px-0' : 'px-3')}
        >
          {state === 'loading'
            ? <Loader2 className={cn('size-3.5 animate-spin', !isPopover && 'mr-1.5')} />
            : <RefreshCw className={cn('size-3.5', !isPopover && 'mr-1.5')} />}
          {!isPopover && (state === 'idle' ? '检测' : state === 'loading' ? '检测中' : '重新检测')}
        </Button>
      </div>

      {(visibleTools.length > 0 || error || (isPopover && hasResult)) && (
        <div className={cn('border-t border-border/60', compact ? 'px-3 pb-3' : 'px-4 pb-4')}>
          {error ? (
            <p className="pt-3 text-xs text-destructive">{error}</p>
          ) : isPopover && visibleTools.length === 0 ? (
            <div className="space-y-2 pt-3">
              <p className="text-xs text-muted-foreground">未检测到可用 CLI。</p>
              {showSettingsLink && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-full rounded-[6px] text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(routes.view.settings('cli'))}
                >
                  打开 CLI 设置
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 pt-3">
              {isPopover && onClearRuntime && (
                <button
                  type="button"
                  className={cn(
                    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-left text-xs transition-colors hover:bg-foreground/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                    !selectedRuntimeId ? 'bg-foreground/5 text-foreground' : 'text-muted-foreground',
                  )}
                  onClick={onClearRuntime}
                >
                  <span className="min-w-0 truncate font-medium">API 模型</span>
                  {!selectedRuntimeId && <Check className="size-3.5 text-success" />}
                </button>
              )}
              <div className={cn('grid grid-cols-1 gap-1.5', !isPopover && 'sm:grid-cols-2')}>
                {visibleTools.map(tool => {
                  const isSelected = selectedRuntimeId === tool.id
                  const rowClassName = cn(
                    'grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs',
                    tool.available ? 'text-foreground' : 'text-muted-foreground',
                    !hasResult && 'opacity-80',
                    isSelected && 'bg-foreground/5',
                    onSelectRuntime && tool.available && 'w-full text-left transition-colors hover:bg-foreground/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  )
                  const rowContent = (
                    <>
                      <span className="flex min-w-0 items-center gap-1.5 font-medium">
                        <CliRuntimeBrandIcon id={tool.id} muted={!tool.available || !hasResult} />
                        <span className="min-w-0 truncate">{tool.displayName}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 truncate text-right text-muted-foreground">
                        <span className="truncate">{statusLabel(tool, hasResult)}</span>
                        {isSelected && <Check className="size-3.5 shrink-0 text-success" />}
                      </span>
                    </>
                  )

                  return onSelectRuntime && tool.available ? (
                    <button
                      key={tool.id}
                      type="button"
                      className={rowClassName}
                      title={tool.resolvedPath ?? tool.failureReason}
                      onClick={() => onSelectRuntime(tool)}
                    >
                      {rowContent}
                    </button>
                  ) : (
                    <div
                      key={tool.id}
                      className={rowClassName}
                      title={tool.resolvedPath ?? tool.failureReason}
                    >
                      {rowContent}
                    </div>
                  )
                })}
              </div>
              {!isPopover && (
                <p className="text-xs text-muted-foreground">
                  当前阶段先接入探测入口；启动、停止、接管交互式终端会走 craft permission 与 session timeline。
                </p>
              )}
              {showSettingsLink && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 w-full rounded-[6px] text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => navigate(routes.view.settings('cli'))}
                >
                  打开 CLI 设置
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {showCustom && (
        <div className={cn('border-t border-border/60', compact ? 'p-3' : 'p-4')}>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-foreground/80">
            <Plus className="size-3.5" />
            其他 CLI
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,0.6fr)_minmax(0,1.4fr)]">
            <Input
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="名称，如 cursor-agent"
              className="h-8 rounded-lg bg-background text-xs"
            />
            <Input
              value={customPath}
              onChange={(event) => setCustomPath(event.target.value)}
              placeholder="/usr/local/bin/xxx 或直接输入命令名"
              className="h-8 rounded-lg bg-background text-xs"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {hasCustomDraft
              ? '已记录输入，下一步会保存到 craft preferences 并纳入 CLI 会话启动。'
              : '自动检测不全时，先在这里填写路径；后续保存到现有 preferences，不另建配置。'}
          </p>
        </div>
      )}
    </div>
  )
}

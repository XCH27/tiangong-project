import * as React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PanelHeaderCenterButton } from '@/components/ui/PanelHeaderCenterButton'
import { cn } from '@/lib/utils'
import { getModelContextWindow } from '@config/models'
import { formatTokenCount } from './input/model-picker-helpers'
import { Spinner } from '@craft-agent/ui'
import type { SessionUsageView } from '@craft-agent/shared/protocol'

type ContextUsageStatus = {
  isCompacting?: boolean
  inputTokens?: number
  contextWindow?: number
}

interface SessionUsageButtonProps {
  sessionId: string
  currentModel: string
  contextStatus?: ContextUsageStatus
  isCliRuntimeActive?: boolean
}

function getContextUsageRing(status: ContextUsageStatus | undefined, modelId: string) {
  const limit = status?.contextWindow || getModelContextWindow(modelId)
  const used = status?.inputTokens ?? 0
  if (!limit || used <= 0) {
    return {
      percent: null,
      label: '暂无上下文用量',
      title: '暂无上下文用量',
      usedLabel: '0',
      limitLabel: limit ? formatTokenCount(limit) : '未知',
    }
  }

  const percent = Math.min(99, Math.max(0, Math.round((used / limit) * 100)))
  const usedLabel = formatTokenCount(used)
  const limitLabel = formatTokenCount(limit)
  return {
    percent,
    label: `${percent}%`,
    title: `上下文用量 ${percent}% · ${usedLabel} / ${limitLabel}`,
    usedLabel,
    limitLabel,
  }
}

function ContextUsageRing({
  percent,
  title,
}: {
  percent: number | null
  title: string
}) {
  const clamped = percent ?? 0
  const color = percent == null
    ? 'color-mix(in oklab, var(--foreground) 18%, transparent)'
    : percent >= 90
      ? 'var(--destructive)'
      : 'var(--info)'

  return (
    <span
      title={title}
      aria-label={title}
      className="relative h-4 w-4 shrink-0 rounded-full"
      style={{
        background: `conic-gradient(${color} ${clamped * 3.6}deg, color-mix(in oklab, var(--foreground) 14%, transparent) 0deg)`,
      }}
    >
      <span className="absolute inset-[3.5px] rounded-full bg-background" />
    </span>
  )
}

function formatUsageSource(source: SessionUsageView['context']['usedSource']): string {
  switch (source) {
    case 'real':
      return '真实'
    case 'estimated':
      return '估算'
    default:
      return '未知'
  }
}

function formatUsagePercent(value: number | null | undefined): string {
  if (value == null) return '未知'
  return `${Math.round(value * 100)}%`
}

function formatUsageTokenPair(context: SessionUsageView['context']): string {
  const used = formatTokenCount(context.usedTokens)
  if (context.contextWindow == null) return used
  return `${used} / ${formatTokenCount(context.contextWindow)}`
}

function usageSegmentColor(id: string): string {
  switch (id) {
    case 'system':
      return 'bg-info'
    case 'rules':
      return 'bg-warning'
    case 'tools':
      return 'bg-accent'
    case 'skills':
      return 'bg-success'
    case 'mcp':
      return 'bg-destructive'
    case 'subagents':
      return 'bg-purple-500'
    case 'conversation':
      return 'bg-foreground/70'
    default:
      return 'bg-muted-foreground/50'
  }
}

function formatPlanReset(value: string | number): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function SessionUsageButton({
  sessionId,
  currentModel,
  contextStatus,
  isCliRuntimeActive = false,
}: SessionUsageButtonProps) {
  const [open, setOpen] = React.useState(false)
  const [sessionUsage, setSessionUsage] = React.useState<SessionUsageView | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const contextUsageRing = React.useMemo(
    () => getContextUsageRing(contextStatus, currentModel),
    [contextStatus, currentModel],
  )

  React.useEffect(() => {
    if (!open || !sessionId) return

    let cancelled = false
    setLoading(true)
    setError(null)
    window.electronAPI.getSessionUsage(sessionId)
      .then((usage) => {
        if (!cancelled) setSessionUsage(usage)
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[SessionUsageButton] Failed to load session usage:', err)
          setError(err instanceof Error ? err.message : String(err))
          setSessionUsage(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [sessionId, open])

  const title = isCliRuntimeActive ? '上下文由 CLI 管理' : contextUsageRing.title

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <PanelHeaderCenterButton
          aria-label="Token 用量"
          title={title}
          icon={<ContextUsageRing percent={isCliRuntimeActive ? null : contextUsageRing.percent} title={title} />}
        />
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" sideOffset={8} className="w-[340px] rounded-[8px] p-3">
        <div className="space-y-3 text-sm">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Spinner className="h-3.5 w-3.5" />
              正在读取用量…
            </div>
          ) : error ? (
            <div className="text-xs text-destructive">读取失败：{error}</div>
          ) : sessionUsage ? (
            <>
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">上下文用量</span>
                  {sessionUsage.context.segments.some(s => s.source === 'estimated') && (
                    <span className="rounded bg-foreground/[0.06] px-1 py-0.5 text-[10px] text-muted-foreground">估算</span>
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {sessionUsage.context.percentFull == null
                      ? '由 CLI 管理'
                      : `${formatUsagePercent(sessionUsage.context.percentFull)} 已用`}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {sessionUsage.context.contextWindow == null
                      ? formatUsageTokenPair(sessionUsage.context)
                      : `~${formatUsageTokenPair(sessionUsage.context)} Tokens`}
                  </span>
                </div>
                {sessionUsage.context.segments.length > 0 && (() => {
                  const segTotal = sessionUsage.context.segments.reduce((sum, s) => sum + s.tokens, 0) || 1
                  return (
                    <div className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                      {sessionUsage.context.segments.map(seg => (
                        <div key={seg.id} className={cn('h-full', usageSegmentColor(seg.id))} style={{ width: `${(seg.tokens / segTotal) * 100}%` }} />
                      ))}
                    </div>
                  )
                })()}
                {sessionUsage.context.segments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {sessionUsage.context.segments.map(seg => (
                      <div key={seg.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className={cn('h-2 w-2 shrink-0 rounded-[2px]', usageSegmentColor(seg.id))} />
                          <span className="truncate text-foreground/70">{seg.label}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">{formatTokenCount(seg.tokens)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {sessionUsage.modelLabel} · {formatUsageSource(sessionUsage.context.usedSource)}
                  </div>
                )}
              </div>

              {sessionUsage.plan.available && sessionUsage.plan.windows.length > 0 && (
                <div className="border-t border-border/50 pt-2.5">
                  <div className="mb-1.5 font-medium">套餐额度</div>
                  <div className="space-y-2">
                    {sessionUsage.plan.windows.map(window => (
                      <div key={window.id}>
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="min-w-0 truncate">{window.label}</span>
                          <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                            {window.resetsAt ? <span>重置 {formatPlanReset(window.resetsAt)}</span> : null}
                            <span className="tabular-nums text-foreground/80">{formatUsagePercent(window.percentUsed)}</span>
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                          <div className="h-full rounded-full bg-info" style={{ width: `${Math.round((window.percentUsed ?? 0) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-muted-foreground">暂无用量数据</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

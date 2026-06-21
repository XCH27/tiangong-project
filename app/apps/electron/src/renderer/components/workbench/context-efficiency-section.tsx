import type { ReactNode } from 'react'
import type { ContextSignalConfidence, ToolCapability } from '@craft-agent/shared/protocol'
import {
  METRIC_KIND_CLASS,
  METRIC_KIND_LABEL,
  type SectionPhase,
  TOOL_SOURCE_LABEL,
} from '@/lib/context-efficiency-ui'

export function MetricKindBadge({
  kind,
  suffix,
}: {
  kind: ContextSignalConfidence
  suffix?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${METRIC_KIND_CLASS[kind]}`}
    >
      {METRIC_KIND_LABEL[kind]}
      {suffix ? ` · ${suffix}` : ''}
    </span>
  )
}

export function SectionBlock({
  step,
  title,
  description,
  phase,
  empty,
  error,
  loading,
  children,
  actions,
}: {
  step: number
  title: string
  description?: string
  phase: SectionPhase
  empty?: ReactNode
  error?: string
  loading?: ReactNode
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="rounded-[8px] border border-border/70 p-2.5 sm:p-3 space-y-2 min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold">
              {step}
            </span>
            <h3 className="font-medium truncate">{title}</h3>
          </div>
          {description && <p className="text-[10px] text-muted-foreground leading-relaxed">{description}</p>}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      {phase === 'loading' && (loading ?? <p className="text-[10px] text-muted-foreground">加载中…</p>)}
      {phase === 'error' && error && (
        <div className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[10px] text-destructive break-words">
          {error}
        </div>
      )}
      {phase === 'empty' && (empty ?? <p className="text-[10px] text-muted-foreground">暂无数据。</p>)}
      {phase === 'ready' && children}
    </section>
  )
}

export function ToolCapabilityCard({ tool }: { tool: ToolCapability }) {
  const sourceLabel = TOOL_SOURCE_LABEL[tool.source] ?? tool.source
  const isReady = tool.status === 'available' || tool.status === 'conflict'

  return (
    <div className="rounded border border-border/60 bg-muted/10 p-2 space-y-1 min-w-0">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="font-medium truncate">{tool.displayName}</span>
        <span className={`text-[10px] shrink-0 ${isReady ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
          {tool.status}
        </span>
      </div>
      {isReady ? (
        <>
          {tool.path && <div className="font-mono text-[10px] break-all text-muted-foreground">{tool.path}</div>}
          <div className="text-[10px] text-muted-foreground">
            来源：{sourceLabel}
            {tool.version ? ` · 版本 ${tool.version}` : ''}
          </div>
        </>
      ) : (
        <>
          {tool.diagnostics[0]?.message && (
            <div className="text-[10px] text-muted-foreground break-words">{tool.diagnostics[0].message}</div>
          )}
          {tool.diagnostics[0]?.repairSuggestion && (
            <div className="text-[10px] text-amber-800 dark:text-amber-200 break-words">
              建议：{tool.diagnostics[0].repairSuggestion}
            </div>
          )}
          {!tool.diagnostics[0]?.repairSuggestion && (
            <div className="text-[10px] text-amber-800 dark:text-amber-200">
              Fleet 不会自动安装或修改 PATH；请在系统工具页手动配置后重新检测。
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function ScrollPre({ children, maxClass = 'max-h-36' }: { children: ReactNode; maxClass?: string }) {
  return (
    <pre
      className={`${maxClass} overflow-auto whitespace-pre-wrap break-all text-[10px] bg-background/60 border border-border/40 p-1.5 rounded min-w-0`}
    >
      {children}
    </pre>
  )
}

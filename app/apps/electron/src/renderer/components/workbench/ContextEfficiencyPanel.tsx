/**
 * ContextEfficiencyPanel — 自包含 Context Center UI（T-CONTEXT-EFF-UI）。
 *
 * 展示 ProjectPack delta、rtk/codegraph 测试、外部审查 job 与 overview。
 * 文案区分：真实 token / 估算 token / 外部平台成本未知 / 本地未外发。
 * 不改 AppShell / Stage / SessionManager。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ContextAdapterCodegraphResult,
  ContextAdapterRtkResult,
  ContextCenterOverview,
  ContextSignalConfidence,
  ProjectPackDeltaMode,
  ProjectPackDeltaPlanResult,
  ToolCapability,
} from '@craft-agent/shared/protocol'
import { ProjectPackPanel } from './ProjectPackPanel'
import { ExternalReviewCenterPanel } from './ExternalReviewCenterPanel'

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; data: T }

const DELTA_MODE_LABELS: Record<ProjectPackDeltaMode, string> = {
  diff: 'Git diff（工作区改动）',
  staged: '已暂存',
  untracked: '未跟踪',
}

function ConfidenceBadge({
  confidence,
  locality,
  note,
}: {
  confidence: ContextSignalConfidence
  locality?: string
  note?: string
}) {
  const label =
    confidence === 'real'
      ? '真实 token / 本机记录'
      : confidence === 'estimate'
        ? '估算 token'
        : '未知 / 外部平台成本未知'
  const tone =
    confidence === 'real'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : confidence === 'estimate'
        ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
        : 'bg-muted text-muted-foreground'

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${tone}`}
      title={note ?? (locality === 'local' ? '本地未外发' : undefined)}
    >
      {label}
      {locality === 'local' ? ' · 本地未外发' : ''}
    </span>
  )
}

function ToolStatusRow({ tool }: { tool: ToolCapability }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-2 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{tool.displayName}</span>
        <span className="text-muted-foreground">{tool.status}</span>
      </div>
      {tool.path && <div className="font-mono text-[10px] break-all text-muted-foreground">{tool.path}</div>}
      {tool.version && <div className="text-[10px] text-muted-foreground">版本 {tool.version}</div>}
      {tool.diagnostics[0]?.message && (
        <div className="text-[10px] text-muted-foreground">{tool.diagnostics[0].message}</div>
      )}
      {tool.diagnostics[0]?.repairSuggestion && (
        <div className="text-[10px] text-amber-700 dark:text-amber-300">{tool.diagnostics[0].repairSuggestion}</div>
      )}
    </div>
  )
}

function SidecarNote({ result }: { result: ContextAdapterRtkResult | ContextAdapterCodegraphResult }) {
  if (result.applied) {
    return (
      <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
        已通过 System Tools 解析的 sidecar 执行（{result.availability.available ? result.availability.path : '—'}）。
      </p>
    )
  }
  return (
    <p className="text-[10px] text-amber-800 dark:text-amber-200">
      使用 Fleet 本地降级逻辑，不是 rtk/codegraph sidecar。
      {result.note ? ` ${result.note}` : ''}
      {!result.availability.available && 'reason' in result.availability
        ? ` (${result.availability.reason})`
        : ''}
    </p>
  )
}

export interface ContextEfficiencyPanelProps {
  workspacePath: string
  workspaceId?: string
  sessionId?: string
  bundleId?: string
  variant?: 'compact' | 'full'
  showFullProjectPack?: boolean
}

export function ContextEfficiencyPanel({
  workspacePath,
  workspaceId,
  sessionId,
  bundleId,
  variant = 'full',
  showFullProjectPack = false,
}: ContextEfficiencyPanelProps) {
  const compact = variant === 'compact'

  const [overviewState, setOverviewState] = useState<AsyncState<ContextCenterOverview>>({ status: 'idle' })

  const [deltaPath, setDeltaPath] = useState(workspacePath)
  const [deltaMode, setDeltaMode] = useState<ProjectPackDeltaMode>('diff')
  const [deltaState, setDeltaState] = useState<AsyncState<ProjectPackDeltaPlanResult>>({ status: 'idle' })

  const [rtkInput, setRtkInput] = useState('npm test\n'.repeat(8))
  const [rtkState, setRtkState] = useState<AsyncState<ContextAdapterRtkResult>>({ status: 'idle' })

  const [codegraphQuery, setCodegraphQuery] = useState('findUser')
  const [codegraphState, setCodegraphState] = useState<AsyncState<ContextAdapterCodegraphResult>>({ status: 'idle' })

  useEffect(() => {
    setDeltaPath(workspacePath)
  }, [workspacePath])

  const overviewInput = useMemo(
    () => ({
      sessionId,
      workspaceId,
      rootPath: workspacePath || undefined,
      bundleId: bundleId || undefined,
      forceToolDetection: false,
    }),
    [sessionId, workspaceId, workspacePath, bundleId],
  )

  const loadOverview = useCallback(async () => {
    setOverviewState({ status: 'loading' })
    try {
      const data = await window.electronAPI.getContextCenterOverview(overviewInput)
      setOverviewState({ status: 'done', data })
    } catch (err) {
      setOverviewState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }, [overviewInput])

  useEffect(() => {
    void loadOverview()
  }, [loadOverview])

  const runDeltaPlan = useCallback(async () => {
    if (!deltaPath.trim()) {
      setDeltaState({ status: 'error', message: '请填写 workspacePath' })
      return
    }
    setDeltaState({ status: 'loading' })
    try {
      const data = await window.electronAPI.planProjectPackDelta({
        workspacePath: deltaPath.trim(),
        mode: deltaMode,
      })
      setDeltaState({ status: 'done', data })
    } catch (err) {
      setDeltaState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [deltaPath, deltaMode])

  const runRtk = useCallback(async () => {
    setRtkState({ status: 'loading' })
    try {
      const data = await window.electronAPI.compressContextRtk({ input: rtkInput })
      setRtkState({ status: 'done', data })
    } catch (err) {
      setRtkState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [rtkInput])

  const runCodegraph = useCallback(async () => {
    if (!workspacePath.trim()) {
      setCodegraphState({ status: 'error', message: '需要项目根路径' })
      return
    }
    setCodegraphState({ status: 'loading' })
    try {
      const data = await window.electronAPI.queryContextCodegraph({
        rootPath: workspacePath.trim(),
        query: codegraphQuery.trim(),
      })
      setCodegraphState({ status: 'done', data })
    } catch (err) {
      setCodegraphState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [workspacePath, codegraphQuery])

  const overview = overviewState.status === 'done' ? overviewState.data : null
  const sidecarTools = useMemo(
    () => overview?.contextTools.value.filter((t) => t.toolId === 'codegraph' || t.toolId === 'rtk') ?? [],
    [overview],
  )

  const sectionClass = compact
    ? 'rounded-[8px] border border-border/70 p-2.5 space-y-2'
    : 'rounded-[8px] border border-border/70 p-3 space-y-3'

  return (
    <div className="flex flex-col gap-3 text-xs" data-testid="context-efficiency-panel">
      <div className={sectionClass}>
        <div className="flex items-center justify-between gap-2">
          <div className="font-medium">Context Center 概览</div>
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground underline"
            onClick={() => void loadOverview()}
            disabled={overviewState.status === 'loading'}
          >
            刷新
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          会话用量为真实 token（若已连接 session）；压缩/打包/图谱为估算 token。外部审查不自动登录、不自动上传、不绕过平台限制。
        </p>

        {overviewState.status === 'loading' && <div className="text-muted-foreground">加载中…</div>}
        {overviewState.status === 'error' && (
          <div className="text-destructive">{overviewState.message}</div>
        )}

        {overview && (
          <div className="space-y-2">
            {overview.usage && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                <span className="text-muted-foreground">输入 token</span>
                <span className="flex items-center gap-1 flex-wrap">
                  {overview.usage.inputTokens.value.toLocaleString()}
                  <ConfidenceBadge confidence={overview.usage.inputTokens.confidence} locality={overview.usage.inputTokens.locality} />
                </span>
                <span className="text-muted-foreground">上下文占用</span>
                <span className="flex items-center gap-1 flex-wrap">
                  {overview.usage.estimatedContextPercent
                    ? `${Math.round(overview.usage.estimatedContextPercent.value * 100)}%`
                    : '—'}
                  {overview.usage.estimatedContextPercent && (
                    <ConfidenceBadge confidence={overview.usage.estimatedContextPercent.confidence} />
                  )}
                </span>
              </div>
            )}

            <div>
              <div className="text-[10px] font-medium mb-1">审查 readiness</div>
              <div className="text-muted-foreground">{overview.reviewReadiness.status.value}</div>
              <ul className="mt-1 list-disc pl-4 text-[10px] text-muted-foreground">
                {overview.reviewReadiness.reasons.value.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>

            {overview.recommendations.length > 0 && (
              <details open={!compact}>
                <summary className="cursor-pointer font-medium">建议 ({overview.recommendations.length})</summary>
                <ul className="mt-2 space-y-2">
                  {overview.recommendations.map((rec) => (
                    <li key={rec.action} className="border border-border/50 rounded p-2">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">{rec.action}</span>
                        <span className="text-muted-foreground">{rec.status}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground">{rec.reason}</p>
                      {rec.requiresPermission && (
                        <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">需要用户授权</p>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {overview.notes.length > 0 && (
              <details>
                <summary className="cursor-pointer text-muted-foreground">备注</summary>
                <ul className="mt-1 list-disc pl-4 text-[10px] text-muted-foreground">
                  {overview.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      {sidecarTools.length > 0 && (
        <div className={sectionClass}>
          <div className="font-medium">Sidecar 工具（System Tools）</div>
          <p className="text-[10px] text-muted-foreground">状态来自统一 registry，非直接 which。</p>
          {sidecarTools.map((tool) => (
            <ToolStatusRow key={tool.toolId} tool={tool} />
          ))}
        </div>
      )}

      <div className={sectionClass}>
        <div className="font-medium">ProjectPack Delta（只读规划）</div>
        <p className="text-[10px] text-muted-foreground">不写 bundle、不外发，仅规划增量范围。</p>
        <label className="block space-y-1">
          <span className="text-muted-foreground">workspacePath</span>
          <input
            className="w-full rounded border bg-background px-2 py-1 font-mono text-[10px]"
            value={deltaPath}
            onChange={(e) => setDeltaPath(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {(Object.keys(DELTA_MODE_LABELS) as ProjectPackDeltaMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`px-2 py-0.5 rounded border text-[10px] ${deltaMode === mode ? 'bg-accent' : ''}`}
              onClick={() => setDeltaMode(mode)}
            >
              {DELTA_MODE_LABELS[mode]}
            </button>
          ))}
          <button
            type="button"
            className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
            disabled={deltaState.status === 'loading'}
            onClick={() => void runDeltaPlan()}
          >
            {deltaState.status === 'loading' ? '规划中…' : '规划 delta'}
          </button>
        </div>
        {deltaState.status === 'error' && <div className="text-destructive">{deltaState.message}</div>}
        {deltaState.status === 'done' && (
          <div className="space-y-2 border rounded p-2 bg-muted/20">
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <span>改动文件</span>
              <span>{deltaState.data.changedFiles.length}</span>
              <span>关联文件</span>
              <span>{deltaState.data.relatedFiles.length}</span>
              <span>纳入</span>
              <span>{deltaState.data.included.length}</span>
              <span>Token</span>
              <span className="flex items-center gap-1">
                {deltaState.data.estimatedTokens.toLocaleString()}
                <ConfidenceBadge confidence="estimate" locality="local" />
              </span>
            </div>
            {deltaState.data.changedFiles.length > 0 && (
              <details>
                <summary>changedFiles ({deltaState.data.changedFiles.length})</summary>
                <ul className="mt-1 max-h-24 overflow-auto font-mono text-[10px]">
                  {deltaState.data.changedFiles.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
            {deltaState.data.relatedFiles.length > 0 && (
              <details>
                <summary>relatedFiles ({deltaState.data.relatedFiles.length})</summary>
                <ul className="mt-1 max-h-24 overflow-auto font-mono text-[10px]">
                  {deltaState.data.relatedFiles.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>
            )}
            {deltaState.data.excluded.length > 0 && (
              <details>
                <summary>excluded ({deltaState.data.excluded.length})</summary>
                <ul className="mt-1 max-h-24 overflow-auto font-mono text-[10px]">
                  {deltaState.data.excluded.slice(0, 40).map((e) => (
                    <li key={`${e.relativePath}:${e.reason}`}>
                      {e.relativePath} — {e.reason}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="font-medium">rtk 压缩测试</div>
        <textarea
          className="w-full min-h-[72px] rounded border bg-background px-2 py-1 font-mono text-[10px]"
          value={rtkInput}
          onChange={(e) => setRtkInput(e.target.value)}
        />
        <button
          type="button"
          className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
          disabled={rtkState.status === 'loading'}
          onClick={() => void runRtk()}
        >
          {rtkState.status === 'loading' ? '压缩中…' : '测试压缩'}
        </button>
        {rtkState.status === 'error' && <div className="text-destructive">{rtkState.message}</div>}
        {rtkState.status === 'done' && (
          <div className="space-y-1 border rounded p-2 bg-muted/20">
            <SidecarNote result={rtkState.data} />
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
              <span>压缩前 chars</span>
              <span>{rtkState.data.stats.beforeChars}</span>
              <span>压缩后 chars</span>
              <span>{rtkState.data.stats.afterChars}</span>
              <span>节省 token（估算）</span>
              <span className="flex items-center gap-1">
                {rtkState.data.stats.savedTokens}
                <ConfidenceBadge confidence="estimate" />
              </span>
            </div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all text-[10px] bg-background/50 p-1 rounded">
              {rtkState.data.output}
            </pre>
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="font-medium">codegraph 查询测试</div>
        <input
          className="w-full rounded border bg-background px-2 py-1 font-mono text-[10px]"
          placeholder="query"
          value={codegraphQuery}
          onChange={(e) => setCodegraphQuery(e.target.value)}
        />
        <button
          type="button"
          className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
          disabled={codegraphState.status === 'loading' || !workspacePath}
          onClick={() => void runCodegraph()}
        >
          {codegraphState.status === 'loading' ? '查询中…' : '测试查询'}
        </button>
        {codegraphState.status === 'error' && <div className="text-destructive">{codegraphState.message}</div>}
        {codegraphState.status === 'done' && (
          <div className="space-y-1 border rounded p-2 bg-muted/20">
            <SidecarNote result={codegraphState.data} />
            <div className="flex items-center gap-1 text-[10px]">
              输出 token（估算） {codegraphState.data.stats.afterTokens}
              <ConfidenceBadge confidence="estimate" />
            </div>
            <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all text-[10px] bg-background/50 p-1 rounded">
              {codegraphState.data.structuredOutput}
            </pre>
          </div>
        )}
      </div>

      <ExternalReviewCenterPanel initialBundleId={bundleId} variant={compact ? 'compact' : 'full'} />

      {showFullProjectPack && workspacePath && (
        <div className={sectionClass}>
          <ProjectPackPanel rootPath={workspacePath} />
        </div>
      )}
    </div>
  )
}

export default ContextEfficiencyPanel

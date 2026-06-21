/**
 * ContextEfficiencyPanel — 四段式上下文效率工作区（T-CONTEXT-REVIEW-POLISH）。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ContextAdapterCodegraphResult,
  ContextAdapterRtkResult,
  ContextCenterOverview,
  ProjectPackDeltaMode,
  ProjectPackDeltaPlanResult,
} from '@craft-agent/shared/protocol'
import {
  deriveSectionPhase,
  FLEET_TOKEN_EXTERNAL_REVIEW_NOTE,
  REVIEW_READINESS_LABEL,
  type AsyncLoadState,
  validateWorkspacePath,
} from '@/lib/context-efficiency-ui'
import { MetricKindBadge, ScrollPre, SectionBlock, ToolCapabilityCard } from './context-efficiency-section'
import { ExternalReviewCenterPanel } from './ExternalReviewCenterPanel'
import { ProjectPackPanel } from './ProjectPackPanel'

const DELTA_MODE_LABELS: Record<ProjectPackDeltaMode, string> = {
  diff: '工作区改动',
  staged: '已暂存',
  untracked: '未跟踪',
}

function SidecarExecutionNote({ result }: { result: ContextAdapterRtkResult | ContextAdapterCodegraphResult }) {
  if (result.applied) {
    return (
      <p className="text-[10px] text-emerald-700 dark:text-emerald-300 break-words">
        已通过 System Tools 解析 sidecar 执行
        {result.availability.available ? `（${result.availability.path}）` : ''}。
      </p>
    )
  }
  return (
    <p className="text-[10px] text-amber-800 dark:text-amber-200 break-words">
      使用 Fleet 本地降级逻辑，不是 rtk/codegraph sidecar。
      {result.note ? ` ${result.note}` : ''}
      {!result.availability.available && 'reason' in result.availability ? ` ${result.availability.reason}` : ''}
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

  const [overviewState, setOverviewState] = useState<AsyncLoadState<ContextCenterOverview>>({ status: 'idle' })
  const [deltaPath, setDeltaPath] = useState(workspacePath)
  const [deltaMode, setDeltaMode] = useState<ProjectPackDeltaMode>('diff')
  const [deltaState, setDeltaState] = useState<AsyncLoadState<ProjectPackDeltaPlanResult>>({ status: 'idle' })
  const [rtkInput, setRtkInput] = useState('npm test\n'.repeat(8))
  const [rtkState, setRtkState] = useState<AsyncLoadState<ContextAdapterRtkResult>>({ status: 'idle' })
  const [codegraphQuery, setCodegraphQuery] = useState('findUser')
  const [codegraphState, setCodegraphState] = useState<AsyncLoadState<ContextAdapterCodegraphResult>>({ status: 'idle' })
  const [deltaValidationError, setDeltaValidationError] = useState<string | null>(null)

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
    const validation = validateWorkspacePath(deltaPath)
    if (validation) {
      setDeltaValidationError(validation)
      setDeltaState({ status: 'error', message: validation })
      return
    }
    setDeltaValidationError(null)
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
    if (!rtkInput.trim()) {
      setRtkState({ status: 'error', message: '请输入要压缩的文本' })
      return
    }
    setRtkState({ status: 'loading' })
    try {
      const data = await window.electronAPI.compressContextRtk({ input: rtkInput })
      setRtkState({ status: 'done', data })
    } catch (err) {
      setRtkState({ status: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }, [rtkInput])

  const runCodegraph = useCallback(async () => {
    const validation = validateWorkspacePath(workspacePath)
    if (validation) {
      setCodegraphState({ status: 'error', message: validation })
      return
    }
    if (!codegraphQuery.trim()) {
      setCodegraphState({ status: 'error', message: '请输入 codegraph 查询' })
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

  const overviewPhase = deriveSectionPhase(overviewState)
  const packPhase = deriveSectionPhase(deltaState)
  const optimizePhase: ReturnType<typeof deriveSectionPhase> =
    rtkState.status === 'loading' || codegraphState.status === 'loading'
      ? 'loading'
      : rtkState.status === 'error' || codegraphState.status === 'error'
        ? 'error'
        : rtkState.status === 'done' || codegraphState.status === 'done'
          ? 'ready'
          : 'empty'

  const optimizeError =
    rtkState.status === 'error'
      ? `rtk：${rtkState.message}`
      : codegraphState.status === 'error'
        ? `codegraph：${codegraphState.message}`
        : undefined

  const reviewPhase = overviewPhase === 'ready' ? 'ready' : overviewPhase

  return (
    <div className="flex flex-col gap-3 text-xs min-w-0 overflow-hidden" data-testid="context-efficiency-panel">
      <SectionBlock
        step={1}
        title="Overview · 当前上下文状态"
        description="会话用量为真实 token；打包/压缩/图谱为估算 token。"
        phase={overviewPhase}
        error={overviewState.status === 'error' ? overviewState.message : undefined}
        actions={
          <button
            type="button"
            className="text-[10px] text-muted-foreground hover:text-foreground underline disabled:opacity-50"
            onClick={() => void loadOverview()}
            disabled={overviewState.status === 'loading'}
          >
            刷新
          </button>
        }
        empty={<p className="text-[10px] text-muted-foreground">连接 session 或 workspace 后可查看上下文概览。</p>}
      >
        {overview && (
          <div className="space-y-3 min-w-0">
            {overview.usage ? (
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
                <span className="text-muted-foreground">Fleet 输入 token</span>
                <span className="flex flex-wrap items-center gap-1 min-w-0">
                  {overview.usage.inputTokens.value.toLocaleString()}
                  <MetricKindBadge kind={overview.usage.inputTokens.confidence} suffix="本机 session" />
                </span>
                <span className="text-muted-foreground">上下文占用</span>
                <span className="flex flex-wrap items-center gap-1">
                  {overview.usage.estimatedContextPercent
                    ? `${Math.round(overview.usage.estimatedContextPercent.value * 100)}%`
                    : '—'}
                  {overview.usage.estimatedContextPercent && (
                    <MetricKindBadge kind={overview.usage.estimatedContextPercent.confidence} />
                  )}
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">暂无真实 session 用量。</p>
            )}

            <div className="space-y-1">
              <div className="text-[10px] font-medium">Sidecar 工具（System Tools）</div>
              {sidecarTools.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">尚未检测到 rtk / codegraph。</p>
              ) : (
                <div className="grid gap-2">
                  {sidecarTools.map((tool) => (
                    <ToolCapabilityCard key={tool.toolId} tool={tool} />
                  ))}
                </div>
              )}
            </div>

            {overview.recommendations.length > 0 && (
              <details open={!compact}>
                <summary className="cursor-pointer text-[10px] font-medium">建议 ({overview.recommendations.length})</summary>
                <ul className="mt-2 space-y-2">
                  {overview.recommendations.map((rec) => (
                    <li key={rec.action} className="rounded border border-border/50 p-2 min-w-0">
                      <div className="flex justify-between gap-2 min-w-0">
                        <span className="font-medium truncate">{rec.action}</span>
                        <span className="text-muted-foreground shrink-0">{rec.status}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted-foreground break-words">{rec.reason}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </SectionBlock>

      <SectionBlock
        step={2}
        title="Pack · ProjectPack Delta"
        description="只读规划增量范围；不写 bundle、不外发。"
        phase={packPhase}
        error={deltaState.status === 'error' ? deltaState.message : undefined}
        empty={
          <p className="text-[10px] text-muted-foreground">
            选择 git 范围后点击「规划 delta」，先确认会纳入哪些文件。
          </p>
        }
      >
        <div className="space-y-2 min-w-0">
          <label className="block space-y-1 min-w-0">
            <span className="text-muted-foreground">workspacePath</span>
            <input
              className="w-full min-w-0 rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={deltaPath}
              onChange={(e) => {
                setDeltaPath(e.target.value)
                setDeltaValidationError(null)
              }}
            />
            {deltaValidationError && <span className="text-[10px] text-destructive">{deltaValidationError}</span>}
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
          </div>
          <button
            type="button"
            className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
            disabled={deltaState.status === 'loading'}
            onClick={() => void runDeltaPlan()}
          >
            {deltaState.status === 'loading' ? '规划中…' : '1. 规划 delta'}
          </button>
          {deltaState.status === 'done' && (
            <div className="space-y-2 rounded border bg-muted/15 p-2 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
                <span>改动 / 关联 / 纳入</span>
                <span>
                  {deltaState.data.changedFiles.length} / {deltaState.data.relatedFiles.length} /{' '}
                  {deltaState.data.included.length}
                </span>
                <span>Token</span>
                <span className="flex flex-wrap items-center gap-1">
                  {deltaState.data.estimatedTokens.toLocaleString()}
                  <MetricKindBadge kind="estimate" suffix="本地未外发" />
                </span>
              </div>
              {deltaState.data.excluded.length > 0 && (
                <details>
                  <summary className="cursor-pointer">排除原因 ({deltaState.data.excluded.length})</summary>
                  <ScrollPre maxClass="max-h-24">
                    {deltaState.data.excluded
                      .slice(0, 40)
                      .map((e) => `${e.relativePath} — ${e.reason}`)
                      .join('\n')}
                  </ScrollPre>
                </details>
              )}
            </div>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        step={3}
        title="Optimize · rtk / codegraph"
        description="先确认工具状态，再按顺序测试压缩与结构查询。"
        phase={optimizePhase}
        error={optimizeError}
        empty={<p className="text-[10px] text-muted-foreground">输入样例文本或 query 后运行测试。</p>}
      >
        <div className="space-y-3 min-w-0">
          <div className="space-y-2">
            <div className="text-[10px] font-medium">3a · rtk 压缩</div>
            <textarea
              className="w-full min-w-0 min-h-[64px] rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={rtkInput}
              onChange={(e) => setRtkInput(e.target.value)}
            />
            <button
              type="button"
              className="px-2 py-1 rounded border text-[10px] disabled:opacity-50"
              disabled={rtkState.status === 'loading'}
              onClick={() => void runRtk()}
            >
              {rtkState.status === 'loading' ? '压缩中…' : '运行 rtk 测试'}
            </button>
            {rtkState.status === 'done' && (
              <div className="space-y-1 rounded border bg-muted/15 p-2 min-w-0">
                <SidecarExecutionNote result={rtkState.data} />
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  节省 token {rtkState.data.stats.savedTokens}
                  <MetricKindBadge kind="estimate" />
                </div>
                <ScrollPre>{rtkState.data.output}</ScrollPre>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-[10px] font-medium">3b · codegraph 查询</div>
            <input
              className="w-full min-w-0 rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={codegraphQuery}
              onChange={(e) => setCodegraphQuery(e.target.value)}
              placeholder="query"
            />
            <button
              type="button"
              className="px-2 py-1 rounded border text-[10px] disabled:opacity-50"
              disabled={codegraphState.status === 'loading' || !workspacePath}
              onClick={() => void runCodegraph()}
            >
              {codegraphState.status === 'loading' ? '查询中…' : '运行 codegraph 测试'}
            </button>
            {codegraphState.status === 'done' && (
              <div className="space-y-1 rounded border bg-muted/15 p-2 min-w-0">
                <SidecarExecutionNote result={codegraphState.data} />
                <div className="flex flex-wrap items-center gap-1 text-[10px]">
                  输出 token {codegraphState.data.stats.afterTokens}
                  <MetricKindBadge kind="estimate" />
                </div>
                <ScrollPre>{codegraphState.data.structuredOutput}</ScrollPre>
              </div>
            )}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        step={4}
        title="Review · 外部审查准备度"
        description={FLEET_TOKEN_EXTERNAL_REVIEW_NOTE}
        phase={reviewPhase}
        error={overviewState.status === 'error' ? overviewState.message : undefined}
        empty={<p className="text-[10px] text-muted-foreground">等待 Overview 加载审查 readiness。</p>}
      >
        {overview && (
          <div className="space-y-3 min-w-0">
            <div className="rounded border bg-muted/15 p-2 space-y-1 min-w-0">
              <div className="font-medium">
                {REVIEW_READINESS_LABEL[overview.reviewReadiness.status.value] ?? overview.reviewReadiness.status.value}
              </div>
              <ul className="list-disc pl-4 text-[10px] text-muted-foreground space-y-0.5">
                {overview.reviewReadiness.reasons.value.map((reason) => (
                  <li key={reason} className="break-words">
                    {reason}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <MetricKindBadge kind={overview.reviewReadiness.externalExportAllowed.confidence} suffix="外发许可" />
                {overview.reviewReadiness.estimatedPackTokens && (
                  <span className="text-[10px] flex items-center gap-1">
                    包 token {overview.reviewReadiness.estimatedPackTokens.value.toLocaleString()}
                    <MetricKindBadge kind="estimate" />
                  </span>
                )}
              </div>
            </div>
            <ExternalReviewCenterPanel initialBundleId={bundleId} variant={compact ? 'compact' : 'full'} embedded />
          </div>
        )}
      </SectionBlock>

      {showFullProjectPack && workspacePath && (
        <div className="rounded-[8px] border border-border/70 p-3 min-w-0 overflow-hidden">
          <ProjectPackPanel rootPath={workspacePath} />
        </div>
      )}
    </div>
  )
}

export default ContextEfficiencyPanel

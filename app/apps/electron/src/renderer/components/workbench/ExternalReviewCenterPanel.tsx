/**
 * ExternalReviewCenterPanel — 外部 AI 审查手动闭环（T-EXTERNAL-REVIEW-MANUAL-FLOW）。
 * Bundle → 生成 prompt → 手动复制 → 粘贴保存 → 多平台 report 归档。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ExternalReviewJob,
  ExternalReviewReport,
  ExternalReviewSeverity,
  ProjectPackReviewPromptResult,
  ProjectPackSummary,
} from '@craft-agent/shared/protocol'
import {
  formatExternalCostKind,
  JOB_STATUS_CLASS,
  JOB_STATUS_LABEL,
  MANUAL_PASTE_PRIVACY_NOTE,
  FLEET_TOKEN_EXTERNAL_REVIEW_NOTE,
  validateBundleId,
  validatePasteOutput,
  validateRequiredText,
} from '@/lib/context-efficiency-ui'
import {
  ALL_EXTERNAL_REVIEW_SEVERITIES,
  collectReportPlatformIds,
  filterExternalReviewFindings,
  filterReportsByProvider,
} from '@/lib/external-review-center-filters'
import {
  buildManualFlowCostMetrics,
  canCopyReviewPrompt,
  derivePromptSectionPhase,
  MANUAL_REVIEW_PROMPT_NOTE,
  type ManualFlowCostMetric,
  type PromptLoadState,
} from '@/lib/external-review-manual-flow'
import { MetricKindBadge, ScrollPre, SectionBlock } from './context-efficiency-section'

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done' }

const SEVERITY_TONE: Record<ExternalReviewSeverity, string> = {
  critical: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-amber-700 dark:text-amber-300',
  low: 'text-sky-700 dark:text-sky-300',
  info: 'text-muted-foreground',
}

function ManualFlowCostMetrics({ metrics }: { metrics: ManualFlowCostMetric[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3 min-w-0" data-testid="manual-flow-cost-metrics">
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded border border-border/60 bg-muted/10 p-2 space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="font-medium">{metric.label}</span>
            <MetricKindBadge kind={metric.kind} />
          </div>
          <div className="text-sm font-semibold tabular-nums">{metric.value}</div>
          {metric.note && <p className="text-[10px] text-muted-foreground leading-relaxed break-words">{metric.note}</p>}
        </div>
      ))}
    </div>
  )
}

function CostBreakdown({ report }: { report: ExternalReviewReport }) {
  return (
    <div className="space-y-1 text-[10px] break-words">
      <div className="flex flex-wrap items-center gap-1">
        <span>Fleet API token</span>
        <span>{report.fleetTokenUsage.value}</span>
        <MetricKindBadge kind="real" suffix="本机记录" />
      </div>
      <div className="text-muted-foreground">{FLEET_TOKEN_EXTERNAL_REVIEW_NOTE}</div>
      <div className="flex flex-wrap items-center gap-1">
        <span>{formatExternalCostKind(report.externalCost.kind)}</span>
        <MetricKindBadge kind={report.externalCost.kind === 'unknown' ? 'unknown' : report.externalCost.kind === 'actual' ? 'real' : 'estimate'} />
      </div>
      {report.externalCost.note && <div className="text-muted-foreground">{report.externalCost.note}</div>}
    </div>
  )
}

function FindingRow({ finding }: { finding: ExternalReviewReport['findings'][number] }) {
  return (
    <li className="border-b border-border/40 py-2 last:border-0 min-w-0">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className={`text-[10px] font-semibold uppercase ${SEVERITY_TONE[finding.severity]}`}>{finding.severity}</span>
        <span className="font-medium break-words">{finding.title}</span>
      </div>
      {finding.relativePath && (
        <div className="font-mono text-[10px] text-muted-foreground mt-0.5 break-all">
          {finding.relativePath}
          {finding.line != null ? `:${finding.line}` : ''}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1 break-words">{finding.evidence}</p>
      <p className="text-[10px] mt-0.5 break-words">{finding.recommendation}</p>
    </li>
  )
}

function ReportColumn({
  report,
  filters,
  compact,
}: {
  report: ExternalReviewReport
  filters: { severities: ExternalReviewSeverity[]; relativePath: string; keyword: string }
  compact: boolean
}) {
  const findings = useMemo(
    () => filterExternalReviewFindings(report.findings, filters),
    [report.findings, filters],
  )

  return (
    <article
      className={`min-w-0 flex flex-col border border-border/70 rounded-md bg-muted/15 overflow-hidden ${compact ? 'min-w-[220px] max-w-[280px] shrink-0' : ''}`}
      data-testid={`review-report-${report.platformId}`}
    >
      <header className="px-2.5 py-2 border-b border-border/60 space-y-1 min-w-0">
        <div className="font-medium truncate" title={report.platformId}>
          {report.platformId}
        </div>
        <div className="text-[10px] text-muted-foreground font-mono truncate" title={report.reportId}>
          report {report.reportId.slice(0, 8)}…
        </div>
        <CostBreakdown report={report} />
        <div className="flex flex-wrap gap-1 text-[10px]">
          {ALL_EXTERNAL_REVIEW_SEVERITIES.map((severity) =>
            report.findingCounts[severity] > 0 ? (
              <span key={severity} className={SEVERITY_TONE[severity]}>
                {severity}:{report.findingCounts[severity]}
              </span>
            ) : null,
          )}
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto px-2.5 py-2">
        {findings.length === 0 ? (
          <p className="text-[10px] text-muted-foreground break-words">
            无匹配 findings；可能仅有原文或未结构化条目。
          </p>
        ) : (
          <ul className="min-w-0">
            {findings.map((finding) => (
              <FindingRow key={finding.findingId} finding={finding} />
            ))}
          </ul>
        )}
        <details className="mt-2 text-[10px] min-w-0">
          <summary className="cursor-pointer text-muted-foreground">原文（本地保存）</summary>
          <ScrollPre maxClass="max-h-32">{report.rawOutput}</ScrollPre>
        </details>
      </div>
    </article>
  )
}

export interface ExternalReviewCenterPanelProps {
  initialBundleId?: string
  variant?: 'compact' | 'full'
  /** 嵌入 ContextEfficiencyPanel Review 区块时不重复外层标题 */
  embedded?: boolean
}

export function ExternalReviewCenterPanel({
  initialBundleId,
  variant = 'full',
  embedded = false,
}: ExternalReviewCenterPanelProps) {
  const compact = variant === 'compact'

  const [bundleIdInput, setBundleIdInput] = useState(initialBundleId ?? '')
  const [bundleHashInput, setBundleHashInput] = useState('')
  const [bundleSummary, setBundleSummary] = useState<ProjectPackSummary | null>(null)
  const [jobs, setJobs] = useState<ExternalReviewJob[]>([])
  const [reports, setReports] = useState<ExternalReviewReport[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'idle' })

  const [activeJob, setActiveJob] = useState<ExternalReviewJob | null>(null)
  const [jobBusy, setJobBusy] = useState(false)
  const [panelError, setPanelError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [severityFilter, setSeverityFilter] = useState<ExternalReviewSeverity[]>(ALL_EXTERNAL_REVIEW_SEVERITIES)
  const [providerFilter, setProviderFilter] = useState('')
  const [fileFilter, setFileFilter] = useState('')
  const [keywordFilter, setKeywordFilter] = useState('')

  const [pastePlatformId, setPastePlatformId] = useState('manual-web')
  const [pasteRawOutput, setPasteRawOutput] = useState('')
  const [newJobPlatformId, setNewJobPlatformId] = useState('manual-web')

  const [promptState, setPromptState] = useState<PromptLoadState>({ status: 'idle' })
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (initialBundleId) setBundleIdInput(initialBundleId)
  }, [initialBundleId])

  const bundleHash =
    bundleSummary?.bundleHash ?? (bundleHashInput.trim() || activeJob?.bundleHash || '')

  const loadBundleContext = useCallback(async (bundleId: string) => {
    const validation = validateBundleId(bundleId)
    if (validation) {
      setLoadState({ status: 'error', message: validation })
      return
    }

    setLoadState({ status: 'loading' })
    setPanelError(null)
    try {
      const id = bundleId.trim()
      const [summary, jobList, reportList] = await Promise.all([
        window.electronAPI.getProjectPackSummary(id),
        window.electronAPI.listExternalReviewJobsByBundle(id),
        window.electronAPI.listExternalReviewReportsByBundle(id),
      ])

      setBundleSummary(summary)
      if (summary?.bundleHash) setBundleHashInput(summary.bundleHash)
      setJobs(jobList)
      setReports(reportList)
      setPromptState({ status: 'idle' })
      setCopyFeedback('idle')

      const reportIds = new Set(reportList.map((r) => r.reportId))
      const missingReportJobs = jobList.filter(
        (job) => job.status === 'completed' && job.reportId && !reportIds.has(job.reportId),
      )
      if (missingReportJobs.length > 0) {
        const fetched = await Promise.all(
          missingReportJobs.map((job) => window.electronAPI.getExternalReviewReport(job.reportId!)),
        )
        const merged = [...reportList]
        for (const report of fetched) {
          if (report && !reportIds.has(report.reportId)) merged.push(report)
        }
        merged.sort((a, b) => b.createdAt - a.createdAt)
        setReports(merged)
      }

      setLoadState({ status: 'done' })
    } catch (err) {
      setLoadState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }, [])

  useEffect(() => {
    if (initialBundleId?.trim()) void loadBundleContext(initialBundleId)
  }, [initialBundleId, loadBundleContext])

  const visibleReports = useMemo(
    () => filterReportsByProvider(reports, providerFilter),
    [reports, providerFilter],
  )

  const platformOptions = useMemo(() => collectReportPlatformIds(reports), [reports])
  const findingFilters = useMemo(
    () => ({ severities: severityFilter, relativePath: fileFilter, keyword: keywordFilter }),
    [severityFilter, fileFilter, keywordFilter],
  )

  const toggleSeverity = useCallback((severity: ExternalReviewSeverity) => {
    setSeverityFilter((current) =>
      current.includes(severity) ? current.filter((s) => s !== severity) : [...current, severity],
    )
  }, [])

  const promptResult = promptState.status === 'done' ? promptState.result : null
  const manualFlowMetrics = useMemo(
    () => buildManualFlowCostMetrics(promptResult, bundleSummary),
    [promptResult, bundleSummary],
  )

  const generateReviewPrompt = useCallback(async () => {
    const bundleId = bundleIdInput.trim()
    const bundleErr = validateBundleId(bundleId)
    if (bundleErr) {
      setPromptState({ status: 'error', message: bundleErr })
      return
    }

    setPromptState({ status: 'loading' })
    setCopyFeedback('idle')
    try {
      const result = await window.electronAPI.buildProjectPackReviewPrompt(bundleId)
      setPromptState({ status: 'done', result })
    } catch (err) {
      setPromptState({
        status: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }, [bundleIdInput])

  const copyReviewPrompt = useCallback(async (result: ProjectPackReviewPromptResult) => {
    if (!canCopyReviewPrompt(result) || !result.reviewPrompt) {
      setCopyFeedback('failed')
      return
    }
    try {
      await navigator.clipboard.writeText(result.reviewPrompt)
      setCopyFeedback('copied')
    } catch {
      setCopyFeedback('failed')
    }
  }, [])

  const createJob = useCallback(async () => {
    const bundleId = bundleIdInput.trim()
    const errors: Record<string, string> = {}
    const bundleErr = validateBundleId(bundleId)
    if (bundleErr) errors.bundleId = bundleErr
    if (!bundleHash) errors.bundleHash = '需要 bundleHash（先加载 ProjectPack 摘要或手动填写）'
    const platformErr = validateRequiredText(newJobPlatformId, 'platformId')
    if (platformErr) errors.platformId = platformErr
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setPanelError(Object.values(errors).join('；'))
      return
    }

    setFieldErrors({})
    setPanelError(null)
    setJobBusy(true)
    try {
      const job = await window.electronAPI.createExternalReviewJob({
        bundleId,
        bundleHash,
        platformId: newJobPlatformId.trim(),
      })
      setActiveJob(job)
      await loadBundleContext(bundleId)
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : String(err))
    } finally {
      setJobBusy(false)
    }
  }, [bundleIdInput, bundleHash, newJobPlatformId, loadBundleContext])

  const advanceJob = useCallback(
    async (
      transition: 'authorize' | 'mark_awaiting_result' | 'complete' | 'fail',
      extras?: { reportId?: string; reason?: string },
    ) => {
      if (!activeJob) return
      setPanelError(null)
      setJobBusy(true)
      try {
        const job = await window.electronAPI.advanceExternalReviewJob({
          jobId: activeJob.jobId,
          transition,
          ...extras,
        })
        setActiveJob(job)
        await loadBundleContext(job.bundleId)
      } catch (err) {
        setPanelError(err instanceof Error ? err.message : String(err))
      } finally {
        setJobBusy(false)
      }
    },
    [activeJob, loadBundleContext],
  )

  const savePastedReport = useCallback(
    async (options?: { completeActiveJob?: boolean }) => {
      const bundleId = bundleIdInput.trim()
      const errors: Record<string, string> = {}
      const bundleErr = validateBundleId(bundleId)
      if (bundleErr) errors.bundleId = bundleErr
      if (!bundleHash) errors.bundleHash = '需要 bundleHash'
      const platformErr = validateRequiredText(pastePlatformId, 'platformId')
      if (platformErr) errors.platformId = platformErr
      const pasteErr = validatePasteOutput(pasteRawOutput)
      if (pasteErr) errors.paste = pasteErr
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setPanelError(Object.values(errors).join('；'))
        return
      }

      setFieldErrors({})
      setPanelError(null)
      setJobBusy(true)
      try {
        const reportInput = {
          bundleId,
          bundleHash,
          platformId: pastePlatformId.trim(),
          transport: 'manual',
          rawOutput: pasteRawOutput,
          externalCost: {
            kind: 'unknown',
            note: '外部平台成本未知；不等于免费。',
          },
        } as const
        if (options?.completeActiveJob && activeJob) {
          await window.electronAPI.completeExternalReviewJobWithReport({
            jobId: activeJob.jobId,
            report: reportInput,
          })
        } else {
          await window.electronAPI.saveExternalReviewReport(reportInput)
        }
        setPasteRawOutput('')
        await loadBundleContext(bundleId)
      } catch (err) {
        setPanelError(err instanceof Error ? err.message : String(err))
      } finally {
        setJobBusy(false)
      }
    },
    [activeJob, bundleHash, bundleIdInput, loadBundleContext, pastePlatformId, pasteRawOutput],
  )

  const bundlePhase =
    loadState.status === 'loading'
      ? 'loading'
      : loadState.status === 'error'
        ? 'error'
        : loadState.status === 'done'
          ? 'ready'
          : 'empty'

  const promptPhase = derivePromptSectionPhase(loadState.status === 'done', promptState)

  const jobsPhase =
    loadState.status !== 'done'
      ? loadState.status === 'loading'
        ? 'loading'
        : 'empty'
      : jobs.length === 0
        ? 'empty'
        : 'ready'

  const reportsPhase =
    loadState.status !== 'done'
      ? 'empty'
      : visibleReports.length === 0
        ? 'empty'
        : 'ready'

  const rootClass = embedded
    ? 'flex flex-col gap-3 text-xs min-w-0 overflow-hidden'
    : 'flex flex-col gap-3 text-xs min-w-0 overflow-hidden rounded-[8px] border border-border/70 p-2.5 sm:p-3'

  return (
    <div className={rootClass} data-testid="external-review-center-panel">
      {!embedded && (
        <div className="space-y-1 min-w-0">
          <div className="font-medium">审查中心</div>
          <p className="text-[10px] text-muted-foreground leading-relaxed break-words">
            手动闭环：生成 prompt → 复制到外部 AI → 粘贴结果归档；同一 bundleId 可保存多平台 report。
          </p>
        </div>
      )}

      <SectionBlock
        step={1}
        title="Bundle · 项目包"
        description="选择一个已保存的 ProjectPack bundle，作为审查上下文。"
        phase={bundlePhase}
        error={loadState.status === 'error' ? loadState.message : undefined}
        empty={<p className="text-[10px] text-muted-foreground">输入 bundleId 并加载。</p>}
      >
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-2 items-end min-w-0">
            <label className="flex-1 min-w-[140px] space-y-1 min-w-0">
              <span className="text-muted-foreground">bundleId</span>
              <input
                className="w-full min-w-0 rounded border bg-background px-2 py-1 font-mono text-[10px]"
                value={bundleIdInput}
                onChange={(e) => setBundleIdInput(e.target.value)}
              />
              {fieldErrors.bundleId && <span className="text-[10px] text-destructive">{fieldErrors.bundleId}</span>}
            </label>
            <button
              type="button"
              className="px-3 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50 shrink-0"
              disabled={loadState.status === 'loading'}
              onClick={() => void loadBundleContext(bundleIdInput)}
            >
              {loadState.status === 'loading' ? '加载中…' : '加载 bundle'}
            </button>
          </div>

          {bundleSummary ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-[10px] rounded border bg-muted/15 p-2 min-w-0">
              <span className="text-muted-foreground">bundleHash</span>
              <span className="font-mono truncate" title={bundleSummary.bundleHash}>
                {bundleSummary.bundleHash.slice(0, 20)}…
              </span>
              <span className="text-muted-foreground">规模</span>
              <span className="break-words">
                {bundleSummary.fileCount} 文件 · {bundleSummary.estimatedTokens.toLocaleString()} tokens{' '}
                <MetricKindBadge kind="estimate" />
              </span>
              <span className="text-muted-foreground">Secret scan</span>
              <span>
                {bundleSummary.secretScan.findingCount} 条
                {bundleSummary.secretScan.hasHighSeverity ? ' · 含高危' : ''}
              </span>
            </div>
          ) : (
            loadState.status === 'done' && (
              <label className="block space-y-1 min-w-0">
                <span className="text-muted-foreground">bundleHash（手动）</span>
                <input
                  className="w-full min-w-0 rounded border bg-background px-2 py-1 font-mono text-[10px]"
                  value={bundleHashInput}
                  onChange={(e) => setBundleHashInput(e.target.value)}
                />
                {fieldErrors.bundleHash && <span className="text-[10px] text-destructive">{fieldErrors.bundleHash}</span>}
              </label>
            )
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        step={2}
        title="Prompt · 生成审查提示词"
        description={MANUAL_REVIEW_PROMPT_NOTE}
        phase={promptPhase}
        error={promptState.status === 'error' ? promptState.message : undefined}
        empty={
          <p className="text-[10px] text-muted-foreground">
            加载 bundle 后点击「生成 prompt」，再手动复制到外部 AI。
          </p>
        }
      >
        <div className="space-y-2 min-w-0">
          <ManualFlowCostMetrics metrics={manualFlowMetrics} />

          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="px-3 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50 shrink-0"
              disabled={loadState.status !== 'done' || promptState.status === 'loading'}
              onClick={() => void generateReviewPrompt()}
              data-testid="generate-review-prompt"
            >
              {promptState.status === 'loading' ? '生成中…' : '生成 prompt'}
            </button>
            {promptResult && canCopyReviewPrompt(promptResult) && (
              <button
                type="button"
                className="px-3 py-1 rounded border text-[10px] shrink-0"
                onClick={() => void copyReviewPrompt(promptResult)}
                data-testid="copy-review-prompt"
              >
                复制 prompt
              </button>
            )}
            {copyFeedback === 'copied' && (
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300">已复制到剪贴板</span>
            )}
            {copyFeedback === 'failed' && (
              <span className="text-[10px] text-destructive">复制失败，请手动选中下方文本</span>
            )}
          </div>

          {promptResult && (
            <div className="space-y-2 min-w-0">
              {promptResult.status === 'blocked' ? (
                <div className="rounded border border-destructive/30 bg-destructive/5 p-2 space-y-1">
                  <div className="text-[10px] font-medium text-destructive">无法生成外发 prompt</div>
                  <ul className="text-[10px] text-muted-foreground list-disc pl-4 space-y-0.5">
                    {promptResult.reasons.map((reason) => (
                      <li key={reason} className="break-words">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <div className="text-[10px] text-muted-foreground break-words">
                    将 ProjectPack 内容与下方 metadata 一并粘贴到外部平台；Fleet 不会自动提交。
                  </div>
                  <div data-testid="review-prompt-preview">
                    <ScrollPre maxClass="max-h-48">{promptResult.reviewPrompt}</ScrollPre>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        step={3}
        title="粘贴 · 保存外部审查结果"
        description={MANUAL_PASTE_PRIVACY_NOTE}
        phase={loadState.status === 'done' ? 'ready' : 'empty'}
        empty={<p className="text-[10px] text-muted-foreground">先加载 bundle，再粘贴外部 AI 返回的原文。</p>}
      >
        <div className="space-y-2 min-w-0">
          <input
            className="w-full min-w-0 rounded border bg-background px-2 py-1 text-[10px]"
            placeholder="platformId（如 claude-web / chatgpt-web）"
            value={pastePlatformId}
            onChange={(e) => setPastePlatformId(e.target.value)}
          />
          {fieldErrors.platformId && <div className="text-[10px] text-destructive">{fieldErrors.platformId}</div>}
          <textarea
            className="w-full min-w-0 min-h-[80px] rounded border bg-background px-2 py-1 text-[10px]"
            placeholder="粘贴外部 AI 审查原文"
            value={pasteRawOutput}
            onChange={(e) => setPasteRawOutput(e.target.value)}
            data-testid="paste-review-output"
          />
          {fieldErrors.paste && <div className="text-[10px] text-destructive">{fieldErrors.paste}</div>}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
              disabled={jobBusy || loadState.status !== 'done'}
              onClick={() => void savePastedReport()}
              data-testid="save-pasted-report"
            >
              保存 report 到 bundle
            </button>
            <button
              type="button"
              className="px-2 py-1 rounded border text-[10px] disabled:opacity-50"
              disabled={jobBusy || activeJob?.status !== 'awaiting_result'}
              onClick={() => void savePastedReport({ completeActiveJob: true })}
            >
              保存并完成当前 job
            </button>
          </div>
          {reports.length > 0 && (
            <p className="text-[10px] text-muted-foreground break-words">
              此 bundle 已归档 {reports.length} 份 report（{platformOptions.join('、') || pastePlatformId}）。
            </p>
          )}
          {panelError && (
            <div className="rounded border border-destructive/30 bg-destructive/5 px-2 py-1.5 text-[10px] text-destructive break-words">
              {panelError}
            </div>
          )}
        </div>
      </SectionBlock>

      <SectionBlock
        step={4}
        title="Reports · 多平台对比"
        description="同一 bundleId 下多平台 report 本地归档与筛选。"
        phase={reportsPhase}
        empty={<p className="text-[10px] text-muted-foreground">尚无 report；完成上方粘贴保存后在此对比。</p>}
      >
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-1">
            {ALL_EXTERNAL_REVIEW_SEVERITIES.map((severity) => (
              <button
                key={severity}
                type="button"
                className={`px-1.5 py-0.5 rounded border text-[10px] ${severityFilter.includes(severity) ? 'bg-accent' : ''}`}
                onClick={() => toggleSeverity(severity)}
              >
                {severity}
              </button>
            ))}
          </div>
          <div className="grid gap-2 min-w-0">
            <input
              list="review-platform-options"
              className="w-full min-w-0 rounded border bg-background px-2 py-1 text-[10px]"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              placeholder="provider / platform 筛选"
            />
            <datalist id="review-platform-options">
              {platformOptions.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
            <input
              className="w-full min-w-0 rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="文件名包含…"
            />
            <input
              className="w-full min-w-0 rounded border bg-background px-2 py-1 text-[10px]"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="关键词搜索 title / evidence / recommendation"
            />
          </div>

          <div className={compact ? 'flex gap-3 overflow-x-auto pb-1 min-w-0' : 'grid gap-3 sm:grid-cols-2 min-w-0'}>
            {visibleReports.map((report) => (
              <ReportColumn key={report.reportId} report={report} compact={compact} filters={findingFilters} />
            ))}
          </div>
        </div>
      </SectionBlock>

      <SectionBlock
        step={5}
        title="Jobs · 审查任务（可选）"
        description="人工推进状态；Fleet 不会自动提交到外部平台。"
        phase={jobsPhase}
        empty={<p className="text-[10px] text-muted-foreground">此 bundle 尚无 job；可直接粘贴保存 report。</p>}
      >
        <div className="space-y-2 min-w-0">
          <div className="flex flex-wrap gap-2 items-end">
            <input
              className="min-w-0 flex-1 rounded border bg-background px-2 py-1 text-[10px]"
              placeholder="platformId"
              value={newJobPlatformId}
              onChange={(e) => setNewJobPlatformId(e.target.value)}
            />
            <button
              type="button"
              className="px-2 py-1 rounded border text-[10px] disabled:opacity-50 shrink-0"
              disabled={jobBusy || loadState.status !== 'done'}
              onClick={() => void createJob()}
            >
              创建 job
            </button>
          </div>
          {fieldErrors.platformId && <div className="text-[10px] text-destructive">{fieldErrors.platformId}</div>}

          <ul className="space-y-1 min-w-0">
            {jobs.map((job) => (
              <li
                key={job.jobId}
                className={`rounded border px-2 py-1.5 min-w-0 ${activeJob?.jobId === job.jobId ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}
              >
                <button
                  type="button"
                  className="w-full text-left min-w-0"
                  onClick={() => setActiveJob(job)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <span className="font-medium truncate">{job.platformId}</span>
                    <span className={`text-[10px] shrink-0 ${JOB_STATUS_CLASS[job.status]}`}>
                      {JOB_STATUS_LABEL[job.status]}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono truncate">{job.jobId}</div>
                </button>
              </li>
            ))}
          </ul>

          {activeJob && (
            <div className="rounded border bg-muted/15 p-2 space-y-2 min-w-0">
              <div className="text-[10px]">
                当前 job：<span className={JOB_STATUS_CLASS[activeJob.status]}>{JOB_STATUS_LABEL[activeJob.status]}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('authorize')}>
                  1. 授权提交
                </button>
                <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('mark_awaiting_result')}>
                  2. 等待结果
                </button>
                <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('fail', { reason: '用户标记失败' })}>
                  标记失败
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionBlock>
    </div>
  )
}

export default ExternalReviewCenterPanel

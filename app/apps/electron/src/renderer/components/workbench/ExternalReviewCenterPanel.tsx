/**
 * ExternalReviewCenterPanel — bundle / job / report 审查中心（T-CONTEXT-REVIEW-REPORT-UI）。
 *
 * 串联 ProjectPack bundle、external review jobs 与结构化 reports。
 * 仅本地读写；不自动登录、不自动提交、不读取 cookies/token、不外发。
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  ExternalReviewJob,
  ExternalReviewReport,
  ExternalReviewSeverity,
  ProjectPackSummary,
} from '@craft-agent/shared/protocol'
import {
  ALL_EXTERNAL_REVIEW_SEVERITIES,
  collectReportPlatformIds,
  filterExternalReviewFindings,
  filterReportsByProvider,
} from '@/lib/external-review-center-filters'

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

function CostNote({ report }: { report: ExternalReviewReport }) {
  return (
    <p className="text-[10px] text-muted-foreground">
      Fleet token：{report.fleetTokenUsage.value}（真实） · 外部成本：{report.externalCost.kind}
      {report.externalCost.note ? ` — ${report.externalCost.note}` : ''}
    </p>
  )
}

function FindingRow({
  finding,
  showPath,
}: {
  finding: ExternalReviewReport['findings'][number]
  showPath?: boolean
}) {
  return (
    <li className="border-b border-border/40 py-2 last:border-0">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-semibold uppercase ${SEVERITY_TONE[finding.severity]}`}>
          {finding.severity}
        </span>
        <span className="font-medium">{finding.title}</span>
      </div>
      {showPath && finding.relativePath && (
        <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
          {finding.relativePath}
          {finding.line != null ? `:${finding.line}` : ''}
        </div>
      )}
      <p className="text-[10px] text-muted-foreground mt-1">{finding.evidence}</p>
      <p className="text-[10px] mt-0.5">{finding.recommendation}</p>
    </li>
  )
}

function ReportColumn({
  report,
  filters,
  compact,
}: {
  report: ExternalReviewReport
  filters: { severities: ExternalReviewSeverity[]; relativePath: string }
  compact: boolean
}) {
  const findings = useMemo(
    () =>
      filterExternalReviewFindings(report.findings, {
        severities: filters.severities,
        relativePath: filters.relativePath,
      }),
    [report.findings, filters.severities, filters.relativePath],
  )

  return (
    <article
      className={`min-w-0 flex flex-col border border-border/70 rounded-md bg-muted/15 ${compact ? 'min-w-[240px] shrink-0' : ''}`}
      data-testid={`review-report-${report.platformId}`}
    >
      <header className="px-2.5 py-2 border-b border-border/60 space-y-1">
        <div className="font-medium truncate" title={report.platformId}>
          {report.platformId}
        </div>
        <div className="text-[10px] text-muted-foreground font-mono truncate" title={report.reportId}>
          {report.reportId.slice(0, 8)}…
        </div>
        <CostNote report={report} />
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
          <p className="text-[10px] text-muted-foreground">无匹配 findings（可能仅有原文或未结构化）。</p>
        ) : (
          <ul>
            {findings.map((finding) => (
              <FindingRow key={finding.findingId} finding={finding} showPath />
            ))}
          </ul>
        )}
        <details className="mt-2 text-[10px]">
          <summary className="cursor-pointer text-muted-foreground">原文（本地保存，未外发）</summary>
          <pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap break-all bg-background/60 p-1.5 rounded">
            {report.rawOutput}
          </pre>
        </details>
      </div>
    </article>
  )
}

export interface ExternalReviewCenterPanelProps {
  initialBundleId?: string
  variant?: 'compact' | 'full'
}

export function ExternalReviewCenterPanel({
  initialBundleId,
  variant = 'full',
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

  const [severityFilter, setSeverityFilter] = useState<ExternalReviewSeverity[]>(ALL_EXTERNAL_REVIEW_SEVERITIES)
  const [providerFilter, setProviderFilter] = useState('')
  const [fileFilter, setFileFilter] = useState('')

  const [pastePlatformId, setPastePlatformId] = useState('manual-web')
  const [pasteRawOutput, setPasteRawOutput] = useState('')
  const [newJobPlatformId, setNewJobPlatformId] = useState('manual-web')

  useEffect(() => {
    if (initialBundleId) setBundleIdInput(initialBundleId)
  }, [initialBundleId])

  const bundleHash =
    bundleSummary?.bundleHash ??
    (bundleHashInput.trim() || activeJob?.bundleHash || '')

  const loadBundleContext = useCallback(async (bundleId: string) => {
    const id = bundleId.trim()
    if (!id) {
      setBundleSummary(null)
      setJobs([])
      setReports([])
      setLoadState({ status: 'idle' })
      return
    }

    setLoadState({ status: 'loading' })
    setPanelError(null)
    try {
      const [summary, jobList, reportList] = await Promise.all([
        window.electronAPI.getProjectPackSummary(id),
        window.electronAPI.listExternalReviewJobsByBundle(id),
        window.electronAPI.listExternalReviewReportsByBundle(id),
      ])

      setBundleSummary(summary)
      if (summary?.bundleHash) setBundleHashInput(summary.bundleHash)
      setJobs(jobList)
      setReports(reportList)

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

  const toggleSeverity = useCallback((severity: ExternalReviewSeverity) => {
    setSeverityFilter((current) =>
      current.includes(severity) ? current.filter((s) => s !== severity) : [...current, severity],
    )
  }, [])

  const createJob = useCallback(async () => {
    const bundleId = bundleIdInput.trim()
    if (!bundleId || !bundleHash) {
      setPanelError('需要 bundleId 与 bundleHash（可先加载 ProjectPack 摘要）')
      return
    }
    setPanelError(null)
    setJobBusy(true)
    try {
      const job = await window.electronAPI.createExternalReviewJob({
        bundleId,
        bundleHash,
        platformId: newJobPlatformId.trim() || 'manual-web',
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
      if (!bundleId || !bundleHash) {
        setPanelError('需要 bundleId 与 bundleHash')
        return
      }
      if (!pasteRawOutput.trim()) {
        setPanelError('请粘贴外部 AI 返回原文（不会自动抓取网页）')
        return
      }
      setPanelError(null)
      setJobBusy(true)
      try {
        const report = await window.electronAPI.saveExternalReviewReport({
          bundleId,
          bundleHash,
          platformId: pastePlatformId.trim() || activeJob?.platformId || 'manual-web',
          transport: 'manual',
          rawOutput: pasteRawOutput,
          externalCost: {
            kind: 'unknown',
            note: '外部平台成本未知；Fleet 未自动登录、上传或读取 cookies/token。',
          },
        })
        if (options?.completeActiveJob && activeJob) {
          await window.electronAPI.advanceExternalReviewJob({
            jobId: activeJob.jobId,
            transition: 'complete',
            reportId: report.reportId,
          })
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

  const sectionClass = compact
    ? 'rounded-[8px] border border-border/70 p-2.5 space-y-2'
    : 'rounded-[8px] border border-border/70 p-3 space-y-3'

  return (
    <div className="flex flex-col gap-3 text-xs" data-testid="external-review-center-panel">
      <div className={sectionClass}>
        <div className="font-medium">审查中心</div>
        <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed">
          选择 ProjectPack bundle，查看关联 jobs 与多平台 reports。所有保存均为本地；不自动登录、不自动提交、不读取
          cookies/token、不外发 bundle。
        </p>

        <div className="flex flex-wrap gap-2 items-end">
          <label className="flex-1 min-w-[160px] space-y-1">
            <span className="text-muted-foreground">bundleId</span>
            <input
              className="w-full rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={bundleIdInput}
              onChange={(e) => setBundleIdInput(e.target.value)}
              placeholder="已保存 ProjectPack 的 bundleId"
            />
          </label>
          <button
            type="button"
            className="px-3 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
            disabled={loadState.status === 'loading' || !bundleIdInput.trim()}
            onClick={() => void loadBundleContext(bundleIdInput)}
          >
            {loadState.status === 'loading' ? '加载中…' : '加载 bundle'}
          </button>
        </div>

        {loadState.status === 'error' && <div className="text-destructive">{loadState.message}</div>}

        {bundleSummary && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] border rounded p-2 bg-muted/20">
            <span className="text-muted-foreground">bundleHash</span>
            <span className="font-mono truncate" title={bundleSummary.bundleHash}>
              {bundleSummary.bundleHash.slice(0, 16)}…
            </span>
            <span className="text-muted-foreground">文件 / Token（估算）</span>
            <span>
              {bundleSummary.fileCount} 文件 · {bundleSummary.estimatedTokens.toLocaleString()} tokens
            </span>
            <span className="text-muted-foreground">Secret scan</span>
            <span>
              {bundleSummary.secretScan.findingCount} 条
              {bundleSummary.secretScan.hasHighSeverity ? ' · 含高危' : ''}
            </span>
            <span className="text-muted-foreground">外发许可</span>
            <span>{bundleSummary.externalExportAllowed ? '无高危 secret（仍需人工确认）' : '阻断'}</span>
          </div>
        )}

        {!bundleSummary && loadState.status === 'done' && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground">
              未找到已保存的 ProjectPack 摘要；仍可管理 jobs/reports，请手动填写 bundleHash。
            </p>
            <label className="block space-y-1">
              <span className="text-muted-foreground">bundleHash（手动）</span>
              <input
                className="w-full rounded border bg-background px-2 py-1 font-mono text-[10px]"
                value={bundleHashInput}
                onChange={(e) => setBundleHashInput(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="font-medium">筛选</div>
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
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-muted-foreground">provider / platform</span>
            <input
              list="review-platform-options"
              className="w-full rounded border bg-background px-2 py-1 text-[10px]"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              placeholder="留空显示全部"
            />
            <datalist id="review-platform-options">
              {platformOptions.map((id) => (
                <option key={id} value={id} />
              ))}
            </datalist>
          </label>
          <label className="space-y-1">
            <span className="text-muted-foreground">file（relativePath 包含）</span>
            <input
              className="w-full rounded border bg-background px-2 py-1 font-mono text-[10px]"
              value={fileFilter}
              onChange={(e) => setFileFilter(e.target.value)}
              placeholder="例如 handler.ts"
            />
          </label>
        </div>
      </div>

      <div className={sectionClass}>
        <div className="font-medium">Jobs（{jobs.length}）</div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="rounded border bg-background px-2 py-1 text-[10px] min-w-[120px]"
            placeholder="新 job platformId"
            value={newJobPlatformId}
            onChange={(e) => setNewJobPlatformId(e.target.value)}
          />
          <button
            type="button"
            className="px-2 py-1 rounded border text-[10px] disabled:opacity-50"
            disabled={jobBusy}
            onClick={() => void createJob()}
          >
            创建 job
          </button>
        </div>
        {jobs.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">此 bundle 尚无 external review jobs。</p>
        ) : (
          <ul className="space-y-1">
            {jobs.map((job) => (
              <li
                key={job.jobId}
                className={`flex flex-wrap items-center justify-between gap-2 border rounded px-2 py-1.5 ${activeJob?.jobId === job.jobId ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}
              >
                <button type="button" className="text-left underline font-mono text-[10px]" onClick={() => setActiveJob(job)}>
                  {job.platformId} · {job.jobId.slice(0, 8)}…
                </button>
                <span className="text-muted-foreground">{job.status}</span>
                {job.status === 'completed' && job.reportId && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-300">report 已关联</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {activeJob && (
          <div className="border rounded p-2 space-y-2 bg-muted/20">
            <div className="font-medium">{activeJob.platformId}</div>
            <div className="text-[10px] text-muted-foreground">状态：{activeJob.status}</div>
            <div className="flex flex-wrap gap-1">
              <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('authorize')}>
                授权提交（人工）
              </button>
              <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('mark_awaiting_result')}>
                标记等待结果
              </button>
              <button type="button" className="px-2 py-0.5 rounded border text-[10px]" disabled={jobBusy} onClick={() => void advanceJob('fail', { reason: '用户标记失败' })}>
                标记失败
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="font-medium">Reports 对比（{visibleReports.length}）</div>
        {visibleReports.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">尚无已保存报告；可在下方粘贴外部 AI 结果。</p>
        ) : (
          <div
            className={
              compact
                ? 'flex gap-3 overflow-x-auto pb-1'
                : 'grid gap-3 sm:grid-cols-2 xl:grid-cols-3'
            }
          >
            {visibleReports.map((report) => (
              <ReportColumn
                key={report.reportId}
                report={report}
                compact={compact}
                filters={{ severities: severityFilter, relativePath: fileFilter }}
              />
            ))}
          </div>
        )}
      </div>

      <div className={sectionClass}>
        <div className="font-medium">人工粘贴并保存</div>
        <p className="text-[10px] text-muted-foreground">
          仅保存粘贴内容到本地 report store；不会打开浏览器或读取登录态。
        </p>
        <input
          className="w-full rounded border bg-background px-2 py-1 text-[10px]"
          placeholder="platformId"
          value={pastePlatformId}
          onChange={(e) => setPastePlatformId(e.target.value)}
        />
        <textarea
          className="w-full min-h-[80px] rounded border bg-background px-2 py-1 text-[10px]"
          placeholder="粘贴外部 AI 审查原文"
          value={pasteRawOutput}
          onChange={(e) => setPasteRawOutput(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="px-2 py-1 rounded bg-primary text-primary-foreground text-[10px] disabled:opacity-50"
            disabled={jobBusy}
            onClick={() => void savePastedReport()}
          >
            仅保存 report
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border text-[10px] disabled:opacity-50"
            disabled={jobBusy || !activeJob}
            onClick={() => void savePastedReport({ completeActiveJob: true })}
          >
            保存并完成当前 job
          </button>
        </div>
        {panelError && <div className="text-destructive">{panelError}</div>}
      </div>
    </div>
  )
}

export default ExternalReviewCenterPanel

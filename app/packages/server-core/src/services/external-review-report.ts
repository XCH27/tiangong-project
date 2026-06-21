import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  CreateExternalReviewReportInput,
  ExternalReviewBundleSummary,
  ExternalReviewFinding,
  ExternalReviewFindingGroup,
  ExternalReviewReport,
  ExternalReviewSeverity,
} from '@craft-agent/shared/protocol'

const SEVERITIES: ExternalReviewSeverity[] = ['critical', 'high', 'medium', 'low', 'info']
const SEVERITY_WEIGHT: Record<ExternalReviewSeverity, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
}
const MAX_AUTO_FINDINGS = 50

const SEVERITY_ALIASES: Array<[ExternalReviewSeverity, RegExp]> = [
  ['critical', /^(critical|blocker|致命|阻断|严重)$/i],
  ['high', /^(high|高危|高|重要)$/i],
  ['medium', /^(medium|med|中危|中)$/i],
  ['low', /^(low|低危|低|minor)$/i],
  ['info', /^(info|note|notice|提示|信息)$/i],
]

const PATH_WITH_LINE_PATTERN =
  /((?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+\.[A-Za-z0-9]+|[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|css|scss|html|vue|svelte|py|go|rs|java|kt|swift|yml|yaml|toml))(?::(\d+))?/

export function getExternalReviewDataDir(): string {
  return join(homedir(), '.craft-agent', 'fleet', 'external-reviews')
}

function requireText(value: string, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} must be a non-empty string`)
  }
  return value.trim()
}

function normalizeFindings(
  findings: CreateExternalReviewReportInput['findings'] = [],
): ExternalReviewFinding[] {
  return findings.map((finding) => {
    if (!SEVERITIES.includes(finding.severity)) {
      throw new Error(`Unsupported external review severity: ${finding.severity}`)
    }
    return {
      ...finding,
      findingId: randomUUID(),
      title: requireText(finding.title, 'finding.title'),
      evidence: requireText(finding.evidence, 'finding.evidence'),
      recommendation: requireText(finding.recommendation, 'finding.recommendation'),
    }
  })
}

function normalizeSeverity(value: string): ExternalReviewSeverity | null {
  const token = value.trim().replace(/^\[|\]$/g, '')
  return SEVERITY_ALIASES.find(([, pattern]) => pattern.test(token))?.[0] ?? null
}

function parseFindingHeader(line: string): { severity: ExternalReviewSeverity; title: string } | null {
  const cleaned = line
    .trim()
    .replace(/^#{1,6}\s*/, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim()

  const bracket = cleaned.match(/^\[([^\]]+)\]\s*[:：\-—]?\s*(.+)$/)
  if (bracket) {
    const severity = normalizeSeverity(bracket[1]!)
    if (severity) return { severity, title: bracket[2]!.trim() }
  }

  const prefix = cleaned.match(/^([A-Za-z\u4e00-\u9fa5]+)\s*[:：\-—]\s*(.+)$/)
  if (prefix) {
    const severity = normalizeSeverity(prefix[1]!)
    if (severity) return { severity, title: prefix[2]!.trim() }
  }

  return null
}

function extractPathAndLine(text: string): Pick<ExternalReviewFinding, 'relativePath' | 'line'> {
  const match = text.match(PATH_WITH_LINE_PATTERN)
  const line = match?.[2] ? Number(match[2]) : undefined
  return {
    relativePath: match?.[1],
    line: Number.isFinite(line) && line! > 0 ? line : undefined,
  }
}

function stripLabel(line: string): string {
  return line.replace(/^[-*•\s]*(evidence|recommendation|fix|solution|建议|证据)\s*[:：]\s*/i, '').trim()
}

function buildRecommendation(block: string[]): string {
  const explicit = block.find((line) => /^(recommendation|fix|solution|建议)\s*[:：]/i.test(line.trim()))
  if (explicit) return stripLabel(explicit)
  return 'Review this finding and decide whether to apply a code or design change.'
}

export function parseExternalReviewFindings(rawOutput: string): Omit<ExternalReviewFinding, 'findingId'>[] {
  const lines = rawOutput.split(/\r?\n/)
  const findings: Omit<ExternalReviewFinding, 'findingId'>[] = []

  for (let index = 0; index < lines.length && findings.length < MAX_AUTO_FINDINGS; index += 1) {
    const header = parseFindingHeader(lines[index] ?? '')
    if (!header) continue

    const block: string[] = []
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor] ?? ''
      if (parseFindingHeader(line)) break
      if (line.trim()) block.push(line.trim())
      if (block.length >= 6) break
    }

    const combined = [header.title, ...block].join('\n')
    const location = extractPathAndLine(combined)
    findings.push({
      severity: header.severity,
      title: header.title.slice(0, 180),
      evidence: block.find((line) => /^(evidence|证据)\s*[:：]/i.test(line.trim()))
        ? stripLabel(block.find((line) => /^(evidence|证据)\s*[:：]/i.test(line.trim()))!)
        : combined.slice(0, 600),
      recommendation: buildRecommendation(block),
      ...location,
    })
  }

  return findings
}

function countFindings(findings: ExternalReviewFinding[]): Record<ExternalReviewSeverity, number> {
  const counts: Record<ExternalReviewSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }
  for (const finding of findings) counts[finding.severity] += 1
  return counts
}

function countGroups(groups: ExternalReviewFindingGroup[]): Record<ExternalReviewSeverity, number> {
  const counts: Record<ExternalReviewSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  }
  for (const group of groups) counts[group.severity] += 1
  return counts
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function normalizeKeyText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ').trim().slice(0, 80)
}

function findingGroupKey(finding: ExternalReviewFinding): string {
  if (finding.relativePath && finding.line) return `loc:${finding.relativePath}:${finding.line}`
  if (finding.relativePath) return `file:${finding.relativePath}:${normalizeKeyText(finding.title)}`
  return `title:${normalizeKeyText(finding.title)}`
}

function preferSeverity(a: ExternalReviewSeverity, b: ExternalReviewSeverity): ExternalReviewSeverity {
  return SEVERITY_WEIGHT[b] > SEVERITY_WEIGHT[a] ? b : a
}

export function summarizeExternalReviewReports(reports: ExternalReviewReport[]): ExternalReviewBundleSummary {
  const bundleId = reports[0]?.bundleId ?? ''
  const groups = new Map<string, ExternalReviewFindingGroup>()

  for (const report of reports) {
    for (const finding of report.findings) {
      const key = findingGroupKey(finding)
      const existing = groups.get(key)
      if (existing) {
        existing.severity = preferSeverity(existing.severity, finding.severity)
        existing.findingIds = dedupe([...existing.findingIds, finding.findingId])
        existing.reportIds = dedupe([...existing.reportIds, report.reportId])
        existing.platformIds = dedupe([...existing.platformIds, report.platformId])
        existing.evidence = dedupe([...existing.evidence, finding.evidence]).slice(0, 5)
        existing.recommendations = dedupe([...existing.recommendations, finding.recommendation]).slice(0, 5)
        continue
      }

      groups.set(key, {
        groupId: createHash('sha1').update(key).digest('hex').slice(0, 16),
        severity: finding.severity,
        title: finding.title,
        relativePath: finding.relativePath,
        line: finding.line,
        findingIds: [finding.findingId],
        reportIds: [report.reportId],
        platformIds: [report.platformId],
        evidence: [finding.evidence],
        recommendations: [finding.recommendation],
      })
    }
  }

  const groupedFindings = [...groups.values()].sort((a, b) => {
    const severityDelta = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]
    if (severityDelta) return severityDelta
    return b.reportIds.length - a.reportIds.length
  })

  return {
    bundleId,
    reportCount: reports.length,
    platformIds: dedupe(reports.map((report) => report.platformId)),
    groupedFindings,
    findingCounts: countGroups(groupedFindings),
    latestReceivedAt: reports.length ? Math.max(...reports.map((report) => report.receivedAt)) : null,
  }
}

export function createExternalReviewReport(
  input: CreateExternalReviewReportInput,
  now = Date.now(),
): ExternalReviewReport {
  const rawOutput = requireText(input.rawOutput, 'rawOutput')
  const findings = normalizeFindings(input.findings?.length ? input.findings : parseExternalReviewFindings(rawOutput))
  const receivedAt = input.receivedAt ?? now

  if (!Number.isFinite(receivedAt) || receivedAt <= 0) {
    throw new Error('receivedAt must be a positive timestamp')
  }

  return {
    reportId: randomUUID(),
    bundleId: requireText(input.bundleId, 'bundleId'),
    bundleHash: requireText(input.bundleHash, 'bundleHash'),
    platformId: requireText(input.platformId, 'platformId'),
    transport: input.transport,
    modelLabel: input.modelLabel?.trim() || null,
    rawOutput,
    rawOutputHash: createHash('sha256').update(rawOutput).digest('hex'),
    findings,
    findingCounts: countFindings(findings),
    fleetTokenUsage: { kind: 'actual', value: 0 },
    externalCost: input.externalCost ?? {
      kind: 'unknown',
      note: 'External platform cost is unknown and tracked separately from Fleet API token usage.',
    },
    submittedAt: input.submittedAt ?? null,
    receivedAt,
    createdAt: now,
  }
}

export class ExternalReviewReportStore {
  constructor(private readonly dataDir = getExternalReviewDataDir()) {}

  async save(input: CreateExternalReviewReportInput): Promise<ExternalReviewReport> {
    const report = createExternalReviewReport(input)
    await mkdir(this.dataDir, { recursive: true })
    await writeFile(join(this.dataDir, `${report.reportId}.json`), JSON.stringify(report, null, 2), 'utf-8')
    return report
  }

  async get(reportId: string): Promise<ExternalReviewReport | null> {
    const safeId = requireText(reportId, 'reportId')
    if (!/^[0-9a-f-]+$/i.test(safeId)) throw new Error('reportId has an invalid format')
    try {
      return JSON.parse(await readFile(join(this.dataDir, `${safeId}.json`), 'utf-8')) as ExternalReviewReport
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw error
    }
  }

  async listByBundle(bundleId: string): Promise<ExternalReviewReport[]> {
    const target = requireText(bundleId, 'bundleId')
    let names: string[]
    try {
      names = await readdir(this.dataDir)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }

    const reports = await Promise.all(
      names.filter((name) => name.endsWith('.json')).map(async (name) => {
        return JSON.parse(await readFile(join(this.dataDir, name), 'utf-8')) as ExternalReviewReport
      }),
    )
    return reports.filter((report) => report.bundleId === target).sort((a, b) => b.createdAt - a.createdAt)
  }

  async summarizeBundle(bundleId: string): Promise<ExternalReviewBundleSummary> {
    return summarizeExternalReviewReports(await this.listByBundle(bundleId))
  }
}

export const externalReviewReportStore = new ExternalReviewReportStore()

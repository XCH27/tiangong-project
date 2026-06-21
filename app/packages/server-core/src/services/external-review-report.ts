import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  CreateExternalReviewReportInput,
  ExternalReviewFinding,
  ExternalReviewReport,
  ExternalReviewSeverity,
} from '@craft-agent/shared/protocol'

const SEVERITIES: ExternalReviewSeverity[] = ['critical', 'high', 'medium', 'low', 'info']

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

export function createExternalReviewReport(
  input: CreateExternalReviewReportInput,
  now = Date.now(),
): ExternalReviewReport {
  const rawOutput = requireText(input.rawOutput, 'rawOutput')
  const findings = normalizeFindings(input.findings)
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
}

export const externalReviewReportStore = new ExternalReviewReportStore()


import { describe, expect, it } from 'bun:test'
import type { ExternalReviewFinding, ExternalReviewReport } from '@craft-agent/shared/protocol'
import { filterExternalReviewFindings, filterReportsByProvider } from './external-review-center-filters'

const findings: ExternalReviewFinding[] = [
  {
    findingId: '1',
    severity: 'high',
    title: 'Missing auth',
    evidence: 'handler.ts accepts unchecked actor',
    recommendation: 'Validate permissions',
    relativePath: 'handler.ts',
    line: 42,
  },
  {
    findingId: '2',
    severity: 'low',
    title: 'Naming nit',
    evidence: 'utils.ts uses vague helper name',
    recommendation: 'Rename helper',
    relativePath: 'utils.ts',
  },
]

describe('external review center filters', () => {
  it('filters by severity, file path, and keyword', () => {
    const bySeverity = filterExternalReviewFindings(findings, {
      severities: ['high'],
      relativePath: '',
      keyword: '',
    })
    expect(bySeverity).toHaveLength(1)
    expect(bySeverity[0]?.title).toBe('Missing auth')

    const byFile = filterExternalReviewFindings(findings, {
      severities: ['critical', 'high', 'medium', 'low', 'info'],
      relativePath: 'utils',
      keyword: '',
    })
    expect(byFile).toHaveLength(1)
    expect(byFile[0]?.relativePath).toBe('utils.ts')

    const byKeyword = filterExternalReviewFindings(findings, {
      severities: ['critical', 'high', 'medium', 'low', 'info'],
      relativePath: '',
      keyword: 'permissions',
    })
    expect(byKeyword).toHaveLength(1)
    expect(byKeyword[0]?.recommendation).toContain('Validate permissions')
  })

  it('filters reports by provider substring', () => {
    const reports: ExternalReviewReport[] = [
      {
        reportId: 'a',
        platformId: 'claude-web',
        bundleId: 'b1',
        bundleHash: 'h',
        transport: 'manual',
        modelLabel: null,
        rawOutput: '',
        rawOutputHash: '',
        findings: [],
        findingCounts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        fleetTokenUsage: { kind: 'actual', value: 0 },
        externalCost: { kind: 'unknown', note: '' },
        submittedAt: null,
        receivedAt: 1,
        createdAt: 1,
      },
      {
        reportId: 'b',
        platformId: 'chatgpt-web',
        bundleId: 'b1',
        bundleHash: 'h',
        transport: 'manual',
        modelLabel: null,
        rawOutput: '',
        rawOutputHash: '',
        findings: [],
        findingCounts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        fleetTokenUsage: { kind: 'actual', value: 0 },
        externalCost: { kind: 'unknown', note: '' },
        submittedAt: null,
        receivedAt: 1,
        createdAt: 1,
      },
    ]
    expect(filterReportsByProvider(reports, 'claude')).toHaveLength(1)
    expect(filterReportsByProvider(reports, '')).toHaveLength(2)
  })
})

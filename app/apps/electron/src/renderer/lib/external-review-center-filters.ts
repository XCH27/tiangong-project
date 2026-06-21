/**
 * Pure filters for external review report findings (renderer-local, no side effects).
 */

import type { ExternalReviewFinding, ExternalReviewReport, ExternalReviewSeverity } from '@craft-agent/shared/protocol'

export interface ExternalReviewFindingFilters {
  severities: ExternalReviewSeverity[]
  relativePath: string
  keyword: string
}

export const ALL_EXTERNAL_REVIEW_SEVERITIES: ExternalReviewSeverity[] = [
  'critical',
  'high',
  'medium',
  'low',
  'info',
]

export function filterExternalReviewFindings(
  findings: ExternalReviewFinding[],
  filters: ExternalReviewFindingFilters,
): ExternalReviewFinding[] {
  const pathNeedle = filters.relativePath.trim().toLowerCase()
  const severitySet = new Set(filters.severities)

  return findings.filter((finding) => {
    if (severitySet.size > 0 && !severitySet.has(finding.severity)) return false
    if (pathNeedle && !(finding.relativePath?.toLowerCase().includes(pathNeedle) ?? false)) return false
    if (filters.keyword.trim()) {
      const keyword = filters.keyword.trim().toLowerCase()
      const haystack = [
        finding.title,
        finding.evidence,
        finding.recommendation,
        finding.relativePath ?? '',
      ]
        .join('\n')
        .toLowerCase()
      if (!haystack.includes(keyword)) return false
    }
    return true
  })
}

export function filterReportsByProvider(
  reports: ExternalReviewReport[],
  platformId: string,
): ExternalReviewReport[] {
  const needle = platformId.trim().toLowerCase()
  if (!needle) return reports
  return reports.filter((report) => report.platformId.toLowerCase().includes(needle))
}

export function collectReportRelativePaths(reports: ExternalReviewReport[]): string[] {
  const paths = new Set<string>()
  for (const report of reports) {
    for (const finding of report.findings) {
      if (finding.relativePath) paths.add(finding.relativePath)
    }
  }
  return [...paths].sort((a, b) => a.localeCompare(b))
}

export function collectReportPlatformIds(reports: ExternalReviewReport[]): string[] {
  return [...new Set(reports.map((report) => report.platformId))].sort((a, b) => a.localeCompare(b))
}

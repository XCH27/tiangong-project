/** Normalized local record for review output returned by an external AI platform. */

export type ExternalReviewSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type ExternalReviewTransport = 'web' | 'api' | 'manual'
export type ExternalReviewCostKind = 'actual' | 'estimate' | 'unknown'

export interface ExternalReviewFinding {
  findingId: string
  severity: ExternalReviewSeverity
  title: string
  evidence: string
  recommendation: string
  relativePath?: string
  line?: number
}

export interface ExternalReviewCost {
  kind: ExternalReviewCostKind
  currency?: string
  amount?: number
  note: string
}

export interface ExternalReviewReport {
  reportId: string
  bundleId: string
  bundleHash: string
  platformId: string
  transport: ExternalReviewTransport
  modelLabel: string | null
  rawOutput: string
  rawOutputHash: string
  findings: ExternalReviewFinding[]
  findingCounts: Record<ExternalReviewSeverity, number>
  /** A manual website review does not consume Fleet API tokens, but may have external cost. */
  fleetTokenUsage: { kind: 'actual'; value: 0 }
  externalCost: ExternalReviewCost
  submittedAt: number | null
  receivedAt: number
  createdAt: number
}

export interface ExternalReviewFindingGroup {
  groupId: string
  severity: ExternalReviewSeverity
  title: string
  relativePath?: string
  line?: number
  findingIds: string[]
  reportIds: string[]
  platformIds: string[]
  evidence: string[]
  recommendations: string[]
}

export interface ExternalReviewBundleSummary {
  bundleId: string
  reportCount: number
  platformIds: string[]
  groupedFindings: ExternalReviewFindingGroup[]
  findingCounts: Record<ExternalReviewSeverity, number>
  latestReceivedAt: number | null
}

export interface CreateExternalReviewReportInput {
  bundleId: string
  bundleHash: string
  platformId: string
  transport: ExternalReviewTransport
  modelLabel?: string | null
  rawOutput: string
  findings?: Omit<ExternalReviewFinding, 'findingId'>[]
  externalCost?: ExternalReviewCost
  submittedAt?: number | null
  receivedAt?: number
}

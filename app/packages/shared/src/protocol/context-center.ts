import type { ProjectPackPlanPreviewSummary, ProjectPackRequest, ProjectPackSummary } from './project-pack'
import type { ProjectEnvironmentProfile, ToolCapability } from './system-tools'

export type ContextSignalConfidence = 'real' | 'estimate' | 'unknown'
export type ContextSignalLocality = 'local' | 'external' | 'unknown'
export type ContextCenterReviewReadinessStatus = 'ready' | 'blocked' | 'needs_pack' | 'unknown'

export interface ContextSignal<T> {
  value: T
  confidence: ContextSignalConfidence
  locality: ContextSignalLocality
  note?: string
}

export interface ContextCenterUsageOverview {
  sessionId: string
  inputTokens: ContextSignal<number>
  outputTokens: ContextSignal<number>
  cacheReadTokens?: ContextSignal<number>
  cacheCreationTokens?: ContextSignal<number>
  reportedCostUsd: ContextSignal<number>
  contextWindow?: ContextSignal<number>
  estimatedContextPercent?: ContextSignal<number>
}

export interface ContextCenterOverviewInput {
  sessionId?: string
  rootPath?: string
  workspaceId?: string
  bundleId?: string
  /** Optional dry-run ProjectPack request. Read-only: no bundle file is written. */
  projectPackPreviewRequest?: ProjectPackRequest
  forceToolDetection?: boolean
}

export interface ContextCenterOverview {
  generatedAt: number
  sessionId?: string
  workspaceId?: string
  rootPath?: string
  usage?: ContextCenterUsageOverview
  projectEnvironment?: ContextSignal<ProjectEnvironmentProfile>
  contextTools: ContextSignal<ToolCapability[]>
  projectPackSummary?: ContextSignal<ProjectPackSummary | null>
  projectPackPlanPreview?: ContextSignal<ProjectPackPlanPreviewSummary>
  reviewReadiness: {
    status: ContextSignal<ContextCenterReviewReadinessStatus>
    reasons: ContextSignal<string[]>
    externalExportAllowed: ContextSignal<boolean>
    secretHighSeverityBlocked?: ContextSignal<boolean>
    secretFindingCount?: ContextSignal<number>
    estimatedPackTokens?: ContextSignal<number>
  }
  notes: string[]
}

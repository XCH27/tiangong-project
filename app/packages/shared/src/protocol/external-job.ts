/**
 * External Job 协议契约（Lead 冻结 · docs/31 §5 · D9/D14 · docs/16）
 * =====================================================================
 *
 * 生图/生视频/图转3D/网页生成/外部审查统一 job 抽象。
 * 状态机：draft→pending_permission→queued→running→polling→completed/failed/cancelled。
 * 证据链：平台、权限确认、原始输出、token before/after、真实/估算/未知成本、回滚点。
 *
 * LOCAL_ONLY；落 `<workspace>/.fleet/external-jobs/`。
 * 实现在 server-core/services/external-job-service.ts。
 */

import type { ActorRef } from './design'

// ---------------------------------------------------------------------------
// Job type / status 词表
// ---------------------------------------------------------------------------

export const EXTERNAL_JOB_TYPES = [
  'external_ai_review',
  'image_gen',
  'image_to_image',
  'bg_remove',
  'image_to_3d',
  'video_gen',
  'video_render',
  'live_web_gen',
  'deploy_publish',
] as const

export type ExternalJobType = typeof EXTERNAL_JOB_TYPES[number]

export const EXTERNAL_JOB_STATUSES = [
  'draft',
  'pending_permission',
  'queued',
  'running',
  'polling',
  'completed',
  'failed',
  'cancelled',
] as const

export type ExternalJobStatus = typeof EXTERNAL_JOB_STATUSES[number]

// ---------------------------------------------------------------------------
// Cost（D9：真实/估算/未知 分栏，不混标）
// ---------------------------------------------------------------------------

export type CostTruth = 'real' | 'estimated' | 'unknown'

export type ExternalJobCostCategory =
  | 'fleet_api_tokens'
  | 'estimated_savings'
  | 'external_platform'
  | 'unknown'

export interface ExternalJobCostEntry {
  category: ExternalJobCostCategory
  label: string
  amount?: number
  currency?: string
  tokensBefore?: number
  tokensAfter?: number
  truth: CostTruth
  notes?: string
}

// ---------------------------------------------------------------------------
// Permission / evidence
// ---------------------------------------------------------------------------

export interface ExternalJobPermissionRecord {
  confirmedAt: number
  confirmedBy: ActorRef
  permissionLevel: 'L2' | 'L3'
  summary: string
  userAuthorizedLogin: boolean
}

export interface SecretScanFinding {
  path: string
  rule: string
  severity: 'low' | 'medium' | 'high'
  excerpt?: string
}

export interface ProjectPackManifestEntry {
  path: string
  size: number
  included: boolean
  reason?: string
}

export interface ExternalAiReviewEvidence {
  bundleHash: string
  fileManifest: ProjectPackManifestEntry[]
  secretScan: {
    scannedFiles: number
    findings: SecretScanFinding[]
  }
  targetPlatform: string
  reviewTemplate?: string
  permission: ExternalJobPermissionRecord
  rawOutput?: string
  reportSummary?: string
}

// ---------------------------------------------------------------------------
// Job record / inputs
// ---------------------------------------------------------------------------

export interface ExternalJobInputRef {
  kind: 'workspace_root' | 'file' | 'selection' | 'artifact' | 'prompt'
  ref: string
}

export interface ExternalJobTarget {
  provider?: string
  site?: string
  model?: string
}

export interface ExternalJobRecord {
  id: string
  type: ExternalJobType
  sessionId: string
  workspaceId: string
  actor: ActorRef
  status: ExternalJobStatus
  target: ExternalJobTarget
  inputRefs: ExternalJobInputRef[]
  permissionLevel: 'L2' | 'L3'
  permission?: ExternalJobPermissionRecord
  costs: ExternalJobCostEntry[]
  evidence?: ExternalAiReviewEvidence
  resultRefs?: string[]
  rollbackPointId?: string
  error?: string
  createdAt: number
  updatedAt: number
  completedAt?: number
}

export interface CreateExternalJobInput {
  type: ExternalJobType
  sessionId: string
  workspaceId: string
  actor: ActorRef
  target: ExternalJobTarget
  inputRefs: ExternalJobInputRef[]
  permissionLevel?: 'L2' | 'L3'
  tokensBefore?: number
  reviewTemplate?: string
}

export interface ConfirmExternalJobPermissionInput {
  jobId: string
  confirmedBy: ActorRef
  summary: string
  userAuthorizedLogin: boolean
}

// ---------------------------------------------------------------------------
// Timeline payload（映射到 SessionEvent external_job_* variant）
// ---------------------------------------------------------------------------

export interface ExternalJobTimelinePayload {
  type: 'external_job'
  sessionId: string
  jobId: string
  jobType: ExternalJobType
  status: ExternalJobStatus
  message: string
  timestamp: number
}

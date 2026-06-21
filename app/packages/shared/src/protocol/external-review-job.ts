/**
 * External review job state machine — local-only status tracking, no auto submit.
 */

export type ExternalReviewJobStatus =
  | 'pending_auth'
  | 'submitted'
  | 'awaiting_result'
  | 'completed'
  | 'failed'

export interface ExternalReviewJob {
  jobId: string
  bundleId: string
  bundleHash: string
  platformId: string
  status: ExternalReviewJobStatus
  createdAt: number
  updatedAt: number
  submittedAt?: number
  completedAt?: number
  failureReason?: string
  reportId?: string
  promptHash?: string
}

export interface CreateExternalReviewJobInput {
  bundleId: string
  bundleHash: string
  platformId: string
  promptHash?: string
}

export type ExternalReviewJobTransitionType =
  | 'authorize'
  | 'mark_awaiting_result'
  | 'complete'
  | 'fail'

export interface AdvanceExternalReviewJobInput {
  jobId: string
  transition: ExternalReviewJobTransitionType
  submittedAt?: number
  completedAt?: number
  reportId?: string
  reason?: string
}

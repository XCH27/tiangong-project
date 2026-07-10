/**
 * W0.1 text freeze — ExternalJob core shape
 * Source: docs/modules/08-aigc-jobs-surface.md + freeze record
 * Cost fields use M11A ValueConfidence only.
 */

import type { ArtifactRef } from './artifact-ref'
import type { ValueConfidence } from './m11a-usage-cost'

export type ExternalJobStatus =
  | 'queued'
  | 'submitting'
  | 'submitted'
  | 'running'
  | 'cancel_requested'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'unknown'
  | 'reconciling'

export type ExternalJob = {
  jobId: string
  operationRef: { capabilityId: string; operationId: string; version: string }
  providerId: string
  providerJobId?: string
  status: ExternalJobStatus
  idempotencyKey: string
  attempt: number
  priority: number
  inputRefs: ArtifactRef[]
  protectedInputRef?: string
  outputRefs: ArtifactRef[]
  progress?: { completed: number; total?: number; message?: string }
  permissionDecisionRef: string
  workflowRunId?: string
  nodeRunId?: string
  invocationId: string
  /** M11A vocabulary — no second cost ledger */
  cost: {
    amount?: number
    currency?: string
    source: ValueConfidence
    usageObservationId?: string
    costRecordId?: string
    budgetPreflightId?: string
  }
  reconcileAfter?: string
  error?: {
    category: string
    code: string
    message: string
    retryable: boolean
  }
  createdAt: string
  updatedAt: string
}

export const EXTERNAL_JOB_CONTRACT_VERSION = 'w0.1-external-job-1' as const

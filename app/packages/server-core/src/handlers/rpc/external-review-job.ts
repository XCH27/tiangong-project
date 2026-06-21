/**
 * External review job RPC handlers (LOCAL_ONLY).
 * Tracks local job state only — no auto login, upload, or outbound network calls.
 */

import type { RpcServer } from '@craft-agent/server-core/transport'
import {
  RPC_CHANNELS,
  type AdvanceExternalReviewJobInput,
  type CreateExternalReviewJobInput,
  type ExternalReviewJob,
} from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import {
  externalReviewJobStore,
  type ExternalReviewJobTransition,
} from '../../services/external-review-job-service'

function toTransition(input: AdvanceExternalReviewJobInput): ExternalReviewJobTransition {
  switch (input.transition) {
    case 'authorize':
      return { type: 'authorize', submittedAt: input.submittedAt }
    case 'mark_awaiting_result':
      return { type: 'mark_awaiting_result' }
    case 'complete':
      if (!input.reportId?.trim()) {
        throw new Error('externalReviewJob:advance complete transition requires reportId')
      }
      return { type: 'complete', reportId: input.reportId.trim(), completedAt: input.completedAt }
    case 'fail':
      return { type: 'fail', reason: input.reason?.trim() || 'Unknown failure' }
    default:
      throw new Error(`Unsupported external review job transition: ${String(input.transition)}`)
  }
}

export function registerExternalReviewJobHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(
    RPC_CHANNELS.externalReviewJob.CREATE,
    async (_ctx, input: CreateExternalReviewJobInput): Promise<ExternalReviewJob> => {
      return externalReviewJobStore.create(input)
    },
  )

  server.handle(
    RPC_CHANNELS.externalReviewJob.GET,
    async (_ctx, jobId: string): Promise<ExternalReviewJob | null> => {
      if (typeof jobId !== 'string' || !jobId.trim()) {
        throw new Error('externalReviewJob:get jobId must be a non-empty string')
      }
      return externalReviewJobStore.get(jobId.trim())
    },
  )

  server.handle(
    RPC_CHANNELS.externalReviewJob.ADVANCE,
    async (_ctx, input: AdvanceExternalReviewJobInput): Promise<ExternalReviewJob> => {
      const jobId = input.jobId?.trim()
      if (!jobId) throw new Error('externalReviewJob:advance jobId is required')
      return externalReviewJobStore.transition(jobId, toTransition(input))
    },
  )

  server.handle(
    RPC_CHANNELS.externalReviewJob.LIST_BY_BUNDLE,
    async (_ctx, bundleId: string): Promise<ExternalReviewJob[]> => {
      if (typeof bundleId !== 'string' || !bundleId.trim()) {
        throw new Error('externalReviewJob:listByBundle bundleId must be a non-empty string')
      }
      return externalReviewJobStore.listByBundle(bundleId.trim())
    },
  )
}

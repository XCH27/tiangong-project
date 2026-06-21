import type { RpcServer } from '@craft-agent/server-core/transport'
import { RPC_CHANNELS, type CreateExternalReviewReportInput } from '@craft-agent/shared/protocol'
import type { HandlerDeps } from '../handler-deps'
import { externalReviewReportStore } from '../../services/external-review-report'

export function registerExternalReviewHandlers(server: RpcServer, _deps: HandlerDeps): void {
  server.handle(
    RPC_CHANNELS.externalReview.SAVE,
    async (_ctx, input: CreateExternalReviewReportInput) => externalReviewReportStore.save(input),
  )
  server.handle(
    RPC_CHANNELS.externalReview.GET,
    async (_ctx, reportId: string) => externalReviewReportStore.get(reportId),
  )
  server.handle(
    RPC_CHANNELS.externalReview.LIST_BY_BUNDLE,
    async (_ctx, bundleId: string) => externalReviewReportStore.listByBundle(bundleId),
  )
}


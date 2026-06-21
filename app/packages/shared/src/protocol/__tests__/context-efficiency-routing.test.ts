import { describe, expect, it } from 'bun:test'
import { RPC_CHANNELS } from '../channels'
import { LOCAL_ONLY_CHANNELS, REMOTE_ELIGIBLE_CHANNELS, isLocalOnly } from '../routing'

const CONTEXT_EFFICIENCY_LOCAL_CHANNELS = [
  RPC_CHANNELS.contextAdapter.QUERY_CODEGRAPH,
  RPC_CHANNELS.contextAdapter.COMPRESS_RTK,
  RPC_CHANNELS.projectPackDelta.PLAN,
  RPC_CHANNELS.externalReviewJob.CREATE,
  RPC_CHANNELS.externalReviewJob.GET,
  RPC_CHANNELS.externalReviewJob.ADVANCE,
  RPC_CHANNELS.externalReviewJob.COMPLETE_WITH_REPORT,
  RPC_CHANNELS.externalReviewJob.LIST_BY_BUNDLE,
] as const

describe('context efficiency channel routing', () => {
  it('classifies new context-efficiency RPC channels as LOCAL_ONLY', () => {
    for (const channel of CONTEXT_EFFICIENCY_LOCAL_CHANNELS) {
      expect(LOCAL_ONLY_CHANNELS.has(channel)).toBe(true)
      expect(REMOTE_ELIGIBLE_CHANNELS.has(channel)).toBe(false)
      expect(isLocalOnly(channel)).toBe(true)
    }
  })
})

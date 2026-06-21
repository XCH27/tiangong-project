/**
 * Manual external review flow helpers — prompt generation, cost metrics, copy UX.
 * No auto-login, no cookies, no outbound submission.
 */

import type {
  ProjectPackReviewPromptResult,
  ProjectPackSummary,
  ContextSignalConfidence,
} from '@craft-agent/shared/protocol'
import {
  FLEET_TOKEN_EXTERNAL_REVIEW_NOTE,
  formatExternalCostKind,
  type SectionPhase,
} from './context-efficiency-ui'

export type ManualFlowCostMetricId = 'fleet-token' | 'external-cost' | 'token-estimate'

export interface ManualFlowCostMetric {
  id: ManualFlowCostMetricId
  label: string
  value: string
  kind: ContextSignalConfidence
  note?: string
}

export type PromptLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; result: ProjectPackReviewPromptResult }

export const MANUAL_REVIEW_PROMPT_NOTE =
  '将下方 prompt 手动复制到外部 AI；Fleet 不会自动打开网页、登录或提交。'

export function buildManualFlowCostMetrics(
  promptResult: ProjectPackReviewPromptResult | null,
  bundleSummary: ProjectPackSummary | null,
): ManualFlowCostMetric[] {
  const estimatedTokens =
    promptResult?.metadata.estimatedTokens ?? bundleSummary?.estimatedTokens ?? null
  const externalNote =
    promptResult?.metadata.externalPlatformCost.note ??
    '外部平台成本未知；不等于免费，可能与 Fleet API token 分开计费。'

  return [
    {
      id: 'fleet-token',
      label: 'Fleet API token',
      value: '0',
      kind: 'real',
      note: FLEET_TOKEN_EXTERNAL_REVIEW_NOTE,
    },
    {
      id: 'external-cost',
      label: formatExternalCostKind('unknown'),
      value: '未知',
      kind: 'unknown',
      note: externalNote,
    },
    {
      id: 'token-estimate',
      label: 'ProjectPack token 估算',
      value: estimatedTokens != null ? estimatedTokens.toLocaleString() : '—',
      kind: 'estimate',
      note:
        promptResult?.metadata.tokenEstimateKind === 'estimate' || bundleSummary?.tokenEstimateKind === 'estimate'
          ? '基于 ProjectPack 文件规模的本地估算，非外部平台计费。'
          : undefined,
    },
  ]
}

export function derivePromptSectionPhase(
  bundleLoaded: boolean,
  promptState: PromptLoadState,
): SectionPhase {
  if (!bundleLoaded) return 'empty'
  if (promptState.status === 'loading') return 'loading'
  if (promptState.status === 'error') return 'error'
  if (promptState.status === 'done') return 'ready'
  return 'empty'
}

export function canCopyReviewPrompt(result: ProjectPackReviewPromptResult | null): boolean {
  return result?.status === 'ready' && typeof result.reviewPrompt === 'string' && result.reviewPrompt.length > 0
}

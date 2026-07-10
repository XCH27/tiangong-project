/**
 * W0.1 text freeze — M11A usage/cost core
 * Contract version: w0.1-m11a-1
 * Source: docs/contracts/m11a-usage-cost-core.md
 * Lead-owned. Implement in W2; required before W3A paid/unknown jobs.
 */

export type ValueConfidence = 'confirmed' | 'estimated' | 'unknown'

export type UsageObservation = {
  observationId: string
  invocationId: string
  workflowRunId?: string
  externalJobId?: string
  providerId?: string
  modelId?: string
  executionMode: 'realtime' | 'native_batch' | 'local' | 'cli' | 'external'
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  mediaUnits?: Record<string, number>
  source:
    | 'provider_response'
    | 'provider_invoice'
    | 'local_measurement'
    | 'estimate'
    | 'none'
  confidence: ValueConfidence
  observedAt: string
}

export type CostRecord = {
  costRecordId: string
  usageObservationId: string
  amount?: number
  currency?: string
  confidence: ValueConfidence
  pricingRef?: string
  reconciles?: string
  createdAt: string
}

export type BudgetPreflight = {
  preflightId: string
  invocationId: string
  externalJobId?: string
  estimatedCost?: { amount: number; currency: string; confidence: ValueConfidence }
  mode: 'bounded' | 'unknown_requires_approval' | 'free_or_local'
  maxAmount?: number
  currency?: string
  decision: 'allow' | 'require_approval' | 'deny'
  decidedAt: string
}

export const M11A_CONTRACT_VERSION = 'w0.1-m11a-1' as const

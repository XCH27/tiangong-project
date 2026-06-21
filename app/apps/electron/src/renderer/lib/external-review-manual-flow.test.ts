import { describe, expect, it } from 'bun:test'
import type { ProjectPackReviewPromptResult, ProjectPackSummary } from '@craft-agent/shared/protocol'
import {
  buildManualFlowCostMetrics,
  canCopyReviewPrompt,
  derivePromptSectionPhase,
} from './external-review-manual-flow'

function makeSummary(overrides: Partial<ProjectPackSummary> = {}): ProjectPackSummary {
  return {
    bundleId: 'bundle-1',
    bundleHash: 'hash-abc',
    bundlePath: '/local/bundle.md',
    scope: 'repo',
    rootPath: '/repo',
    gitCommit: 'abc',
    gitBranch: 'main',
    gitDirty: false,
    fileCount: 2,
    totalBytes: 800,
    estimatedTokens: 320,
    tokenEstimateKind: 'estimate',
    excluded: [],
    files: [],
    secretScan: {
      scannedFileCount: 2,
      findingCount: 0,
      findings: [],
      hasHighSeverity: false,
    },
    createdAt: 1,
    markdownBytes: 900,
    externalExportAllowed: true,
    ...overrides,
  }
}

function makePromptResult(overrides: Partial<ProjectPackReviewPromptResult> = {}): ProjectPackReviewPromptResult {
  return {
    status: 'ready',
    metadata: {
      bundleId: 'bundle-1',
      bundleHash: 'hash-abc',
      fileCount: 2,
      estimatedTokens: 320,
      tokenEstimateKind: 'estimate',
      secretScan: {
        scannedFileCount: 2,
        findingCount: 0,
        hasHighSeverity: false,
        status: 'passed',
      },
      externalExportAllowed: true,
      externalPlatformCost: {
        status: 'unknown',
        label: 'external-platform-cost-unknown',
        note: 'External platform cost is unknown.',
      },
    },
    reasons: ['ok'],
    reviewPrompt: 'Review this bundle…',
    ...overrides,
  }
}

describe('external review manual flow helpers', () => {
  it('builds three separate cost metrics for fleet token, external cost, and token estimate', () => {
    const metrics = buildManualFlowCostMetrics(makePromptResult(), makeSummary())

    expect(metrics).toHaveLength(3)
    expect(metrics.map((m) => m.id)).toEqual(['fleet-token', 'external-cost', 'token-estimate'])
    expect(metrics[0]).toMatchObject({ kind: 'real', value: '0' })
    expect(metrics[1]).toMatchObject({ kind: 'unknown', value: '未知' })
    expect(metrics[2]).toMatchObject({ kind: 'estimate', value: '320' })
  })

  it('falls back to bundle summary when prompt result is missing', () => {
    const metrics = buildManualFlowCostMetrics(null, makeSummary({ estimatedTokens: 512 }))
    expect(metrics[2]?.value).toBe('512')
  })

  it('derives prompt section phase from bundle and prompt load state', () => {
    expect(derivePromptSectionPhase(false, { status: 'idle' })).toBe('empty')
    expect(derivePromptSectionPhase(true, { status: 'loading' })).toBe('loading')
    expect(derivePromptSectionPhase(true, { status: 'error', message: 'x' })).toBe('error')
    expect(
      derivePromptSectionPhase(true, { status: 'done', result: makePromptResult() }),
    ).toBe('ready')
  })

  it('allows copy only for ready prompts with non-empty text', () => {
    expect(canCopyReviewPrompt(makePromptResult())).toBe(true)
    expect(canCopyReviewPrompt(makePromptResult({ status: 'blocked', reviewPrompt: null }))).toBe(false)
    expect(canCopyReviewPrompt(makePromptResult({ reviewPrompt: '' }))).toBe(false)
  })
})

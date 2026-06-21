import { describe, expect, it } from 'bun:test'
import type { ProjectPackSummary } from '@craft-agent/shared/protocol'
import {
  PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE,
  buildProjectPackReviewPrompt,
} from './project-pack-review-prompt'

function makeSummary(overrides: Partial<ProjectPackSummary> = {}): ProjectPackSummary {
  return {
    bundleId: 'bundle-1',
    bundleHash: 'hash-abc',
    bundlePath: '/local/data/bundle-1.md',
    scope: 'repo',
    rootPath: '/repo',
    gitCommit: 'abc123',
    gitBranch: 'main',
    gitDirty: false,
    fileCount: 3,
    totalBytes: 1200,
    estimatedTokens: 400,
    tokenEstimateKind: 'estimate',
    excluded: [],
    files: [
      { relativePath: 'src/index.ts', bytes: 100, sha256: 'file-hash-1' },
      { relativePath: 'src/app.ts', bytes: 200, sha256: 'file-hash-2' },
      { relativePath: 'README.md', bytes: 300, sha256: 'file-hash-3' },
    ],
    secretScan: {
      scannedFileCount: 3,
      findingCount: 0,
      findings: [],
      hasHighSeverity: false,
    },
    createdAt: 123,
    markdownBytes: 1600,
    externalExportAllowed: true,
    ...overrides,
  }
}

describe('buildProjectPackReviewPrompt', () => {
  it('builds ready review prompt metadata from ProjectPackSummary with unknown external cost', () => {
    const result = buildProjectPackReviewPrompt(makeSummary())

    expect(result.status).toBe('ready')
    expect(result.metadata).toEqual({
      bundleId: 'bundle-1',
      bundleHash: 'hash-abc',
      fileCount: 3,
      estimatedTokens: 400,
      tokenEstimateKind: 'estimate',
      secretScan: {
        scannedFileCount: 3,
        findingCount: 0,
        hasHighSeverity: false,
        status: 'passed',
      },
      externalExportAllowed: true,
      externalPlatformCost: {
        status: 'unknown',
        label: 'external-platform-cost-unknown',
        note: PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE,
      },
    })
    expect(result.reviewPrompt).toContain('bundleId: bundle-1')
    expect(result.reviewPrompt).toContain('bundleHash: hash-abc')
    expect(result.reviewPrompt).toContain('fileCount: 3')
    expect(result.reviewPrompt).toContain('estimatedTokens: 400 (estimate)')
    expect(result.reviewPrompt).toContain('secretScan: passed')
    expect(result.reviewPrompt).toContain('externalExportAllowed: true')
    expect(result.reviewPrompt).toContain('External platform cost is unknown')
    expect(result.reviewPrompt).not.toContain('bundlePath')
    expect(result.reviewPrompt).not.toContain('/local/data/bundle-1.md')
    expect(result.reviewPrompt?.toLowerCase()).not.toContain(String.fromCharCode(102, 114, 101, 101))
    expect(result.reviewPrompt).not.toContain(String.fromCharCode(20813, 36153))
  })

  it('blocks prompt generation when high severity secrets are present', () => {
    const result = buildProjectPackReviewPrompt(makeSummary({
      secretScan: {
        scannedFileCount: 3,
        findingCount: 1,
        findings: [
          {
            relativePath: '.env',
            line: 1,
            ruleId: 'openai-key',
            severity: 'high',
            message: 'OpenAI API key',
            snippet: 'OPENAI_API_KEY=sk-...',
          },
        ],
        hasHighSeverity: true,
      },
      externalExportAllowed: false,
    }))

    expect(result.status).toBe('blocked')
    expect(result.reviewPrompt).toBeNull()
    expect(result.metadata.secretScan.status).toBe('blocked')
    expect(result.metadata.secretScan.hasHighSeverity).toBe(true)
    expect(result.metadata.externalExportAllowed).toBe(false)
    expect(result.reasons).toContain('High severity secret findings are present; external review prompt generation is blocked.')
    expect(result.reasons).toContain('ProjectPack summary marks external export as not allowed.')
  })

  it('blocks prompt generation when summary policy does not allow external export', () => {
    const result = buildProjectPackReviewPrompt(makeSummary({ externalExportAllowed: false }))

    expect(result.status).toBe('blocked')
    expect(result.reviewPrompt).toBeNull()
    expect(result.metadata.secretScan.status).toBe('passed')
    expect(result.metadata.externalExportAllowed).toBe(false)
    expect(result.reasons).toContain('ProjectPack summary marks external export as not allowed.')
    expect(result.reasons).toContain(PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE)
  })
})

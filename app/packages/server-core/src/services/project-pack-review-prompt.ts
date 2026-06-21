import type {
  ProjectPackReviewPromptMetadata,
  ProjectPackReviewPromptResult,
  ProjectPackSummary,
} from '@craft-agent/shared/protocol'

export const PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE =
  'External platform cost is unknown and may be charged, quota-limited, or governed by the user account on the external platform; it is tracked separately from Fleet API token usage.'

function buildMetadata(summary: ProjectPackSummary): ProjectPackReviewPromptMetadata {
  const highSeverityBlocked = summary.secretScan.hasHighSeverity

  return {
    bundleId: summary.bundleId,
    bundleHash: summary.bundleHash,
    fileCount: summary.fileCount,
    estimatedTokens: summary.estimatedTokens,
    tokenEstimateKind: summary.tokenEstimateKind,
    secretScan: {
      scannedFileCount: summary.secretScan.scannedFileCount,
      findingCount: summary.secretScan.findingCount,
      hasHighSeverity: highSeverityBlocked,
      status: highSeverityBlocked ? 'blocked' : 'passed',
    },
    externalExportAllowed: summary.externalExportAllowed,
    externalPlatformCost: {
      status: 'unknown',
      label: 'external-platform-cost-unknown',
      note: PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE,
    },
  }
}

function buildReasons(summary: ProjectPackSummary): string[] {
  const reasons: string[] = []

  if (summary.secretScan.hasHighSeverity) {
    reasons.push('High severity secret findings are present; external review prompt generation is blocked.')
  }

  if (!summary.externalExportAllowed) {
    reasons.push('ProjectPack summary marks external export as not allowed.')
  }

  if (reasons.length === 0) {
    reasons.push('ProjectPack summary allows external export and secret scan has no high severity findings.')
  }

  reasons.push(PROJECT_PACK_EXTERNAL_PLATFORM_COST_UNKNOWN_NOTE)

  return reasons
}

function buildPrompt(summary: ProjectPackSummary, metadata: ProjectPackReviewPromptMetadata): string {
  return [
    'Review this ProjectPack bundle for code quality, correctness risks, security issues, missing tests, and integration concerns.',
    '',
    'Important boundaries:',
    '- Use only the ProjectPack bundle content supplied by the user or Fleet.',
    '- Do not assume access to files outside the bundle.',
    '- External platform cost is unknown and tracked separately from Fleet API token usage.',
    '- Return findings ordered by severity, with concise evidence and actionable recommendations.',
    '',
    'Bundle metadata:',
    `- bundleId: ${metadata.bundleId}`,
    `- bundleHash: ${metadata.bundleHash}`,
    `- scope: ${summary.scope}`,
    `- gitCommit: ${summary.gitCommit ?? 'unknown'}`,
    `- gitBranch: ${summary.gitBranch ?? 'unknown'}`,
    `- gitDirty: ${summary.gitDirty}`,
    `- fileCount: ${metadata.fileCount}`,
    `- estimatedTokens: ${metadata.estimatedTokens} (${metadata.tokenEstimateKind})`,
    `- secretScan: ${metadata.secretScan.status}; scannedFileCount=${metadata.secretScan.scannedFileCount}; findingCount=${metadata.secretScan.findingCount}; hasHighSeverity=${metadata.secretScan.hasHighSeverity}`,
    `- externalExportAllowed: ${metadata.externalExportAllowed}`,
    `- externalPlatformCost: ${metadata.externalPlatformCost.status}`,
  ].join('\n')
}

export function buildProjectPackReviewPrompt(summary: ProjectPackSummary): ProjectPackReviewPromptResult {
  const metadata = buildMetadata(summary)
  const reasons = buildReasons(summary)
  const blocked = summary.secretScan.hasHighSeverity || !summary.externalExportAllowed

  return {
    status: blocked ? 'blocked' : 'ready',
    metadata,
    reasons,
    reviewPrompt: blocked ? null : buildPrompt(summary, metadata),
  }
}

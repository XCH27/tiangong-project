import type {
  ContextCenterOverview,
  ContextCenterOverviewInput,
  ContextCenterReviewReadinessStatus,
  ContextCenterUsageOverview,
  ProjectEnvironmentProfile,
  ProjectPackPlanPreviewSummary,
  ProjectPackSummary,
  ToolCapability,
} from '@craft-agent/shared/protocol'
import { buildContextEfficiencyRecommendations, buildContextCenterSidecarNotes } from './context-efficiency-advisor'

type SessionLike = {
  id: string
  tokenUsage?: {
    inputTokens: number
    outputTokens: number
    totalTokens?: number
    contextTokens?: number
    costUsd: number
    cacheReadTokens?: number
    cacheCreationTokens?: number
    contextWindow?: number
  }
} | null

function realLocal<T>(value: T) {
  return { value, confidence: 'real' as const, locality: 'local' as const }
}

function estimateLocal<T>(value: T) {
  return { value, confidence: 'estimate' as const, locality: 'local' as const }
}

function unknown<T>(value: T, note: string) {
  return { value, confidence: 'unknown' as const, locality: 'unknown' as const, note }
}

function buildReviewReadiness(
  input: ContextCenterOverviewInput,
  projectPackEvidence?: ProjectPackSummary | ProjectPackPlanPreviewSummary | null,
): ContextCenterOverview['reviewReadiness'] {
  if (projectPackEvidence === undefined) {
    if (input.bundleId || input.projectPackPreviewRequest) {
      return {
        status: unknown<ContextCenterReviewReadinessStatus>('unknown', '请求了项目包摘要但未读取到结果'),
        reasons: unknown(['请求了项目包摘要或 dry-run 预览，但没有读取到结果；不能确认外部审查 readiness'], '缺少项目包摘要'),
        externalExportAllowed: unknown(false, '没有可外发的项目包摘要'),
      }
    }

    return {
      status: realLocal<ContextCenterReviewReadinessStatus>('needs_pack'),
      reasons: realLocal(['尚未提供项目包摘要；需要先生成或选择已有项目包后才能判断外部审查 readiness']),
      externalExportAllowed: unknown(false, '没有可外发的项目包摘要'),
    }
  }

  if (projectPackEvidence === null) {
    return {
      status: unknown<ContextCenterReviewReadinessStatus>('unknown', '项目包摘要为空'),
      reasons: unknown(['项目包摘要为空；不能确认外部审查 readiness'], '缺少项目包摘要'),
      externalExportAllowed: unknown(false, '没有可外发的项目包摘要'),
    }
  }

  const highSeverityBlocked = projectPackEvidence.secretScan.hasHighSeverity
  const reasons: string[] = []
  if (highSeverityBlocked) {
    reasons.push('发现 high severity secret，外部审查被阻断')
  }
  if (!projectPackEvidence.externalExportAllowed && !highSeverityBlocked) {
    reasons.push('项目包摘要禁止外发；需要重新检查项目包策略或 secret scan 结果')
  }
  if (reasons.length === 0) {
    reasons.push('项目包摘要可用，且未发现 high severity secret 阻断项')
  }

  const status: ContextCenterReviewReadinessStatus =
    highSeverityBlocked || !projectPackEvidence.externalExportAllowed ? 'blocked' : 'ready'

  return {
    status: realLocal(status),
    reasons: realLocal(reasons),
    externalExportAllowed: realLocal(projectPackEvidence.externalExportAllowed),
    secretHighSeverityBlocked: realLocal(highSeverityBlocked),
    secretFindingCount: realLocal(projectPackEvidence.secretScan.findingCount),
    estimatedPackTokens: estimateLocal(projectPackEvidence.estimatedTokens),
  }
}

function usageOverview(session: SessionLike): ContextCenterUsageOverview | undefined {
  if (!session?.tokenUsage) return undefined
  const tu = session.tokenUsage
  const overview: ContextCenterUsageOverview = {
    sessionId: session.id,
    inputTokens: realLocal(tu.inputTokens),
    outputTokens: realLocal(tu.outputTokens),
    reportedCostUsd: realLocal(tu.costUsd),
  }
  if (tu.cacheReadTokens !== undefined) overview.cacheReadTokens = realLocal(tu.cacheReadTokens)
  if (tu.cacheCreationTokens !== undefined) overview.cacheCreationTokens = realLocal(tu.cacheCreationTokens)
  if (tu.contextWindow !== undefined) overview.contextWindow = realLocal(tu.contextWindow)
  if (tu.contextWindow && tu.contextWindow > 0) {
    overview.estimatedContextPercent = estimateLocal(Math.max(0, Math.min(1, tu.inputTokens / tu.contextWindow)))
  }
  return overview
}

export function buildContextCenterOverview(params: {
  input: ContextCenterOverviewInput
  session?: SessionLike
  contextTools: ToolCapability[]
  projectEnvironment?: ProjectEnvironmentProfile
  projectPackSummary?: ProjectPackSummary | null
  projectPackPlanPreview?: ProjectPackPlanPreviewSummary
  generatedAt?: number
}): ContextCenterOverview {
  const { input, session, contextTools, projectEnvironment, projectPackSummary, projectPackPlanPreview } = params
  const notes: string[] = []
  if (!input.sessionId) notes.push('未提供 sessionId，无法读取真实用量')
  if (input.sessionId && !session) notes.push(`sessionId=${input.sessionId} 不存在，无法读取真实用量`)
  if (input.rootPath && !projectEnvironment) notes.push('未生成项目环境摘要')
  if (input.bundleId && projectPackSummary === undefined) notes.push(`bundleId=${input.bundleId} 未找到已保存的项目包摘要`)
  if (input.projectPackPreviewRequest && projectPackPlanPreview === undefined) notes.push('ProjectPack dry-run 预览请求未返回结果')
  notes.push(...buildContextCenterSidecarNotes(contextTools))

  const baseOverview: Omit<ContextCenterOverview, 'recommendations'> = {
    generatedAt: params.generatedAt ?? Date.now(),
    sessionId: input.sessionId,
    workspaceId: input.workspaceId,
    rootPath: input.rootPath,
    usage: usageOverview(session ?? null),
    projectEnvironment: projectEnvironment ? realLocal(projectEnvironment) : undefined,
    contextTools: realLocal(contextTools),
    projectPackSummary: projectPackSummary !== undefined ? realLocal(projectPackSummary) : undefined,
    projectPackPlanPreview: projectPackPlanPreview !== undefined ? realLocal(projectPackPlanPreview) : undefined,
    reviewReadiness: buildReviewReadiness(input, projectPackSummary !== undefined ? projectPackSummary : projectPackPlanPreview),
    notes,
  }
  return {
    ...baseOverview,
    recommendations: buildContextEfficiencyRecommendations(baseOverview),
  }
}

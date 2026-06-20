import type {
  ContextCenterOverview,
  ContextCenterOverviewInput,
  ContextCenterUsageOverview,
  ProjectEnvironmentProfile,
  ProjectPackSummary,
  ToolCapability,
} from '@craft-agent/shared/protocol'

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
  generatedAt?: number
}): ContextCenterOverview {
  const { input, session, contextTools, projectEnvironment, projectPackSummary } = params
  const notes: string[] = []
  if (!input.sessionId) notes.push('未提供 sessionId，无法读取真实用量')
  if (input.sessionId && !session) notes.push('未找到 session，无法读取真实用量')
  if (input.rootPath && !projectEnvironment) notes.push('未生成项目环境摘要')
  if (input.bundleId && projectPackSummary === undefined) notes.push('未读取到项目包摘要')

  const overview: ContextCenterOverview = {
    generatedAt: params.generatedAt ?? Date.now(),
    sessionId: input.sessionId,
    workspaceId: input.workspaceId,
    rootPath: input.rootPath,
    usage: usageOverview(session ?? null),
    projectEnvironment: projectEnvironment ? realLocal(projectEnvironment) : undefined,
    contextTools: realLocal(contextTools),
    projectPackSummary: projectPackSummary !== undefined ? realLocal(projectPackSummary) : undefined,
    reviewReadiness: {
      externalExportAllowed: projectPackSummary
        ? realLocal(projectPackSummary.externalExportAllowed)
        : unknown(false, '没有可外发的项目包摘要'),
      secretFindingCount: projectPackSummary
        ? realLocal(projectPackSummary.secretScan.findingCount)
        : undefined,
      estimatedPackTokens: projectPackSummary
        ? estimateLocal(projectPackSummary.estimatedTokens)
        : undefined,
    },
    notes,
  }

  return overview
}

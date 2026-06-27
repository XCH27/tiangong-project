/**
 * 智能模型路由 + 多模型融合 + 分层缓存 — 类型定义
 *
 * 单一真相：docs/03-Fusion多模型融合方案.md
 *
 * 本文件定义路由决策、Fusion 流水线、缓存和成本账本的共享类型。
 * 不含实现逻辑——实现分别在 model-orchestrator.ts / fusion-pipeline.ts / fusion-cache.ts。
 */

// ---------------------------------------------------------------------------
// 任务类型与复杂度
// ---------------------------------------------------------------------------

/**
 * 任务类型 / 执行面（轴 1）。
 * 隐含能力需求：design→vision+structuredOutput，code→toolCalling 等。
 * media-gen 走 External Job 平面（docs/31），不进 LLM 路由。
 */
export type TaskType =
  | 'chat-text'
  | 'code-tools'
  | 'review-analysis'
  | 'design-canvas'
  | 'animation'
  | 'video-edit'
  | 'prompt-opt'
  | 'automation'
  | 'memory-op'
  | 'media-gen'

/** 复杂度 1–4（轴 2，FrugalGPT 轴）。 */
export type Complexity = 1 | 2 | 3 | 4

/** 模型档位，对应 craft 三档 connection.models[0/1/2]。 */
export type ModelTier = 'fast' | 'balanced' | 'best'

/** Fusion 形态。 */
export type FusionMode = 'none' | 'synthesis' | 'plan'

// ---------------------------------------------------------------------------
// 路由决策
// ---------------------------------------------------------------------------

/**
 * 队长派发子任务时携带的路由建议（软约束）。
 * 执行 Agent 的 orchestrator 在 hint 范围内做决策；冲突时可覆写并回注理由。
 */
export interface RoutingHint {
  preferredSurface?: 'api' | 'cli'
  suggestFusion?: boolean
  fusionForm?: 'synthesis' | 'plan'
  tierHint?: ModelTier
  budgetTokens?: number
}

/** 路由器输入。 */
export interface RoutingInput {
  message: string
  attachmentsCount: number
  hasCodeBlocks: boolean
  hasFileMentions: boolean
  hasToolIntent: boolean
  conversationTurns: number
  taskTypeHint?: TaskType
  routingHint?: RoutingHint
  latencySensitive?: boolean
}

/** 路由器输出（决策）。 */
export interface RoutingDecision {
  taskType: TaskType
  complexity: Complexity
  tier: ModelTier
  modelId?: string
  connectionSlug?: string
  fusionMode: FusionMode
  /** 级联升级信号（低置信时设 true，允许后续 cascade）。 */
  cascadeEligible: boolean
  /** 路由依据（写 timeline）。 */
  basis: string
  /** 队长 hint 与实际决策冲突时的覆写理由。 */
  hintOverrideReason?: string
}

// ---------------------------------------------------------------------------
// Fusion 流水线
// ---------------------------------------------------------------------------

/** Panel 成员定义。 */
export interface PanelMember {
  connectionSlug: string
  modelId: string
  role: 'logic' | 'code' | 'language'
  timeoutMs: number
}

/** Panel 成员的单次产出。 */
export interface PanelResult {
  member: PanelMember
  answer: string
  /** 动作方案（Plan Fusion 用）。 */
  actionPlan?: unknown
  error?: string
  cacheHit: boolean
  durationMs: number
}

/** Judge 结构化输出（LLM-as-a-Judge）。 */
export interface JudgeAnalysis {
  consensus: string[]
  contradictions: string[]
  partialCoverage: string[]
  uniqueInsights: string[]
  blindSpots: string[]
  /** Judge 的 go/no-go 决定（简单任务直答不融合）。 */
  shouldFuse: boolean
}

/** Fusion 流水线配置。 */
export interface FusionConfig {
  panel: PanelMember[]
  judgeModel: { connectionSlug: string; modelId: string }
  writerModel: { connectionSlug: string; modelId: string }
  fusionDepth: number
  budgetCap: { maxTokens: number; maxPanelists: number }
  verification?: { enabled: boolean; models?: string[] }
  /** L3 Panel 中间缓存（默认关，由 prefs.cache.panelIntermediate 控制） */
  panelCacheEnabled?: boolean
}

/** Fusion 执行结果。 */
export interface FusionResult {
  finalAnswer: string
  /** Plan Fusion 的可执行动作序列。 */
  actionPlan?: unknown
  panelResults: PanelResult[]
  judgeAnalysis: JudgeAnalysis
  verificationPassed?: boolean
  totalTokens: number
  totalCostUsd: number
  cascadeUpgrades: number
}

// ---------------------------------------------------------------------------
// 缓存
// ---------------------------------------------------------------------------

export type CacheLayer = 'l2-exact' | 'l2-semantic' | 'l3-panel'

export interface CacheKey {
  workspaceId: string
  connectionSlug: string
  modelId: string
  taskType: TaskType
  toolSetHash: string
  memoryInjectionHash: string
  permissionMode: string
  normalizedMessage: string
  attachmentHashes: string[]
}

export interface CacheEntry {
  namespace: CacheLayer
  key: string
  createdAt: number
  expiresAt: number
  workspaceId: string
  payload: {
    answer: string
    actionPlan?: unknown
    panelMeta?: Array<{ member: PanelMember; cacheHit: boolean }>
  }
  invalidators: {
    gitHead?: string
    memoryVersion?: string
    toolSetHash: string
  }
}

export interface CacheLookupResult {
  hit: boolean
  entry?: CacheEntry
  layer?: CacheLayer
}

// ---------------------------------------------------------------------------
// 成本账本
// ---------------------------------------------------------------------------

export interface CostLedger {
  routing: {
    taskType: TaskType
    complexity: Complexity
    tier: ModelTier
    fusionMode: FusionMode
    cascadeUpgrades: number
  }
  shaping?: {
    tool: string
    beforeTokens: number
    afterTokens: number
    kind: 'estimated'
  }
  layers: {
    l1Provider?: {
      cacheReadTokens: number
      cacheCreationTokens: number
      provider: string
      kind: 'actual'
    }
    l2Exact?: { hit: boolean }
    l3Panel?: { hits: number; misses: number; savedEstTokens: number; kind: 'estimated' }
  }
  cost: {
    actual: number | null
    estimated: number | null
    savedByCache: number | null
  }
}

// ---------------------------------------------------------------------------
// 偏好设置
// ---------------------------------------------------------------------------

export interface ModelRoutingPrefs {
  mode: 'manual' | 'auto'
  cascade: { enabled: boolean; respectLatencySensitive: boolean }
  shaping: { rtk: boolean; codegraph: boolean; reasonixPrefix: boolean }
  taskTypeRouting?: Partial<Record<TaskType, { tier?: ModelTier; fusionMode?: FusionMode }>>
  agentPolicy: {
    manager: { connectionSlug: string; modelId: string }
    leader: { allowAuto: boolean; allowFusion: boolean; allowCli: boolean }
    executor: {
      allowAuto: boolean
      allowCli: boolean
      surfaceByTaskType?: Partial<Record<TaskType, 'api' | 'cli'>>
    }
  }
  fusion: {
    enabled: 'off' | 'on' | 'smart'
    preset: 'quality' | 'budget' | 'custom'
    panelSize: 2 | 3
    panelModels: string[]
    judgeModel: string
    writerModel: string
    formsByTaskType?: Partial<Record<TaskType, 'synthesis' | 'plan'>>
    budgetCap: { maxTokens: number; maxPanelists: number; perWorkspaceDaily?: number }
    scope: 'leader-only' | 'all-agents'
    verification: { enabled: boolean; models?: string[] }
  }
  cache: { exact: boolean; semantic: boolean; panelIntermediate: boolean }
}

/** 默认偏好（所有新字段的安全默认值）。 */
export const DEFAULT_MODEL_ROUTING_PREFS: ModelRoutingPrefs = {
  mode: 'manual',
  cascade: { enabled: true, respectLatencySensitive: true },
  shaping: { rtk: false, codegraph: false, reasonixPrefix: false },
  agentPolicy: {
    manager: { connectionSlug: '', modelId: '' },
    leader: { allowAuto: true, allowFusion: true, allowCli: true },
    executor: { allowAuto: true, allowCli: true },
  },
  fusion: {
    enabled: 'off',
    preset: 'budget',
    panelSize: 3,
    panelModels: [],
    judgeModel: '',
    writerModel: '',
    budgetCap: { maxTokens: 50000, maxPanelists: 3 },
    scope: 'leader-only',
    verification: { enabled: false },
  },
  cache: { exact: true, semantic: false, panelIntermediate: false },
}

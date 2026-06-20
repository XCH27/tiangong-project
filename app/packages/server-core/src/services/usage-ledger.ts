/**
 * Usage Ledger v1 (T-USAGE)
 *
 * 只统计和展示**真实存在**的数据。
 * - real tokens 来自 session.tokenUsage（provider / agent complete 事件）
 * - 没有真实数据就显示未知 / 缺席，不伪造
 * - 真实 token、估算 token、外部平台成本必须分开标注
 * - 本地/CLI 运行不得显示为 API 花费
 *
 * 本服务为纯计算/读取层，不引入第二套 store，不改 SessionEvent 契约。
 * 供后续主线接进 Context / Inspector 使用。
 */

import type { TokenUsage } from '@craft-agent/core/types'
import type { LlmAuthType } from '@craft-agent/shared/config'

export interface ConnectionInfoForCost {
  slug?: string
  authType?: LlmAuthType
  providerType?: string
  baseUrl?: string
  name?: string
}

/**
 * 分类账本：把真实数据与估算/未知严格分离。
 */
export interface UsageLedger {
  sessionId: string

  /** 真实 token 计数（直接来自 provider 报告，未经累加伪造） */
  real: {
    inputTokens: number
    outputTokens: number
    /**
     * 仅当 provider 真实报告时才存在（undefined 表示本次会话/该轮未报告缓存数据）
     * 组件端据此决定是否渲染 "缓存命中" 行
     */
    cacheReadTokens?: number
    cacheCreationTokens?: number
  }

  /**
   * provider 报告的原始 costUsd 累计值（可能是 0）。
   * 仅当 >0 时才视为真实 API 费用。
   */
  reportedCostUsd: number

  /**
   * 费用归属（严格区分）：
   * - 'provider-reported': reportedCostUsd > 0，来自真实 provider 用量响应
   * - 'local-no-api-cost': 本地/CLI/无认证连接，不应显示为 API 花费
   * - 'unknown': 0 费用但无法确定来源（可能是免费额度、未报告、或未来外部）
   */
  costAttribution: 'provider-reported' | 'local-no-api-cost' | 'unknown'

  /** 若 provider 同时报告 context window，则存在（真实） */
  contextWindow?: number

  /**
   * 上下文填充比例（仅当 inputTokens 与 contextWindow 均为真实正数时才计算，否则 undefined）
   * 标注为"估算"，因为它取决于当前 input 作为"本次发送上下文大小"的理解。
   */
  estimatedContextPercent?: number

  /**
   * 人类可读说明（真实/未知边界）
   */
  notes: string[]
}

/**
 * 判定是否为本地/无 API 计费的连接。
 * 黑盒启发式：authType==='none'、slug/base/model 含 local/ollama/cli 等关键词。
 * 不依赖未来 T-CLI 细节。
 */
function isLikelyLocalNoApiCost(
  connection: ConnectionInfoForCost | null | undefined,
  model?: string
): boolean {
  if (!connection) return false
  if (connection.authType === 'none') return true

  const hay = [
    connection.slug ?? '',
    connection.baseUrl ?? '',
    connection.name ?? '',
    model ?? '',
    connection.providerType ?? '',
  ]
    .join(' ')
    .toLowerCase()

  return /(?:^|[\s_\-./:])(?:local|ollama|lmstudio|llama\.cpp|gpt4all|kobold|llamacpp|cli|localhost|127\.0\.0\.1)(?:$|[\s_\-./:])/i.test(
    hay
  )
}

/**
 * 基于真实 tokenUsage + 可选连接信息计算分类账本。
 * 绝不把缺失字段填充为"有"，绝不把 0 费用展示为正向花费。
 */
export function computeUsageLedger(params: {
  sessionId: string
  tokenUsage?: Partial<TokenUsage> & { contextWindow?: number }
  connection?: ConnectionInfoForCost | null
  model?: string
}): UsageLedger {
  const tu = params.tokenUsage ?? {}
  const sessionId = params.sessionId

  const hasInputTokens = typeof tu.inputTokens === 'number'
  const realInput = hasInputTokens ? tu.inputTokens! : 0
  const realOutput = typeof tu.outputTokens === 'number' ? tu.outputTokens : 0
  const reportedCost = typeof tu.costUsd === 'number' ? tu.costUsd : 0

  // 仅当字段真实存在于数据中（非 undefined）才带入 real
  const cacheRead =
    tu.cacheReadTokens !== undefined ? tu.cacheReadTokens : undefined
  const cacheCreate =
    tu.cacheCreationTokens !== undefined ? tu.cacheCreationTokens : undefined

  const contextWindow =
    typeof tu.contextWindow === 'number' && tu.contextWindow > 0
      ? tu.contextWindow
      : undefined

  // 仅当两者都是真实可用数字时才给出估算百分比
  let estimatedContextPercent: number | undefined
  if (contextWindow && hasInputTokens && realInput >= 0) {
    const pct = realInput / contextWindow
    // 限制到合理范围，保留 4 位小数用于显示
    estimatedContextPercent = Math.max(0, Math.min(1, pct))
  }

  // 费用归属判定（绝不把 local 显示成 API 费用）
  let costAttribution: UsageLedger['costAttribution']
  if (reportedCost > 0) {
    costAttribution = 'provider-reported'
  } else if (isLikelyLocalNoApiCost(params.connection, params.model)) {
    costAttribution = 'local-no-api-cost'
  } else {
    costAttribution = 'unknown'
  }

  const notes: string[] = []
  if (cacheRead === undefined && cacheCreate === undefined) {
    notes.push('本次会话未报告缓存读写数据（cacheRead/cacheCreation 缺席）')
  }
  if (reportedCost === 0) {
    if (costAttribution === 'local-no-api-cost') {
      notes.push('本地/CLI 模型运行，无 API 费用记录')
    } else if (costAttribution === 'unknown') {
      notes.push('费用为 0 或未报告；不视为 Fleet API 花费')
    }
  }
  if (estimatedContextPercent === undefined) {
    notes.push(
      contextWindow
        ? '上下文窗口已知，但当前 inputTokens 未提供或无法计算百分比'
        : '上下文窗口大小未知，无法计算填充比例'
    )
  }

  return {
    sessionId,
    real: {
      inputTokens: realInput,
      outputTokens: realOutput,
      cacheReadTokens: cacheRead,
      cacheCreationTokens: cacheCreate,
    },
    reportedCostUsd: reportedCost,
    costAttribution,
    contextWindow,
    estimatedContextPercent,
    notes,
  }
}

/**
 * 便捷：从一个完整的 TokenUsage（可能带 contextWindow）直接生成 ledger。
 * connection 信息可选，用于成本分类。
 */
export function ledgerFromTokenUsage(
  sessionId: string,
  tokenUsage: (TokenUsage & { contextWindow?: number }) | undefined | null,
  connection?: ConnectionInfoForCost | null,
  model?: string
): UsageLedger {
  return computeUsageLedger({
    sessionId,
    tokenUsage: tokenUsage ?? undefined,
    connection: connection ?? undefined,
    model,
  })
}

/**
 * 人类可读的成本标签（用于 UI 展示，不作为计费证明）。
 */
export function describeCost(ledger: UsageLedger): string {
  if (ledger.costAttribution === 'provider-reported') {
    return `$${ledger.reportedCostUsd.toFixed(6)} (provider-reported)`
  }
  if (ledger.costAttribution === 'local-no-api-cost') {
    return '本地运行 / CLI，无 API 费用'
  }
  return '未知（未报告或 0）'
}

/**
 * 简要真实数据摘要（供日志或测试）
 */
export function summarizeReal(ledger: UsageLedger): string {
  const c = ledger.real
  const parts: string[] = [
    `in=${c.inputTokens}`,
    `out=${c.outputTokens}`,
  ]
  if (c.cacheReadTokens !== undefined)
    parts.push(`cacheRead=${c.cacheReadTokens}`)
  if (c.cacheCreationTokens !== undefined)
    parts.push(`cacheCreate=${c.cacheCreationTokens}`)
  return parts.join(' ')
}

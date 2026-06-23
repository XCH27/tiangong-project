/**
 * 用量 / 额度（Token 环点击详情的数据契约，docs/16 §2.2 · docs/01 §3⑥）。
 *
 * 两件**互不混淆**的事（docs/00A：别把上下文占用和会员额度画成同一个圆环）：
 * - **上下文占用 ContextUsage**：本会话当前上下文窗口填了多少（图2 那种 N/200K + 分段）。
 * - **套餐额度 PlanUsage**：账号订阅额度窗口（图1 那种 5 小时 / 每周 + reset + 百分比）。
 *
 * 诚实分级（docs/16）：每个数字带 `source: real | estimated | unknown`。
 * 拿不到就老老实实标 unknown / unavailable，不编造数字。CLI 运行时上下文由 CLI 管理 → window unknown。
 *
 * browser-safe：纯类型 + 纯函数。
 */

export type UsageSource = 'real' | 'estimated' | 'unknown'

/** 运行方式（用量视角的 API vs 本机 CLI）。 */
export type UsageRuntimeKind = 'api' | 'cli'

export const CONTEXT_SEGMENT_IDS = ['system', 'tools', 'rules', 'skills', 'mcp', 'subagents', 'conversation', 'other'] as const
export type ContextSegmentId = typeof CONTEXT_SEGMENT_IDS[number]

export interface ContextSegment {
  id: ContextSegmentId
  label: string
  tokens: number
  source: UsageSource
}

export interface ContextUsage {
  /** 当前上下文占用 tokens。 */
  usedTokens: number
  usedSource: UsageSource
  /** 上下文窗口；CLI 由 CLI 管理时为 null（unknown）。 */
  contextWindow: number | null
  windowSource: UsageSource
  /** 0–1；窗口未知时为 null。 */
  percentFull: number | null
  /** 分段明细（未细分时为空数组；分段是估算时各段标 estimated）。 */
  segments: ContextSegment[]
}

export interface PlanUsageWindow {
  id: string
  /** 中文显示，如 "5 小时限额"、"每周 · 全部模型"。 */
  label: string
  /** 0–1。 */
  percentUsed: number
  /** 重置时间（epoch ms），未知则省略。 */
  resetsAt?: number
  source: UsageSource
}

export interface PlanUsage {
  available: boolean
  /** 不可用原因（如 "该 provider 未暴露订阅额度"）。 */
  unavailableReason?: string
  windows: PlanUsageWindow[]
  source: UsageSource
}

/** Token 环点击后弹层要展示的完整视图。 */
export interface SessionUsageView {
  sessionId: string
  runtime: UsageRuntimeKind
  /** 当前模型 / runtime 显示名，如 "Opus 4.8" 或 "Grok Build"。 */
  modelLabel: string
  context: ContextUsage
  plan: PlanUsage
}

// ---------------------------------------------------------------------------
// 纯函数（可单测）
// ---------------------------------------------------------------------------

export interface ComputeContextInput {
  usedTokens: number
  /** null = 窗口未知（CLI 管理）。 */
  contextWindow: number | null
  usedSource?: UsageSource
  segments?: ContextSegment[]
}

export function computeContextUsage(input: ComputeContextInput): ContextUsage {
  const window = input.contextWindow
  const valid = typeof window === 'number' && window > 0
  return {
    usedTokens: Math.max(0, input.usedTokens),
    usedSource: input.usedSource ?? 'real',
    contextWindow: valid ? window : null,
    windowSource: valid ? 'real' : 'unknown',
    percentFull: valid ? Math.min(1, Math.max(0, input.usedTokens / window)) : null,
    segments: input.segments ?? [],
  }
}

/** 标准"额度不可用"（默认态：多数 provider 不暴露订阅额度）。 */
export function unavailablePlanUsage(reason: string): PlanUsage {
  return { available: false, unavailableReason: reason, windows: [], source: 'unknown' }
}

export interface ContextSegmentEstimateInput {
  /** 真实总上下文占用（来自 SDK，real）。分段按它归一，保证和=总数。 */
  total: number
  /** 系统提示 + 规则的估算 tokens。 */
  systemTokens: number
  /** 工具定义（含 MCP/技能/子代理工具）估算 tokens；拿不到传 0。 */
  toolTokens?: number
  /** 对话消息估算 tokens。 */
  conversationTokens: number
}

/**
 * 估算上下文分段（Cursor 式按类目拆分）。craft 不像 Cursor 那样给每段打 token 标签，
 * 所以这里用 estimateTokens 对可拿到的几块（系统提示+规则 / 工具 / 对话）做**估算**，
 * 余下归入 `other`，并整体归一到真实总数 `total`，保证分段之和=真实总占用。
 * 每段标 `estimated`（诚实分级，docs/16）——不谎称是精确 tokenizer 计数。
 */
export function estimateContextSegments(input: ContextSegmentEstimateInput): ContextSegment[] {
  const total = Math.max(0, Math.round(input.total))
  if (total === 0) return []
  let system = Math.max(0, Math.round(input.systemTokens))
  let tools = Math.max(0, Math.round(input.toolTokens ?? 0))
  let conversation = Math.max(0, Math.round(input.conversationTokens))
  const accounted = system + tools + conversation

  // 估算可能超过真实总数（估算偏高）→ 按比例缩回，余量给 other=0。
  if (accounted > total && accounted > 0) {
    const scale = total / accounted
    system = Math.round(system * scale)
    tools = Math.round(tools * scale)
    conversation = Math.max(0, total - system - tools)
    return ([
      { id: 'system' as const, label: '系统提示与规则', tokens: system, source: 'estimated' as const },
      { id: 'tools' as const, label: '工具定义', tokens: tools, source: 'estimated' as const },
      { id: 'conversation' as const, label: '对话', tokens: conversation, source: 'estimated' as const },
    ]).filter(seg => seg.tokens > 0)
  }

  const other = Math.max(0, total - accounted)
  return ([
    { id: 'system' as const, label: '系统提示与规则', tokens: system, source: 'estimated' as const },
    { id: 'tools' as const, label: '工具定义', tokens: tools, source: 'estimated' as const },
    { id: 'conversation' as const, label: '对话', tokens: conversation, source: 'estimated' as const },
    { id: 'other' as const, label: '工具/技能/其它', tokens: other, source: 'estimated' as const },
  ]).filter(seg => seg.tokens > 0)
}

/** 百分比 → 显示文案（如 "90% 满"）。窗口未知时给出诚实文案。 */
export function describeContextPercent(context: ContextUsage): string {
  if (context.percentFull == null) return '上下文窗口由 CLI 管理（未知）'
  return `${Math.round(context.percentFull * 100)}% 满`
}

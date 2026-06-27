/**
 * 智能模型路由器 — 两轴决策 + 级联升级 + 成本感知
 *
 * 单一真相：docs/03 §4
 *
 * 职责：根据 (任务类型 × 复杂度) + 级联信号，决定档位 + Fusion 形态。
 * 不直接调模型——只产出 RoutingDecision，由 SessionManager 消费。
 */

import type {
  TaskType,
  Complexity,
  ModelTier,
  FusionMode,
  RoutingInput,
  RoutingDecision,
  RoutingHint,
  ModelRoutingPrefs,
} from './fusion-types.ts'

// ---------------------------------------------------------------------------
// 任务类型识别
// ---------------------------------------------------------------------------

const REVIEW_KEYWORDS = ['审查', 'review', 'security', '安全', 'audit', 'vulnerab', 'CVE', '风险']
const DESIGN_KEYWORDS = ['设计', 'design', '画布', 'canvas', '布局', 'layout', 'UI', '配色', '配色板']
const ANIMATION_KEYWORDS = ['动画', 'animation', '关键帧', 'keyframe', '时间线', 'timeline', '动效']
const VIDEO_KEYWORDS = ['视频', 'video', '剪辑', 'edit', '片段', 'clip', '轨道', 'track', '转场']
const PROMPT_KEYWORDS = ['提示词优化', 'prompt optim', 'prompt改写', '优化提示', 'prompt refine']
const AUTOMATION_KEYWORDS = ['自动化', 'automation', 'trigger', '触发', 'webhook', '定时', 'schedule']
const MEMORY_KEYWORDS = ['记忆', 'memory', '记住', 'recall', '检索记忆', 'forget']

const CODE_INDICATORS = ['```', 'function', 'class ', 'def ', 'import ', 'const ', 'export ', 'interface ', 'interface{', 'git diff', 'refactor', '重构']

/**
 * 从消息内容 + 上下文信号识别任务类型。
 * 启发式：关键词匹配 + 结构信号。不调 LLM。
 */
export function identifyTaskType(input: RoutingInput): TaskType {
  const msg = input.message.toLowerCase()

  // 显式 hint 优先
  if (input.taskTypeHint) return input.taskTypeHint

  if (MEMORY_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'memory-op'
  if (PROMPT_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'prompt-opt'
  if (AUTOMATION_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'automation'
  if (VIDEO_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'video-edit'
  if (ANIMATION_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'animation'
  if (DESIGN_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'design-canvas'
  if (REVIEW_KEYWORDS.some(k => msg.includes(k.toLowerCase()))) return 'review-analysis'

  // 代码信号
  if (input.hasCodeBlocks || CODE_INDICATORS.some(k => msg.includes(k.toLowerCase()))) return 'code-tools'

  // 默认：文本问答
  return 'chat-text'
}

// ---------------------------------------------------------------------------
// 复杂度判定（启发式）
// ---------------------------------------------------------------------------

/**
 * 启发式复杂度评分（零成本，不调 LLM）。
 * 返回 1–4。
 */
export function assessComplexity(input: RoutingInput, taskType: TaskType): Complexity {
  const msg = input.message
  const length = msg.length

  // 任务类型基础复杂度
  const baseByType: Record<TaskType, Complexity> = {
    'chat-text': 1,
    'memory-op': 1,
    'prompt-opt': 2,
    'automation': 2,
    'code-tools': 2,
    'review-analysis': 3,
    'design-canvas': 3,
    'animation': 3,
    'video-edit': 4,
    'media-gen': 1, // 走 External Job，不进 LLM 路由
  }

  let score = baseByType[taskType] ?? 2

  // 长度加成
  if (length > 2000) score = Math.max(score, 3) as Complexity
  if (length > 5000) score = 4

  // 附件/文件提及加成
  if (input.attachmentsCount > 0 || input.hasFileMentions) {
    score = Math.max(score, 2) as Complexity
    if (input.attachmentsCount > 2) score = Math.max(score, 3) as Complexity
  }

  // 工具意图加成（改文件/跑命令 → 至少 3）
  if (input.hasToolIntent) score = Math.max(score, 3) as Complexity

  // 多轮追问加成
  if (input.conversationTurns > 5) score = Math.max(score, 3) as Complexity

  // 关键词升级
  const lowerMsg = msg.toLowerCase()
  if (lowerMsg.includes('架构') || lowerMsg.includes('architecture') || lowerMsg.includes('跨模块') || lowerMsg.includes('重写')) {
    score = 4
  }
  if (lowerMsg.includes('安全审查') || lowerMsg.includes('security audit')) {
    score = 4
  }

  return Math.min(4, Math.max(1, score)) as Complexity
}

// ---------------------------------------------------------------------------
// 档位映射
// ---------------------------------------------------------------------------

/** 复杂度 → 默认档位。 */
export function complexityToTier(complexity: Complexity): ModelTier {
  switch (complexity) {
    case 1: return 'fast'
    case 2: return 'fast' // fast/balanced 边界，mini 二段可判
    case 3: return 'balanced'
    case 4: return 'best'
  }
}

// ---------------------------------------------------------------------------
// Fusion 形态决定
// ---------------------------------------------------------------------------

/**
 * 根据任务类型 + 复杂度 + Fusion 设置决定 Fusion 形态。
 * 只在 C4 + Fusion 开启时触发。
 */
export function decideFusionMode(
  taskType: TaskType,
  complexity: Complexity,
  prefs: ModelRoutingPrefs,
): FusionMode {
  // Fusion 全局关
  if (prefs.fusion.enabled === 'off') return 'none'

  // 非 C4 不 Fusion
  if (complexity < 4) return 'none'

  // smart 模式：只有特定任务类型才 Fusion
  if (prefs.fusion.enabled === 'smart') {
    const fusibleTypes: TaskType[] = ['review-analysis', 'code-tools', 'design-canvas', 'animation', 'video-edit']
    if (!fusibleTypes.includes(taskType)) return 'none'
  }

  // 按任务类型决定形态
  const formOverride = prefs.fusion.formsByTaskType?.[taskType]
  if (formOverride) return formOverride

  // 默认：动作型 → plan，文本型 → synthesis
  const planTypes: TaskType[] = ['code-tools', 'design-canvas', 'animation', 'video-edit', 'automation']
  return planTypes.includes(taskType) ? 'plan' : 'synthesis'
}

// ---------------------------------------------------------------------------
// 级联资格
// ---------------------------------------------------------------------------

/** 判断此请求是否适合级联升级（低延迟任务不级联）。 */
export function isCascadeEligible(
  taskType: TaskType,
  complexity: Complexity,
  latencySensitive: boolean,
  prefs: ModelRoutingPrefs,
): boolean {
  if (!prefs.cascade.enabled) return false
  if (prefs.cascade.respectLatencySensitive && latencySensitive) return false
  // C1 闲聊不级联（浪费）
  if (complexity <= 1) return false
  // C4 已经是最高档，级联无意义（除非 Fusion 关了，那 C4→best 也可以不升）
  if (complexity >= 4) return false
  return true
}

// ---------------------------------------------------------------------------
// hint 融合
// ---------------------------------------------------------------------------

/** 把队长 routingHint 作为软约束融入决策，冲突时记录覆写理由。 */
function applyRoutingHint(
  decision: Omit<RoutingDecision, 'hintOverrideReason'>,
  hint?: RoutingHint,
): RoutingDecision {
  if (!hint) return decision

  let overrideReason: string | undefined

  // tierHint：在合理范围内采纳
  if (hint.tierHint) {
    const tierRank = { fast: 1, balanced: 2, best: 3 }
    // hint 可以升级但不降级（队长说 best，路由说 fast → 采纳 best）
    if (tierRank[hint.tierHint] > tierRank[decision.tier]) {
      decision.tier = hint.tierHint
    }
  }

  // suggestFusion：队长建议 Fusion，但只有满足条件才采纳
  if (hint.suggestFusion && decision.fusionMode === 'none') {
    if (decision.complexity >= 3) {
      decision.fusionMode = hint.fusionForm ?? 'synthesis'
    } else {
      overrideReason = '队长建议 Fusion 但复杂度不足（<3），未采纳'
    }
  }

  return { ...decision, hintOverrideReason: overrideReason }
}

/** 判断是否为低延迟敏感任务（闲聊/短问答）。 */
export function inferLatencySensitive(
  message: string,
  taskType: TaskType,
  complexity: Complexity,
): boolean {
  if (taskType !== 'chat-text') return false
  if (complexity > 2) return false
  const trimmed = message.trim()
  return trimmed.length < 240 && !/```/.test(trimmed)
}

export type MiniCompletionFn = (prompt: string) => Promise<string | null>

/**
 * C2/C3 边界模糊时，用 mini 模型二段判官（docs/03 §4.2）。
 * 仅在启发式复杂度 === 2 时触发；失败则保留启发式结果。
 */
export async function refineComplexityWithMini(
  heuristic: Complexity,
  message: string,
  taskType: TaskType,
  runMini: MiniCompletionFn,
): Promise<{ complexity: Complexity; basisSuffix: string }> {
  if (heuristic !== 2) {
    return { complexity: heuristic, basisSuffix: '' }
  }

  const prompt = `Classify this user task complexity for model routing.
Reply with ONLY the digit 2 or 3:
2 = simple/moderate (short edits, summaries, straightforward Q&A)
3 = complex (multi-step analysis, review, careful reasoning)

Task type: ${taskType}
User message:
${message.slice(0, 1500)}`

  try {
    const raw = await runMini(prompt)
    if (!raw) return { complexity: heuristic, basisSuffix: '' }
    const digit = raw.trim().match(/\b([23])\b/)?.[1]
    if (digit === '3') {
      return { complexity: 3, basisSuffix: 'mini-judge=3' }
    }
    if (digit === '2') {
      return { complexity: 2, basisSuffix: 'mini-judge=2' }
    }
  } catch {
    // fall through
  }
  return { complexity: heuristic, basisSuffix: '' }
}

/** mini 判官或外部修正后，重建档位/Fusion/级联字段。 */
export function rebuildDecisionForComplexity(
  decision: RoutingDecision,
  complexity: Complexity,
  prefs: ModelRoutingPrefs,
  latencySensitive: boolean,
  basisSuffix?: string,
): RoutingDecision {
  const tier = complexityToTier(complexity)
  const fusionMode = decideFusionMode(decision.taskType, complexity, prefs)
  const cascadeEligible = isCascadeEligible(
    decision.taskType,
    complexity,
    latencySensitive,
    prefs,
  )
  const basis = basisSuffix
    ? `${decision.basis.split('; mini-judge')[0]}; ${basisSuffix}; tier=${tier} fusion=${fusionMode}`
    : `taskType=${decision.taskType} complexity=${complexity} tier=${tier} fusion=${fusionMode} cascade=${cascadeEligible}`

  return {
    ...decision,
    complexity,
    tier,
    fusionMode,
    cascadeEligible,
    basis,
  }
}

/**
 * 路由主入口。两轴决策 + hint 融合 + 级联资格标记。
 *
 * 启发式首判 + 可选 mini 二段判官（`refineComplexityWithMini`，SessionManager 在 agent 就绪后调用）。
 */
export function plan(input: RoutingInput, prefs: ModelRoutingPrefs): RoutingDecision {
  const taskType = identifyTaskType(input)
  const complexity = assessComplexity(input, taskType)
  const latencySensitive = input.latencySensitive ?? inferLatencySensitive(input.message, taskType, complexity)
  const tier = complexityToTier(complexity)
  const fusionMode = decideFusionMode(taskType, complexity, prefs)
  const cascadeEligible = isCascadeEligible(
    taskType,
    complexity,
    latencySensitive,
    prefs,
  )

  // 场景覆写
  const override = prefs.taskTypeRouting?.[taskType]
  const finalTier = override?.tier ?? tier
  const finalFusion = override?.fusionMode ?? fusionMode

  const basis = `taskType=${taskType} complexity=${complexity} tier=${finalTier} fusion=${finalFusion} cascade=${cascadeEligible}`

  const decision: RoutingDecision = {
    taskType,
    complexity,
    tier: finalTier,
    fusionMode: finalFusion,
    cascadeEligible,
    basis,
  }

  return applyRoutingHint(decision, input.routingHint)
}

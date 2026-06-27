/**
 * 级联升级（cascade）— 安全网，不是每请求必走
 *
 * 单一真相：docs/03 §4.3
 *
 * 当路由器选了便宜档、但执行出现低置信信号时，升级到更贵档或触发 Fusion。
 * 升级条件遵守 FrugalGPT：仅当「期望质量增益 > 成本增加」。
 *
 * 信号类型：
 * - 文本：自报置信度低 / 自一致性差
 * - 动作型：DesignAction/编辑计划 schema 校验失败或工具调用报错
 * - 代码：测试/lint 失败
 *
 * latencySensitive 任务不级联（避免增延迟）。
 */

import type { Complexity, ModelTier, FusionMode, RoutingDecision, ModelRoutingPrefs } from './fusion-types.ts'

/** 级联触发信号。 */
export type CascadeSignal =
  | { kind: 'low-confidence'; detail: string }
  | { kind: 'schema-failure'; detail: string }
  | { kind: 'tool-error'; detail: string }
  | { kind: 'test-failure'; detail: string }
  | { kind: 'self-inconsistency'; detail: string }

/** 级联升级结果。 */
export interface CascadeResult {
  /** 是否升级。 */
  upgraded: boolean
  /** 升级后的档位（若 upgraded）。 */
  newTier?: ModelTier
  /** 升级后的 Fusion 形态（若触发 Fusion）。 */
  newFusionMode?: FusionMode
  /** 升级依据。 */
  reason: string
  /** 升级次数（累计）。 */
  cascadeUpgrades: number
}

/** tier 排名（用于比较）。 */
const TIER_RANK: Record<ModelTier, number> = { fast: 1, balanced: 2, best: 3 }

/**
 * 评估级联信号，决定是否升级。
 *
 * 升级路径：fast → balanced → best → Fusion
 * 只升不降。C4 不级联（已是最高档）。
 */
export function evaluateCascade(
  current: RoutingDecision,
  signals: CascadeSignal[],
  prefs: ModelRoutingPrefs,
): CascadeResult {
  // 无信号 → 不升级
  if (signals.length === 0) {
    return { upgraded: false, reason: '无级联信号', cascadeUpgrades: 0 }
  }

  // 级联未启用
  if (!prefs.cascade.enabled) {
    return { upgraded: false, reason: '级联未启用', cascadeUpgrades: 0 }
  }

  // 低延迟任务不级联
  if (prefs.cascade.respectLatencySensitive && current.cascadeEligible === false) {
    return { upgraded: false, reason: '低延迟任务或不可级联', cascadeUpgrades: 0 }
  }

  // C4 不级联（已是最高档，除非 Fusion 关了——那也不升）
  if (current.complexity >= 4) {
    return { upgraded: false, reason: 'C4 已是最高档', cascadeUpgrades: 0 }
  }

  // 升级路径
  const currentRank = TIER_RANK[current.tier]
  let newTier: ModelTier = current.tier
  let newFusionMode: FusionMode = current.fusionMode

  // 严重信号（schema-failure / test-failure）→ 直接升到 best
  const severe = signals.some(s => s.kind === 'schema-failure' || s.kind === 'test-failure')
  if (severe) {
    newTier = 'best'
  } else if (currentRank < 2) {
    // 一般信号 → 升一级
    newTier = 'balanced'
  } else if (currentRank < 3) {
    newTier = 'best'
  }

  // 如果已经是 best + Fusion 开启 + 信号严重 → 触发 Fusion
  if (newTier === 'best' && prefs.fusion.enabled !== 'off' && severe) {
    newFusionMode = current.taskType === 'code-tools' || current.taskType === 'design-canvas' ? 'plan' : 'synthesis'
  }

  const upgraded = newTier !== current.tier || newFusionMode !== current.fusionMode
  const reason = upgraded
    ? `信号: ${signals.map(s => s.kind).join(',')} → ${current.tier}→${newTier}` + (newFusionMode !== current.fusionMode ? ` +Fusion:${newFusionMode}` : '')
    : '信号不足以升级'

  return {
    upgraded,
    newTier: upgraded ? newTier : undefined,
    newFusionMode: upgraded && newFusionMode !== current.fusionMode ? newFusionMode : undefined,
    reason,
    cascadeUpgrades: upgraded ? 1 : 0,
  }
}

/**
 * 从模型输出文本提取低置信信号。
 * 启发式：检测犹豫措辞、自相矛盾标记。
 */
export function extractConfidenceSignals(output: string): CascadeSignal[] {
  const signals: CascadeSignal[] = []
  const lower = output.toLowerCase()

  // 自报低置信
  if (lower.includes('不确定') || lower.includes('not sure') || lower.includes('might be') || lower.includes('i think')) {
    signals.push({ kind: 'low-confidence', detail: '模型自报不确定' })
  }

  // 自相矛盾
  if (lower.includes('另一方面') && lower.includes('但也可以') || lower.includes('on the other hand')) {
    signals.push({ kind: 'self-inconsistency', detail: '输出含自相矛盾措辞' })
  }

  return signals
}

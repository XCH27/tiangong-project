/**
 * 管理 Agent 分级自动决策引擎（D12 / docs/17 §4）。
 *
 * 默认关键动作问用户；用户开启自动决策后，管理 Agent 只在低风险按记忆/偏好/规则代答，且必须分级：
 * - L0 只读建议：自动可。
 * - L1 低风险本地：开启自动决策 + 按偏好自动。
 * - L2 写入/执行/外发：需规则授权或预授权，否则升级用户。
 * - L3 不可逆/敏感：永远明确确认，规则也不能自动同意。
 *
 * 硬要求：每个自动判断都带「依据」（引用规则/偏好），可写 timeline、可回放、可撤销。
 * 不能：自动同意 L3、绕过 permission、无依据代答、把"开了自动决策"当无限授权。
 *
 * browser-safe：纯类型 + 纯函数，无 Node 依赖。
 */

import type { ActorRef } from './design'
import type { ThinkingLevel } from '../agent/thinking-levels'

export const AUTO_DECISION_LEVELS = ['L0', 'L1', 'L2', 'L3'] as const
export type AutoDecisionLevel = typeof AUTO_DECISION_LEVELS[number]

/** 动作风险类别（决定等级）。 */
export type AutoDecisionKind =
  | 'readonly'                 // L0：不改任何状态
  | 'local_reversible'         // L1：本地、可回滚、符合偏好
  | 'write_execute_external'   // L2：写文件 / 运行命令 / 外发
  | 'irreversible_sensitive'   // L3：删除 / 发布 / 付款 / 登录 / 改方向 / 外发敏感

export type AutoDecisionOutcome = 'auto_allow' | 'auto_deny' | 'escalate'

export interface AutoDecisionRequest {
  kind: AutoDecisionKind
  /** 动作描述（如 "run test: bun test"、"git push"）。 */
  action: string
  /** 关联会话（写 timeline 用）。 */
  sessionId: string
  /** 发起的项目 Agent（可选）。 */
  requesterAgentId?: string
}

/** 预授权规则：把某类动作授权到最高 L2（L3 永不可被规则自动同意）。 */
export interface AutoDecisionRule {
  id: string
  /** 匹配：动作类别 + 可选动作前缀。 */
  matchKind?: AutoDecisionKind
  actionPrefix?: string
  /** 授权方向。 */
  grants: 'allow' | 'deny'
  /** 规则可达到的最高等级（只允许 L1/L2）。 */
  maxLevel: 'L1' | 'L2'
  /** 依据说明（写进 decision 的 basis）。 */
  reason: string
}

export type ManagerAgentModelMode = 'workspace_default' | 'api_connection'

export interface ManagerAgentModelSettings {
  /**
   * workspace_default: follow current workspace default model.
   * api_connection: pin the software-level Manager Agent to a specific API connection/model.
   *
   * CLI runtimes are intentionally excluded here until a native manager runtime
   * adapter exists; otherwise the UI would advertise a model that cannot run.
   */
  mode: ManagerAgentModelMode
  connectionSlug?: string
  model?: string
  thinkingLevel?: ThinkingLevel
}

export interface AutoDecisionSettings {
  /** 用户是否开启自动决策。默认 false（全部关键动作问用户）。 */
  enabled: boolean
  /** L1 是否按偏好自动（仅在 enabled 时生效）。 */
  autoL1: boolean
  /** L2 预授权规则。 */
  rules: AutoDecisionRule[]
  /** 管理 Agent 自己使用的模型配置。 */
  model: ManagerAgentModelSettings
}

export const DEFAULT_AUTO_DECISION_SETTINGS: AutoDecisionSettings = Object.freeze({
  enabled: false,
  autoL1: true,
  rules: [],
  model: { mode: 'workspace_default' as const },
})

export interface AutoDecisionResult {
  level: AutoDecisionLevel
  outcome: AutoDecisionOutcome
  /** 依据（引用规则/偏好/默认）。每个判断都必须有。 */
  basis: string
  /** 命中的规则 id（如有）。 */
  ruleId?: string
  /** 是否可撤销（L3 升级时为 false 提示不可逆）。 */
  revocable: boolean
}

/** 动作类别 → 等级。 */
export function classifyAutoDecisionLevel(kind: AutoDecisionKind): AutoDecisionLevel {
  switch (kind) {
    case 'readonly': return 'L0'
    case 'local_reversible': return 'L1'
    case 'write_execute_external': return 'L2'
    case 'irreversible_sensitive': return 'L3'
  }
}

function ruleMatches(rule: AutoDecisionRule, request: AutoDecisionRequest): boolean {
  if (rule.matchKind && rule.matchKind !== request.kind) return false
  if (rule.actionPrefix && !request.action.startsWith(rule.actionPrefix)) return false
  return true
}

/**
 * 核心：给定请求与设置，判定自动决策结果。纯函数、确定性、可单测。
 * 调用方负责把结果写 timeline（manager_auto_decision 事件）并真正执行/升级。
 */
export function decideAuto(request: AutoDecisionRequest, settings: AutoDecisionSettings): AutoDecisionResult {
  const level = classifyAutoDecisionLevel(request.kind)

  // L0 只读：始终自动，无需开启自动决策。
  if (level === 'L0') {
    return { level, outcome: 'auto_allow', basis: 'L0 只读动作，默认自动（不改状态）', revocable: true }
  }

  // 未开启自动决策：L1+ 一律升级用户。
  if (!settings.enabled) {
    return { level, outcome: 'escalate', basis: '未开启自动决策，关键动作交用户确认', revocable: level !== 'L3' }
  }

  // L3 不可逆/敏感：永远明确确认，规则也不能自动同意。
  if (level === 'L3') {
    return { level, outcome: 'escalate', basis: 'L3 不可逆/敏感，必须用户明确确认（规则不可自动同意）', revocable: false }
  }

  // L1：按偏好自动。
  if (level === 'L1') {
    if (settings.autoL1) {
      return { level, outcome: 'auto_allow', basis: 'L1 低风险本地，按用户偏好自动', revocable: true }
    }
    return { level, outcome: 'escalate', basis: 'L1 自动开关关闭，交用户确认', revocable: true }
  }

  // L2：必须有匹配规则授权（maxLevel 覆盖 L2）。
  const rule = settings.rules.find(candidate =>
    candidate.maxLevel === 'L2' && ruleMatches(candidate, request))
  if (rule) {
    return {
      level,
      outcome: rule.grants === 'allow' ? 'auto_allow' : 'auto_deny',
      basis: `命中预授权规则「${rule.id}」：${rule.reason}`,
      ruleId: rule.id,
      revocable: true,
    }
  }
  return { level, outcome: 'escalate', basis: 'L2 写入/执行/外发无规则授权，需用户确认', revocable: true }
}

/** 管理 Agent 决策记录（写 timeline / 回放用）。 */
export interface ManagerAutoDecisionRecord {
  decisionId: string
  request: AutoDecisionRequest
  result: AutoDecisionResult
  actor: ActorRef
  timestamp: number
}

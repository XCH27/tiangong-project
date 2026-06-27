import type {
  RoutingDecision,
  RoutingHint,
  ModelRoutingPrefs,
  TaskType,
} from './fusion-types.ts'
import type { AgentRole } from './budget-gatekeeper.ts'

export interface PolicyCheckResult {
  allowed: boolean
  overriddenDecision?: RoutingDecision
  reason?: string
  warning?: string
}

export interface HintValidationResult {
  valid: boolean
  reason?: string
}

export function enforceAgentPolicy(
  agentRole: AgentRole,
  decision: RoutingDecision,
  prefs: ModelRoutingPrefs,
): PolicyCheckResult {
  if (agentRole === 'manager') {
    return enforceManagerPolicy(decision)
  }

  if (agentRole === 'leader') {
    return enforceLeaderPolicy(decision, prefs)
  }

  return enforceExecutorPolicy(decision, prefs)
}

function enforceManagerPolicy(decision: RoutingDecision): PolicyCheckResult {
  if (decision.fusionMode !== 'none') {
    return {
      allowed: false,
      overriddenDecision: { ...decision, fusionMode: 'none' },
      reason: '管理 Agent 永不 Fusion（守门人不能是预算消费者）',
    }
  }
  return { allowed: true }
}

function enforceLeaderPolicy(
  decision: RoutingDecision,
  prefs: ModelRoutingPrefs,
): PolicyCheckResult {
  if (!prefs.agentPolicy.leader.allowFusion && decision.fusionMode !== 'none') {
    return {
      allowed: false,
      overriddenDecision: { ...decision, fusionMode: 'none' },
      reason: '队长 Fusion 已被策略禁用',
    }
  }

  let warning: string | undefined
  if (prefs.agentPolicy.leader.allowCli) {
    warning = '队长使用 CLI 将丢失 Fusion 能力（CLI 路径不可触发 Fusion）'
  }

  return { allowed: true, warning }
}

function enforceExecutorPolicy(
  decision: RoutingDecision,
  prefs: ModelRoutingPrefs,
): PolicyCheckResult {
  if (decision.fusionMode !== 'none') {
    if (prefs.fusion.scope === 'leader-only') {
      return {
        allowed: false,
        overriddenDecision: { ...decision, fusionMode: 'none' },
        reason: 'Fusion scope=leader-only：执行 Agent 不可自触发 Fusion',
      }
    }
  }

  return { allowed: true }
}

export function validateRoutingHint(
  hint: RoutingHint,
  agentRole: AgentRole,
  prefs: ModelRoutingPrefs,
): HintValidationResult {
  if (agentRole === 'manager') {
    if (hint.suggestFusion || hint.fusionForm) {
      return {
        valid: false,
        reason: '管理 Agent 永不 Fusion，routingHint 不可建议 Fusion',
      }
    }
    if (hint.preferredSurface === 'cli') {
      return {
        valid: false,
        reason: '管理 Agent 不可使用 CLI 路径',
      }
    }
  }

  if (agentRole === 'executor' && hint.suggestFusion) {
    if (prefs.fusion.scope === 'leader-only') {
      return {
        valid: false,
        reason: 'Fusion scope=leader-only：执行 Agent 不可接收 Fusion hint',
      }
    }
    if (prefs.fusion.enabled === 'off') {
      return {
        valid: false,
        reason: 'Fusion 全局关闭，不可建议 Fusion',
      }
    }
  }

  if (agentRole === 'leader' && hint.suggestFusion) {
    if (!prefs.agentPolicy.leader.allowFusion) {
      return {
        valid: false,
        reason: '队长 Fusion 已被策略禁用，hint 无效',
      }
    }
  }

  if (hint.budgetTokens !== undefined && hint.budgetTokens < 0) {
    return {
      valid: false,
      reason: 'budgetTokens 不可为负',
    }
  }

  if (hint.preferredSurface === 'cli' && agentRole === 'executor') {
    if (!prefs.agentPolicy.executor.allowCli) {
      return {
        valid: false,
        reason: '执行 Agent CLI 路径已被策略禁用',
      }
    }
  }

  if (hint.preferredSurface === 'cli' && agentRole === 'leader') {
    if (!prefs.agentPolicy.leader.allowCli) {
      return {
        valid: false,
        reason: '队长 CLI 路径已被策略禁用',
      }
    }
  }

  return { valid: true }
}

export function resolveExecutorSurface(
  taskType: TaskType,
  prefs: ModelRoutingPrefs,
): 'api' | 'cli' {
  const override = prefs.agentPolicy.executor.surfaceByTaskType?.[taskType]
  if (override) return override
  return 'api'
}

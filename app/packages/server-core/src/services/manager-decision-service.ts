/**
 * ManagerDecisionService —— 管理 Agent 分级自动决策（D12 / docs/17 §4）的落地包装。
 *
 * 纯判定逻辑在 `@craft-agent/shared/protocol` 的 `decideAuto`（可单测）；本服务只负责
 * 设置持久化（`<workspace>/.fleet/manager-decision.json`）+ 生成可写 timeline 的决策记录。
 * 不绕过 permission：`escalate` 的结果仍走 craft permission，由调用方处理。
 */

import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  decideAuto,
  DEFAULT_AUTO_DECISION_SETTINGS,
  type ActorRef,
  type AutoDecisionRequest,
  type AutoDecisionResult,
  type AutoDecisionSettings,
  type ManagerAutoDecisionRecord,
} from '@craft-agent/shared/protocol'

const STORE_RELATIVE_PATH = '.fleet/manager-decision.json'

/**
 * 权限请求 → 自动决策落点（纯函数，可单测）。用于 `requestWorkflowPermission` 拦截。
 * 安全边界：`team:` 动作交回原流程（由 TeamCoordinator 分级）；未开启 → prompt；
 * 只在显式 L2 规则匹配时 allow/deny，否则 prompt。L3 永不在此 allow（craft 权限类型按 L2 处理，仍需规则）。
 */
export function permissionAutoOutcome(toolName: string, settings: AutoDecisionSettings): 'allow' | 'deny' | 'prompt' {
  if (toolName.startsWith('team:')) return 'prompt'
  if (!settings.enabled) return 'prompt'
  const { outcome } = decideAuto({ kind: 'write_execute_external', action: toolName, sessionId: '' }, settings)
  if (outcome === 'auto_allow') return 'allow'
  if (outcome === 'auto_deny') return 'deny'
  return 'prompt'
}

export interface ManagerDecisionEventPayload {
  type: 'manager_auto_decision'
  sessionId: string
  decisionId: string
  level: string
  outcome: string
  basis: string
  ruleId?: string
  revocable: boolean
  action: string
  timestamp: number
}

export class ManagerDecisionService {
  readonly path: string

  constructor(workspaceRoot: string) {
    this.path = join(workspaceRoot, STORE_RELATIVE_PATH)
  }

  getSettings(): AutoDecisionSettings {
    if (!existsSync(this.path)) return { ...DEFAULT_AUTO_DECISION_SETTINGS }
    try {
      const parsed = JSON.parse(readFileSync(this.path, 'utf8')) as Partial<AutoDecisionSettings>
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : false,
        autoL1: typeof parsed.autoL1 === 'boolean' ? parsed.autoL1 : true,
        rules: Array.isArray(parsed.rules) ? parsed.rules.filter(isRule) : [],
      }
    } catch {
      return { ...DEFAULT_AUTO_DECISION_SETTINGS }
    }
  }

  updateSettings(patch: Partial<AutoDecisionSettings>): AutoDecisionSettings {
    const next: AutoDecisionSettings = { ...this.getSettings(), ...patch }
    mkdirSync(dirname(this.path), { recursive: true })
    const tempPath = `${this.path}.${process.pid}.tmp`
    try {
      writeFileSync(tempPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
      renameSync(tempPath, this.path)
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath)
      throw error
    }
    return next
  }

  /** 判定 + 生成可写 timeline 的记录。escalate 仍需调用方走 permission。 */
  decide(request: AutoDecisionRequest, actor: ActorRef): { result: AutoDecisionResult; record: ManagerAutoDecisionRecord } {
    const result = decideAuto(request, this.getSettings())
    const record: ManagerAutoDecisionRecord = {
      decisionId: randomUUID(),
      request,
      result,
      actor,
      timestamp: Date.now(),
    }
    return { result, record }
  }

  /** 记录 → SessionEvent 载荷（写 timeline 用）。 */
  static toEventPayload(record: ManagerAutoDecisionRecord): ManagerDecisionEventPayload {
    return {
      type: 'manager_auto_decision',
      sessionId: record.request.sessionId,
      decisionId: record.decisionId,
      level: record.result.level,
      outcome: record.result.outcome,
      basis: record.result.basis,
      ruleId: record.result.ruleId,
      revocable: record.result.revocable,
      action: record.request.action,
      timestamp: record.timestamp,
    }
  }
}

function isRule(value: unknown): boolean {
  return typeof value === 'object' && value !== null
    && typeof (value as { id?: unknown }).id === 'string'
    && ((value as { grants?: unknown }).grants === 'allow' || (value as { grants?: unknown }).grants === 'deny')
}

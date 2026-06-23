/**
 * 用量视图构建（docs/16 §2.2）。把会话的真实 token 占用 + 模型窗口 + 运行方式，
 * 组成 Token 环点击弹层要的 `SessionUsageView`。诚实分级：拿不到就标 unknown，不编造。
 *
 * 纯函数 `buildSessionUsageView` 可单测；SessionManager 负责喂真实数字。
 */

import {
  computeContextUsage,
  unavailablePlanUsage,
  type SessionUsageView,
  type UsageRuntimeKind,
  type ContextSegment,
  type PlanUsage,
} from '@craft-agent/shared/protocol'

export interface SessionUsageInputs {
  sessionId: string
  runtime: UsageRuntimeKind
  modelLabel: string
  /** 当前上下文占用 tokens（real）。 */
  usedTokens: number
  /** 模型上下文窗口；CLI 由 CLI 管理 → null。 */
  contextWindow: number | null
  /** 可选分段（未细分时省略）。 */
  segments?: ContextSegment[]
  /** 套餐额度（默认不可用；接入 provider 额度后再传真实数据）。 */
  plan?: PlanUsage
}

const CLI_PLAN_REASON = '本机 CLI 用量/额度由 CLI 自己的登录态管理，Fleet 不读取'
const API_PLAN_REASON = '该 provider 未向 Fleet 暴露订阅额度接口'

export function buildSessionUsageView(input: SessionUsageInputs): SessionUsageView {
  const context = computeContextUsage({
    usedTokens: input.usedTokens,
    contextWindow: input.contextWindow,
    segments: input.segments,
  })
  const plan = input.plan
    ?? unavailablePlanUsage(input.runtime === 'cli' ? CLI_PLAN_REASON : API_PLAN_REASON)
  return {
    sessionId: input.sessionId,
    runtime: input.runtime,
    modelLabel: input.modelLabel,
    context,
    plan,
  }
}

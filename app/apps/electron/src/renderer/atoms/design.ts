/**
 * Fleet 工作台渲染端动作状态（T-ENGINE 接线）。
 *
 * `design_*` / `selection_changed` 事件和别的 SessionEvent 走同一条 `session:event`
 * 通道，渲染端经 `onSessionEvent` 统一收。这里把它们收敛成：
 * - 当前选区（`designLatestSelectionAtom`）—— 喂 Inspector。
 * - 最近动作流（`designTickerAtom`）—— 喂底部 Action Ticker（人和 Agent 的真实操作）。
 *
 * 还提供 `designClient`：人类 UI 触发动作的入口，和 AI 工具走同一组 RPC channel、
 * 同一个引擎（没有第二条写入路径）。
 */

import { atom } from 'jotai'
import type { SessionEvent, DesignSelection, ActorRef } from '@craft-agent/shared/protocol'

export type DesignTickerKind = 'selection' | 'proposed' | 'committed' | 'rolled_back' | 'tool'

export interface DesignTickerEntry {
  id: string
  ts: number
  kind: DesignTickerKind
  /** 'user' → '我'；否则 Agent 显示名/角色。 */
  actorLabel: string
  summary: string
}

/** 当前选区（最近一次 selection_changed）。Inspector 选区/属性 tab 读它。 */
export const designLatestSelectionAtom = atom<DesignSelection | null>(null)

/** 最近的动作事件流（capped）。Action Ticker 读它。 */
export const designTickerAtom = atom<DesignTickerEntry[]>([])

export const DESIGN_TICKER_MAX = 50

export function designActorLabel(actor?: ActorRef): string {
  if (!actor || actor.kind === 'user') return '我'
  return actor.displayName || actor.role || actor.agentId || 'Agent'
}

/** 把 design_* / selection_changed / tool_start 事件映射成 ticker 条目；其它返回 null。 */
export function mapDesignEventToEntry(event: SessionEvent): DesignTickerEntry | null {
  const ts = Date.now()
  const id = `de-${ts}-${(globalThis.crypto?.randomUUID?.() ?? String(Math.random())).slice(0, 8)}`
  switch (event.type) {
    case 'selection_changed':
      return { id, ts, kind: 'selection', actorLabel: designActorLabel(event.selection.createdBy), summary: `选择 ${event.selection.objects.length} 个对象` }
    case 'design_action_proposed':
      return { id, ts, kind: 'proposed', actorLabel: designActorLabel(event.action.actor), summary: `提案 ${event.action.op.kind}` }
    case 'design_patch_committed':
      return { id, ts, kind: 'committed', actorLabel: designActorLabel(event.actor), summary: '提交补丁' }
    case 'design_patch_rolled_back':
      return { id, ts, kind: 'rolled_back', actorLabel: designActorLabel(event.actor), summary: '回滚补丁' }
    case 'tool_start':
      // Agent 工具调用也是"动作"。actor 未填时默认 Agent（工具调用本就是 Agent 发起）；
      // T-EVENT-ACTOR 已在 emit 点带上 actor（kind:'agent' + runtime），M1 再精确到具体 Agent。
      return {
        id,
        ts,
        kind: 'tool',
        actorLabel: event.actor ? designActorLabel(event.actor) : 'Agent',
        summary: `调用 ${event.toolDisplayName || event.toolName}`,
      }
    default:
      return null
  }
}

/**
 * 人类 UI 触发动作的入口。和 AI 工具走同一组 `RPC_CHANNELS.design` channel、同一引擎。
 * （Inspector 的"动作"按钮、未来浏览器选择都经这里。）
 */
export const designClient = {
  setSelection: (input: import('@craft-agent/shared/protocol').SetSelectionInput) => window.electronAPI.setDesignSelection(input),
  getSelection: (sessionId: string) => window.electronAPI.getDesignSelection(sessionId),
  proposeAction: (input: import('@craft-agent/shared/protocol').ProposeActionInput) => window.electronAPI.proposeDesignAction(input),
  commitPatch: (input: import('@craft-agent/shared/protocol').CommitPatchInput) => window.electronAPI.commitDesignPatch(input),
  rollbackPatch: (input: import('@craft-agent/shared/protocol').RollbackPatchInput) => window.electronAPI.rollbackDesignPatch(input),
}

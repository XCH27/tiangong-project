/**
 * plan-fusion-executor faux 单测（零网络）
 *
 * 断言：
 * - actionPlan steps 被正确转成 DesignAction / ActionInvocation
 * - actionDefinitionId 优先走 internal action 路径
 * - 无 actionDefinitionId 走 design action 路径
 * - 无法识别的 step 记 error 但不中断
 * - 执行异常被捕获进 errors
 */

import { describe, it, expect, mock } from 'bun:test'
import { executePlanFusion, parseActionPlan } from '../plan-fusion-executor.ts'
import type { PlanExecutionDeps } from '../plan-fusion-executor.ts'
import type { DesignAction, ActionInvocation, ActorRef } from '@craft-agent/shared/protocol'
import type { FusionResult } from '../fusion-types.ts'

const SESSION = 'session-plan-1'
const ACTOR: ActorRef = { kind: 'agent', agentId: 'agent-fusion-writer', runtime: 'api', role: 'code', displayName: 'Fusion Writer' }

function makeFusionResult(actionPlan: unknown): FusionResult {
  return {
    finalAnswer: 'plan answer',
    actionPlan,
    panelResults: [],
    judgeAnalysis: { consensus: [], contradictions: [], partialCoverage: [], uniqueInsights: [], blindSpots: [], shouldFuse: true },
    totalTokens: 0,
    totalCostUsd: 0,
    cascadeUpgrades: 0,
  }
}

function makeDeps(overrides: Partial<PlanExecutionDeps> = {}): PlanExecutionDeps {
  return {
    sessionId: SESSION,
    actor: ACTOR,
    emitDesignAction: mock(async (_action: DesignAction) => ({ patchId: 'patch-1' })),
    invokeInternalAction: mock(async (_invocation: ActionInvocation) => ({ ok: true })),
    ...overrides,
  }
}

describe('parseActionPlan', () => {
  it('解析数组形态', () => {
    const steps = parseActionPlan([{ kind: 'set_style', props: { color: 'red' } }])
    expect(steps).toHaveLength(1)
    expect(steps[0].kind).toBe('set_style')
  })

  it('解析 { steps: [...] } 形态', () => {
    const steps = parseActionPlan({ steps: [{ kind: 'set_transform', x: 10 }] })
    expect(steps).toHaveLength(1)
    expect(steps[0].kind).toBe('set_transform')
  })

  it('解析 { actions: [...] } 形态', () => {
    const steps = parseActionPlan({ actions: [{ kind: 'annotate', messageId: 'm1', text: 'hi' }] })
    expect(steps).toHaveLength(1)
    expect(steps[0].kind).toBe('annotate')
  })

  it('null/undefined 返回空数组', () => {
    expect(parseActionPlan(null)).toEqual([])
    expect(parseActionPlan(undefined)).toEqual([])
  })

  it('无法识别形状返回空数组', () => {
    expect(parseActionPlan('just a string')).toEqual([])
    expect(parseActionPlan(42)).toEqual([])
  })
})

describe('executePlanFusion', () => {
  it('带 actionDefinitionId 的 step 走 internal action 路径', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([
        { actionDefinitionId: 'files.move_entry', contractVersion: 1, input: { fromPath: 'a', toPath: 'b' } },
      ]),
      deps,
    )

    expect(result.executedInternalActions).toHaveLength(1)
    expect(result.executedInternalActions[0].actionDefinitionId).toBe('files.move_entry')
    expect(result.executedDesignActions).toHaveLength(0)
    expect(result.results).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
  })

  it('无 actionDefinitionId 的 design step 走 design action 路径', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([
        { kind: 'set_style', selectionId: 'sel-1', props: { color: 'blue' } },
        { kind: 'set_transform', x: 10, y: 20 },
      ]),
      deps,
    )

    expect(result.executedDesignActions).toHaveLength(2)
    expect(result.executedDesignActions[0].op).toEqual({ kind: 'set_style', props: { color: 'blue' } })
    expect(result.executedDesignActions[0].selectionId).toBe('sel-1')
    expect(result.executedDesignActions[0].actor).toBe(ACTOR)
    expect(result.executedDesignActions[0].origin).toBe('agent_tool')
    expect(result.executedInternalActions).toHaveLength(0)
    expect(result.results).toHaveLength(2)
    expect(result.errors).toHaveLength(0)
  })

  it('design action 带 agentId（规则 15）', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([{ kind: 'set_style', props: {} }]),
      deps,
    )

    expect(result.executedDesignActions[0].actor.agentId).toBe('agent-fusion-writer')
    expect(result.executedDesignActions[0].actor.role).toBe('code')
  })

  it('无法识别的 step kind 记 error 但不中断', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([
        { kind: 'set_style', props: { color: 'red' } },
        { kind: 'totally_unknown_op' },
        { kind: 'insert_asset', assetId: 'asset-1' },
      ]),
      deps,
    )

    expect(result.executedDesignActions).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].index).toBe(1)
  })

  it('执行异常被捕获进 errors', async () => {
    const deps = makeDeps({
      emitDesignAction: mock(async () => { throw new Error('permission denied') }),
    })
    const result = await executePlanFusion(
      makeFusionResult([{ kind: 'set_style', props: {} }]),
      deps,
    )

    expect(result.executedDesignActions).toHaveLength(1)
    expect(result.results).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].error).toContain('permission denied')
  })

  it('internal action 执行异常被捕获', async () => {
    const deps = makeDeps({
      invokeInternalAction: mock(async () => { throw new Error('action not found') }),
    })
    const result = await executePlanFusion(
      makeFusionResult([
        { actionDefinitionId: 'files.move_entry', input: {} },
        { kind: 'set_style', props: {} },
      ]),
      deps,
    )

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].index).toBe(0)
    expect(result.errors[0].error).toContain('action not found')
    expect(result.executedDesignActions).toHaveLength(1)
  })

  it('空 actionPlan 返回空结果', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(makeFusionResult(null), deps)

    expect(result.executedDesignActions).toHaveLength(0)
    expect(result.executedInternalActions).toHaveLength(0)
    expect(result.results).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('annotate 缺 messageId 被跳过', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([
        { kind: 'annotate', text: 'hi' },
      ]),
      deps,
    )

    expect(result.executedDesignActions).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('混合 internal + design step', async () => {
    const deps = makeDeps()
    const result = await executePlanFusion(
      makeFusionResult([
        { actionDefinitionId: 'memory.add_entry', input: { partition: 'user', content: 'x' } },
        { kind: 'set_layout', reorder: ['a', 'b'] },
        { actionDefinitionId: 'files.select_entry', input: { path: 'a.txt' } },
        { kind: 'insert_asset', assetId: 'img-1' },
      ]),
      deps,
    )

    expect(result.executedInternalActions).toHaveLength(2)
    expect(result.executedDesignActions).toHaveLength(2)
    expect(result.results).toHaveLength(4)
    expect(result.errors).toHaveLength(0)
  })
})

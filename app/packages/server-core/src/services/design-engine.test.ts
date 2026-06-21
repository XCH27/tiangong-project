/**
 * 承重墙证明（docs/30 §11 / docs/31 S1）：
 * **人改一处、AI 改一处、都进同一条 timeline、都能撤销。**
 *
 * 验证统一动作引擎的硬规则：
 * - 人(human_ui) 和 AI(agent_tool) 走同一个 proposeAction，产同一种 patch。
 * - 人的写动作默认预授权(preview)，可直接 commit。
 * - Agent 的写动作默认 pending，未授权 commit 抛错；授权后才 commit。
 * - 每步发一个带 actor 的 SessionEvent，全部落在同一个 sessionId 的一条 timeline 上。
 * - 每个 committed patch 有 inverse，可 rollback（applier.revert 被调用）。
 */

import { describe, expect, it } from 'bun:test'
import type {
  SessionEvent,
  DesignAction,
  DesignSelection,
  DesignPatch,
} from '@craft-agent/shared/protocol'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import { DesignEngineService, type DesignPatchApplier } from './design-engine'

const SESSION = 'session-spine-1'

function makeSelection(): DesignSelection {
  return {
    selectionId: 'sel-1',
    sessionId: SESSION,
    objects: [{ type: 'design_node', surface: 'artifact', locator: { nodeId: 'node-1' } }],
    createdBy: USER_ACTOR,
  }
}

function humanAction(): DesignAction {
  return {
    actionId: 'act-human',
    sessionId: SESSION,
    selectionId: 'sel-1',
    actor: USER_ACTOR,
    op: { kind: 'set_style', props: { color: 'red' } },
    origin: 'human_ui',
  }
}

function agentAction(): DesignAction {
  return {
    actionId: 'act-agent',
    sessionId: SESSION,
    selectionId: 'sel-1',
    actor: { kind: 'agent', agentId: 'agent-design-1', runtime: 'api', role: 'design', displayName: '设计 Agent' },
    op: { kind: 'set_style', props: { color: 'blue' } },
    origin: 'agent_tool',
  }
}

/** 一个最小适配器：算 forward/inverse 并记录 apply/revert 调用（模拟原生引擎）。 */
function makeRecordingApplier() {
  const calls: Array<{ kind: 'apply' | 'revert'; patchId: string }> = []
  const applier: DesignPatchApplier = {
    preview: (action) => ({
      forward: { op: action.op },
      inverse: { restore: { color: 'inherit' } },
    }),
    apply: (patch) => {
      calls.push({ kind: 'apply', patchId: patch.patchId })
    },
    revert: (patch) => {
      calls.push({ kind: 'revert', patchId: patch.patchId })
    },
  }
  return { applier, calls }
}

function makeEngine(applier?: DesignPatchApplier) {
  const events: SessionEvent[] = []
  const engine = new DesignEngineService((e) => events.push(e), applier) // no persistence → in-memory ledger
  return { engine, events }
}

describe('DesignEngineService — 承重墙：一条 timeline，人机共编，可回滚', () => {
  it('setSelection 发 selection_changed 并可读回', async () => {
    const { engine, events } = makeEngine()
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })
    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe('selection_changed')
    const got = await engine.getSelection(SESSION)
    expect(got?.selectionId).toBe('sel-1')
  })

  it('人的写动作预授权 → preview → 直接 commit（不需 permissionGranted）', async () => {
    const { applier, calls } = makeRecordingApplier()
    const { engine, events } = makeEngine(applier)
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })

    const { patch, permission } = await engine.proposeAction({ sessionId: SESSION, action: humanAction() })
    expect(permission?.required).toBe(false)
    expect(patch.status).toBe('preview')

    const committed = await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(committed.patch.status).toBe('committed')
    expect(committed.patch.inverse).toBeDefined()
    expect(calls).toContainEqual({ kind: 'apply', patchId: patch.patchId })

    const committedEvent = events.find((e) => e.type === 'design_patch_committed')
    expect(committedEvent).toBeDefined()
    expect(committedEvent && 'actor' in committedEvent && committedEvent.actor.kind).toBe('user')
  })

  it('Agent 的写动作默认 pending → 未授权 commit 抛错 → 授权后 commit', async () => {
    const { engine } = makeEngine(makeRecordingApplier().applier)
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })

    const { patch, permission, permissionRequestId } = await engine.proposeAction({ sessionId: SESSION, action: agentAction() })
    expect(permission?.required).toBe(true)
    expect(permission?.level).toBe('L2')
    expect(patch.status).toBe('pending')
    expect(permissionRequestId).toBeDefined()

    await expect(engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })).rejects.toThrow(/requires permission/)

    const committed = await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId, permissionGranted: true })
    expect(committed.patch.status).toBe('committed')
  })

  it('L3 显式确认：即使人发起也 required（不能被预授权代答）', async () => {
    const { engine } = makeEngine()
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })
    const { permission, patch } = await engine.proposeAction({
      sessionId: SESSION,
      action: humanAction(),
      decision: { requiresExplicitConfirm: true },
    })
    expect(permission?.required).toBe(true)
    expect(permission?.level).toBe('L3')
    expect(permission?.requiresExplicitConfirm).toBe(true)
    expect(patch.status).toBe('pending')
  })

  it('committed patch 可 rollback：applier.revert 被调用并发 design_patch_rolled_back', async () => {
    const { applier, calls } = makeRecordingApplier()
    const { engine, events } = makeEngine(applier)
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })
    const { patch } = await engine.proposeAction({ sessionId: SESSION, action: humanAction() })
    await engine.commitPatch({ sessionId: SESSION, patchId: patch.patchId })

    const rolled = await engine.rollbackPatch({ sessionId: SESSION, patchId: patch.patchId })
    expect(rolled.patch.status).toBe('rolled_back')
    expect(calls).toContainEqual({ kind: 'revert', patchId: patch.patchId })
    expect(events.some((e) => e.type === 'design_patch_rolled_back')).toBe(true)
  })

  it('人改一处 + AI 改一处：两条动作都落在同一个 sessionId 的一条 timeline 上，actor 可分', async () => {
    const { engine, events } = makeEngine(makeRecordingApplier().applier)
    await engine.setSelection({ sessionId: SESSION, selection: makeSelection() })

    const human = await engine.proposeAction({ sessionId: SESSION, action: humanAction() })
    await engine.commitPatch({ sessionId: SESSION, patchId: human.patch.patchId })

    const agent = await engine.proposeAction({ sessionId: SESSION, action: agentAction() })
    await engine.commitPatch({ sessionId: SESSION, patchId: agent.patch.patchId, permissionGranted: true })

    // 一条 timeline：所有事件同一个 sessionId。
    expect(events.every((e) => e.sessionId === SESSION)).toBe(true)

    // 两个 committed，actor 一个 user 一个 agent —— 不混流。
    const commits = events.filter((e): e is Extract<SessionEvent, { type: 'design_patch_committed' }> => e.type === 'design_patch_committed')
    expect(commits).toHaveLength(2)
    const actorKinds = commits.map((e) => e.actor.kind).sort()
    expect(actorKinds).toEqual(['agent', 'user'])
    const agentCommit = commits.find((e) => e.actor.kind === 'agent')
    expect(agentCommit?.actor.agentId).toBe('agent-design-1')

    // 两个 committed patch 都带 inverse（可回滚）。
    for (const c of commits) {
      const patch = c.patch as DesignPatch
      expect(patch.inverse).toBeDefined()
    }
  })
})

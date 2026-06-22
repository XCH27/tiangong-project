/**
 * 承重墙证明（docs/33 §0）：团队编排核心。
 * 验证：投递≠运行、broadcast vs 私聊可见性、report→awaitingReview→待审队列派生、
 * 权限分级（agent autoRun 需授权）、成员对账、序号派生、leader 边界。
 */

import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, type ActorRef, type SessionEvent, type TeamRulesV1, type TeamRulesLoadResult } from '@craft-agent/shared/protocol'
import { TeamCoordinator, MemoryTeamStore, type TeamRuntime, type TeamRulesStore, type TeamSessionInfo } from './team-coordinator'

const AGENT_ACTOR: ActorRef = { kind: 'agent', agentId: 'agent-x', role: 'code', runtime: 'api' }

class MemoryRulesStore implements TeamRulesStore {
  rules: TeamRulesV1 | null = null
  load(): TeamRulesLoadResult {
    return { rules: this.rules, source: this.rules ? 'disk' : 'missing', path: '/mem/.fleet/team.rules.json' }
  }
  save(rules: TeamRulesV1): TeamRulesV1 {
    this.rules = structuredClone(rules)
    return this.rules
  }
  validate() {
    return { valid: true, errors: [] }
  }
}

function makeRuntime(initial: TeamSessionInfo[]) {
  const sessions = new Map(initial.map(s => [s.id, { ...s }]))
  const events: SessionEvent[] = []
  const turns: Array<{ sessionId: string; input: string }> = []
  let counter = 0
  const runtime: TeamRuntime = {
    emit: e => { events.push(e) },
    now: () => ++counter,
    newId: () => `id-${++counter}`,
    listSessions: () => [...sessions.values()].filter(s => !s.hidden),
    ensureTeamConversationSession: async existing => existing ?? 'team-conv',
    startTurn: async (sessionId, input) => { turns.push({ sessionId, input }) },
    setSessionStatus: async (sessionId, statusId) => {
      const s = sessions.get(sessionId)
      if (s) s.sessionStatus = statusId
    },
  }
  return { runtime, events, turns, sessions }
}

function make(initial: TeamSessionInfo[] = []) {
  const rules = new MemoryRulesStore()
  const store = new MemoryTeamStore()
  const rt = makeRuntime(initial)
  const coordinator = new TeamCoordinator(rules, rt.runtime, store)
  return { coordinator, rules, store, ...rt }
}

const member = (id: string, createdAt: number, status = 'todo'): TeamSessionInfo => ({ id, createdAt, sessionStatus: status })

describe('TeamCoordinator — 承重墙', () => {
  it('promoteTeamLeader：建团队、加成员、设队长、打 leader 标签、发 team_leader_changed', async () => {
    const { coordinator, rules, events } = make([member('m1', 100)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect(rules.rules?.leaderSessionId).toBe('m1')
    expect(rules.rules?.memberSessionIds).toContain('m1')
    expect(rules.rules?.identityAssignments['m1']).toContain('leader')
    expect(events.some(e => e.type === 'team_leader_changed')).toBe(true)
  })

  it('sendTeamMessage 广播：投递给除发送者外的全体成员，事件 visibility=broadcast', async () => {
    const { coordinator, store, events } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'sendTeamMessage', teamId: 'team-main', content: '全员注意' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect((await store.listInbox('m2')).some(i => i.kind === 'message')).toBe(true)
    expect(await store.listInbox('m1')).toEqual([]) // 发送者不收自己的广播
    const msg = events.find(e => e.type === 'team_message') as any
    expect(msg.visibility).toBe('broadcast')
  })

  it('sendTeamMessage @私聊：只投递给 audience，事件 visibility=private', async () => {
    const { coordinator, store, events } = make([member('m1', 100), member('m2', 200), member('m3', 300)])
    for (const id of ['m1', 'm2', 'm3']) {
      await coordinator.handleCommand({ type: 'changeTeamIdentityTag', teamId: 'team-main', targetSessionId: id, tagId: 'code', action: 'add' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    }
    await coordinator.handleCommand({ type: 'sendTeamMessage', teamId: 'team-main', content: '只给 m2', audienceSessionIds: ['m2'] }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect((await store.listInbox('m2')).length).toBe(1)
    expect(await store.listInbox('m3')).toEqual([])
    const msg = events.find(e => e.type === 'team_message') as any
    expect(msg.visibility).toBe('private')
    expect(msg.audienceSessionIds).toEqual(['m2'])
  })

  it('投递 ≠ 运行：无 autoRun 只入队+置 active，不启动 turn', async () => {
    const { coordinator, store, turns, sessions } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: '实现协议' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect((await store.listInbox('m2')).some(i => i.kind === 'task')).toBe(true)
    expect(sessions.get('m2')?.sessionStatus).toBe('todo') // statusMap.active = 'todo'
    expect(turns).toEqual([]) // 没有 autoRun → 不启动
  })

  it('autoRun dispatch（人发起）：启动一轮、event 带 runId', async () => {
    const { coordinator, turns, events } = make([member('m1', 100), member('m2', 200)])
    const result = await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: '跑测试', autoRun: true }, { issuerSessionId: 'm1', actor: USER_ACTOR }) as { runId?: string }
    expect(turns.length).toBe(1)
    expect(turns[0]?.sessionId).toBe('m2')
    expect(result.runId).toBeDefined()
    const assigned = events.find(e => e.type === 'team_task_assigned') as any
    expect(assigned.runId).toBeDefined()
  })

  it('权限分级：Agent autoRun 未授权抛错；授权后放行', async () => {
    const { coordinator, turns } = make([member('m1', 100), member('m2', 200)])
    await expect(coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR },
    )).rejects.toThrow(/L2/)
    expect(turns).toEqual([])
    await coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't2', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR, permissionGranted: true },
    )
    expect(turns.length).toBe(1)
  })

  it('submitTeamReport：存报告、置 awaitingReview、发 report_submitted + review_queued', async () => {
    const { coordinator, store, sessions, events } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'submitTeamReport', teamId: 'team-main', taskId: 't1', runId: 'r1', summary: '完成了' }, { issuerSessionId: 'm2', actor: USER_ACTOR })
    expect((await store.getLatestReport('m2'))?.summary).toBe('完成了')
    expect(sessions.get('m2')?.sessionStatus).toBe('needs-review') // statusMap.awaitingReview
    expect(events.some(e => e.type === 'team_report_submitted')).toBe(true)
    expect(events.some(e => e.type === 'team_review_queued')).toBe(true)
  })

  it('getReviewQueue：派生自 awaitingReview 成员 + 最新报告，按时间排序', async () => {
    const { coordinator } = make([member('m1', 100), member('m2', 200), member('m3', 300)])
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't2', assigneeSessionId: 'm2', title: 'a' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't3', assigneeSessionId: 'm3', title: 'b' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'submitTeamReport', teamId: 'team-main', taskId: 't2', runId: 'r2', summary: 'm2 done' }, { issuerSessionId: 'm2', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'submitTeamReport', teamId: 'team-main', taskId: 't3', runId: 'r3', summary: 'm3 done' }, { issuerSessionId: 'm3', actor: USER_ACTOR })
    const queue = await coordinator.getReviewQueue()
    expect(queue.map(q => q.reporterSessionId)).toEqual(['m2', 'm3'])
    expect(queue[0]?.queuePosition).toBe(0)
    expect(queue[1]?.queuePosition).toBe(1)
  })

  it('changeTeamIdentityTag：未知标签抛错；已知标签写入 assignment', async () => {
    const { coordinator, rules } = make([member('m1', 100)])
    await expect(coordinator.handleCommand(
      { type: 'changeTeamIdentityTag', teamId: 'team-main', targetSessionId: 'm1', tagId: 'nope', action: 'add' },
      { issuerSessionId: 'm1', actor: USER_ACTOR },
    )).rejects.toThrow(/未知身份标签/)
    await coordinator.handleCommand(
      { type: 'changeTeamIdentityTag', teamId: 'team-main', targetSessionId: 'm1', tagId: 'design', action: 'add' },
      { issuerSessionId: 'm1', actor: USER_ACTOR },
    )
    expect(rules.rules?.identityAssignments['m1']).toContain('design')
  })

  it('成员对账：会话消失则从规则剔除，队长失效则清空并发事件', async () => {
    const { coordinator, rules, sessions, events } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    sessions.delete('m1') // 队长会话被删
    const before = events.length
    const projection = await coordinator.getProjection()
    expect(projection?.leaderSessionId).toBeNull()
    expect(projection?.members.map(m => m.sessionId)).toEqual(['m2'])
    expect(events.slice(before).some(e => e.type === 'team_leader_changed')).toBe(true)
  })

  it('getProjection：成员序号按 createdAt 派生 G-01/G-02', async () => {
    const { coordinator } = make([member('mB', 200), member('mA', 100)])
    await coordinator.handleCommand({ type: 'changeTeamIdentityTag', teamId: 'team-main', targetSessionId: 'mB', tagId: 'code', action: 'add' }, { issuerSessionId: 'mB', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'changeTeamIdentityTag', teamId: 'team-main', targetSessionId: 'mA', tagId: 'code', action: 'add' }, { issuerSessionId: 'mA', actor: USER_ACTOR })
    const projection = await coordinator.getProjection()
    const seqBySession = Object.fromEntries((projection?.members ?? []).map(m => [m.sessionId, m.sequence]))
    expect(seqBySession['mA']).toBe('G-01') // createdAt 100 → 第一
    expect(seqBySession['mB']).toBe('G-02')
  })

  it('updateTeamRules：合并校验、发 team_rules_changed', async () => {
    const { coordinator, rules, events } = make([member('m1', 100)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'updateTeamRules', teamId: 'team-main', rules: { version: 1, teamId: 'team-main', norms: ['先说明再写文件'] } }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect(rules.rules?.norms).toEqual(['先说明再写文件'])
    expect(events.some(e => e.type === 'team_rules_changed')).toBe(true)
  })
})

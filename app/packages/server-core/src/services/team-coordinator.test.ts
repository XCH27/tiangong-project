/**
 * 承重墙证明（docs/33 §0）：团队编排核心。
 * 验证：投递≠运行、broadcast vs 私聊可见性、report→awaitingReview→待审队列派生、
 * 权限分级（agent autoRun 需授权）、成员对账、序号派生、leader 边界。
 * 身份/队长收敛到 craft 原标签后：promoteTeamLeader 走 setSessionLabels + 队长唯一性，
 * 成员身份从 session labels 派生，team rules 不再存 identityTags/identityAssignments（docs/33 §1.2）。
 */

import { describe, expect, it } from 'bun:test'
import { USER_ACTOR, decideAuto, type ActorRef, type SessionEvent, type TeamRulesV1, type TeamRulesLoadResult, type TeamIdentityLabel, type AutoDecisionRequest, type AutoDecisionResult, type AutoDecisionSettings, type ManagerAutoDecisionRecord } from '@craft-agent/shared/protocol'
import { LEADER_LABEL_ID, extractLabelId } from '@craft-agent/shared/labels'
import { TeamCoordinator, MemoryTeamStore, type TeamRuntime, type TeamRulesStore, type TeamSessionInfo, type TeamDecisionPort } from './team-coordinator'

const AGENT_ACTOR: ActorRef = { kind: 'agent', agentId: 'agent-x', role: 'code', runtime: 'api' }

const IDENTITY_CATALOG: TeamIdentityLabel[] = [
  { id: LEADER_LABEL_ID, displayName: '队长' },
  { id: 'code', displayName: '代码' },
  { id: 'design', displayName: '设计' },
  { id: 'review', displayName: '审查' },
  { id: 'test', displayName: '测试' },
  { id: 'context', displayName: '上下文' },
]

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
  const sessions = new Map(initial.map(s => [s.id, { ...s, labels: s.labels ?? [] }]))
  const events: SessionEvent[] = []
  const turns: Array<{ sessionId: string; input: string }> = []
  const permissionRequests: string[] = []
  let permissionAllowed = true
  let counter = 0
  const runtime: TeamRuntime = {
    recordEvent: async e => { events.push(e); return `event-${events.length}` },
    now: () => ++counter,
    newId: () => `id-${++counter}`,
    listSessions: () => [...sessions.values()].filter(s => !s.hidden),
    ensureTeamConversationSession: async existing => existing ?? 'team-conv',
    ensureManagerProjectionSession: async existing => existing ?? 'manager-projection',
    startTurn: async (sessionId, input) => { turns.push({ sessionId, input }) },
    setSessionStatus: async (sessionId, statusId) => {
      const s = sessions.get(sessionId)
      if (s) s.sessionStatus = statusId
    },
    getSessionLabels: sessionId => sessions.get(sessionId)?.labels ?? [],
    // 镜像 SessionManager.setSessionLabels 的队长唯一性：加 leader 标签时剔除其它会话的 leader。
    setSessionLabels: async (sessionId, labels) => {
      const target = sessions.get(sessionId)
      if (!target) return
      if (labels.some(label => extractLabelId(label) === LEADER_LABEL_ID)) {
        for (const other of sessions.values()) {
          if (other.id === sessionId) continue
          other.labels = (other.labels ?? []).filter(label => extractLabelId(label) !== LEADER_LABEL_ID)
        }
      }
      target.labels = labels
    },
    listIdentityLabels: () => IDENTITY_CATALOG,
    requestPermission: async (_sessionId, input) => {
      permissionRequests.push(input.toolName)
      return permissionAllowed
    },
    getLatestReport: async sessionId => {
      const event = [...events].reverse().find(candidate => candidate.type === 'team_report_submitted' && candidate.sessionId === sessionId)
      if (!event || event.type !== 'team_report_submitted') return null
      return {
        reportId: event.reportId,
        taskId: event.taskId,
        runId: event.runId,
        reporterSessionId: event.reporterSessionId,
        summary: event.summary,
        artifactPaths: event.artifactPaths,
        createdAt: event.timestamp,
      }
    },
    resolveInbox: async items => items.map(item => `${item.kind}:${item.sourceMessageId}`).join('\n'),
  }
  return { runtime, events, turns, sessions, permissionRequests, setPermissionAllowed: (allowed: boolean) => { permissionAllowed = allowed } }
}

function make(initial: TeamSessionInfo[] = [], decisionService?: TeamDecisionPort) {
  const rules = new MemoryRulesStore()
  const store = new MemoryTeamStore()
  const rt = makeRuntime(initial)
  const coordinator = new TeamCoordinator(rules, rt.runtime, store, decisionService)
  return { coordinator, rules, store, ...rt }
}

/** 直接种入团队规则（用于只验证派生/可见性、不想触发 assignTask 收件箱副作用的用例）。 */
function seedRules(rules: MemoryRulesStore, memberSessionIds: string[], leaderSessionId: string | null = null): void {
  rules.rules = {
    version: 1,
    teamId: 'team-main',
    teamConversationSessionId: 'team-conv',
    managerProjectionSessionId: 'manager-projection',
    leaderSessionId,
    memberSessionIds,
    statusMap: { unassigned: 'backlog', active: 'todo', awaitingReview: 'needs-review', done: 'done', cancelled: 'cancelled' },
    routing: { mentionPrefix: '@', commandPrefix: '/', defaultVisibility: 'broadcast' },
    taskPolicy: { requireTaskIdForAssignment: true, requireRunIdForReport: true, queueLatestStructuredReport: true },
    managerContextPolicy: { userPreferenceInjection: 'leaderOnly', crossProjectRecordInjection: 'off', deepMemberContextRequiresPermission: true },
    norms: [],
  }
}

const member = (id: string, createdAt: number, status = 'todo'): TeamSessionInfo => ({ id, createdAt, sessionStatus: status })

describe('TeamCoordinator — 承重墙', () => {
  it('promoteTeamLeader：建团队、加成员、设队长、打 leader 标签、发 team_leader_changed', async () => {
    const { coordinator, rules, sessions, events } = make([member('m1', 100)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect(rules.rules?.leaderSessionId).toBe('m1')
    expect(rules.rules?.memberSessionIds).toContain('m1')
    // 身份真相在 session labels，不在 team rules。
    expect(sessions.get('m1')?.labels).toContain('leader')
    expect(events.some(e => e.type === 'team_leader_changed')).toBe(true)
  })

  it('promoteTeamLeader 换队长：原子移除旧队长 leader 标签（队长唯一性）', async () => {
    const { coordinator, rules, sessions } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm1' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'promoteTeamLeader', teamId: 'team-main', leaderSessionId: 'm2' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    expect(sessions.get('m1')?.labels).not.toContain('leader')
    expect(sessions.get('m2')?.labels).toContain('leader')
    expect(rules.rules?.leaderSessionId).toBe('m2')
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
    const { coordinator, rules, store, events } = make([member('m1', 100), member('m2', 200), member('m3', 300)])
    seedRules(rules, ['m1', 'm2', 'm3']) // 直接种成员，避免 assignTask 收件箱副作用
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
    const { coordinator, turns, events, permissionRequests } = make([member('m1', 100), member('m2', 200)])
    const result = await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: '跑测试', autoRun: true }, { issuerSessionId: 'm1', actor: USER_ACTOR }) as { runId?: string }
    expect(turns.length).toBe(1)
    expect(turns[0]?.sessionId).toBe('m2')
    expect(result.runId).toBeDefined()
    const assigned = events.find(e => e.type === 'team_task_assigned') as any
    expect(assigned.runId).toBeDefined()
    expect(permissionRequests).toEqual(['team:assignTeamTask'])
  })

  it('权限分级：Agent autoRun 未授权抛错；授权后放行', async () => {
    const { coordinator, turns, setPermissionAllowed } = make([member('m1', 100), member('m2', 200)])
    setPermissionAllowed(false)
    await expect(coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR },
    )).rejects.toThrow(/L2/)
    expect(turns).toEqual([])
    setPermissionAllowed(true)
    await coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't2', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR, permissionGranted: true },
    )
    expect(turns.length).toBe(1)
  })

  it('submitTeamReport：写持久事件、置 awaitingReview、无队长时排给管理 Agent', async () => {
    const { coordinator, sessions, events } = make([member('m1', 100), member('m2', 200)])
    await coordinator.handleCommand({ type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x' }, { issuerSessionId: 'm1', actor: USER_ACTOR })
    await coordinator.handleCommand({ type: 'submitTeamReport', teamId: 'team-main', taskId: 't1', runId: 'r1', summary: '完成了' }, { issuerSessionId: 'm2', actor: USER_ACTOR })
    expect(sessions.get('m2')?.sessionStatus).toBe('needs-review') // statusMap.awaitingReview
    const report = events.find(e => e.type === 'team_report_submitted')
    expect(report?.type === 'team_report_submitted' ? report.summary : undefined).toBe('完成了')
    const queued = events.find(e => e.type === 'team_review_queued')
    expect(queued?.type === 'team_review_queued' ? queued.targetReviewerSessionId : undefined).toBe('manager-projection')
  })

  it('submitTeamReport：拒绝不存在的汇报会话', async () => {
    const { coordinator } = make([member('m1', 100)])
    await expect(coordinator.handleCommand(
      { type: 'submitTeamReport', teamId: 'team-main', taskId: 't1', runId: 'r1', summary: '伪造汇报' },
      { issuerSessionId: 'missing', actor: AGENT_ACTOR },
    )).rejects.toThrow(/不存在的会话/)
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

  it('身份从 session labels 派生：projection.identityLabelIds 反映已应用标签', async () => {
    const { coordinator, rules, sessions } = make([member('m1', 100), member('m2', 200)])
    seedRules(rules, ['m1', 'm2'])
    sessions.get('m2')!.labels = ['design', 'priority::2'] // design 是 identity 标签，priority 不是
    const projection = await coordinator.getProjection()
    const m2 = projection?.members.find(m => m.sessionId === 'm2')
    expect(m2?.identityLabelIds).toEqual(['design'])
    expect(projection?.identityLabels.map(l => l.id)).toContain('design')
  })

  it('成员对账：会话消失则从规则剔除，队长失效则清空并发事件', async () => {
    const { coordinator, sessions, events } = make([member('m1', 100), member('m2', 200)])
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
    const { coordinator, rules } = make([member('mB', 200), member('mA', 100)])
    seedRules(rules, ['mB', 'mA'])
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
    expect(rules.rules?.managerProjectionSessionId).toBe('manager-projection')
  })
})

const AGENT_ACTOR_X: ActorRef = { kind: 'agent', agentId: 'agent-y', role: 'code', runtime: 'api' }

function decisionPort(settings: AutoDecisionSettings): TeamDecisionPort {
  return {
    getSettings: () => settings,
    decide: (request: AutoDecisionRequest, actor: ActorRef): { result: AutoDecisionResult; record: ManagerAutoDecisionRecord } => {
      const result = decideAuto(request, settings)
      return { result, record: { decisionId: 'd1', request, result, actor, timestamp: 1 } }
    },
  }
}

describe('TeamCoordinator — 分级自动决策（D12）', () => {
  it('开启 + L2 allow 规则：agent autoRun 自动放行（不弹权限）+ 写 manager_auto_decision', async () => {
    const settings: AutoDecisionSettings = {
      enabled: true, autoL1: true,
      rules: [{ id: 'team-tasks', matchKind: 'write_execute_external', actionPrefix: 'team:assignTeamTask', grants: 'allow', maxLevel: 'L2', reason: '项目规则允许派任务' }],
    }
    const { coordinator, turns, events, permissionRequests } = make([member('m1', 100), member('m2', 200)], decisionPort(settings))
    await coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR_X },
    )
    expect(turns.length).toBe(1) // 放行并运行
    expect(permissionRequests).toEqual([]) // 没弹权限
    expect(events.some(e => e.type === 'manager_auto_decision')).toBe(true)
  })

  it('开启但无规则：L2 升级 → 仍走人工权限（不绕过 permission）', async () => {
    const settings: AutoDecisionSettings = { enabled: true, autoL1: true, rules: [] }
    const { coordinator, turns, permissionRequests } = make([member('m1', 100), member('m2', 200)], decisionPort(settings))
    await coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR_X },
    )
    expect(permissionRequests).toEqual(['team:assignTeamTask']) // 升级到人工
    expect(turns.length).toBe(1) // 权限默认允许 → 放行运行
  })

  it('未开启自动决策：行为不变（L2 仍需权限）', async () => {
    const settings: AutoDecisionSettings = { enabled: false, autoL1: true, rules: [] }
    const { coordinator, turns, permissionRequests, setPermissionAllowed } = make([member('m1', 100), member('m2', 200)], decisionPort(settings))
    setPermissionAllowed(false)
    await expect(coordinator.handleCommand(
      { type: 'assignTeamTask', teamId: 'team-main', taskId: 't1', assigneeSessionId: 'm2', title: 'x', autoRun: true },
      { issuerSessionId: 'm1', actor: AGENT_ACTOR_X },
    )).rejects.toThrow()
    expect(turns).toEqual([])
    expect(permissionRequests).toEqual(['team:assignTeamTask'])
  })
})

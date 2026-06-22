/**
 * TeamCoordinator —— 团队编排脊柱业务（承重墙 · 最难、最易返工，docs/33 §0）。
 *
 * 一句话：人/AI 的团队动作（提升队长 / 发消息 / 派任务 / 汇报 / 改身份 / 改规则）都经
 * 唯一 `handleCommand`，过权限分级，写 craft `SessionEvent` 进**同一条 timeline**，
 * 规则落 `.fleet/team.rules.json`，**不建第二套 session/team/store**。
 *
 * 设计纪律：
 * - **投递 ≠ 运行**：发消息/不带 autoRun 的派任务 = 入队收件箱 + 写 transcript（L1，不启动 agent）；
 *   `assignTeamTask.autoRun` = 在 assignee 会话启动一轮（L2，过 permission）。
 * - **待审队列派生**：扫 awaitingReview 成员 + 各自最新报告实时算，不持久化队列。
 * - **成员序号派生**：按 session createdAt 排名算 G-01/G-02，不写回。
 * - **成员对账**：每次操作前把不存在的会话/队长从规则里剔除（lazy reconcile）。
 * - **管理 Agent**：软件级单一身份 `manager:global`；无队长时待审排给它；只代答 L0/L1。
 * - **队长边界**：分派/规范/汇总/请求审查；不能绕 permission、不批 L3、不改全局。
 *
 * 纯编排：所有 craft 耦合经注入的 `TeamRuntime` 端口，便于单测（注入 mock runtime + MemoryTeamStore）。
 */

import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  type ActorRef,
  type SessionEvent,
  type TeamSessionCommand,
  type TeamRulesV1,
  type TeamRulesPatch,
  type TeamRulesLoadResult,
  type TeamRulesValidationResult,
  type TeamInboxItem,
  type TeamProjection,
  type TeamMemberProjection,
  type TeamReviewQueueItem,
  type TeamReport,
  normalizeTeamManagerContextPolicy,
  normalizeTeamStatusMap,
  TEAM_DEFAULT_IDENTITY_TAGS,
} from '@craft-agent/shared/protocol'
import { TeamRulesService } from './team-rules-service'
import { FileTeamStore, MemoryTeamStore, type TeamStore } from './team-store'

/** 软件级管理 Agent 身份（单一，跨 workspace 投影）。 */
export const MANAGER_ACTOR: ActorRef = {
  kind: 'agent',
  agentId: 'manager:global',
  role: 'manager',
  displayName: '管理 Agent',
}

const DEFAULT_TEAM_ID = 'team-main'

export interface TeamSessionInfo {
  id: string
  createdAt: number
  sessionStatus?: string
  hidden?: boolean
  name?: string
}

/** craft 耦合端口：协调器只通过它触达 SessionManager 能力。 */
export interface TeamRuntime {
  recordEvent(event: SessionEvent): Promise<string>
  now(): number
  newId(): string
  /** 当前 workspace 的可见（非 hidden）会话，用于成员/fanout/派生。 */
  listSessions(): TeamSessionInfo[]
  /** 确保团队群聊 hidden 会话存在；existingId 仍有效则复用。 */
  ensureTeamConversationSession(existingId: string | null): Promise<string>
  ensureManagerProjectionSession(existingId: string | null): Promise<string>
  /** 在某会话启动一轮执行（autoRun dispatch）。 */
  startTurn(sessionId: string, input: string): Promise<void>
  /** 改会话状态（团队语义 → craft status id）。 */
  setSessionStatus(sessionId: string, statusId: string): Promise<void>
  requestPermission(
    sessionId: string,
    input: { toolName: string; description: string; type: 'file_write' | 'mcp_mutation' | 'api_mutation'; reason?: string },
  ): Promise<boolean>
  getLatestReport(sessionId: string): Promise<TeamReport | null>
  resolveInbox(items: TeamInboxItem[]): Promise<string>
}

/** 规则存储端口（TeamRulesService 结构上满足；测试可注入内存实现）。 */
export interface TeamRulesStore {
  load(): TeamRulesLoadResult
  save(rules: TeamRulesV1): TeamRulesV1
  validate(value: unknown): TeamRulesValidationResult
}

export type TeamPermissionLevel = 'L1' | 'L2' | 'L3'

export interface TeamCommandContext {
  /** 发起命令的会话（汇报人/上下文）。 */
  issuerSessionId: string
  /** 谁发起（RPC=人；session 工具=agent）。 */
  actor: ActorRef
  /** agent 的 L2 预授权标记（人类点击=已授权，无需此项）。 */
  permissionGranted?: boolean
  /** L3 明确确认。 */
  confirmed?: boolean
}

export function requiredTeamPermissionLevel(command: TeamSessionCommand): TeamPermissionLevel {
  switch (command.type) {
    case 'assignTeamTask':
      return command.autoRun ? 'L2' : 'L1'
    case 'updateTeamRules':
      return 'L2'
    default:
      return 'L1'
  }
}

export class TeamCoordinator {
  constructor(
    private readonly rules: TeamRulesStore,
    private readonly runtime: TeamRuntime,
    private readonly store: TeamStore,
  ) {}

  // ---- 命令入口（唯一写路径）---------------------------------------------

  async handleCommand(command: TeamSessionCommand, ctx: TeamCommandContext): Promise<unknown> {
    await this.enforcePermission(command, ctx)
    switch (command.type) {
      case 'promoteTeamLeader':
        return this.promoteLeader(command, ctx)
      case 'sendTeamMessage':
        return this.sendMessage(command, ctx)
      case 'assignTeamTask':
        return this.assignTask(command, ctx)
      case 'submitTeamReport':
        return this.submitReport(command, ctx)
      case 'changeTeamIdentityTag':
        return this.changeIdentity(command, ctx)
      case 'updateTeamRules':
        return this.updateRules(command, ctx)
      default: {
        const _exhaustive: never = command
        throw new Error(`Unknown team command: ${JSON.stringify(_exhaustive)}`)
      }
    }
  }

  private async enforcePermission(command: TeamSessionCommand, ctx: TeamCommandContext): Promise<void> {
    const level = requiredTeamPermissionLevel(command)
    if (level === 'L1' || ctx.permissionGranted || (level === 'L3' && ctx.confirmed)) return
    const allowed = await this.runtime.requestPermission(ctx.issuerSessionId, {
      toolName: `team:${command.type}`,
      description: level === 'L3'
        ? `确认执行敏感团队动作：${command.type}`
        : `确认执行团队写入动作：${command.type}`,
      type: 'mcp_mutation',
      reason: `团队权限等级 ${level}`,
    })
    if (!allowed) throw new Error(`团队动作 ${command.type} 未获授权（${level}）`)
  }

  // ---- 各命令 ------------------------------------------------------------

  private async promoteLeader(
    command: Extract<TeamSessionCommand, { type: 'promoteTeamLeader' }>,
    ctx: TeamCommandContext,
  ): Promise<TeamProjection> {
    const rules = await this.ensureRules(command.teamId)
    const previous = rules.leaderSessionId
    const next = command.leaderSessionId

    if (next) {
      if (!this.runtime.listSessions().some(session => session.id === next)) {
        throw new Error(`无法提升不存在的会话为队长: ${next}`)
      }
      if (!rules.memberSessionIds.includes(next)) rules.memberSessionIds.push(next)
      this.addTag(rules, next, 'leader')
    }
    if (previous && previous !== next) this.removeTag(rules, previous, 'leader')
    rules.leaderSessionId = next
    this.rules.save(rules)

    await this.runtime.recordEvent(this.teamEvent(rules, rules.teamConversationSessionId, ctx.actor, {
      type: 'team_leader_changed',
      leaderSessionId: next,
      previousLeaderSessionId: previous,
    }))
    return this.projectionFrom(rules)
  }

  private async sendMessage(
    command: Extract<TeamSessionCommand, { type: 'sendTeamMessage' }>,
    ctx: TeamCommandContext,
  ): Promise<{ messageId: string }> {
    const rules = await this.ensureRules(command.teamId)
    const visibility = command.audienceSessionIds && command.audienceSessionIds.length > 0 ? 'private' : 'broadcast'
    const recipients = visibility === 'private'
      ? (command.audienceSessionIds ?? []).filter(id => rules.memberSessionIds.includes(id))
      : rules.memberSessionIds.filter(id => id !== ctx.issuerSessionId)
    if (visibility === 'private' && recipients.length !== command.audienceSessionIds?.length) {
      throw new Error('私聊目标包含不存在或不属于当前团队的会话')
    }
    const messageId = this.runtime.newId()
    const createdAt = this.runtime.now()

    const sourceMessageId = await this.runtime.recordEvent(this.teamEvent(rules, rules.teamConversationSessionId, ctx.actor, {
      type: 'team_message',
      messageId,
      content: command.content,
      visibility,
      audienceSessionIds: visibility === 'private' ? recipients : undefined,
      taskId: command.taskId,
      runId: command.runId,
      delivery: 'queued',
    }))

    for (const recipient of recipients) {
      await this.store.enqueueInbox({
        id: this.runtime.newId(),
        sessionId: recipient,
        kind: 'message',
        fromActor: ctx.actor,
        sourceSessionId: rules.teamConversationSessionId,
        sourceMessageId,
        taskId: command.taskId,
        runId: command.runId,
        visibility,
        createdAt,
      })
    }

    return { messageId }
  }

  private async assignTask(
    command: Extract<TeamSessionCommand, { type: 'assignTeamTask' }>,
    _ctx: TeamCommandContext,
  ): Promise<{ taskId: string; runId?: string }> {
    const ctx = _ctx
    const rules = await this.ensureRules(command.teamId)
    if (!this.runtime.listSessions().some(session => session.id === command.assigneeSessionId)) {
      throw new Error(`无法向不存在的会话派发任务: ${command.assigneeSessionId}`)
    }
    if (!rules.memberSessionIds.includes(command.assigneeSessionId)) {
      rules.memberSessionIds.push(command.assigneeSessionId)
      this.rules.save(rules)
    }

    const runId = command.autoRun ? this.runtime.newId() : undefined

    const sourceMessageId = await this.runtime.recordEvent(this.teamEvent(rules, command.assigneeSessionId, ctx.actor, {
      type: 'team_task_assigned',
      taskId: command.taskId,
      assigneeSessionId: command.assigneeSessionId,
      title: command.title,
      description: command.description,
      runId,
    }))
    await this.store.enqueueInbox({
      id: this.runtime.newId(),
      sessionId: command.assigneeSessionId,
      kind: 'task',
      fromActor: ctx.actor,
      sourceSessionId: command.assigneeSessionId,
      sourceMessageId,
      taskId: command.taskId,
      runId,
      createdAt: this.runtime.now(),
    })
    await this.runtime.setSessionStatus(command.assigneeSessionId, rules.statusMap.active)

    if (command.autoRun) {
      await this.runtime.startTurn(command.assigneeSessionId, buildTaskPrompt(command.title, command.description, command.taskId))
    }
    return { taskId: command.taskId, runId }
  }

  private async submitReport(
    command: Extract<TeamSessionCommand, { type: 'submitTeamReport' }>,
    ctx: TeamCommandContext,
  ): Promise<{ reportId: string; reviewId: string }> {
    const rules = await this.ensureRules(command.teamId)
    const reporterSessionId = ctx.issuerSessionId
    if (!this.runtime.listSessions().some(session => session.id === reporterSessionId)) {
      throw new Error(`无法从不存在的会话提交汇报: ${reporterSessionId}`)
    }
    const createdAt = this.runtime.now()
    const report: TeamReport = {
      reportId: this.runtime.newId(),
      taskId: command.taskId,
      runId: command.runId,
      reporterSessionId,
      summary: command.summary,
      artifactPaths: command.artifactPaths,
      createdAt,
    }
    await this.runtime.recordEvent(this.teamEvent(rules, reporterSessionId, ctx.actor, {
      type: 'team_report_submitted',
      reportId: report.reportId,
      taskId: command.taskId,
      runId: command.runId,
      reporterSessionId,
      summary: command.summary,
      artifactPaths: command.artifactPaths,
    }))
    await this.runtime.setSessionStatus(reporterSessionId, rules.statusMap.awaitingReview)

    const reviewId = this.runtime.newId()
    const queue = await this.getReviewQueue()
    const queuePosition = Math.max(0, queue.findIndex(item => item.reporterSessionId === reporterSessionId))
    await this.runtime.recordEvent(this.teamEvent(rules, reporterSessionId, ctx.actor, {
      type: 'team_review_queued',
      reviewId,
      taskId: command.taskId,
      reportId: report.reportId,
      targetReviewerSessionId: rules.leaderSessionId ?? rules.managerProjectionSessionId,
      queuePosition,
    }))
    return { reportId: report.reportId, reviewId }
  }

  private async changeIdentity(
    command: Extract<TeamSessionCommand, { type: 'changeTeamIdentityTag' }>,
    ctx: TeamCommandContext,
  ): Promise<TeamProjection> {
    const rules = await this.ensureRules(command.teamId)
    if (!this.runtime.listSessions().some(session => session.id === command.targetSessionId)) {
      throw new Error(`无法给不存在的会话写身份: ${command.targetSessionId}`)
    }
    if (command.action === 'add' && !rules.identityTags.some(tag => tag.id === command.tagId)) {
      throw new Error(`未知身份标签: ${command.tagId}`)
    }
    if (!rules.memberSessionIds.includes(command.targetSessionId)) {
      rules.memberSessionIds.push(command.targetSessionId)
    }
    if (command.action === 'add') this.addTag(rules, command.targetSessionId, command.tagId)
    else this.removeTag(rules, command.targetSessionId, command.tagId)
    this.rules.save(rules)

    await this.runtime.recordEvent(this.teamEvent(rules, command.targetSessionId, ctx.actor, {
      type: 'team_identity_changed',
      targetSessionId: command.targetSessionId,
      tagId: command.tagId,
      action: command.action,
    }))
    return this.projectionFrom(rules)
  }

  private async updateRules(
    command: Extract<TeamSessionCommand, { type: 'updateTeamRules' }>,
    ctx: TeamCommandContext,
  ): Promise<TeamProjection> {
    const current = await this.ensureRules(command.teamId)
    const merged = this.mergeRules(current, command.rules)
    const validation = this.rules.validate(merged)
    if (!validation.valid) throw new Error(`团队规则无效: ${validation.errors.join('; ')}`)
    this.rules.save(merged)

    const changedKeys = Object.keys(command.rules).filter(k => k !== 'version' && k !== 'teamId')
    await this.runtime.recordEvent(this.teamEvent(merged, merged.teamConversationSessionId, ctx.actor, {
      type: 'team_rules_changed',
      rulesVersion: merged.version,
      changedKeys,
    }))
    return this.projectionFrom(merged)
  }

  // ---- 查询（派生，不写）-------------------------------------------------

  async getProjection(): Promise<TeamProjection | null> {
    const loaded = this.rules.load()
    if (!loaded.rules) return null
    const rules = await this.reconcile(loaded.rules)
    return this.projectionFrom(rules)
  }

  async getReviewQueue(): Promise<TeamReviewQueueItem[]> {
    const loaded = this.rules.load()
    if (!loaded.rules) return []
    const rules = loaded.rules
    const awaiting = this.runtime.listSessions()
      .filter(s => rules.memberSessionIds.includes(s.id) && s.sessionStatus === rules.statusMap.awaitingReview)
    const items: TeamReviewQueueItem[] = []
    for (const session of awaiting) {
      const report = await this.runtime.getLatestReport(session.id)
      if (!report) continue
      items.push({
        reviewId: `review-${report.reportId}`,
        taskId: report.taskId,
        reportId: report.reportId,
        reporterSessionId: report.reporterSessionId,
        summary: report.summary,
        queuePosition: 0,
        createdAt: report.createdAt,
      })
    }
    items.sort((a, b) => a.createdAt - b.createdAt)
    items.forEach((item, index) => { item.queuePosition = index })
    return items
  }

  getInbox(sessionId: string): Promise<TeamInboxItem[]> {
    return this.store.listInbox(sessionId)
  }

  async drainInboxContext(sessionId: string): Promise<string> {
    const items = await this.store.drainInbox(sessionId)
    if (items.length === 0) return ''
    return this.runtime.resolveInbox(items)
  }

  // ---- 内部 --------------------------------------------------------------

  private async ensureRules(teamId: string): Promise<TeamRulesV1> {
    const loaded = this.rules.load()
    if (loaded.rules) return this.reconcile(loaded.rules)

    const conversationId = await this.runtime.ensureTeamConversationSession(null)
    const managerProjectionSessionId = await this.runtime.ensureManagerProjectionSession(null)
    const rules: TeamRulesV1 = {
      version: 1,
      teamId: teamId || DEFAULT_TEAM_ID,
      teamConversationSessionId: conversationId,
      managerProjectionSessionId,
      leaderSessionId: null,
      memberSessionIds: [],
      identityTags: TEAM_DEFAULT_IDENTITY_TAGS.map(tag => ({ ...tag })),
      identityAssignments: {},
      statusMap: normalizeTeamStatusMap(),
      routing: { mentionPrefix: '@', commandPrefix: '/', defaultVisibility: 'broadcast' },
      taskPolicy: { requireTaskIdForAssignment: true, requireRunIdForReport: true, queueLatestStructuredReport: true },
      managerContextPolicy: normalizeTeamManagerContextPolicy(),
      norms: [],
    }
    this.rules.save(rules)
    return rules
  }

  /** lazy 成员对账：剔除已不存在的会话；队长失效则清空并发事件。 */
  private async reconcile(rules: TeamRulesV1): Promise<TeamRulesV1> {
    const live = new Set(this.runtime.listSessions().map(s => s.id))
    // 团队群聊会话本身是 hidden，不在 listSessions(可见) 里——单独确保其存在。
    const conversationId = await this.runtime.ensureTeamConversationSession(rules.teamConversationSessionId)
    const managerProjectionSessionId = await this.runtime.ensureManagerProjectionSession(rules.managerProjectionSessionId ?? null)
    let changed = conversationId !== rules.teamConversationSessionId || managerProjectionSessionId !== rules.managerProjectionSessionId

    const members = rules.memberSessionIds.filter(id => live.has(id))
    if (members.length !== rules.memberSessionIds.length) changed = true

    const assignments: Record<string, string[]> = {}
    for (const id of members) if (rules.identityAssignments[id]) assignments[id] = rules.identityAssignments[id]
    if (Object.keys(assignments).length !== Object.keys(rules.identityAssignments).length) changed = true

    let leader = rules.leaderSessionId
    const leaderLost = leader !== null && !live.has(leader)
    if (leaderLost) leader = null

    if (!changed && !leaderLost) return rules

    const next: TeamRulesV1 = {
      ...rules,
      teamConversationSessionId: conversationId,
      managerProjectionSessionId,
      memberSessionIds: members,
      identityAssignments: assignments,
      leaderSessionId: leader,
    }
    this.rules.save(next)
    if (leaderLost) {
      await this.runtime.recordEvent(this.teamEvent(next, next.teamConversationSessionId, MANAGER_ACTOR, {
        type: 'team_leader_changed',
        leaderSessionId: null,
        previousLeaderSessionId: rules.leaderSessionId,
      }))
    }
    return next
  }

  private projectionFrom(rules: TeamRulesV1): TeamProjection {
    const sessions = new Map(this.runtime.listSessions().map(s => [s.id, s]))
    const ordered = [...rules.memberSessionIds].sort((a, b) => (sessions.get(a)?.createdAt ?? 0) - (sessions.get(b)?.createdAt ?? 0))
    const seqOf = new Map(ordered.map((id, index) => [id, `G-${String(index + 1).padStart(2, '0')}`]))
    const members: TeamMemberProjection[] = rules.memberSessionIds.map(id => ({
      sessionId: id,
      sequence: seqOf.get(id) ?? 'G-00',
      isLeader: rules.leaderSessionId === id,
      identityTagIds: rules.identityAssignments[id] ?? [],
      status: sessions.get(id)?.sessionStatus,
    }))
    return {
      teamId: rules.teamId,
      teamConversationSessionId: rules.teamConversationSessionId,
      managerProjectionSessionId: rules.managerProjectionSessionId,
      leaderSessionId: rules.leaderSessionId,
      members,
      identityTags: rules.identityTags,
      statusMap: rules.statusMap,
      managerContextPolicy: normalizeTeamManagerContextPolicy(rules.managerContextPolicy),
      norms: rules.norms,
    }
  }

  private mergeRules(current: TeamRulesV1, patch: TeamRulesPatch): TeamRulesV1 {
    return {
      ...current,
      ...patch,
      version: 1,
      teamId: current.teamId,
      teamConversationSessionId: current.teamConversationSessionId,
      managerProjectionSessionId: current.managerProjectionSessionId,
      statusMap: patch.statusMap ? normalizeTeamStatusMap(patch.statusMap) : current.statusMap,
      managerContextPolicy: patch.managerContextPolicy
        ? normalizeTeamManagerContextPolicy(patch.managerContextPolicy)
        : normalizeTeamManagerContextPolicy(current.managerContextPolicy),
    }
  }

  private addTag(rules: TeamRulesV1, sessionId: string, tagId: string): void {
    const tags = new Set(rules.identityAssignments[sessionId] ?? [])
    tags.add(tagId)
    rules.identityAssignments[sessionId] = [...tags]
  }

  private removeTag(rules: TeamRulesV1, sessionId: string, tagId: string): void {
    const tags = (rules.identityAssignments[sessionId] ?? []).filter(id => id !== tagId)
    if (tags.length > 0) rules.identityAssignments[sessionId] = tags
    else delete rules.identityAssignments[sessionId]
  }

  private teamEvent<T extends { type: string }>(
    rules: TeamRulesV1,
    sessionId: string,
    actor: ActorRef,
    rest: T,
  ): SessionEvent {
    return {
      ...rest,
      sessionId,
      teamId: rules.teamId,
      conversationId: rules.teamConversationSessionId,
      actor,
      timestamp: this.runtime.now(),
    } as unknown as SessionEvent
  }
}

function buildTaskPrompt(title: string, description: string | undefined, taskId: string): string {
  const body = description ? `${title}\n\n${description}` : title
  return `【团队任务】${body}\n\n(taskId: ${taskId}) 完成后请提交结构化工作汇报。`
}

// ---- 与 SessionManager 的绑定 + 每 workspace 单例 --------------------------

/** SessionManager 的最小结构契约（避免直接 import 具体类，便于测试与解耦）。 */
export interface TeamSessionManagerLike {
  appendSessionEvent(event: SessionEvent): Promise<string>
  getSessions(workspaceId?: string): Array<{ id: string; createdAt?: number; sessionStatus?: string; hidden?: boolean; name?: string }>
  createSession(workspaceId: string, options?: { hidden?: boolean; name?: string; systemPromptPreset?: 'default' | 'mini' | string }): Promise<{ id: string }>
  sendMessage(sessionId: string, message: string): Promise<void>
  setSessionStatus(sessionId: string, status: string): Promise<void>
  requestWorkflowPermission(
    sessionId: string,
    input: { toolName: string; description: string; type: 'file_write' | 'mcp_mutation' | 'api_mutation'; reason?: string },
  ): Promise<boolean>
  getLatestTeamReport(sessionId: string): Promise<TeamReport | null>
  resolveTeamInbox(items: TeamInboxItem[]): Promise<string>
}

export function createSessionManagerTeamRuntime(sm: TeamSessionManagerLike, workspaceId: string): TeamRuntime {
  return {
    recordEvent: event => sm.appendSessionEvent(event),
    now: () => Date.now(),
    newId: () => randomUUID(),
    listSessions: () =>
      sm.getSessions(workspaceId)
        .filter(s => !s.hidden)
        .map(s => ({ id: s.id, createdAt: s.createdAt ?? 0, sessionStatus: s.sessionStatus, hidden: s.hidden, name: s.name })),
    ensureTeamConversationSession: async existingId => {
      if (existingId && sm.getSessions(workspaceId).some(s => s.id === existingId)) return existingId
      const created = await sm.createSession(workspaceId, { hidden: true, name: '团队群聊' })
      return created.id
    },
    ensureManagerProjectionSession: async existingId => {
      if (existingId && sm.getSessions(workspaceId).some(s => s.id === existingId)) return existingId
      const created = await sm.createSession(workspaceId, {
        hidden: true,
        name: '管理 Agent',
        systemPromptPreset: 'mini',
      })
      return created.id
    },
    startTurn: (sessionId, input) => sm.sendMessage(sessionId, input),
    setSessionStatus: (sessionId, statusId) => sm.setSessionStatus(sessionId, statusId),
    requestPermission: (sessionId, input) => sm.requestWorkflowPermission(sessionId, input),
    getLatestReport: sessionId => sm.getLatestTeamReport(sessionId),
    resolveInbox: items => sm.resolveTeamInbox(items),
  }
}

const coordinatorRegistry = new Map<string, TeamCoordinator>()

/** 每 workspace 单例协调器；首次创建时绑定 runtime + 本地 store。 */
export function getTeamCoordinator(opts: {
  workspaceRootPath: string
  runtime: TeamRuntime
  store?: TeamStore
}): TeamCoordinator {
  let coordinator = coordinatorRegistry.get(opts.workspaceRootPath)
  if (!coordinator) {
    const rulesService = new TeamRulesService(opts.workspaceRootPath)
    const store = opts.store ?? new FileTeamStore(join(opts.workspaceRootPath, '.fleet', 'team-store'))
    coordinator = new TeamCoordinator(rulesService, opts.runtime, store)
    coordinatorRegistry.set(opts.workspaceRootPath, coordinator)
  }
  return coordinator
}

/** 测试用：清空单例缓存。 */
export function __resetTeamCoordinatorRegistry(): void {
  coordinatorRegistry.clear()
}

export { MemoryTeamStore }

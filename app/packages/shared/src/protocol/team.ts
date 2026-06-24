import type { ActorRef } from './design'

// ---------------------------------------------------------------------------
// Team status semantics
// ---------------------------------------------------------------------------

export const TEAM_STATUS_SEMANTICS = [
  'unassigned',
  'active',
  'awaitingReview',
  'done',
  'cancelled',
] as const

export type TeamStatusSemantic = typeof TEAM_STATUS_SEMANTICS[number]

export type TeamStatusMap = Record<TeamStatusSemantic, string>

export const DEFAULT_TEAM_STATUS_MAP: TeamStatusMap = Object.freeze({
  unassigned: 'backlog',
  active: 'todo',
  awaitingReview: 'needs-review',
  done: 'done',
  cancelled: 'cancelled',
})

const RESERVED_TEAM_STATUS_IDS = new Set<string>([
  'unassigned',
  'active',
  'awaitingReview',
])

export function isReservedTeamStatusId(value: string): boolean {
  return RESERVED_TEAM_STATUS_IDS.has(value)
}

export function normalizeTeamStatusMap(overrides?: Partial<TeamStatusMap>): TeamStatusMap {
  return {
    ...DEFAULT_TEAM_STATUS_MAP,
    ...(overrides ?? {}),
  }
}

// ---------------------------------------------------------------------------
// Team rules
// ---------------------------------------------------------------------------

/**
 * 身份标签的派生读模型（仅 UI 投影用）。
 * 身份真相在 craft 原 `LabelConfig`（`kind==='identity'`）+ session `labels`，
 * 不再存进 team rules。这里只是 `TeamProjection` 给前端的派生视图，不是存储真相。
 */
export interface TeamIdentityLabel {
  id: string
  displayName: string
  systemPromptPreset?: string
  color?: string
}

export type ManagerContextInjectionTarget = 'off' | 'leaderOnly' | 'allMembers'

export interface TeamManagerContextPolicy {
  /**
   * 管理 Agent 的项目观察边界固定为“有队长只看队长摘要；无队长才看普通成员摘要”。
   * 这里配置的是它把跨项目记录/长期偏好反向注入项目时的范围。
   */
  userPreferenceInjection: ManagerContextInjectionTarget
  crossProjectRecordInjection: Exclude<ManagerContextInjectionTarget, 'allMembers'>
  deepMemberContextRequiresPermission: boolean
}

export const DEFAULT_TEAM_MANAGER_CONTEXT_POLICY: TeamManagerContextPolicy = Object.freeze({
  userPreferenceInjection: 'leaderOnly',
  crossProjectRecordInjection: 'off',
  deepMemberContextRequiresPermission: true,
})

export function normalizeTeamManagerContextPolicy(
  overrides?: Partial<TeamManagerContextPolicy>,
): TeamManagerContextPolicy {
  return {
    ...DEFAULT_TEAM_MANAGER_CONTEXT_POLICY,
    ...(overrides ?? {}),
  }
}

export interface TeamRulesV1 {
  version: 1
  teamId: string
  teamConversationSessionId: string
  /**
   * manager:global 在当前 workspace 的内部投影锚点。
   * 只用于 timeline/待审路由，不是常驻管理 Agent 的用户对话位置。
   */
  managerProjectionSessionId?: string
  /**
   * 队长会话的派生缓存：真相是该会话原 `labels` 是否含 `leader` 身份标签。
   * 加载/对账时必须与 session labels 核对，冲突以标签为准（docs/33 §2）。
   */
  leaderSessionId: string | null
  memberSessionIds: string[]
  // 身份定义与分配已收敛到 craft 原标签系统（labels/config.json + session labels），
  // team rules 不再保存 identityTags / identityAssignments（docs/33 §1.2 / §0-8）。
  statusMap: TeamStatusMap
  routing: {
    mentionPrefix: '@'
    commandPrefix: '/'
    defaultVisibility: TeamMessageVisibility
  }
  taskPolicy: {
    requireTaskIdForAssignment: boolean
    requireRunIdForReport: boolean
    queueLatestStructuredReport: boolean
  }
  managerContextPolicy: TeamManagerContextPolicy
  norms: string[]
}

export type TeamRulesPatch = Partial<TeamRulesV1> & {
  version: 1
  teamId: string
}

export interface TeamRulesValidationResult {
  valid: boolean
  errors: string[]
}

export interface TeamRulesLoadResult {
  rules: TeamRulesV1 | null
  source: 'disk' | 'missing' | 'last-valid' | 'invalid'
  path: string
  error?: string
}

// ---------------------------------------------------------------------------
// Team events
// ---------------------------------------------------------------------------

export type TeamMessageVisibility = 'broadcast' | 'private'

export interface TeamEventBase {
  sessionId: string
  teamId: string
  /** The craft session used for the team conversation or member context. */
  conversationId: string
  actor: ActorRef
  timestamp: number
}

export type TeamSessionEvent =
  | (TeamEventBase & {
      type: 'team_rules_changed'
      rulesVersion: number
      changedKeys: string[]
    })
  | (TeamEventBase & {
      type: 'team_leader_changed'
      leaderSessionId: string | null
      previousLeaderSessionId?: string | null
    })
  | (TeamEventBase & {
      type: 'team_message'
      messageId: string
      content: string
      visibility: TeamMessageVisibility
      audienceSessionIds?: string[]
      taskId?: string
      runId?: string
      /** 投递状态：消息真相在 team 会话 transcript，这里只记引用与 fanout 状态，不复制完整 Message。 */
      delivery?: 'queued' | 'delivered'
    })
  | (TeamEventBase & {
      type: 'team_task_assigned'
      taskId: string
      assigneeSessionId: string
      title: string
      description?: string
      runId?: string
    })
  | (TeamEventBase & {
      type: 'team_report_submitted'
      reportId: string
      taskId: string
      runId: string
      reporterSessionId: string
      summary: string
      artifactPaths?: string[]
    })
  | (TeamEventBase & {
      type: 'team_review_queued'
      reviewId: string
      taskId: string
      reportId: string
      targetReviewerSessionId?: string
      queuePosition?: number
    })
  | (TeamEventBase & {
      type: 'team_rules_validation_failed'
      error: string
      attemptedPath?: string
    })

// ---------------------------------------------------------------------------
// Team commands
// ---------------------------------------------------------------------------

export type TeamSessionCommand =
  | {
      type: 'promoteTeamLeader'
      teamId: string
      leaderSessionId: string | null
    }
  | {
      type: 'sendTeamMessage'
      teamId: string
      content: string
      /**
       * 人类输入中的 @G-01 / @G-02 目标。编号只是一层显示语义，必须由后端
       * 根据当前 TeamProjection 解析成会话 ID，不能把成员映射真相放进 renderer。
       */
      audienceSequences?: string[]
      audienceSessionIds?: string[]
      taskId?: string
      runId?: string
    }
  | {
      type: 'assignTeamTask'
      teamId: string
      taskId: string
      assigneeSessionId: string
      title: string
      description?: string
      /**
       * 是否立刻在 assignee 会话上启动一轮执行（auto-run / dispatch）。
       * false / 省略 = 只创建任务并投递到收件箱（L1）；true = 启动 agent 运行（L2，过 permission）。
       * 这条区分是 TeamCoordinator 的核心：投递 ≠ 运行。
       */
      autoRun?: boolean
    }
  | {
      type: 'submitTeamReport'
      teamId: string
      taskId: string
      runId: string
      summary: string
      artifactPaths?: string[]
    }
  // 身份/队长标签变更不再走团队命令，统一走 craft 原 `setLabels`
  // session 命令（set_session_labels），由 SessionManager 保证队长唯一性（docs/33 §1.2）。
  | {
      type: 'updateTeamRules'
      teamId: string
      rules: TeamRulesPatch
    }

// 默认身份标签预设已迁到 craft 原标签系统：见
// `@craft-agent/shared/labels` 的 `DEFAULT_IDENTITY_LABEL_PRESETS` 与 `LEADER_LABEL_ID`。

// ---------------------------------------------------------------------------
// Team delivery + projection types（收件箱 / 报告 / 派生视图 · 查询返回）
// ---------------------------------------------------------------------------

/** 投递到某个成员会话的待消费项（真相是 transcript+事件，这里是 fanout 投递引用）。 */
export interface TeamInboxItem {
  id: string
  /** 收件人会话。 */
  sessionId: string
  kind: 'message' | 'task'
  fromActor: ActorRef
  /** 正文真相所在的 craft session 与持久化 timeline message。 */
  sourceSessionId: string
  sourceMessageId: string
  taskId?: string
  runId?: string
  visibility?: TeamMessageVisibility
  createdAt: number
  delivered?: boolean
}

/** 结构化工作汇报（持久化；待审队列从中派生）。 */
export interface TeamReport {
  reportId: string
  taskId: string
  runId: string
  reporterSessionId: string
  summary: string
  artifactPaths?: string[]
  createdAt: number
}

/** 成员投影（运行态从 session + rules 派生，不双写）。 */
export interface TeamMemberProjection {
  sessionId: string
  /** 稳定序号（按 createdAt 排名派生，如 G-01）。 */
  sequence: string
  isLeader: boolean
  /** 派生自 session `labels` 里命中的 identity 标签 id（不含 leader 也可能为空）。 */
  identityLabelIds: string[]
  /** 当前会话状态 id（craft 动态 status）。 */
  status?: string
}

/** 团队投影：rules + 派生成员，给 UI 读。 */
export interface TeamProjection {
  teamId: string
  teamConversationSessionId: string
  managerProjectionSessionId?: string
  leaderSessionId: string | null
  members: TeamMemberProjection[]
  /** 身份标签目录，派生自 workspace `LabelConfig`（kind==='identity'），不是 rules 真相。 */
  identityLabels: TeamIdentityLabel[]
  statusMap: TeamStatusMap
  managerContextPolicy?: TeamManagerContextPolicy
  norms: string[]
}

/** 待审队列项（派生：awaitingReview 成员 + 最新报告，按报告时间排序）。 */
export interface TeamReviewQueueItem {
  reviewId: string
  taskId: string
  reportId: string
  reporterSessionId: string
  summary: string
  queuePosition: number
  createdAt: number
}

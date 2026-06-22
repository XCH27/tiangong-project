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

export interface TeamIdentityTag {
  id: string
  displayName: string
  systemPromptPreset?: string
  color?: string
}

export interface TeamRulesV1 {
  version: 1
  teamId: string
  teamConversationSessionId: string
  /** manager:global 在当前 workspace 的 hidden session 投影。 */
  managerProjectionSessionId?: string
  leaderSessionId: string | null
  memberSessionIds: string[]
  identityTags: TeamIdentityTag[]
  /** sessionId -> identity tag ids */
  identityAssignments: Record<string, string[]>
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
      type: 'team_identity_changed'
      targetSessionId: string
      tagId: string
      action: 'add' | 'remove'
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
  | {
      type: 'changeTeamIdentityTag'
      teamId: string
      targetSessionId: string
      tagId: string
      action: 'add' | 'remove'
    }
  | {
      type: 'updateTeamRules'
      teamId: string
      rules: TeamRulesPatch
    }

// ---------------------------------------------------------------------------
// Team default identity tags（功能身份预设）
// ---------------------------------------------------------------------------

export const TEAM_DEFAULT_IDENTITY_TAGS: TeamIdentityTag[] = [
  { id: 'leader', displayName: '队长', systemPromptPreset: '负责拆分任务、分派、汇总和验收，不绕过权限。' },
  { id: 'code', displayName: '代码' },
  { id: 'design', displayName: '设计' },
  { id: 'review', displayName: '审查', systemPromptPreset: '负责检查风险、回归和验收证据。' },
  { id: 'test', displayName: '测试' },
  { id: 'context', displayName: '上下文' },
]

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
  identityTagIds: string[]
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
  identityTags: TeamIdentityTag[]
  statusMap: TeamStatusMap
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

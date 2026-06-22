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

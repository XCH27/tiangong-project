import { describe, expect, test } from 'bun:test'
import {
  DEFAULT_TEAM_STATUS_MAP,
  DEFAULT_TEAM_MANAGER_CONTEXT_POLICY,
  TEAM_STATUS_SEMANTICS,
  isReservedTeamStatusId,
  normalizeTeamManagerContextPolicy,
  normalizeTeamStatusMap,
  type TeamSessionCommand,
  type TeamSessionEvent,
} from '../index'

describe('team protocol defaults', () => {
  test('maps team status semantics to existing craft status ids', () => {
    expect(TEAM_STATUS_SEMANTICS).toEqual([
      'unassigned',
      'active',
      'awaitingReview',
      'done',
      'cancelled',
    ])

    expect(DEFAULT_TEAM_STATUS_MAP).toEqual({
      unassigned: 'backlog',
      active: 'todo',
      awaitingReview: 'needs-review',
      done: 'done',
      cancelled: 'cancelled',
    })
  })

  test('keeps team semantic ids out of persisted session status values', () => {
    expect(isReservedTeamStatusId('unassigned')).toBe(true)
    expect(isReservedTeamStatusId('active')).toBe(true)
    expect(isReservedTeamStatusId('awaitingReview')).toBe(true)
    expect(isReservedTeamStatusId('todo')).toBe(false)
    expect(isReservedTeamStatusId('needs-review')).toBe(false)
  })

  test('normalizes partial workspace overrides without losing defaults', () => {
    expect(normalizeTeamStatusMap({ active: 'custom-active' })).toEqual({
      ...DEFAULT_TEAM_STATUS_MAP,
      active: 'custom-active',
    })
  })

  test('keeps manager context injection conservative by default', () => {
    expect(DEFAULT_TEAM_MANAGER_CONTEXT_POLICY).toEqual({
      userPreferenceInjection: 'leaderOnly',
      crossProjectRecordInjection: 'off',
      deepMemberContextRequiresPermission: true,
    })
    expect(normalizeTeamManagerContextPolicy({ crossProjectRecordInjection: 'leaderOnly' })).toEqual({
      ...DEFAULT_TEAM_MANAGER_CONTEXT_POLICY,
      crossProjectRecordInjection: 'leaderOnly',
    })
  })
})

describe('team session event and command shapes', () => {
  test('represents private team messages with one event type plus visibility', () => {
    const event: TeamSessionEvent = {
      type: 'team_message',
      sessionId: 'team-session',
      teamId: 'team-1',
      conversationId: 'team-session',
      actor: { kind: 'agent', agentId: 'agent-1', role: 'leader' },
      timestamp: 1,
      messageId: 'msg-1',
      visibility: 'private',
      audienceSessionIds: ['member-session'],
      content: '只发给你',
    }

    expect(event.type).toBe('team_message')
    expect(event.visibility).toBe('private')
  })

  test('exposes commands for leader, team messaging, tasks, reports, and identity tags', () => {
    const commands: TeamSessionCommand[] = [
      { type: 'promoteTeamLeader', teamId: 'team-1', leaderSessionId: 'leader-session' },
      { type: 'sendTeamMessage', teamId: 'team-1', content: 'all' },
      { type: 'assignTeamTask', teamId: 'team-1', taskId: 'task-1', assigneeSessionId: 'member-session', title: '实现协议' },
      { type: 'submitTeamReport', teamId: 'team-1', taskId: 'task-1', runId: 'run-1', summary: '完成' },
      { type: 'changeTeamIdentityTag', teamId: 'team-1', targetSessionId: 'member-session', tagId: 'reviewer', action: 'add' },
      { type: 'updateTeamRules', teamId: 'team-1', rules: { version: 1, teamId: 'team-1' } },
    ]

    expect(commands.map((command) => command.type)).toEqual([
      'promoteTeamLeader',
      'sendTeamMessage',
      'assignTeamTask',
      'submitTeamReport',
      'changeTeamIdentityTag',
      'updateTeamRules',
    ])
  })
})

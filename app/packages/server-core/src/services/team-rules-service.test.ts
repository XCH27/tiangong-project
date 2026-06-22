import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_TEAM_STATUS_MAP, type TeamRulesV1 } from '@craft-agent/shared/protocol'
import { TeamRulesService, validateTeamRules } from './team-rules-service'

function validRules(): TeamRulesV1 {
  return {
    version: 1,
    teamId: 'team-workspace',
    teamConversationSessionId: 'session-team',
    leaderSessionId: 'session-leader',
    memberSessionIds: ['session-leader', 'session-worker'],
    identityTags: [
      { id: 'leader', displayName: '队长' },
      { id: 'code', displayName: '代码' },
    ],
    identityAssignments: {
      'session-leader': ['leader'],
      'session-worker': ['code'],
    },
    statusMap: { ...DEFAULT_TEAM_STATUS_MAP },
    routing: {
      mentionPrefix: '@',
      commandPrefix: '/',
      defaultVisibility: 'broadcast',
    },
    taskPolicy: {
      requireTaskIdForAssignment: true,
      requireRunIdForReport: true,
      queueLatestStructuredReport: true,
    },
    norms: ['先报告阻塞，再扩范围'],
  }
}

describe('TeamRulesService', () => {
  let root: string

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fleet-team-rules-'))
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('returns an honest missing state without inventing a team session', () => {
    const result = new TeamRulesService(root).load()
    expect(result.rules).toBeNull()
    expect(result.source).toBe('missing')
    expect(result.path).toBe(join(root, '.fleet/team.rules.json'))
  })

  it('atomically saves and loads valid workspace rules', () => {
    const service = new TeamRulesService(root)
    service.save(validRules())

    const result = service.load()
    expect(result.source).toBe('disk')
    expect(result.rules?.leaderSessionId).toBe('session-leader')
    expect(JSON.parse(readFileSync(result.path, 'utf8')).teamId).toBe('team-workspace')
  })

  it('keeps the last valid rules when the file is later corrupted', () => {
    const service = new TeamRulesService(root)
    service.save(validRules())
    writeFileSync(service.path, '{ broken json', 'utf8')

    const result = service.load()
    expect(result.source).toBe('last-valid')
    expect(result.rules?.teamId).toBe('team-workspace')
    expect(result.error).toContain('JSON')
  })

  it('recovers the last valid rules after process restart', () => {
    const firstProcess = new TeamRulesService(root)
    firstProcess.save(validRules())
    writeFileSync(firstProcess.path, '{ broken json', 'utf8')

    const restartedProcess = new TeamRulesService(root)
    const result = restartedProcess.load()
    expect(result.source).toBe('last-valid')
    expect(result.rules?.teamId).toBe('team-workspace')
  })

  it('does not fabricate a fallback when no valid version was loaded', () => {
    mkdirSync(join(root, '.fleet'), { recursive: true })
    writeFileSync(join(root, '.fleet/team.rules.json'), '{}', 'utf8')

    const result = new TeamRulesService(root).load()
    expect(result.source).toBe('invalid')
    expect(result.rules).toBeNull()
    expect(result.error).toContain('version 必须为 1')
  })

  it('rejects unknown statuses, invalid prefixes, duplicate members, and dangling tags', () => {
    const rules = validRules()
    rules.memberSessionIds.push('session-worker')
    rules.statusMap.active = 'not-a-status'
    rules.routing.mentionPrefix = '#' as '@'
    rules.identityAssignments['session-worker'] = ['missing-tag']

    const result = validateTeamRules(rules, new Set(['backlog', 'todo', 'needs-review', 'done', 'cancelled']))
    expect(result.valid).toBeFalse()
    expect(result.errors.some(error => error.includes('重复项'))).toBeTrue()
    expect(result.errors.some(error => error.includes('不存在的状态'))).toBeTrue()
    expect(result.errors.some(error => error.includes('mentionPrefix'))).toBeTrue()
    expect(result.errors.some(error => error.includes('未知标签'))).toBeTrue()
  })
})

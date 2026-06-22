import { describe, expect, it } from 'bun:test'
import type { SessionToolContext } from '../context.ts'
import {
  handleAssignTeamTask,
  handleGetTeam,
  handleSendTeamMessage,
  handleSubmitTeamReport,
} from './team.ts'

function context(overrides: Partial<SessionToolContext> = {}): SessionToolContext {
  return {
    sessionId: 'session-agent',
    workspacePath: '/workspace',
    sourcesPath: '/workspace/sources',
    skillsPath: '/workspace/skills',
    plansFolderPath: '/workspace/plans',
    callbacks: { onPlanSubmitted() {}, onAuthRequest() {} },
    fs: {} as SessionToolContext['fs'],
    loadSourceConfig: () => null,
    ...overrides,
  }
}

describe('team session tools', () => {
  it('returns the current team projection', async () => {
    const result = await handleGetTeam(context({
      getTeam: async () => ({ teamId: 'team-main', leaderSessionId: 'leader', members: [] }),
    }), {})
    expect(result.content[0]?.text).toContain('team-main')
  })

  it('sends a private team message through the coordinator callback', async () => {
    const calls: unknown[] = []
    const result = await handleSendTeamMessage(context({
      sendTeamMessage: async input => { calls.push(input); return { messageId: 'm1' } },
    }), { content: '只给设计成员', audienceSessionIds: ['design-session'] })
    expect(calls).toEqual([{ content: '只给设计成员', audienceSessionIds: ['design-session'] }])
    expect(result.content[0]?.text).toContain('m1')
  })

  it('assigns without auto-run by default', async () => {
    const calls: unknown[] = []
    await handleAssignTeamTask(context({
      assignTeamTask: async input => { calls.push(input); return { taskId: input.taskId } },
    }), { taskId: 'T-1', assigneeSessionId: 'member', title: '实现后端' })
    expect(calls).toEqual([{ taskId: 'T-1', assigneeSessionId: 'member', title: '实现后端', description: undefined, autoRun: false }])
  })

  it('submits a structured report for review', async () => {
    const calls: unknown[] = []
    const result = await handleSubmitTeamReport(context({
      submitTeamReport: async input => { calls.push(input); return { reportId: 'r1', reviewId: 'q1' } },
    }), { taskId: 'T-1', runId: 'run-1', summary: '完成', artifactPaths: ['a.ts'] })
    expect(calls).toHaveLength(1)
    expect(result.content[0]?.text).toContain('q1')
  })
})

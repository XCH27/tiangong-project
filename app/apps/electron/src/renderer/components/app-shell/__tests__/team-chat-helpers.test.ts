import { describe, expect, it } from 'bun:test'
import type { TeamProjection } from '@craft-agent/shared/protocol'
import { DEFAULT_TEAM_STATUS_MAP } from '@craft-agent/shared/protocol'

import {
  resolveTeamMessageAudience,
  getLeaderDisplay,
  getSessionSequenceDisplay,
} from '../team-chat-helpers'

const team: TeamProjection = {
  teamId: 'team-main',
  teamConversationSessionId: 'team-session',
  leaderSessionId: 'session-a',
  members: [
    {
      sessionId: 'session-a',
      sequence: 'G-01',
      isLeader: true,
      identityTagIds: ['leader'],
      status: 'active',
    },
    {
      sessionId: 'session-b',
      sequence: 'G-02',
      isLeader: false,
      identityTagIds: ['code'],
      status: 'idle',
    },
  ],
  identityTags: [],
  statusMap: DEFAULT_TEAM_STATUS_MAP,
  norms: [],
}

describe('team chat helpers', () => {
  it('keeps broadcast messages when no mention is present', () => {
    expect(resolveTeamMessageAudience('同步一下今天的规范', team)).toEqual({
      content: '同步一下今天的规范',
      audienceSessionIds: undefined,
    })
  })

  it('routes @序号 to a private audience and strips the mention', () => {
    expect(resolveTeamMessageAudience('@G-02 你负责检查登录页', team)).toEqual({
      content: '你负责检查登录页',
      audienceSessionIds: ['session-b'],
    })
  })

  it('routes @队长 to the current leader', () => {
    expect(resolveTeamMessageAudience('@队长 这个任务需要排队审查', team)).toEqual({
      content: '这个任务需要排队审查',
      audienceSessionIds: ['session-a'],
    })
  })

  it('formats sequence and leader labels for compact UI', () => {
    expect(getSessionSequenceDisplay(team, 'session-b')).toBe('G-02')
    expect(getLeaderDisplay(team)).toBe('G-01')
    expect(getLeaderDisplay({ ...team, leaderSessionId: null })).toBe('未设置')
  })
})

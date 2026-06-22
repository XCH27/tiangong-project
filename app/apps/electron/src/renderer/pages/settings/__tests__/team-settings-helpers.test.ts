import { describe, expect, it } from 'bun:test'
import {
  DEFAULT_TEAM_ID,
  getEditableIdentityTags,
  getEditableManagerContextPolicy,
  getEditableStatusMap,
  getEditableTeamId,
  getIssuerSessionId,
  normsToText,
  normalizeTagId,
  removeIdentityTag,
  textToNorms,
  upsertIdentityTag,
} from '../team-settings-helpers'

describe('team-settings-helpers', () => {
  it('uses stable defaults when team rules are not initialized', () => {
    expect(getEditableTeamId(null, null)).toBe(DEFAULT_TEAM_ID)
    expect(getEditableIdentityTags(null, null).some(tag => tag.id === 'leader')).toBe(true)
    expect(getEditableStatusMap(null, null).awaitingReview).toBe('needs-review')
    expect(getEditableManagerContextPolicy(null, null)).toEqual({
      userPreferenceInjection: 'leaderOnly',
      crossProjectRecordInjection: 'off',
      deepMemberContextRequiresPermission: true,
    })
  })

  it('chooses the safest issuer session for command-backed writes', () => {
    expect(getIssuerSessionId('active', null)).toBe('active')
    expect(getIssuerSessionId(null, {
      teamId: 'team-main',
      teamConversationSessionId: 'team',
      leaderSessionId: 'leader-session',
      members: [],
      identityTags: [],
      statusMap: getEditableStatusMap(null, null),
      norms: [],
    })).toBe('leader-session')
    expect(getIssuerSessionId(null, {
      teamId: 'team-main',
      teamConversationSessionId: 'team',
      leaderSessionId: null,
      members: [{ sessionId: 'member-1', sequence: 'G-01', isLeader: false, identityTagIds: [] }],
      identityTags: [],
      statusMap: getEditableStatusMap(null, null),
      norms: [],
    })).toBe('member-1')
  })

  it('normalizes textarea norms', () => {
    expect(textToNorms('先读文档\n\n  不绕权限  ')).toEqual(['先读文档', '不绕权限'])
    expect(normsToText(['先读文档', '不绕权限'])).toBe('先读文档\n不绕权限')
  })

  it('upserts and removes identity tags predictably', () => {
    const tags = upsertIdentityTag([], {
      id: 'Code Owner',
      displayName: '代码',
      systemPromptPreset: '写代码',
    })
    expect(tags).toEqual([{ id: 'code-owner', displayName: '代码', systemPromptPreset: '写代码' }])
    expect(upsertIdentityTag(tags, { id: 'code-owner', displayName: '工程' })[0]?.displayName).toBe('工程')
    expect(removeIdentityTag(tags, 'code-owner')).toEqual([])
  })

  it('rejects empty tag ids or names by returning the original list', () => {
    const tags = [{ id: 'review', displayName: '审查' }]
    expect(upsertIdentityTag(tags, { id: ' ', displayName: '测试' })).toBe(tags)
    expect(upsertIdentityTag(tags, { id: 'test', displayName: ' ' })).toBe(tags)
  })

  it('normalizes ids for slash-free team identity use', () => {
    expect(normalizeTagId('  设计  Agent  ')).toBe('agent')
    expect(normalizeTagId('Design-Agent_01')).toBe('design-agent_01')
  })
})

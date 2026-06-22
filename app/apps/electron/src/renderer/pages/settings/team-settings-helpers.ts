import {
  DEFAULT_TEAM_STATUS_MAP,
  TEAM_DEFAULT_IDENTITY_TAGS,
  type TeamIdentityTag,
  type TeamProjection,
  type TeamRulesV1,
  type TeamStatusMap,
  type TeamStatusSemantic,
} from '@craft-agent/shared/protocol'

export const DEFAULT_TEAM_ID = 'team-main'

export const TEAM_STATUS_FIELDS: Array<{ key: TeamStatusSemantic; label: string; description: string }> = [
  { key: 'unassigned', label: '待安排', description: '团队模式下暂无工作的智能体。' },
  { key: 'active', label: '进行中', description: '正在工作或刚新建的智能体。' },
  { key: 'awaitingReview', label: '待审查', description: '完成任务但队长或人类尚未审查。' },
  { key: 'done', label: '完成', description: '已验收完成。' },
  { key: 'cancelled', label: '取消', description: '已取消或不再推进。' },
]

export function getEditableTeamId(rules: TeamRulesV1 | null, team: TeamProjection | null): string {
  return rules?.teamId || team?.teamId || DEFAULT_TEAM_ID
}

export function getIssuerSessionId(activeSessionId: string | null | undefined, team: TeamProjection | null): string | null {
  return activeSessionId || team?.leaderSessionId || team?.members[0]?.sessionId || null
}

export function getEditableIdentityTags(rules: TeamRulesV1 | null, team: TeamProjection | null): TeamIdentityTag[] {
  const tags = rules?.identityTags ?? team?.identityTags
  return tags && tags.length > 0 ? tags : [...TEAM_DEFAULT_IDENTITY_TAGS]
}

export function getEditableStatusMap(rules: TeamRulesV1 | null, team: TeamProjection | null): TeamStatusMap {
  return {
    ...DEFAULT_TEAM_STATUS_MAP,
    ...(team?.statusMap ?? {}),
    ...(rules?.statusMap ?? {}),
  }
}

export function getEditableNorms(rules: TeamRulesV1 | null, team: TeamProjection | null): string[] {
  return rules?.norms ?? team?.norms ?? []
}

export function normsToText(norms: string[]): string {
  return norms.join('\n')
}

export function textToNorms(value: string): string[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function normalizeTagId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function upsertIdentityTag(tags: TeamIdentityTag[], next: TeamIdentityTag): TeamIdentityTag[] {
  const normalized = { ...next, id: normalizeTagId(next.id) }
  if (!normalized.id || !normalized.displayName.trim()) return tags
  const index = tags.findIndex(tag => tag.id === normalized.id)
  if (index === -1) return [...tags, normalized]
  return tags.map((tag, currentIndex) => currentIndex === index ? normalized : tag)
}

export function removeIdentityTag(tags: TeamIdentityTag[], tagId: string): TeamIdentityTag[] {
  return tags.filter(tag => tag.id !== tagId)
}

export function getMemberDisplayName(member: { sessionId: string; sequence: string; isLeader: boolean }): string {
  return `${member.sequence || member.sessionId}${member.isLeader ? ' · 队长' : ''}`
}

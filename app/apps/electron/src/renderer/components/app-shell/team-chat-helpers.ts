import type { TeamProjection } from '@craft-agent/shared/protocol'

export interface ResolvedTeamMessageAudience {
  content: string
  audienceSessionIds?: string[]
}

function normalizeMention(value: string): string {
  return value.trim().toLowerCase()
}

function findMentionTarget(team: TeamProjection | null | undefined, rawMention: string): string | null {
  if (!team) return null
  const mention = normalizeMention(rawMention)

  if ((mention === '队长' || mention === 'leader') && team.leaderSessionId) {
    return team.leaderSessionId
  }

  const member = team.members.find((candidate) => {
    return (
      normalizeMention(candidate.sessionId) === mention ||
      normalizeMention(candidate.sequence) === mention
    )
  })
  return member?.sessionId ?? null
}

export function resolveTeamMessageAudience(
  rawContent: string,
  team: TeamProjection | null | undefined,
): ResolvedTeamMessageAudience {
  const audience = new Set<string>()
  let content = rawContent

  content = content.replace(/@([^\s@]+)/g, (match, rawMention: string) => {
    const targetSessionId = findMentionTarget(team, rawMention)
    if (!targetSessionId) return match
    audience.add(targetSessionId)
    return ''
  })

  const trimmed = content.replace(/\s+/g, ' ').trim()
  return {
    content: trimmed,
    audienceSessionIds: audience.size > 0 ? Array.from(audience) : undefined,
  }
}

export function getSessionSequenceDisplay(team: TeamProjection | null | undefined, sessionId: string | null | undefined): string {
  if (!team || !sessionId) return ''
  return team.members.find((member) => member.sessionId === sessionId)?.sequence ?? ''
}

export function getLeaderDisplay(team: TeamProjection | null | undefined): string {
  if (!team?.leaderSessionId) return '未设置'
  return getSessionSequenceDisplay(team, team.leaderSessionId) || team.leaderSessionId
}

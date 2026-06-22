import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SessionEvent, TeamProjection, TeamReviewQueueItem } from '@craft-agent/shared/protocol'
import { Crown, MessageSquare, Send, Users } from 'lucide-react'

import { getLeaderDisplay, getSessionSequenceDisplay, resolveTeamMessageAudience } from './team-chat-helpers'

const TEAM_ID = 'team-main'

interface TeamConversationBarProps {
  workspaceId?: string
  issuerSessionId?: string | null
}

function isTeamEvent(event: SessionEvent): boolean {
  return event.type.startsWith('team_')
}

export function TeamConversationBar({ workspaceId, issuerSessionId }: TeamConversationBarProps) {
  const [team, setTeam] = useState<TeamProjection | null>(null)
  const [reviewQueue, setReviewQueue] = useState<TeamReviewQueueItem[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedSequence = useMemo(() => {
    return getSessionSequenceDisplay(team, issuerSessionId)
  }, [team, issuerSessionId])

  const loadTeam = useCallback(async () => {
    if (!workspaceId) {
      setTeam(null)
      setReviewQueue([])
      return
    }
    try {
      const [nextTeam, nextQueue] = await Promise.all([
        window.electronAPI.getTeam(workspaceId),
        window.electronAPI.getTeamReviewQueue(workspaceId),
      ])
      setTeam(nextTeam)
      setReviewQueue(nextQueue)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [workspaceId])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  useEffect(() => {
    return window.electronAPI.onSessionEvent((event) => {
      if (isTeamEvent(event)) void loadTeam()
    })
  }, [loadTeam])

  const promoteSelected = useCallback(async () => {
    if (!issuerSessionId) {
      setError('先选中一个会话，再设为队长。')
      return
    }
    setIsLoading(true)
    try {
      await window.electronAPI.sessionCommand(issuerSessionId, {
        type: 'promoteTeamLeader',
        teamId: TEAM_ID,
        leaderSessionId: issuerSessionId,
      })
      await loadTeam()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [issuerSessionId, loadTeam])

  const sendTeamMessage = useCallback(async () => {
    if (!issuerSessionId) {
      setError('先选中一个会话作为发送者。')
      return
    }
    const resolved = resolveTeamMessageAudience(message, team)
    if (!resolved.content) {
      setError('请输入团队消息。')
      return
    }
    setIsLoading(true)
    try {
      await window.electronAPI.sessionCommand(issuerSessionId, {
        type: 'sendTeamMessage',
        teamId: TEAM_ID,
        content: resolved.content,
        ...(resolved.audienceSessionIds ? { audienceSessionIds: resolved.audienceSessionIds } : {}),
      })
      setMessage('')
      await loadTeam()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [issuerSessionId, loadTeam, message, team])

  return (
    <div className="mx-3 mb-2 rounded-[10px] border border-border/70 bg-background/75 px-3 py-2 shadow-minimal">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span>团队群聊</span>
            {selectedSequence && (
              <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] text-muted-foreground">
                当前 {selectedSequence}
              </span>
            )}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            队长：{getLeaderDisplay(team)} · 待审 {reviewQueue.length}
          </div>
        </div>
        <button
          type="button"
          onClick={promoteSelected}
          disabled={!issuerSessionId || isLoading}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[8px] border border-border bg-background px-2 text-[11px] text-foreground hover:bg-foreground/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          title="把当前会话提升为队长"
        >
          <Crown className="h-3.5 w-3.5" />
          设为队长
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.preventDefault()
              void sendTeamMessage()
            }
          }}
          disabled={!issuerSessionId || isLoading}
          placeholder="@G-02 私聊；不 @ 默认全员"
          className="h-7 min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground/60 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={sendTeamMessage}
          disabled={!issuerSessionId || isLoading || !message.trim()}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-foreground text-background hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
          title="发送团队消息"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <div className="mt-1.5 text-[11px] text-destructive">{error}</div>}
    </div>
  )
}

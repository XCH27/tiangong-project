/**
 * TeamRosterHeader（团队群聊花名册 · docs/00A §4「团队群聊」）
 *
 * 进入团队群聊会话（teamConversationSessionId）时，在原 ChatDisplay 顶部显示成员花名册：
 * 稳定序号 G-01 + 队长冠 + 身份角色。数据来自 craft 原 `getTeam` 投影，纯展示、自带守卫——
 * 只有「当前会话正是团队群聊会话且有成员」时才渲染；其它任何会话返回 null，界面不变。
 * 点成员跳到该成员会话。不新建第二套团队 store。
 */

import { useEffect, useState } from 'react'
import { Users, Crown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TeamProjection } from '@craft-agent/shared/protocol'
import { CHAT_LAYOUT } from '@/config/layout'
import { navigate, routes } from '@/lib/navigate'
import { cn } from '@/lib/utils'

export function TeamRosterHeader({ workspaceId, sessionId }: { workspaceId: string; sessionId: string }) {
  const { t } = useTranslation()
  const [projection, setProjection] = useState<TeamProjection | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!workspaceId || !window.electronAPI?.getTeam) {
      setProjection(null)
      return
    }
    void window.electronAPI
      .getTeam(workspaceId)
      .then((p) => { if (!cancelled) setProjection(p) })
      .catch(() => { if (!cancelled) setProjection(null) })
    return () => { cancelled = true }
  }, [workspaceId, sessionId])

  // 守卫：仅团队群聊会话且有成员时显示。
  if (!projection || projection.teamConversationSessionId !== sessionId || projection.members.length === 0) {
    return null
  }

  const identityById = new Map(projection.identityLabels.map((l) => [l.id, l.displayName]))

  return (
    <div className={cn(CHAT_LAYOUT.maxWidth, 'mx-auto w-full min-w-0 px-4 pt-3')}>
      <div className="rounded-[8px] border border-border/50 bg-foreground/[0.02] px-3 py-2.5">
        <div className="mb-2 flex items-center gap-1.5 text-[12px] font-medium text-foreground/70">
          <Users className="h-3.5 w-3.5" />
          {t('session.teamMembers')} · {projection.members.length}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {projection.members.map((m) => {
            const roles = m.identityLabelIds
              .filter((id) => id !== 'leader')
              .map((id) => identityById.get(id) ?? id)
            return (
              <button
                key={m.sessionId}
                type="button"
                onClick={() => navigate(routes.view.allSessions(m.sessionId))}
                className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-foreground/[0.03] px-2 py-0.5 text-[11px] transition-colors hover:bg-foreground/[0.06]"
              >
                <span className="tabular-nums text-foreground/45">{m.sequence}</span>
                {m.isLeader && <Crown className="h-3 w-3 text-amber-500" />}
                {roles.length > 0 && <span className="text-foreground/70">{roles.join(' · ')}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

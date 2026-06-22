import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, RefreshCw, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { TeamIdentityTag, TeamManagerContextPolicy, TeamProjection, TeamRulesLoadResult, TeamRulesPatch, TeamRulesV1, TeamStatusMap } from '@craft-agent/shared/protocol'

import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SettingsCard, SettingsCardContent, SettingsCardFooter, SettingsInput, SettingsRow, SettingsSection, SettingsTextarea, SettingsToggle } from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import { routes } from '@/lib/navigate'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import {
  DEFAULT_TEAM_ID,
  TEAM_STATUS_FIELDS,
  getEditableIdentityTags,
  getEditableManagerContextPolicy,
  getEditableNorms,
  getEditableStatusMap,
  getEditableTeamId,
  getIssuerSessionId,
  getMemberDisplayName,
  normsToText,
  removeIdentityTag,
  textToNorms,
  upsertIdentityTag,
} from './team-settings-helpers'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'team',
}

function cloneRulesPatch(teamId: string, patch: Omit<TeamRulesPatch, 'version' | 'teamId'>): TeamRulesPatch {
  return { version: 1, teamId, ...patch }
}

function shortId(value: string | null | undefined): string {
  if (!value) return '未设置'
  return value.length <= 12 ? value : `${value.slice(0, 6)}…${value.slice(-4)}`
}

function pruneAssignmentsForRemovedTag(
  rules: TeamRulesV1 | null,
  tagId: string,
): Record<string, string[]> {
  const current = rules?.identityAssignments ?? {}
  const next: Record<string, string[]> = {}
  for (const [sessionId, ids] of Object.entries(current)) {
    const kept = ids.filter(id => id !== tagId)
    if (kept.length > 0) next[sessionId] = kept
  }
  return next
}

export default function TeamSettingsPage() {
  const { t } = useTranslation()
  const { activeWorkspaceId, activeSessionId, sessionStatuses } = useAppShellContext()

  const [loadResult, setLoadResult] = useState<TeamRulesLoadResult | null>(null)
  const [team, setTeam] = useState<TeamProjection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [identityTags, setIdentityTags] = useState<TeamIdentityTag[]>([])
  const [statusMap, setStatusMap] = useState<TeamStatusMap>(getEditableStatusMap(null, null))
  const [managerContextPolicy, setManagerContextPolicy] = useState<TeamManagerContextPolicy>(getEditableManagerContextPolicy(null, null))
  const [normsText, setNormsText] = useState('')
  const [draftTag, setDraftTag] = useState<TeamIdentityTag>({ id: '', displayName: '', systemPromptPreset: '' })

  const rules = loadResult?.rules ?? null
  const teamId = getEditableTeamId(rules, team)
  const issuerSessionId = getIssuerSessionId(activeSessionId, team)
  const canWrite = Boolean(activeWorkspaceId && issuerSessionId && window.electronAPI)

  const statusOptions = useMemo(() => {
    return sessionStatuses ?? []
  }, [sessionStatuses])

  const load = useCallback(async () => {
    if (!activeWorkspaceId || !window.electronAPI) {
      setLoadResult(null)
      setTeam(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const [nextRules, nextTeam] = await Promise.all([
        window.electronAPI.getTeamRules(activeWorkspaceId),
        window.electronAPI.getTeam(activeWorkspaceId),
      ])
      setLoadResult(nextRules)
      setTeam(nextTeam)
      setIdentityTags(getEditableIdentityTags(nextRules.rules, nextTeam))
      setStatusMap(getEditableStatusMap(nextRules.rules, nextTeam))
      setManagerContextPolicy(getEditableManagerContextPolicy(nextRules.rules, nextTeam))
      setNormsText(normsToText(getEditableNorms(nextRules.rules, nextTeam)))
      setError(nextRules.error ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const runTeamCommand = useCallback(async (patch: Omit<TeamRulesPatch, 'version' | 'teamId'>) => {
    if (!issuerSessionId) {
      throw new Error('先选中一个会话作为团队设置的操作者。')
    }
    await window.electronAPI.sessionCommand(issuerSessionId, {
      type: 'updateTeamRules',
      teamId,
      rules: cloneRulesPatch(teamId, patch),
    })
  }, [issuerSessionId, teamId])

  const savePatch = useCallback(async (
    patch: Omit<TeamRulesPatch, 'version' | 'teamId'>,
    successMessage: string,
  ) => {
    setIsSaving(true)
    try {
      await runTeamCommand(patch)
      await load()
      setError(null)
      toast.success(successMessage)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [load, runTeamCommand])

  const initializeRules = useCallback(async () => {
    await savePatch({}, '团队规则已初始化')
  }, [savePatch])

  const saveIdentityTags = useCallback(async (nextTags: TeamIdentityTag[]) => {
    setIdentityTags(nextTags)
    await savePatch({ identityTags: nextTags }, '身份标签已保存')
  }, [savePatch])

  const saveStatusMap = useCallback(async () => {
    await savePatch({ statusMap }, '状态映射已保存')
  }, [savePatch, statusMap])

  const saveManagerContextPolicy = useCallback(async () => {
    await savePatch({ managerContextPolicy }, '管理 Agent 上下文策略已保存')
  }, [managerContextPolicy, savePatch])

  const saveNorms = useCallback(async () => {
    await savePatch({ norms: textToNorms(normsText) }, '团队规范已保存')
  }, [normsText, savePatch])

  const addOrUpdateTag = useCallback(async () => {
    const next = upsertIdentityTag(identityTags, draftTag)
    if (next === identityTags) {
      setError('身份标签需要有效 ID 和名称。')
      return
    }
    await saveIdentityTags(next)
    setDraftTag({ id: '', displayName: '', systemPromptPreset: '' })
  }, [draftTag, identityTags, saveIdentityTags])

  const deleteTag = useCallback(async (tagId: string) => {
    if (tagId === 'leader') {
      setError('队长身份是保留身份，不能删除。')
      return
    }
    const nextTags = removeIdentityTag(identityTags, tagId)
    setIsSaving(true)
    try {
      await runTeamCommand({
        identityTags: nextTags,
        identityAssignments: pruneAssignmentsForRemovedTag(rules, tagId),
      })
      await load()
      setError(null)
      toast.success('身份标签已删除')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [identityTags, load, rules, runTeamCommand])

  const promoteLeader = useCallback(async (leaderSessionId: string | null) => {
    if (!issuerSessionId) {
      setError('先选中一个会话作为团队设置的操作者。')
      return
    }
    setIsSaving(true)
    try {
      await window.electronAPI.sessionCommand(issuerSessionId, {
        type: 'promoteTeamLeader',
        teamId,
        leaderSessionId,
      })
      await load()
      toast.success(leaderSessionId ? '队长已更新' : '队长已清空')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [issuerSessionId, load, teamId])

  const toggleMemberTag = useCallback(async (sessionId: string, tagId: string, assigned: boolean) => {
    if (!issuerSessionId) {
      setError('先选中一个会话作为团队设置的操作者。')
      return
    }
    setIsSaving(true)
    try {
      await window.electronAPI.sessionCommand(issuerSessionId, {
        type: 'changeTeamIdentityTag',
        teamId,
        targetSessionId: sessionId,
        tagId,
        action: assigned ? 'remove' : 'add',
      })
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }, [issuerSessionId, load, teamId])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title={t('settings.team.title')} actions={<HeaderMenu route={routes.view.settings('team')} />} />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <SettingsSection
                    title="团队规则"
                    description="团队规则保存在当前 Workspace 的 .fleet/team.rules.json，修改会走会话命令、权限和 timeline。"
                    action={
                      <Button variant="ghost" size="sm" onClick={() => void load()} disabled={isSaving}>
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        刷新
                      </Button>
                    }
                  >
                    <SettingsCard>
                      <SettingsRow label="规则状态" description={loadResult?.path ?? '未找到规则文件'}>
                        <span className="text-sm text-muted-foreground">
                          {loadResult?.source === 'disk' ? '已加载' : loadResult?.source === 'missing' ? '未初始化' : '需修复'}
                        </span>
                      </SettingsRow>
                      <SettingsRow label="当前队长" description={team?.leaderSessionId ? shortId(team.leaderSessionId) : '未设置'}>
                        <Button variant="ghost" size="sm" onClick={() => void promoteLeader(null)} disabled={!team?.leaderSessionId || isSaving || !canWrite}>
                          清空
                        </Button>
                      </SettingsRow>
                      <SettingsRow label="团队群聊" description={team?.teamConversationSessionId ? shortId(team.teamConversationSessionId) : '初始化后自动创建'}>
                        {!rules && (
                          <Button size="sm" onClick={() => void initializeRules()} disabled={!canWrite || isSaving}>
                            初始化
                          </Button>
                        )}
                      </SettingsRow>
                    </SettingsCard>
                    {error && <div className="mt-2 text-sm text-destructive">{error}</div>}
                    {!issuerSessionId && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        先选中一个会话，才能通过会话命令修改团队规则。
                      </div>
                    )}
                  </SettingsSection>

                  <SettingsSection
                    title="常驻管理 Agent"
                    description="软件级单一身份，消息入口属于“所有会话”的全局专栏；当前 Workspace 只保留内部投影。"
                  >
                    <SettingsCard>
                      <SettingsRow label="身份" description="固定 agentId；切换文件夹后仍是同一个软件管家。">
                        <span className="text-sm text-muted-foreground">manager:global</span>
                      </SettingsRow>
                      <SettingsRow label="消息入口" description="不放在单个 Workspace 会话里；后续在所有会话页提供常驻专栏。">
                        <span className="text-sm text-muted-foreground">全局专栏（未接入）</span>
                      </SettingsRow>
                      <SettingsRow label="内部投影锚点" description="每个 Workspace 一个 hidden 锚点，只挂 timeline 和待审路由，不承载用户对话。">
                        <span className="text-sm text-muted-foreground">{shortId(team?.managerProjectionSessionId)}</span>
                      </SettingsRow>
                      <SettingsRow label="权限边界" description="只允许低风险 L0/L1 自动；写文件、外发、删除、发布仍走确认。">
                        <span className="text-sm text-muted-foreground">不绕过 permission</span>
                      </SettingsRow>
                      <SettingsRow label="自动代理" description="后续接记忆和决策服务后，可代替人类回复队长或普通智能体。">
                        <span className="text-sm text-muted-foreground">未接入</span>
                      </SettingsRow>
                    </SettingsCard>
                  </SettingsSection>

                  <SettingsSection
                    title="上下文注入"
                    description="跨项目记录和用户长期偏好只由管理 Agent 注入；项目 Agent 不直接读取全局记忆。"
                  >
                    <SettingsCard>
                      <SettingsRow label="观察边界" description="有队长时只看队长摘要；无队长时才看普通成员摘要。">
                        <span className="text-sm text-muted-foreground">固定隔离</span>
                      </SettingsRow>
                      <SettingsRow label="长期偏好" description="用户风格、常用判断和软件偏好注入到谁的上下文。">
                        <select
                          value={managerContextPolicy.userPreferenceInjection}
                          onChange={event => setManagerContextPolicy(prev => ({ ...prev, userPreferenceInjection: event.target.value as TeamManagerContextPolicy['userPreferenceInjection'] }))}
                          disabled={isSaving}
                          className="h-8 min-w-[160px] rounded-md bg-muted/50 px-2 text-sm text-foreground outline-none shadow-minimal"
                        >
                          <option value="off">不注入</option>
                          <option value="leaderOnly">只给队长</option>
                          <option value="allMembers">给全体成员</option>
                        </select>
                      </SettingsRow>
                      <SettingsRow label="跨项目记录" description="其它项目沉淀的经验、风险和参考，只能给队长或关闭。">
                        <select
                          value={managerContextPolicy.crossProjectRecordInjection}
                          onChange={event => setManagerContextPolicy(prev => ({ ...prev, crossProjectRecordInjection: event.target.value as TeamManagerContextPolicy['crossProjectRecordInjection'] }))}
                          disabled={isSaving}
                          className="h-8 min-w-[160px] rounded-md bg-muted/50 px-2 text-sm text-foreground outline-none shadow-minimal"
                        >
                          <option value="off">不注入</option>
                          <option value="leaderOnly">只给队长</option>
                        </select>
                      </SettingsRow>
                      <SettingsToggle
                        label="深读成员上下文需要单独授权"
                        description="管理 Agent 要查看队员完整会话、文件或执行细节时，必须先走权限卡。"
                        checked={managerContextPolicy.deepMemberContextRequiresPermission}
                        onCheckedChange={deepMemberContextRequiresPermission => setManagerContextPolicy(prev => ({ ...prev, deepMemberContextRequiresPermission }))}
                        disabled={isSaving}
                      />
                    </SettingsCard>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => void saveManagerContextPolicy()} disabled={isSaving || !canWrite}>
                        保存上下文策略
                      </Button>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    title="成员与身份"
                    description="会话就是团队成员。身份标签用于系统提示词、分工和 @ 提及。"
                  >
                    <SettingsCard className="p-0">
                      {team?.members.length ? (
                        <div className="divide-y divide-border/50">
                          {team.members.map(member => (
                            <div key={member.sessionId} className="px-4 py-3.5">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-medium">{getMemberDisplayName(member)}</div>
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    {shortId(member.sessionId)} · 状态 {member.status ?? '未知'}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => void promoteLeader(member.sessionId)}
                                  disabled={member.isLeader || isSaving || !canWrite}
                                >
                                  设为队长
                                </Button>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-1.5">
                                {identityTags.map(tag => {
                                  const assigned = member.identityTagIds.includes(tag.id)
                                  return (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      onClick={() => void toggleMemberTag(member.sessionId, tag.id, assigned)}
                                      disabled={isSaving || !canWrite}
                                      className={`rounded-full border px-2 py-1 text-xs transition-colors ${
                                        assigned
                                          ? 'border-foreground/20 bg-foreground text-background'
                                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                                      } disabled:cursor-not-allowed disabled:opacity-50`}
                                    >
                                      {tag.displayName}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <SettingsCardContent>
                          <div className="text-sm text-muted-foreground">暂无团队成员。先在会话列表把一个会话设为队长。</div>
                        </SettingsCardContent>
                      )}
                    </SettingsCard>
                  </SettingsSection>

                  <SettingsSection
                    title="身份标签"
                    description="旧标签继续用于整理；这里的身份标签用于团队角色和提示词注入。"
                  >
                    <SettingsCard divided={false}>
                      <div className="divide-y divide-border/50">
                        {identityTags.map(tag => (
                          <div key={tag.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
                            <div className="min-w-0">
                              <div className="text-sm font-medium">{tag.displayName}</div>
                              <div className="mt-0.5 text-xs text-muted-foreground">{tag.id}</div>
                              {tag.systemPromptPreset && (
                                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{tag.systemPromptPreset}</div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void deleteTag(tag.id)}
                              disabled={tag.id === 'leader' || isSaving || !canWrite}
                              aria-label={`删除 ${tag.displayName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="grid gap-3 border-t border-border/50 px-4 py-3.5 md:grid-cols-[140px_160px_1fr]">
                        <SettingsInput value={draftTag.id} onChange={id => setDraftTag(prev => ({ ...prev, id }))} placeholder="code / design" />
                        <SettingsInput value={draftTag.displayName} onChange={displayName => setDraftTag(prev => ({ ...prev, displayName }))} placeholder="身份名称" />
                        <SettingsInput value={draftTag.systemPromptPreset ?? ''} onChange={systemPromptPreset => setDraftTag(prev => ({ ...prev, systemPromptPreset }))} placeholder="系统提示词，可选" />
                      </div>
                      <SettingsCardFooter>
                        <Button size="sm" onClick={() => void addOrUpdateTag()} disabled={isSaving || !canWrite}>
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                          保存身份
                        </Button>
                      </SettingsCardFooter>
                    </SettingsCard>
                  </SettingsSection>

                  <SettingsSection
                    title="状态映射"
                    description="团队语义映射到现有会话状态，不新增第二套状态。"
                  >
                    <SettingsCard>
                      {TEAM_STATUS_FIELDS.map(field => (
                        <SettingsRow key={field.key} label={field.label} description={field.description}>
                          <select
                            value={statusMap[field.key]}
                            onChange={event => setStatusMap(prev => ({ ...prev, [field.key]: event.target.value }))}
                            disabled={isSaving}
                            className="h-8 min-w-[160px] rounded-md bg-muted/50 px-2 text-sm text-foreground outline-none shadow-minimal"
                          >
                            {statusOptions.length === 0 && <option value={statusMap[field.key]}>{statusMap[field.key]}</option>}
                            {statusOptions.map(status => (
                              <option key={status.id} value={status.id}>{status.label}</option>
                            ))}
                          </select>
                        </SettingsRow>
                      ))}
                    </SettingsCard>
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" onClick={() => void saveStatusMap()} disabled={isSaving || !canWrite}>
                        保存状态映射
                      </Button>
                    </div>
                  </SettingsSection>

                  <SettingsSection
                    title="团队规范"
                    description="队长可以给全员下规范；这里保存默认规范，后续团队消息会引用。"
                  >
                    <SettingsCard divided={false}>
                      <SettingsTextarea
                        value={normsText}
                        onChange={setNormsText}
                        rows={6}
                        inCard
                        placeholder="每行一条规范，例如：动共享协议先找 Lead；完成后按 docs/32 汇报。"
                      />
                      <SettingsCardFooter>
                        <Button size="sm" onClick={() => void saveNorms()} disabled={isSaving || !canWrite}>
                          保存规范
                        </Button>
                      </SettingsCardFooter>
                    </SettingsCard>
                  </SettingsSection>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

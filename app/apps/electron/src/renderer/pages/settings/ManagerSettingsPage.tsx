import * as React from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Brain, ShieldCheck, Plus, Trash2, RefreshCw } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SettingsSection, SettingsCard, SettingsToggle, SettingsInput } from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import {
  MEMORY_PARTITIONS,
  isScopedPartition,
  type AutoDecisionSettings,
  type AutoDecisionRule,
  type MemoryEntry,
  type MemoryPartition,
} from '@craft-agent/shared/protocol'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'managerAgent',
}

const PARTITION_LABEL: Record<MemoryPartition, string> = {
  user: '用户长期',
  software: '软件状态',
  project: '项目',
  agent: 'Agent',
  task: '任务',
  design_asset: '设计资产',
  external_review: '外部审查',
}

const DEFAULT_SETTINGS: AutoDecisionSettings = { enabled: false, autoL1: true, rules: [] }

export default function ManagerSettingsPage(): React.ReactElement {
  const { activeWorkspaceId } = useAppShellContext()
  const [settings, setSettings] = useState<AutoDecisionSettings>(DEFAULT_SETTINGS)
  const [memory, setMemory] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  // 新规则表单
  const [rulePrefix, setRulePrefix] = useState('')
  const [ruleReason, setRuleReason] = useState('')
  // 新记忆表单
  const [memPartition, setMemPartition] = useState<MemoryPartition>('user')
  const [memContent, setMemContent] = useState('')
  const [memScopeId, setMemScopeId] = useState('')

  const load = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setLoading(true)
    try {
      setSettings(await window.electronAPI.getManagerDecisionSettings(activeWorkspaceId))
      // 默认列用户/软件分区记忆（非 scoped，无需 scopeId）
      setMemory(await window.electronAPI.listMemory(activeWorkspaceId, { partition: 'user' }))
    } catch (error) {
      toast.error(`加载失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [activeWorkspaceId])

  useEffect(() => { void load() }, [load])

  const persist = useCallback(async (patch: Partial<AutoDecisionSettings>) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    try {
      setSettings(await window.electronAPI.updateManagerDecisionSettings(activeWorkspaceId, patch))
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeWorkspaceId])

  const addRule = useCallback(async (grants: 'allow' | 'deny') => {
    const prefix = rulePrefix.trim()
    if (!prefix) { toast.error('请填动作前缀，例如 write_file:'); return }
    const rule: AutoDecisionRule = {
      id: `rule-${Date.now()}`,
      actionPrefix: prefix,
      grants,
      maxLevel: 'L2',
      reason: ruleReason.trim() || `${grants === 'allow' ? '允许' : '禁止'} ${prefix}`,
    }
    await persist({ rules: [...settings.rules, rule] })
    setRulePrefix(''); setRuleReason('')
  }, [persist, rulePrefix, ruleReason, settings.rules])

  const removeRule = useCallback(async (id: string) => {
    await persist({ rules: settings.rules.filter(r => r.id !== id) })
  }, [persist, settings.rules])

  const addMemory = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    const content = memContent.trim()
    if (!content) { toast.error('记忆内容不能为空'); return }
    if (isScopedPartition(memPartition) && !memScopeId.trim()) { toast.error(`${PARTITION_LABEL[memPartition]} 分区需要 scopeId（按归属隔离）`); return }
    try {
      await window.electronAPI.addMemory(activeWorkspaceId, {
        partition: memPartition,
        content,
        scopeId: memScopeId.trim() || undefined,
      })
      setMemContent(''); setMemScopeId('')
      await refreshMemory(memPartition, memScopeId.trim() || undefined)
      toast.success('已记忆')
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeWorkspaceId, memContent, memPartition, memScopeId])

  const refreshMemory = useCallback(async (partition: MemoryPartition, scopeId?: string) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setMemory(await window.electronAPI.listMemory(activeWorkspaceId, { partition, scopeId }))
  }, [activeWorkspaceId])

  const removeMemory = useCallback(async (id: string) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    await window.electronAPI.deleteMemory(activeWorkspaceId, id)
    setMemory(prev => prev.filter(m => m.id !== id))
  }, [activeWorkspaceId])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="管理 Agent" />
      <ScrollArea className="flex-1">
        <div className="max-w-3xl mx-auto px-8 py-8 space-y-8">
          {/* 分级自动决策 */}
          <SettingsSection title="分级自动决策（D12）" description="开启后，管理 Agent 可按规则代答低风险（L2）权限请求；L3 不可逆动作永远问你，绝不绕过 permission。每次自动判断都写 timeline。">
            <SettingsCard>
              <SettingsToggle
                label="开启自动决策"
                description="默认关。关闭时所有关键动作都问你（行为与现在完全一致）。"
                checked={settings.enabled}
                onCheckedChange={(enabled) => void persist({ enabled })}
                disabled={loading}
              />
              <SettingsToggle
                label="L1 低风险按偏好自动"
                description="仅在已开启自动决策时生效。"
                checked={settings.autoL1}
                onCheckedChange={(autoL1) => void persist({ autoL1 })}
                disabled={loading || !settings.enabled}
              />
              <div className="px-4 py-3 border-t border-border/50">
                <div className="text-sm font-medium mb-2">L2 预授权规则</div>
                {settings.rules.length === 0 ? (
                  <div className="text-sm text-muted-foreground mb-3">还没有规则。没有匹配规则的 L2 动作会照常弹给你确认。</div>
                ) : (
                  <div className="space-y-1 mb-3">
                    {settings.rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between text-sm rounded-md bg-muted/40 px-3 py-2">
                        <span className="inline-flex items-center gap-2 min-w-0">
                          <ShieldCheck className={rule.grants === 'allow' ? 'h-4 w-4 text-emerald-500' : 'h-4 w-4 text-red-500'} />
                          <code className="truncate">{rule.actionPrefix}</code>
                          <span className="text-muted-foreground">· {rule.grants === 'allow' ? '允许' : '禁止'} · {rule.reason}</span>
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => void removeRule(rule.id)} aria-label="删除规则">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <SettingsInput inCard label="动作前缀" value={rulePrefix} onChange={setRulePrefix} placeholder="例如：write_file:  或  run_command:bun test" />
                  <SettingsInput inCard label="依据说明（可选）" value={ruleReason} onChange={setRuleReason} placeholder="例如：项目允许的格式化写入" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void addRule('allow')} disabled={!settings.enabled}><Plus className="h-4 w-4 mr-1" />允许规则</Button>
                    <Button size="sm" variant="outline" onClick={() => void addRule('deny')} disabled={!settings.enabled}><Plus className="h-4 w-4 mr-1" />禁止规则</Button>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </SettingsSection>

          {/* 分层记忆 */}
          <SettingsSection title="分层记忆（D2 · 可查可删）" description="管理 Agent 拥有的本地记忆。项目/任务/Agent 分区按 scopeId 隔离，跨项目默认不可见。全本地，可随时删除。">
            <SettingsCard>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  <select
                    className="text-sm bg-transparent border border-border rounded-md px-2 py-1"
                    value={memPartition}
                    onChange={(e) => { const p = e.target.value as MemoryPartition; setMemPartition(p); void refreshMemory(p, isScopedPartition(p) ? memScopeId.trim() || undefined : undefined) }}
                  >
                    {MEMORY_PARTITIONS.map(p => <option key={p} value={p}>{PARTITION_LABEL[p]}</option>)}
                  </select>
                  {isScopedPartition(memPartition) && (
                    <input
                      className="text-sm bg-transparent border border-border rounded-md px-2 py-1 w-40"
                      placeholder="scopeId（项目/任务 id）"
                      value={memScopeId}
                      onChange={(e) => setMemScopeId(e.target.value)}
                      onBlur={() => void refreshMemory(memPartition, memScopeId.trim() || undefined)}
                    />
                  )}
                </div>
                <Button size="sm" variant="ghost" onClick={() => void refreshMemory(memPartition, memScopeId.trim() || undefined)} disabled={loading}>
                  {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
              <div className="border-t border-border/50">
                {memory.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">该分区暂无记忆{isScopedPartition(memPartition) && !memScopeId.trim() ? '（scoped 分区需先填 scopeId）' : ''}。</div>
                ) : memory.map(entry => (
                  <div key={entry.id} className="flex items-start justify-between gap-2 px-4 py-2.5 border-t border-border/30 first:border-t-0">
                    <div className="min-w-0">
                      <div className="text-sm truncate">{entry.content}</div>
                      <div className="text-xs text-muted-foreground">{entry.tier} · 敏感度 {entry.sensitivity}{entry.scopeId ? ` · ${entry.scopeId}` : ''}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => void removeMemory(entry.id)} aria-label="删除记忆">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-border/50 flex flex-col gap-2">
                <SettingsInput inCard label="新增记忆" value={memContent} onChange={setMemContent} placeholder="例如：用户偏好 TypeScript + 严格类型" />
                <div className="flex justify-end">
                  <Button size="sm" variant="outline" onClick={() => void addMemory()}><Plus className="h-4 w-4 mr-1" />记住</Button>
                </div>
              </div>
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}

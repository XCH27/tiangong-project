import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Trash2 } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  SettingsCard,
  SettingsCardContent,
  SettingsInput,
  SettingsMenuSelectRow,
  SettingsSection,
  SettingsToggle,
} from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import {
  MEMORY_PARTITIONS,
  isScopedPartition,
  type MemoryEntry,
  type MemoryPartition,
} from '@craft-agent/shared/protocol'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'memory',
}

const PARTITION_LABEL: Record<MemoryPartition, string> = {
  user: '用户',
  software: '软件',
  project: '项目',
  agent: 'Agent',
  task: '任务',
  design_asset: '设计资产',
  external_review: '外部审查',
}

export default function MemorySettingsPage(): React.ReactElement {
  const { activeWorkspaceId } = useAppShellContext()
  const [enabled, setEnabled] = useState(true)
  const [partition, setPartition] = useState<MemoryPartition>('user')
  const [scopeId, setScopeId] = useState('')
  const [content, setContent] = useState('')
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [loading, setLoading] = useState(false)

  const queryScopeId = isScopedPartition(partition) ? scopeId.trim() || undefined : undefined

  const load = useCallback(async (nextPartition = partition, nextScopeId = queryScopeId) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setLoading(true)
    try {
      setEntries(await window.electronAPI.listMemory(activeWorkspaceId, {
        partition: nextPartition,
        scopeId: isScopedPartition(nextPartition) ? nextScopeId : undefined,
      }))
    } catch (error) {
      toast.error(`加载失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }, [activeWorkspaceId, partition, queryScopeId])

  const checkEnabled = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    try {
      const list = await window.electronAPI.listMemory(activeWorkspaceId, {
        partition: 'software',
        contains: 'memory_enabled',
      })
      const isDisabled = list.some(e => e.partition === 'software' && e.content === 'memory_enabled:false')
      setEnabled(!isDisabled)
    } catch (error) {
      console.error('Failed to check memory status:', error)
    }
  }, [activeWorkspaceId])

  useEffect(() => {
    void checkEnabled()
  }, [checkEnabled])

  useEffect(() => {
    if (enabled) {
      void load()
    } else {
      setEntries([])
    }
  }, [load, enabled])

  const partitionOptions = useMemo(() => MEMORY_PARTITIONS.map(value => ({
    value,
    label: PARTITION_LABEL[value],
  })), [])

  const handleToggle = useCallback(async (val: boolean) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    try {
      await window.electronAPI.addMemory(activeWorkspaceId, {
        partition: 'software',
        content: `memory_enabled:${val}`,
      })
      setEnabled(val)
      toast.success(val ? '分层记忆已启用' : '分层记忆已禁用')
    } catch (error) {
      toast.error(`设置更新失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeWorkspaceId])

  const handlePartitionChange = useCallback((value: string) => {
    const nextPartition = value as MemoryPartition
    setPartition(nextPartition)
    void load(nextPartition, isScopedPartition(nextPartition) ? scopeId.trim() || undefined : undefined)
  }, [load, scopeId])

  const addEntry = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    const trimmed = content.trim()
    if (!trimmed) {
      toast.error('记忆内容不能为空')
      return
    }
    if (isScopedPartition(partition) && !scopeId.trim()) {
      toast.error('当前分区需要归属 ID')
      return
    }

    try {
      await window.electronAPI.addMemory(activeWorkspaceId, {
        partition,
        scopeId: queryScopeId,
        content: trimmed,
      })
      setContent('')
      await load(partition, queryScopeId)
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeWorkspaceId, content, load, partition, queryScopeId, scopeId])

  const deleteEntry = useCallback(async (id: string) => {
    if (!window.electronAPI || !activeWorkspaceId) return
    try {
      await window.electronAPI.deleteMemory(activeWorkspaceId, id)
      setEntries(prev => prev.filter(entry => entry.id !== id))
    } catch (error) {
      toast.error(`删除失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }, [activeWorkspaceId])

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="记忆" />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-8">
          <SettingsSection title="配置">
            <SettingsCard>
              <SettingsToggle
                label="启用分层记忆"
                description="启用后，Agent 将在每个会话结束时自动抽取记忆，并在自动决策和检索中注入记忆作为依据"
                checked={enabled}
                onCheckedChange={handleToggle}
              />
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="本地记忆">
            <SettingsCard>
              <SettingsMenuSelectRow
                label="分区"
                description="按归属隔离"
                value={partition}
                onValueChange={handlePartitionChange}
                options={partitionOptions}
                menuWidth={220}
                disabled={!enabled}
              />
              {isScopedPartition(partition) && (
                <SettingsInput
                  inCard
                  label="归属 ID"
                  description="项目、任务和 Agent 记忆只在同归属内可见"
                  value={scopeId}
                  onChange={setScopeId}
                  onBlur={() => void load(partition, scopeId.trim() || undefined)}
                  placeholder="scope id"
                  disabled={!enabled}
                />
              )}
              <SettingsInput
                inCard
                label="新增记忆"
                value={content}
                onChange={setContent}
                placeholder="写入一条本地记忆"
                disabled={!enabled}
                action={
                  <Button variant="outline" onClick={() => void addEntry()} disabled={!enabled}>
                    记住
                  </Button>
                }
              />
            </SettingsCard>
          </SettingsSection>

          <SettingsSection
            title="已保存"
            action={
              <Button size="sm" variant="ghost" onClick={() => void load()} disabled={loading || !enabled}>
                {loading ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                刷新
              </Button>
            }
          >
            <SettingsCard className={cn(!enabled && 'opacity-50 pointer-events-none')}>
              {loading ? (
                <SettingsCardContent className="text-sm text-muted-foreground">
                  正在加载
                </SettingsCardContent>
              ) : entries.length === 0 ? (
                <SettingsCardContent className="text-sm text-muted-foreground">
                  暂无记忆。
                </SettingsCardContent>
              ) : entries.map(entry => (
                <div key={entry.id} className="px-4 py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm truncate">{entry.content}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {PARTITION_LABEL[entry.partition]} · {entry.tier}{entry.scopeId ? ` · ${entry.scopeId}` : ''}
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => void deleteEntry(entry.id)} aria-label="删除记忆" disabled={!enabled}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}

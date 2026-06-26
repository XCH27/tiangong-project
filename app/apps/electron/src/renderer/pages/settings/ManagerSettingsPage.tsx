import * as React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { SettingsSection, SettingsCard, SettingsToggle, SettingsInput, SettingsMenuSelectRow, SettingsSegmentedControl } from '@/components/settings'
import { useAppShellContext } from '@/context/AppShellContext'
import {
  MANAGER_AGENT_DEFAULT_EXIT_MODE,
  persistManagerAgentExitMode,
  readManagerAgentExitMode,
} from '@/components/app-shell/ManagerAgentLauncher'
import type { ManagerAgentExitMode } from '@/components/app-shell/ManagerAgentColumn'
import {
  type AutoDecisionSettings,
  type AutoDecisionRule,
} from '@craft-agent/shared/protocol'
import { DEFAULT_THINKING_LEVEL, THINKING_LEVELS } from '@craft-agent/shared/agent/thinking-levels'
import { getModelShortName, type ModelDefinition } from '@config/models'
import { getModelsForProviderType } from '@config/llm-connections'
import type { LlmConnectionWithStatus } from '../../../shared/types'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'managerAgent',
}

const DEFAULT_SETTINGS: AutoDecisionSettings = { enabled: false, autoL1: true, rules: [], model: { mode: 'workspace_default' } }

export default function ManagerSettingsPage(): React.ReactElement {
  const { t } = useTranslation()
  const { activeWorkspaceId, llmConnections, workspaceDefaultLlmConnection } = useAppShellContext()
  const [settings, setSettings] = useState<AutoDecisionSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)

  const [rulePrefix, setRulePrefix] = useState('')
  const [ruleReason, setRuleReason] = useState('')

  // Exit behavior is a renderer-local preference (no protocol channel): it only
  // affects whether minimizing the Manager Agent clears its conversation ref or
  // keeps it restorable. Persisted via the Manager Agent domain helper.
  const [exitMode, setExitMode] = useState<ManagerAgentExitMode>(MANAGER_AGENT_DEFAULT_EXIT_MODE)
  useEffect(() => {
    setExitMode(readManagerAgentExitMode())
  }, [])

  const onExitModeChange = useCallback((mode: ManagerAgentExitMode) => {
    setExitMode(mode)
    persistManagerAgentExitMode(mode)
  }, [])

  const load = useCallback(async () => {
    if (!window.electronAPI || !activeWorkspaceId) return
    setLoading(true)
    try {
      setSettings(await window.electronAPI.getManagerDecisionSettings(activeWorkspaceId))
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

  const managerModel = settings.model ?? { mode: 'workspace_default' as const }
  const effectiveConnection = useMemo(() => {
    if (managerModel.mode === 'api_connection' && managerModel.connectionSlug) {
      return llmConnections.find(connection => connection.slug === managerModel.connectionSlug)
    }
    if (workspaceDefaultLlmConnection) {
      return llmConnections.find(connection => connection.slug === workspaceDefaultLlmConnection)
    }
    return llmConnections.find(connection => connection.isDefault) ?? llmConnections[0]
  }, [llmConnections, managerModel.connectionSlug, managerModel.mode, workspaceDefaultLlmConnection])

  const modelOptions = useMemo(() => getModelOptionsForConnection(effectiveConnection), [effectiveConnection])

  const setManagerConnection = useCallback(async (value: string) => {
    if (value === 'workspace_default') {
      await persist({ model: { mode: 'workspace_default' } })
      return
    }
    const connection = llmConnections.find(candidate => candidate.slug === value)
    await persist({
      model: {
        mode: 'api_connection',
        connectionSlug: value,
        ...(connection?.defaultModel ? { model: connection.defaultModel } : {}),
        thinkingLevel: managerModel.thinkingLevel ?? DEFAULT_THINKING_LEVEL,
      },
    })
  }, [llmConnections, managerModel.thinkingLevel, persist])

  const setManagerModel = useCallback(async (value: string) => {
    if (managerModel.mode !== 'api_connection' || !managerModel.connectionSlug) return
    await persist({
      model: {
        ...managerModel,
        model: value === 'connection_default' ? undefined : value,
      },
    })
  }, [managerModel, persist])

  const setManagerThinking = useCallback(async (value: string) => {
    await persist({
      model: {
        ...managerModel,
        thinkingLevel: value === 'workspace_default' ? undefined : value as typeof THINKING_LEVELS[number]['id'],
      },
    })
  }, [managerModel, persist])

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

  return (
    <div className="h-full flex flex-col">
      <PanelHeader title="管理 Agent" />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-8">
          <SettingsSection title="模型">
            <SettingsCard>
              <SettingsMenuSelectRow
                label="连接"
                description="管理 Agent 的默认模型"
                value={managerModel.mode === 'api_connection' ? managerModel.connectionSlug ?? 'workspace_default' : 'workspace_default'}
                onValueChange={(value) => void setManagerConnection(value)}
                options={[
                  { value: 'workspace_default', label: '跟随工作区默认', description: effectiveConnection ? `${effectiveConnection.name} · ${effectiveConnection.defaultModel ?? '连接默认模型'}` : '未配置默认连接' },
                  ...llmConnections.map(connection => ({
                    value: connection.slug,
                    label: connection.name,
                    description: `${providerDescription(connection)}${connection.isAuthenticated ? '' : ' · 未认证'}${connection.defaultModel ? ` · ${getModelShortName(connection.defaultModel)}` : ''}`,
                  })),
                ]}
                disabled={loading}
                menuWidth={340}
                searchable
              />
              <SettingsMenuSelectRow
                label="模型"
                description="固定连接后可单独指定"
                value={managerModel.mode === 'api_connection' ? managerModel.model ?? 'connection_default' : 'connection_default'}
                onValueChange={(value) => void setManagerModel(value)}
                options={[
                  { value: 'connection_default', label: '连接默认模型', description: effectiveConnection?.defaultModel ? getModelShortName(effectiveConnection.defaultModel) : '由连接配置决定' },
                  ...modelOptions.map(option => ({
                    ...option,
                    description: option.descriptionKey ? t(option.descriptionKey) : option.description,
                  })),
                ]}
                disabled={loading || managerModel.mode !== 'api_connection' || !effectiveConnection}
                menuWidth={360}
                searchable
              />
              <SettingsMenuSelectRow
                label="推理强度"
                description="用于规划和权限解释"
                value={managerModel.thinkingLevel ?? 'workspace_default'}
                onValueChange={(value) => void setManagerThinking(value)}
                options={[
                  { value: 'workspace_default', label: '跟随工作区默认', description: '使用当前工作区的默认推理强度' },
                  ...THINKING_LEVELS.map(level => ({
                    value: level.id,
                    label: t(level.nameKey),
                    description: t(level.descriptionKey),
                  })),
                ]}
                disabled={loading}
                menuWidth={320}
              />
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="自动决策">
            <SettingsCard>
              <SettingsToggle
                label="开启自动决策"
                description="关闭时所有关键动作仍由你确认"
                checked={settings.enabled}
                onCheckedChange={(enabled) => void persist({ enabled })}
                disabled={loading}
              />
              <SettingsToggle
                label="低风险自动"
                description="仅限 L1 本地可回滚动作"
                checked={settings.autoL1}
                onCheckedChange={(autoL1) => void persist({ autoL1 })}
                disabled={loading || !settings.enabled}
              />
              <div className="px-4 py-3 border-t border-border/50">
                <div className="text-sm font-medium mb-2">预授权规则</div>
                {settings.rules.length === 0 ? (
                  <div className="text-sm text-muted-foreground mb-3">没有规则时，L2 动作仍会询问。</div>
                ) : (
                  <div className="space-y-1 mb-3">
                    {settings.rules.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between text-sm rounded-md bg-muted/40 px-3 py-2">
                        <span className="min-w-0 truncate">
                          <code>{rule.actionPrefix}</code>
                          <span className="text-muted-foreground"> · {rule.grants === 'allow' ? '允许' : '禁止'} · {rule.reason}</span>
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => void removeRule(rule.id)} aria-label="删除规则">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <SettingsInput inCard label="动作前缀" value={rulePrefix} onChange={setRulePrefix} placeholder="write_file:" />
                  <SettingsInput inCard label="依据" value={ruleReason} onChange={setRuleReason} placeholder="项目允许的格式化写入" />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void addRule('allow')} disabled={!settings.enabled}><Plus className="h-4 w-4 mr-1" />允许</Button>
                    <Button size="sm" variant="outline" onClick={() => void addRule('deny')} disabled={!settings.enabled}><Plus className="h-4 w-4 mr-1" />禁止</Button>
                  </div>
                </div>
              </div>
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="退出行为">
            <SettingsCard>
              <div className="px-4 py-3 space-y-2">
                <div className="text-sm font-medium">关闭管理 Agent 时</div>
                <SettingsSegmentedControl
                  value={exitMode}
                  onValueChange={onExitModeChange}
                  options={[
                    { value: 'persistent_mini', label: '常驻小窗' },
                    { value: 'direct_exit', label: '直接退出' },
                  ]}
                />
                <div className="text-xs text-muted-foreground">
                  {exitMode === 'persistent_mini'
                    ? '收起为常驻小窗，保留管理 Agent、长任务和通知状态，可重新唤起恢复对话。'
                    : '直接退出并清除当前管理对话引用，下次唤起从新对话开始。隐藏管理会话本身不会被删除。'}
                </div>
              </div>
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}

function getModelOptionsForConnection(
  connection: LlmConnectionWithStatus | undefined,
): Array<{ value: string; label: string; description: string; descriptionKey?: string }> {
  if (!connection) return []
  if (connection.models && connection.models.length > 0) {
    return connection.models.map(model => {
      if (typeof model === 'string') {
        return { value: model, label: getModelShortName(model), description: '' }
      }
      const definition = model as ModelDefinition
      return {
        value: definition.id,
        label: definition.name,
        description: definition.description,
        descriptionKey: definition.descriptionKey,
      }
    })
  }
  return getModelsForProviderType(connection.providerType, connection.piAuthProvider).map(model => ({
    value: model.id,
    label: model.name,
    description: model.description,
    descriptionKey: model.descriptionKey,
  }))
}

function providerDescription(connection: LlmConnectionWithStatus): string {
  if (connection.providerType === 'anthropic') return 'Anthropic'
  if (connection.providerType === 'pi') return 'Craft Agents Backend'
  if (connection.providerType === 'pi_compat') return connection.piAuthProvider ?? 'OpenAI-compatible'
  return connection.providerType || connection.type || 'Unknown'
}

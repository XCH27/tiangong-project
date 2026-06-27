import * as React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import { Check } from 'lucide-react'
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  SettingsMenuSelectRow,
  SettingsToggle,
  SettingsInput,
} from '@/components/settings'
import {
  StyledDropdownMenuItem,
  StyledDropdownMenuContent,
} from '@/components/ui/styled-dropdown'
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppShellContext } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { DetailsPageMeta } from '@/lib/navigation-registry'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'modelRouting',
}

interface ModelRoutingPrefs {
  mode: 'manual' | 'auto'
  cascade: { enabled: boolean; respectLatencySensitive: boolean }
  shaping: { rtk: boolean; codegraph: boolean; reasonixPrefix: boolean }
  agentPolicy: {
    manager: { connectionSlug: string; modelId: string }
    leader: { allowAuto: boolean; allowFusion: boolean; allowCli: boolean }
    executor: { allowAuto: boolean; allowCli: boolean; surfaceByTaskType?: Record<string, 'api' | 'cli'> }
  }
  fusion: {
    enabled: 'off' | 'on' | 'smart'
    preset: 'quality' | 'budget' | 'custom'
    panelSize: 2 | 3
    panelModels: string[]
    judgeModel: string
    writerModel: string
    budgetCap: { maxTokens: number; maxPanelists: number; perWorkspaceDaily?: number }
    scope: 'leader-only' | 'all-agents'
    verification: { enabled: boolean; models?: string[] }
  }
  cache: { exact: boolean; semantic: boolean; panelIntermediate: boolean }
}

const DEFAULT_PREFS: ModelRoutingPrefs = {
  mode: 'manual',
  cascade: { enabled: false, respectLatencySensitive: true },
  shaping: { rtk: false, codegraph: false, reasonixPrefix: false },
  agentPolicy: {
    manager: { connectionSlug: '', modelId: '' },
    leader: { allowAuto: true, allowFusion: true, allowCli: true },
    executor: { allowAuto: true, allowCli: true },
  },
  fusion: {
    enabled: 'off',
    preset: 'quality',
    panelSize: 2,
    panelModels: [],
    judgeModel: '',
    writerModel: '',
    budgetCap: { maxTokens: 50000, maxPanelists: 2 },
    scope: 'leader-only',
    verification: { enabled: false },
  },
  cache: { exact: true, semantic: false, panelIntermediate: false },
}

function mergePrefs(raw: unknown): ModelRoutingPrefs {
  if (!raw || typeof raw !== 'object') return DEFAULT_PREFS
  const r = raw as Partial<ModelRoutingPrefs>
  return {
    mode: r.mode === 'auto' ? 'auto' : 'manual',
    cascade: {
      enabled: r.cascade?.enabled ?? DEFAULT_PREFS.cascade.enabled,
      respectLatencySensitive: r.cascade?.respectLatencySensitive ?? DEFAULT_PREFS.cascade.respectLatencySensitive,
    },
    shaping: {
      rtk: r.shaping?.rtk ?? DEFAULT_PREFS.shaping.rtk,
      codegraph: r.shaping?.codegraph ?? DEFAULT_PREFS.shaping.codegraph,
      reasonixPrefix: r.shaping?.reasonixPrefix ?? DEFAULT_PREFS.shaping.reasonixPrefix,
    },
    agentPolicy: {
      manager: {
        connectionSlug: r.agentPolicy?.manager?.connectionSlug ?? '',
        modelId: r.agentPolicy?.manager?.modelId ?? '',
      },
      leader: {
        allowAuto: r.agentPolicy?.leader?.allowAuto ?? true,
        allowFusion: r.agentPolicy?.leader?.allowFusion ?? true,
        allowCli: r.agentPolicy?.leader?.allowCli ?? true,
      },
      executor: {
        allowAuto: r.agentPolicy?.executor?.allowAuto ?? true,
        allowCli: r.agentPolicy?.executor?.allowCli ?? true,
        surfaceByTaskType: r.agentPolicy?.executor?.surfaceByTaskType,
      },
    },
    fusion: {
      enabled: r.fusion?.enabled === 'on' ? 'on' : r.fusion?.enabled === 'smart' ? 'smart' : 'off',
      preset: r.fusion?.preset === 'budget' ? 'budget' : r.fusion?.preset === 'custom' ? 'custom' : 'quality',
      panelSize: r.fusion?.panelSize === 3 ? 3 : 2,
      panelModels: Array.isArray(r.fusion?.panelModels) ? r.fusion!.panelModels : [],
      judgeModel: r.fusion?.judgeModel ?? '',
      writerModel: r.fusion?.writerModel ?? '',
      budgetCap: {
        maxTokens: r.fusion?.budgetCap?.maxTokens ?? DEFAULT_PREFS.fusion.budgetCap.maxTokens,
        maxPanelists: r.fusion?.budgetCap?.maxPanelists ?? DEFAULT_PREFS.fusion.budgetCap.maxPanelists,
        perWorkspaceDaily: r.fusion?.budgetCap?.perWorkspaceDaily,
      },
      scope: r.fusion?.scope === 'all-agents' ? 'all-agents' : 'leader-only',
      verification: {
        enabled: r.fusion?.verification?.enabled ?? DEFAULT_PREFS.fusion.verification.enabled,
        models: r.fusion?.verification?.models,
      },
    },
    cache: {
      exact: r.cache?.exact ?? DEFAULT_PREFS.cache.exact,
      semantic: r.cache?.semantic ?? DEFAULT_PREFS.cache.semantic,
      panelIntermediate: r.cache?.panelIntermediate ?? DEFAULT_PREFS.cache.panelIntermediate,
    },
  }
}

export default function ModelRoutingSettingsPage() {
  const { t } = useTranslation()
  const { llmConnections } = useAppShellContext()
  const [prefs, setPrefs] = useState<ModelRoutingPrefs>(DEFAULT_PREFS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await window.electronAPI.readPreferences()
        const parsed = JSON.parse(result.content || '{}')
        setPrefs(mergePrefs(parsed.modelRouting))
      } catch (err) {
        console.error('Failed to load model routing preferences:', err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const savePrefs = useCallback(async (next: ModelRoutingPrefs) => {
    setPrefs(next)
    try {
      const result = await window.electronAPI.readPreferences()
      const existing = JSON.parse(result.content || '{}')
      existing.modelRouting = next
      existing.updatedAt = Date.now()
      const writeResult = await window.electronAPI.writePreferences(JSON.stringify(existing, null, 2))
      if (!writeResult.success) {
        toast.error(t('settings.modelRouting.saveFailed'))
      }
    } catch (err) {
      console.error('Failed to save model routing preferences:', err)
      toast.error(t('settings.modelRouting.saveFailed'))
    }
  }, [t])

  const modelOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = []
    const seen = new Set<string>()
    for (const conn of llmConnections) {
      const models = conn.models || []
      for (const m of models) {
        const id = typeof m === 'string' ? m : m.id
        const name = typeof m === 'string' ? m : (m.name ?? m.id)
        if (id && !seen.has(id)) {
          seen.add(id)
          opts.push({ value: id, label: name })
        }
      }
    }
    return opts
  }, [llmConnections])

  const panelModelLabel = useMemo(() => {
    if (prefs.fusion.panelModels.length === 0) return t('settings.modelRouting.noneSelected')
    const names = prefs.fusion.panelModels.map(id => {
      const opt = modelOptions.find(o => o.value === id)
      return opt?.label ?? id
    })
    return names.join(', ')
  }, [prefs.fusion.panelModels, modelOptions, t])

  const togglePanelModel = useCallback((modelId: string) => {
    const current = prefs.fusion.panelModels
    const next = current.includes(modelId)
      ? current.filter(m => m !== modelId)
      : [...current, modelId]
    savePrefs({
      ...prefs,
      fusion: { ...prefs.fusion, panelModels: next },
    })
  }, [prefs, savePrefs])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <PanelHeader title={t('settings.modelRouting.title')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <PanelHeader
        title={t('settings.modelRouting.title')}
        actions={<HeaderMenu route={routes.view.settings('modelRouting')} />}
      />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">

              <SettingsSection
                title={t('settings.modelRouting.routingTitle')}
                description={t('settings.modelRouting.routingDesc')}
              >
                <SettingsCard>
                  <SettingsMenuSelectRow
                    label={t('settings.modelRouting.mode')}
                    description={t('settings.modelRouting.modeDesc')}
                    value={prefs.mode}
                    onValueChange={(v) => savePrefs({ ...prefs, mode: v as 'manual' | 'auto' })}
                    options={[
                      { value: 'manual', label: t('settings.modelRouting.manual'), description: t('settings.modelRouting.manualDesc') },
                      { value: 'auto', label: t('settings.modelRouting.auto'), description: t('settings.modelRouting.autoDesc') },
                    ]}
                  />
                  <SettingsToggle
                    label={t('settings.modelRouting.cascade')}
                    description={t('settings.modelRouting.cascadeDesc')}
                    checked={prefs.cascade.enabled}
                    onCheckedChange={(v) => savePrefs({
                      ...prefs,
                      cascade: { ...prefs.cascade, enabled: v },
                    })}
                  />
                  {prefs.cascade.enabled && (
                    <SettingsToggle
                      label={t('settings.modelRouting.latencySensitive')}
                      description={t('settings.modelRouting.latencySensitiveDesc')}
                      checked={prefs.cascade.respectLatencySensitive}
                      onCheckedChange={(v) => savePrefs({
                        ...prefs,
                        cascade: { ...prefs.cascade, respectLatencySensitive: v },
                      })}
                    />
                  )}
                </SettingsCard>
              </SettingsSection>

              <SettingsSection
                title={t('settings.fusion.title')}
                description={t('settings.fusion.description')}
              >
                <SettingsCard>
                  <SettingsMenuSelectRow
                    label={t('settings.fusion.enabled')}
                    description={t('settings.fusion.enabledDesc')}
                    value={prefs.fusion.enabled}
                    onValueChange={(v) => savePrefs({
                      ...prefs,
                      fusion: { ...prefs.fusion, enabled: v as 'off' | 'on' | 'smart' },
                    })}
                    options={[
                      { value: 'off', label: t('settings.fusion.off'), description: t('settings.fusion.offDesc') },
                      { value: 'on', label: t('settings.fusion.on'), description: t('settings.fusion.onDesc') },
                      { value: 'smart', label: t('settings.fusion.smart'), description: t('settings.fusion.smartDesc') },
                    ]}
                  />

                  {prefs.fusion.enabled !== 'off' && (
                    <>
                      <SettingsMenuSelectRow
                        label={t('settings.fusion.preset')}
                        description={t('settings.fusion.presetDesc')}
                        value={prefs.fusion.preset}
                        onValueChange={(v) => savePrefs({
                          ...prefs,
                          fusion: { ...prefs.fusion, preset: v as 'quality' | 'budget' | 'custom' },
                        })}
                        options={[
                          { value: 'quality', label: t('settings.fusion.presetQuality') },
                          { value: 'budget', label: t('settings.fusion.presetBudget') },
                          { value: 'custom', label: t('settings.fusion.presetCustom') },
                        ]}
                      />

                      <SettingsMenuSelectRow
                        label={t('settings.fusion.panelSize')}
                        description={t('settings.fusion.panelSizeDesc')}
                        value={String(prefs.fusion.panelSize)}
                        onValueChange={(v) => savePrefs({
                          ...prefs,
                          fusion: { ...prefs.fusion, panelSize: Number(v) as 2 | 3 },
                        })}
                        options={[
                          { value: '2', label: '2' },
                          { value: '3', label: '3' },
                        ]}
                      />

                      <SettingsRow
                        label={t('settings.fusion.panelModels')}
                        description={t('settings.fusion.panelModelsDesc')}
                      >
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex items-center h-8 px-3 gap-1 text-sm rounded-lg bg-background shadow-minimal hover:bg-foreground/[0.02] transition-colors max-w-[280px]"
                            >
                              <span className="truncate">{panelModelLabel}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <StyledDropdownMenuContent align="end" sideOffset={4} className="min-w-[240px] max-h-64 overflow-auto">
                            {modelOptions.length === 0 ? (
                              <div className="px-2.5 py-3 text-sm text-muted-foreground text-center">
                                {t('settings.fusion.noModels')}
                              </div>
                            ) : (
                              modelOptions.map((opt) => {
                                const isSelected = prefs.fusion.panelModels.includes(opt.value)
                                return (
                                  <StyledDropdownMenuItem
                                    key={opt.value}
                                    onSelect={(e) => { e.preventDefault(); togglePanelModel(opt.value) }}
                                    className="flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer"
                                  >
                                    <span className="text-sm flex-1 min-w-0 truncate">{opt.label}</span>
                                    {isSelected && <Check className="size-4 text-foreground shrink-0 ml-2" />}
                                  </StyledDropdownMenuItem>
                                )
                              })
                            )}
                          </StyledDropdownMenuContent>
                        </DropdownMenu>
                      </SettingsRow>

                      <SettingsMenuSelectRow
                        label={t('settings.fusion.judgeModel')}
                        description={t('settings.fusion.judgeModelDesc')}
                        value={prefs.fusion.judgeModel}
                        onValueChange={(v) => savePrefs({
                          ...prefs,
                          fusion: { ...prefs.fusion, judgeModel: v },
                        })}
                        options={modelOptions}
                        placeholder={t('settings.fusion.selectModel')}
                      />

                      <SettingsMenuSelectRow
                        label={t('settings.fusion.writerModel')}
                        description={t('settings.fusion.writerModelDesc')}
                        value={prefs.fusion.writerModel}
                        onValueChange={(v) => savePrefs({
                          ...prefs,
                          fusion: { ...prefs.fusion, writerModel: v },
                        })}
                        options={modelOptions}
                        placeholder={t('settings.fusion.selectModel')}
                      />

                      <SettingsInput
                        label={t('settings.fusion.budgetTokens')}
                        description={t('settings.fusion.budgetTokensDesc')}
                        value={String(prefs.fusion.budgetCap.maxTokens)}
                        onChange={(v) => {
                          const num = parseInt(v, 10)
                          if (!isNaN(num) && num > 0) {
                            savePrefs({
                              ...prefs,
                              fusion: {
                                ...prefs.fusion,
                                budgetCap: { ...prefs.fusion.budgetCap, maxTokens: num },
                              },
                            })
                          }
                        }}
                      />

                      <SettingsMenuSelectRow
                        label={t('settings.fusion.scope')}
                        description={t('settings.fusion.scopeDesc')}
                        value={prefs.fusion.scope}
                        onValueChange={(v) => savePrefs({
                          ...prefs,
                          fusion: { ...prefs.fusion, scope: v as 'leader-only' | 'all-agents' },
                        })}
                        options={[
                          { value: 'leader-only', label: t('settings.fusion.scopeLeader') },
                          { value: 'all-agents', label: t('settings.fusion.scopeAll') },
                        ]}
                      />

                      <SettingsToggle
                        label={t('settings.fusion.verification')}
                        description={t('settings.fusion.verificationDesc')}
                        checked={prefs.fusion.verification.enabled}
                        onCheckedChange={(v) => savePrefs({
                          ...prefs,
                          fusion: {
                            ...prefs.fusion,
                            verification: { ...prefs.fusion.verification, enabled: v },
                          },
                        })}
                      />
                    </>
                  )}
                </SettingsCard>
              </SettingsSection>

              <SettingsSection
                title={t('settings.modelRouting.cacheTitle')}
                description={t('settings.modelRouting.cacheDesc')}
              >
                <SettingsCard>
                  <SettingsToggle
                    label={t('settings.modelRouting.cacheExact')}
                    description={t('settings.modelRouting.cacheExactDesc')}
                    checked={prefs.cache.exact}
                    onCheckedChange={(v) => savePrefs({
                      ...prefs,
                      cache: { ...prefs.cache, exact: v },
                    })}
                  />
                  <SettingsToggle
                    label={t('settings.modelRouting.cacheSemantic')}
                    description={t('settings.modelRouting.cacheSemanticDesc')}
                    checked={prefs.cache.semantic}
                    onCheckedChange={(v) => savePrefs({
                      ...prefs,
                      cache: { ...prefs.cache, semantic: v },
                    })}
                  />
                  <SettingsToggle
                    label={t('settings.modelRouting.cachePanel')}
                    description={t('settings.modelRouting.cachePanelDesc')}
                    checked={prefs.cache.panelIntermediate}
                    onCheckedChange={(v) => savePrefs({
                      ...prefs,
                      cache: { ...prefs.cache, panelIntermediate: v },
                    })}
                  />
                </SettingsCard>
              </SettingsSection>

            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

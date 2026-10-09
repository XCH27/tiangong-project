/**
 * PluginsSettingsPage
 *
 * One settings page on the existing navigator. Five views and the Market
 * content filters use the same state as the host loadout. Install, enable,
 * and disable write through HostTurnKernel. Later plugin phases stay Locked.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import {
  LOCKED_PLUGIN_PHASES,
  MARKET_CONTENT_FILTERS,
  PLUGIN_SETTINGS_SESSION_ID,
  PLUGIN_VIEWS,
  entriesForView,
  loadoutRecord,
  parseMarketFilter,
  parsePluginView,
  pluginLoadoutPath,
  pluginPhaseStatus,
  projectWorkspacePlugins,
  selectMarketFilter,
  selectPluginView,
  type MarketContentFilter,
  type PluginCatalogEntry,
  type PluginLoadoutFile,
  type PluginMutationName,
  type PluginView,
  emptyPluginLoadout,
} from '@craft-agent/shared/protocol/plugin-settings'
import {
  applyPluginMutationFromHuman,
  createPluginSettingsHost,
  readPluginLoadout,
} from '@craft-agent/shared/protocol/plugin-settings-host'
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
  SettingsSegmentedControl,
  SettingsToggle,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'plugins',
}

const desktopActor = { kind: 'human' as const, id: 'desktop-user', displayName: 'Desktop' }

export default function PluginsSettingsPage() {
  const { t } = useTranslation()
  const shell = useOptionalAppShellContext()
  const workspace = shell?.workspaces.find((item) => item.id === shell.activeWorkspaceId) ?? null
  const filePath = workspace ? pluginLoadoutPath(workspace.rootPath) : null
  const host = useMemo(() => createPluginSettingsHost(), [])
  const invocationCount = useRef(0)
  const [view, setView] = useState<PluginView>('installed')
  const [marketFilter, setMarketFilter] = useState<MarketContentFilter>('all')
  const [loadout, setLoadout] = useState<PluginLoadoutFile>(emptyPluginLoadout())

  const catalog = useMemo(() => projectWorkspacePlugins({
    skills: (shell?.skills ?? []).map((skill) => ({
      slug: skill.slug,
      name: skill.metadata.name,
      description: skill.metadata.description,
    })),
    sources: (shell?.enabledSources ?? []).map((source) => ({
      slug: source.config.slug,
      name: source.config.name,
      type: source.config.type,
      description: source.config.tagline,
    })),
  }), [shell?.skills, shell?.enabledSources])

  useEffect(() => {
    if (!filePath) {
      setLoadout(emptyPluginLoadout())
      return
    }
    const read = readPluginLoadout(filePath)
    if (read.status === 'ok' || read.status === 'missing') setLoadout(read.loadout)
  }, [filePath])

  const state = selectMarketFilter(
    selectPluginView({ view: 'installed', marketFilter: 'all', catalog, loadout }, view),
    marketFilter,
  )
  const entries = entriesForView(state)

  const changeView = useCallback((next: string) => {
    const parsed = parsePluginView(next)
    if (parsed) setView(parsed)
  }, [])

  const changeFilter = useCallback((next: string) => {
    const parsed = parseMarketFilter(next)
    if (parsed) setMarketFilter(parsed)
  }, [])

  const mutate = useCallback(async (op: PluginMutationName, pluginId: string) => {
    if (!filePath) return
    invocationCount.current += 1
    const result = await applyPluginMutationFromHuman(host, {
      op,
      pluginId,
      invocationId: `plugin-${invocationCount.current}`,
      sessionId: PLUGIN_SETTINGS_SESSION_ID,
      actor: desktopActor,
      filePath,
      catalog,
    })
    if (result.status === 'completed') {
      setLoadout(result.loadout)
      return
    }
    if (result.status === 'Locked') {
      toast.message(t(lockedLabelKey(result.phase)))
    }
  }, [catalog, filePath, host, t])

  return (
    <div className="h-full flex flex-col" data-plugin-view={view} data-market-filter={marketFilter}>
      <PanelHeader
        title={t('settings.plugins.title')}
        actions={<HeaderMenu route={routes.view.settings('plugins')} helpFeature="app-settings" />}
      />
      <div className="flex-1 min-h-0 mask-fade-y">
        <ScrollArea className="h-full">
          <div className="px-5 py-7 max-w-3xl mx-auto">
            <div className="space-y-8">
              <div className="text-sm text-muted-foreground -mt-3">
                {t('settings.plugins.manageDesc')}
              </div>

              <SettingsSection title={t('settings.plugins.title')}>
                <SettingsCard>
                  <div className="px-4 py-3.5">
                    <SettingsSegmentedControl
                      value={view}
                      onValueChange={changeView}
                      className="flex-wrap"
                      options={PLUGIN_VIEWS.map((item) => ({
                        value: item,
                        label: viewLabel(item, t),
                      }))}
                    />
                  </div>
                  {view === 'market' && (
                    <div className="px-4 py-3.5">
                      <SettingsSegmentedControl
                        value={marketFilter}
                        onValueChange={changeFilter}
                        size="sm"
                        className="flex-wrap"
                        options={MARKET_CONTENT_FILTERS.map((item) => ({
                          value: item,
                          label: filterLabel(item, t),
                        }))}
                      />
                    </div>
                  )}
                </SettingsCard>
              </SettingsSection>

              <SettingsSection title={viewLabel(view, t)}>
                <SettingsCard>
                  {entries.length === 0 ? (
                    <SettingsRow label={t('settings.plugins.empty')} />
                  ) : entries.map((entry) => (
                    <PluginEntryRow
                      key={entry.id}
                      entry={entry}
                      installed={loadoutRecord(loadout, entry.id)?.installed === true}
                      enabled={loadoutRecord(loadout, entry.id)?.enabled === true}
                      canWrite={filePath !== null}
                      installLabel={t('settings.plugins.install')}
                      lockedLabel={t('settings.plugins.statusLocked')}
                      onInstall={() => { void mutate('install', entry.id) }}
                      onEnabledChange={(checked) => { void mutate(checked ? 'enable' : 'disable', entry.id) }}
                    />
                  ))}
                </SettingsCard>
              </SettingsSection>

              <SettingsSection title={t('settings.plugins.statusLocked')} description={t('settings.plugins.manageDesc')}>
                <SettingsCard>
                  {LOCKED_PLUGIN_PHASES.map((phase) => (
                    <SettingsRow
                      key={phase}
                      label={t(lockedLabelKey(phase))}
                      description={t(lockedDescriptionKey(phase))}
                      action={<span className="text-xs text-muted-foreground">{pluginPhaseStatus(phase)}</span>}
                    />
                  ))}
                </SettingsCard>
              </SettingsSection>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

function PluginEntryRow({
  entry,
  installed,
  enabled,
  canWrite,
  installLabel,
  lockedLabel,
  onInstall,
  onEnabledChange,
}: {
  entry: PluginCatalogEntry
  installed: boolean
  enabled: boolean
  canWrite: boolean
  installLabel: string
  lockedLabel: string
  onInstall: () => void
  onEnabledChange: (checked: boolean) => void
}) {
  const thirdPartyHook = entry.kind === 'hook' && entry.trust === 'third_party'
  if (!installed) {
    return (
      <SettingsRow
        label={entry.name}
        description={entry.description}
        action={(
          <Button variant="secondary" size="sm" disabled={!canWrite} onClick={onInstall}>
            {installLabel}
          </Button>
        )}
      />
    )
  }
  if (thirdPartyHook) {
    return (
      <SettingsRow
        label={entry.name}
        description={entry.description}
        action={<span className="text-xs text-muted-foreground">{lockedLabel}</span>}
      />
    )
  }
  return (
    <SettingsToggle
      label={entry.name}
      description={entry.description}
      checked={enabled}
      disabled={!canWrite}
      onCheckedChange={onEnabledChange}
    />
  )
}

function viewLabel(view: PluginView, t: (key: string) => string): string {
  switch (view) {
    case 'installed':
      return t('settings.plugins.view.installed')
    case 'market':
      return t('settings.plugins.view.market')
    case 'skills':
      return t('settings.plugins.view.skills')
    case 'mcp':
      return t('settings.plugins.view.mcp')
    case 'hooks':
      return t('settings.plugins.view.hooks')
    default: {
      const unexpected: never = view
      return unexpected
    }
  }
}

function filterLabel(filter: MarketContentFilter, t: (key: string) => string): string {
  switch (filter) {
    case 'all':
      return t('settings.plugins.filter.all')
    case 'skill':
      return t('settings.plugins.filter.skill')
    case 'mcp':
      return t('settings.plugins.filter.mcp')
    case 'hook':
      return t('settings.plugins.filter.hook')
    case 'command':
      return t('settings.plugins.filter.command')
    default: {
      const unexpected: never = filter
      return unexpected
    }
  }
}

function lockedLabelKey(phase: (typeof LOCKED_PLUGIN_PHASES)[number]): string {
  switch (phase) {
    case 'mcp_registry_catalogs':
      return 'settings.plugins.locked.mcpRegistry'
    case 'third_party_hook_approval':
      return 'settings.plugins.locked.hooks'
    case 'mcp_apps_side_pane':
      return 'settings.plugins.locked.mcpApps'
    case 'agent_plugins_1_0_0':
      return 'settings.plugins.locked.agentPlugins'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

function lockedDescriptionKey(phase: (typeof LOCKED_PLUGIN_PHASES)[number]): string {
  switch (phase) {
    case 'mcp_registry_catalogs':
      return 'settings.plugins.locked.mcpRegistryDesc'
    case 'third_party_hook_approval':
      return 'settings.plugins.locked.hooksDesc'
    case 'mcp_apps_side_pane':
      return 'settings.plugins.locked.mcpAppsDesc'
    case 'agent_plugins_1_0_0':
      return 'settings.plugins.locked.agentPluginsDesc'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

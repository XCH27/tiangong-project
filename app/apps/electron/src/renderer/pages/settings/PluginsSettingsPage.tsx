/**
 * PluginsSettingsPage
 *
 * One settings page on the existing navigator. Five views, Market content
 * filters, and catalog source filters list workspace skills, MCP sources,
 * and catalog reads. Install, enable, and disable do not run here. This
 * page does not construct createPluginSettingsHost and does not write
 * .claude-plugin/loadout.json. It does not render the Craft session
 * permission card. The MCP Apps side pane opens on the existing right
 * sidebar and reads the loadout. It does not construct a host kernel. Its
 * sandboxed app view stays Locked. A local Agent Plugins 1.0.0 package is
 * listed when a skill or MCP server maps onto the loadout shape. This page
 * does not open a remote store.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { useNavigation, useNavigationState } from '@/contexts/NavigationContext'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import {
  LOCKED_PLUGIN_PHASES,
  MARKET_CONTENT_FILTERS,
  PLUGIN_VIEWS,
  entriesForView,
  loadoutRecord,
  parseMarketFilter,
  parsePluginView,
  pluginLoadoutPath,
  pluginPhaseStatus,
  selectMarketFilter,
  selectPluginView,
  type MarketContentFilter,
  type PluginCatalogEntry,
  type PluginLoadoutFile,
  type PluginView,
  emptyPluginLoadout,
} from '@craft-agent/shared/protocol/plugin-settings'
import {
  AGENT_PLUGINS_SOURCE,
  CATALOG_SOURCE_KINDS,
  MCP_REGISTRY_LIST_URL,
  MCP_REGISTRY_SOURCE,
  catalogSourceStatus,
  listCatalogMarket,
  parseCatalogSourceKind,
  readCatalogSource,
  type CatalogRead,
  type CatalogSourceKind,
} from '@craft-agent/shared/protocol/plugin-catalog-sources'
import { readPluginLoadout } from '@craft-agent/shared/protocol/plugin-settings-host'
import {
  SettingsCard,
  SettingsRow,
  SettingsSection,
  SettingsSegmentedControl,
} from '@/components/settings'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'plugins',
}

export default function PluginsSettingsPage() {
  const { t } = useTranslation()
  const shell = useOptionalAppShellContext()
  const { updateRightSidebar } = useNavigation()
  const navState = useNavigationState()
  const workspace = shell?.workspaces.find((item) => item.id === shell.activeWorkspaceId) ?? null
  const filePath = workspace ? pluginLoadoutPath(workspace.rootPath) : null
  const [view, setView] = useState<PluginView>('installed')
  const [marketFilter, setMarketFilter] = useState<MarketContentFilter>('all')
  const [sourceKind, setSourceKind] = useState<CatalogSourceKind | 'all'>('all')
  const [reads, setReads] = useState<CatalogRead[]>([])
  const [loadout, setLoadout] = useState<PluginLoadoutFile>(emptyPluginLoadout())

  const workspaceSkills = useMemo(() => (shell?.skills ?? []).map((skill) => ({
    slug: skill.slug,
    name: skill.metadata.name,
    description: skill.metadata.description,
  })), [shell?.skills])
  const workspaceSources = useMemo(() => (shell?.enabledSources ?? []).map((source) => ({
    slug: source.config.slug,
    name: source.config.name,
    type: source.config.type,
    description: source.config.tagline,
  })), [shell?.enabledSources])
  const catalog = useMemo(() => listCatalogMarket({
    skills: workspaceSkills,
    sources: workspaceSources,
    reads,
    contentFilter: 'all',
  }), [workspaceSkills, workspaceSources, reads])
  const marketEntries = useMemo(() => listCatalogMarket({
    skills: workspaceSkills,
    sources: workspaceSources,
    reads,
    sourceFilter: sourceKind === 'all' ? null : { kind: 'type', sourceKind },
    contentFilter: marketFilter,
  }), [workspaceSkills, workspaceSources, reads, sourceKind, marketFilter])

  useEffect(() => {
    if (!filePath) {
      setLoadout(emptyPluginLoadout())
      return
    }
    const read = readPluginLoadout(filePath)
    if (read.status === 'ok' || read.status === 'missing') setLoadout(read.loadout)
  }, [filePath])

  useEffect(() => {
    const packageRoot = workspace?.rootPath
    if (!packageRoot) return
    let cancelled = false
    void readCatalogSource({
      source: AGENT_PLUGINS_SOURCE,
      packageRoot,
    }).then((read) => {
      if (cancelled) return
      setReads((current) => {
        const rest = current.filter((item) => item.source.kind !== 'agent_plugins')
        if (read.status === 'closed' && read.reason === 'manifest_missing') return rest
        return [read, ...rest]
      })
    })
    return () => {
      cancelled = true
    }
  }, [workspace?.rootPath])

  const state = selectMarketFilter(
    selectPluginView({ view: 'installed', marketFilter: 'all', catalog, loadout }, view),
    marketFilter,
  )
  const entries = view === 'market' ? marketEntries : entriesForView(state)

  const changeView = useCallback((next: string) => {
    const parsed = parsePluginView(next)
    if (parsed) setView(parsed)
  }, [])

  const changeFilter = useCallback((next: string) => {
    const parsed = parseMarketFilter(next)
    if (parsed) setMarketFilter(parsed)
  }, [])

  const changeSource = useCallback((next: string) => {
    if (next === 'all') {
      setSourceKind('all')
      return
    }
    const parsed = parseCatalogSourceKind(next)
    if (parsed) setSourceKind(parsed)
  }, [])

  const refreshCatalogs = useCallback(async () => {
    const mcp = await readCatalogSource({
      source: MCP_REGISTRY_SOURCE,
      allowNetwork: true,
      url: MCP_REGISTRY_LIST_URL,
    })
    setReads((current) => [mcp, ...current.filter((item) => item.source.kind !== 'mcp_registry')])
  }, [])

  const openSidePane = useCallback(() => {
    if (navState.rightSidebar?.type === 'mcp-apps') return
    updateRightSidebar({ type: 'mcp-apps' })
  }, [navState.rightSidebar, updateRightSidebar])

  return (
    <div className="h-full flex flex-col" data-plugin-view={view} data-market-filter={marketFilter} data-catalog-source={sourceKind} data-plugin-writes="locked" data-plugin-approval="display-only">
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
                  <div className="px-4 py-3.5">
                    <Button variant="secondary" size="sm" onClick={() => { void openSidePane() }}>
                      {t('settings.plugins.openSidePane')}
                    </Button>
                  </div>
                  {view === 'market' && (
                    <div className="px-4 py-3.5 space-y-3">
                      <SettingsSegmentedControl
                        value={sourceKind}
                        onValueChange={changeSource}
                        size="sm"
                        className="flex-wrap"
                        options={[
                          { value: 'all', label: t('settings.plugins.catalog.all') },
                          ...CATALOG_SOURCE_KINDS.map((item) => ({
                            value: item,
                            label: catalogSourceLabel(item, t),
                          })),
                        ]}
                      />
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

              <SettingsSection title={viewLabel(view, t)} description={viewApprovalDescription(view, t)}>
                <SettingsCard>
                  {entries.length === 0 ? (
                    <SettingsRow label={t('settings.plugins.empty')} />
                  ) : entries.map((entry) => (
                    <PluginEntryRow
                      key={entry.id}
                      entry={entry}
                      installed={loadoutRecord(loadout, entry.id)?.installed === true}
                      enabled={loadoutRecord(loadout, entry.id)?.enabled === true}
                      lockedLabel={t('settings.plugins.statusLocked')}
                    />
                  ))}
                </SettingsCard>
              </SettingsSection>

              {view === 'market' && (
                <SettingsSection title={t('settings.plugins.catalog.sources')}>
                  <SettingsCard>
                    {CATALOG_SOURCE_KINDS.map((kind) => {
                      const read = reads.find((item) => item.source.kind === kind)
                      return (
                        <SettingsRow
                          key={kind}
                          label={catalogSourceLabel(kind, t)}
                          description={catalogReadDescription(read, catalogSourceDescription(kind, t), t)}
                          action={<span className="text-xs text-muted-foreground">{catalogSourceStatus(kind)}</span>}
                        />
                      )
                    })}
                    <div className="px-4 py-3.5">
                      <Button variant="secondary" size="sm" onClick={() => { void refreshCatalogs() }}>
                        {t('settings.plugins.catalog.refresh')}
                      </Button>
                    </div>
                  </SettingsCard>
                </SettingsSection>
              )}

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
  lockedLabel,
}: {
  entry: PluginCatalogEntry
  installed: boolean
  enabled: boolean
  lockedLabel: string
}) {
  const readState = installed ? (enabled ? 'enabled' : 'installed') : 'listed'
  return (
    <SettingsRow
      label={entry.name}
      description={entry.description}
      action={(
        <span className="text-xs text-muted-foreground" data-plugin-read={readState}>
          {lockedLabel}
        </span>
      )}
    />
  )
}

function viewApprovalDescription(view: PluginView, t: (key: string) => string): string | undefined {
  switch (view) {
    case 'hooks':
      return t('settings.plugins.locked.hooksDesc')
    case 'mcp':
      return t('settings.plugins.approval.mcpDesc')
    case 'installed':
    case 'market':
    case 'skills':
      return undefined
    default: {
      const unexpected: never = view
      return unexpected
    }
  }
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

function catalogSourceLabel(kind: CatalogSourceKind, t: (key: string) => string): string {
  switch (kind) {
    case 'mcp_registry':
      return t('settings.plugins.catalog.mcpRegistry')
    case 'skill_repository':
      return t('settings.plugins.catalog.skillRepository')
    case 'agent_plugins':
      return t('settings.plugins.catalog.agentPlugins')
    default: {
      const unexpected: never = kind
      return unexpected
    }
  }
}

function catalogSourceDescription(kind: CatalogSourceKind, t: (key: string) => string): string {
  switch (kind) {
    case 'mcp_registry':
      return t('settings.plugins.catalog.mcpRegistryDesc')
    case 'skill_repository':
      return t('settings.plugins.catalog.skillRepositoryDesc')
    case 'agent_plugins':
      return t('settings.plugins.catalog.agentPluginsDesc')
    default: {
      const unexpected: never = kind
      return unexpected
    }
  }
}

function catalogReadDescription(
  read: CatalogRead | undefined,
  idle: string,
  t: (key: string) => string,
): string {
  if (!read) return idle
  switch (read.status) {
    case 'ok':
      return t('settings.plugins.catalog.ready')
    case 'closed':
      return t('settings.plugins.catalog.closed')
    case 'Locked':
      return t(lockedLabelKey(read.phase))
    default: {
      const unexpected: never = read
      return unexpected
    }
  }
}

function lockedLabelKey(phase: (typeof LOCKED_PLUGIN_PHASES)[number]): string {
  switch (phase) {
    case 'mcp_apps_sandbox':
      return 'settings.plugins.locked.mcpApps'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

function lockedDescriptionKey(phase: (typeof LOCKED_PLUGIN_PHASES)[number]): string {
  switch (phase) {
    case 'mcp_apps_sandbox':
      return 'settings.plugins.locked.mcpAppsDesc'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

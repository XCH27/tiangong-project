/**
 * MCP Apps side pane.
 *
 * A read of the enabled MCP rows in the plugin loadout, plus a local
 * inventory the caller already has. Closing the pane updates the existing
 * right-sidebar slot. This component does not construct a host kernel and
 * does not admit a focus or a tool call. The sandboxed app view, live
 * tools/list, and tool invocation stay Locked.
 */

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { AdmissionNotice, presentMcpAppsPane } from '@craft-agent/ui'
import type { McpAppsSurface } from '@craft-agent/shared/protocol/mcp-apps-pane'
import {
  projectEnabledMcpApps,
  type McpAppFocus,
  type McpAppInventoryEntry,
} from '@craft-agent/shared/protocol/mcp-apps-pane'
import {
  emptyPluginLoadout,
  pluginLoadoutPath,
  projectWorkspacePlugins,
  type PluginLoadoutFile,
} from '@craft-agent/shared/protocol/plugin-settings'
import { readPluginLoadout, type PluginLoadoutRead } from '@craft-agent/shared/protocol/plugin-settings-host'
import { Panel } from '../app-shell/Panel'
import { PanelHeader } from '../app-shell/PanelHeader'

export function McpAppsSidePane({
  focus,
  inventory = [],
}: {
  focus?: McpAppFocus
  inventory?: readonly McpAppInventoryEntry[]
}) {
  const { t } = useTranslation()
  const { updateRightSidebar } = useNavigation()
  const shell = useOptionalAppShellContext()
  const workspace = shell?.workspaces.find((item) => item.id === shell.activeWorkspaceId) ?? null
  const filePath = workspace ? pluginLoadoutPath(workspace.rootPath) : null
  const [readState, setReadState] = useState<PluginLoadoutRead | 'loading'>('loading')

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
      setReadState({ status: 'missing', loadout: emptyPluginLoadout() })
      return
    }
    setReadState('loading')
    setReadState(readPluginLoadout(filePath))
  }, [filePath])

  const loadout: PluginLoadoutFile = readState === 'loading' || readState.status === 'failed'
    ? emptyPluginLoadout()
    : readState.loadout
  const apps = projectEnabledMcpApps({ catalog, loadout, inventory })
  const presentation = presentMcpAppsPane({
    read: readState === 'loading' ? 'loading' : readState.status,
    readReason: readState !== 'loading' && readState.status === 'failed' ? readState.reason : undefined,
    appCount: apps.length,
    workspace: workspace !== null,
  })
  const showList = presentation.phase === 'viewer'

  return (
    <Panel variant="shrink" width={320} className="h-full">
      <div className="h-full flex flex-col bg-background shadow-middle" data-mcp-apps-pane="open">
        <PanelHeader
          title={t('mcpApps.title')}
          actions={(
            <Button variant="ghost" size="sm" onClick={() => updateRightSidebar({ type: 'none' })}>
              {t('mcpApps.close')}
            </Button>
          )}
        />
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          <AdmissionNotice
            presentation={presentation}
            detailKey={paneDetailKey(presentation.phase, presentation.reason)}
          />
          {showList ? apps.map((app) => (
            <section key={app.pluginId} className="mb-4 mt-4" data-mcp-app={app.pluginId}>
              <h2 className="text-sm font-medium">{app.name}</h2>
              {app.description ? (
                <p className="text-xs text-muted-foreground mt-1">{app.description}</p>
              ) : null}
              <ItemList
                label={t('mcpApps.tools')}
                items={app.tools.map((tool) => ({ id: tool.name, label: tool.name }))}
                activeId={focus?.pluginId === app.pluginId && focus.kind === 'tool' ? focus.itemId : undefined}
              />
              <ItemList
                label={t('mcpApps.resources')}
                items={app.resources.map((resource) => ({ id: resource.uri, label: resource.name }))}
                activeId={focus?.pluginId === app.pluginId && focus.kind === 'resource' ? focus.itemId : undefined}
              />
              {app.tools.length === 0 && app.resources.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">{t('mcpApps.noInventory')}</p>
              ) : null}
            </section>
          )) : null}
          <div className="mt-4 space-y-2">
            {presentation.lockedSurfaces.map((surface) => (
              <AdmissionNotice
                key={surface.id}
                presentation={{ phase: 'locked', status: 'Locked', reason: surface.id }}
                detailKey={lockedSurfaceDetailKey(surface.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function ItemList({
  label,
  items,
  activeId,
}: {
  label: string
  items: Array<{ id: string; label: string }>
  activeId?: string
}) {
  if (items.length === 0) return null
  return (
    <div className="mt-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="text-sm rounded-md px-2 py-1 text-foreground/80 aria-[current=true]:bg-foreground/10"
            aria-current={activeId === item.id ? 'true' : undefined}
            data-mcp-route-focus={activeId === item.id ? 'true' : undefined}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function paneDetailKey(phase: string, reason?: string): string | undefined {
  switch (phase) {
    case 'viewer':
      return 'admission.mcp.readOnly'
    case 'error':
      return 'mcpApps.readError'
    case 'empty':
      return reason === 'no_workspace' ? undefined : 'mcpApps.empty'
    case 'loading':
    case 'locked':
      return undefined
    default:
      return undefined
  }
}

function lockedSurfaceDetailKey(id: string): string | undefined {
  const surfaceId = id as McpAppsSurface['id']
  switch (surfaceId) {
    case 'sandboxed_app_view':
      return 'mcpApps.lockedSandbox'
    case 'tool_invocation':
      return 'mcpApps.lockedToolInvocation'
    case 'live_tool_list':
      return 'mcpApps.lockedLiveTools'
    case 'mcp_registry_catalogs':
      return 'mcpApps.lockedRegistry'
    case 'remote_marketplace':
      return 'mcpApps.lockedMarketplace'
    case 'enabled_list':
    case 'open_focus':
      return undefined
    default: {
      const unexpected: never = surfaceId
      return unexpected
    }
  }
}

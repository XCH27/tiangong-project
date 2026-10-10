/**
 * MCP Apps side pane.
 *
 * Lists enabled MCP tools and resources from the loadout projection and
 * focuses one item through HostTurnKernel. The existing right-sidebar slot
 * is the layout. The sandboxed app view stays Locked.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { useNavigation } from '@/contexts/NavigationContext'
import { closeMcpAppsFromHuman, createMcpAppsHost, focusMcpAppFromHuman } from '@craft-agent/shared/protocol/mcp-apps-host'
import {
  MCP_APPS_SESSION_ID,
  mcpAppsLayoutSlot,
  projectEnabledMcpApps,
  type McpAppFocus,
  type McpAppInventoryEntry,
  type McpAppItemKind,
} from '@craft-agent/shared/protocol/mcp-apps-pane'
import {
  emptyPluginLoadout,
  pluginLoadoutPath,
  projectWorkspacePlugins,
  type PluginLoadoutFile,
} from '@craft-agent/shared/protocol/plugin-settings'
import { readPluginLoadout } from '@craft-agent/shared/protocol/plugin-settings-host'
import { Panel } from '../app-shell/Panel'
import { PanelHeader } from '../app-shell/PanelHeader'

const desktopActor = { kind: 'human' as const, id: 'desktop-user', displayName: 'Desktop' }

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
  const host = useMemo(() => createMcpAppsHost(), [])
  const invocationCount = useRef(0)
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

  const apps = projectEnabledMcpApps({ catalog, loadout, inventory })
  const layout = { open: true as const, focus: focus ?? null }

  const publish = useCallback((view: { open: boolean; focus: McpAppFocus | null }) => {
    const slot = mcpAppsLayoutSlot(view)
    updateRightSidebar(slot.type === 'none' ? { type: 'none' } : slot)
  }, [updateRightSidebar])

  const focusItem = useCallback(async (pluginId: string, itemKind: McpAppItemKind, itemId: string) => {
    invocationCount.current += 1
    const result = await focusMcpAppFromHuman(host, {
      invocationId: `mcp-apps-focus-${invocationCount.current}`,
      sessionId: MCP_APPS_SESSION_ID,
      actor: desktopActor,
      catalog,
      loadout,
      inventory,
      layout,
      pluginId,
      itemKind,
      itemId,
    })
    if (result.status === 'completed') publish(result.view)
  }, [catalog, host, inventory, layout, loadout, publish])

  const closePane = useCallback(async () => {
    invocationCount.current += 1
    const result = await closeMcpAppsFromHuman(host, {
      invocationId: `mcp-apps-close-${invocationCount.current}`,
      sessionId: MCP_APPS_SESSION_ID,
      actor: desktopActor,
      catalog,
      loadout,
      inventory,
      layout,
    })
    if (result.status === 'completed') publish(result.view)
  }, [catalog, host, inventory, layout, loadout, publish])

  return (
    <Panel variant="shrink" width={320} className="h-full">
      <div className="h-full flex flex-col bg-background shadow-middle" data-mcp-apps-pane="open">
        <PanelHeader
          title={t('mcpApps.title')}
          actions={(
            <Button variant="ghost" size="sm" onClick={() => { void closePane() }}>
              {t('mcpApps.close')}
            </Button>
          )}
        />
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
          {apps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('mcpApps.empty')}</p>
          ) : apps.map((app) => (
            <section key={app.pluginId} className="mb-4" data-mcp-app={app.pluginId}>
              <h2 className="text-sm font-medium">{app.name}</h2>
              {app.description ? (
                <p className="text-xs text-muted-foreground mt-1">{app.description}</p>
              ) : null}
              <ItemList
                label={t('mcpApps.tools')}
                items={app.tools.map((tool) => ({ id: tool.name, label: tool.name }))}
                activeId={focus?.pluginId === app.pluginId && focus.kind === 'tool' ? focus.itemId : undefined}
                onSelect={(itemId) => { void focusItem(app.pluginId, 'tool', itemId) }}
              />
              <ItemList
                label={t('mcpApps.resources')}
                items={app.resources.map((resource) => ({ id: resource.uri, label: resource.name }))}
                activeId={focus?.pluginId === app.pluginId && focus.kind === 'resource' ? focus.itemId : undefined}
                onSelect={(itemId) => { void focusItem(app.pluginId, 'resource', itemId) }}
              />
              {app.tools.length === 0 && app.resources.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">{t('mcpApps.noInventory')}</p>
              ) : null}
            </section>
          ))}
          <p className="text-xs text-muted-foreground">{t('mcpApps.lockedSandbox')}</p>
        </div>
      </div>
    </Panel>
  )
}

function ItemList({
  label,
  items,
  activeId,
  onSelect,
}: {
  label: string
  items: Array<{ id: string; label: string }>
  activeId?: string
  onSelect: (itemId: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="mt-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full text-left text-sm rounded-md px-2 py-1 hover:bg-foreground/5 aria-[current=true]:bg-foreground/10"
              aria-current={activeId === item.id ? 'true' : undefined}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

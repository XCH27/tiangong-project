import { BrowserWindow, webContents } from 'electron'
import {
  RPC_CHANNELS,
  type BrowserPaneCreateOptions,
  type BrowserEmptyStateLaunchPayload,
  type BrowserPaneEmbedBounds,
  type BrowserInstanceInfo,
} from '../../shared/types'
import type { BrowserScreenshotOptions } from '../browser-pane-manager'
import { pushTyped, type RpcServer } from '@craft-agent/server-core/transport'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import type { HandlerDeps } from './handler-deps'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.browserPane.CREATE,
  RPC_CHANNELS.browserPane.DESTROY,
  RPC_CHANNELS.browserPane.LIST,
  RPC_CHANNELS.browserPane.NAVIGATE,
  RPC_CHANNELS.browserPane.GO_BACK,
  RPC_CHANNELS.browserPane.GO_FORWARD,
  RPC_CHANNELS.browserPane.RELOAD,
  RPC_CHANNELS.browserPane.STOP,
  RPC_CHANNELS.browserPane.FOCUS,
  RPC_CHANNELS.browserPane.EMBED,
  RPC_CHANNELS.browserPane.DETACH,
  RPC_CHANNELS.browserPane.LAUNCH,
  RPC_CHANNELS.browserPane.SNAPSHOT,
  RPC_CHANNELS.browserPane.CLICK,
  RPC_CHANNELS.browserPane.FILL,
  RPC_CHANNELS.browserPane.SELECT,
  RPC_CHANNELS.browserPane.SCREENSHOT,
  RPC_CHANNELS.browserPane.EVALUATE,
  RPC_CHANNELS.browserPane.SCROLL,
] as const

/**
 * Resolve the host-registered workspace for this desktop window.
 * Never treats client-declared `ctx.workspaceId` as authorization.
 */
function resolveHostWorkspaceId(
  deps: HandlerDeps,
  ctx: { workspaceId: string | null; webContentsId: number | null },
): string | null {
  if (ctx.webContentsId == null) return null
  const desktopWindows = deps.windowManager
  if (!desktopWindows) return null
  if (!desktopWindows.getWindowByWebContentsId(ctx.webContentsId)) return null
  return desktopWindows.getWorkspaceForWindow(ctx.webContentsId)
}

/**
 * Local + remote-mirror workspace ids visible to this host window.
 * Mirrors renderer filterInstancesForWorkspace so remote-stamped tabs remain
 * visible without leaking other workspaces' instances.
 */
function resolveVisibleWorkspaceIds(
  deps: HandlerDeps,
  ctx: { workspaceId: string | null; webContentsId: number | null },
): { localId: string | null; remoteId: string | null } {
  const localId = resolveHostWorkspaceId(deps, ctx)
  if (!localId) return { localId: null, remoteId: null }
  const remoteId = getWorkspaceByNameOrId(localId)?.remoteServer?.remoteWorkspaceId ?? null
  return { localId, remoteId }
}

function instanceVisibleToWorkspace(
  instance: BrowserInstanceInfo,
  localId: string | null,
  remoteId: string | null,
): boolean {
  // Unbound / legacy (missing workspaceId) — visible to every desktop window.
  if (!instance.workspaceId) return true
  if (localId && instance.workspaceId === localId) return true
  if (remoteId && instance.workspaceId === remoteId) return true
  return false
}

export function registerBrowserHandlers(server: RpcServer, deps: HandlerDeps): void {
  const { browserPaneManager, platform } = deps
  if (!browserPaneManager) return

  /**
   * Authorization for every id-scoped browser op.
   * Anchor in the main-process window registry — never in client handshake fields.
   */
  const requireBrowserInstance = (
    ctx: { workspaceId: string | null; webContentsId: number | null },
    id: string,
  ) => {
    if (ctx.webContentsId == null) {
      throw new Error('Browser pane actions require a desktop window')
    }
    const { localId, remoteId } = resolveVisibleWorkspaceIds(deps, ctx)
    if (!localId) {
      throw new Error('Browser pane actions require a desktop window')
    }
    const instance = browserPaneManager.listInstances().find((candidate) => candidate.id === id)
    if (!instance) throw new Error(`Browser instance not found: ${id}`)
    if (!instanceVisibleToWorkspace(instance, localId, remoteId)) {
      throw new Error('Browser instance is not available in the current workspace')
    }
    return instance
  }

  server.handle(RPC_CHANNELS.browserPane.CREATE, (ctx, input?: string | BrowserPaneCreateOptions) => {
    // Prefer host-registered workspace so manual UI tabs cannot be stamped
    // into a foreign workspace via a forged handshake workspaceId.
    const workspaceId = resolveHostWorkspaceId(deps, ctx) ?? ctx.workspaceId ?? null

    if (typeof input === 'string') {
      return browserPaneManager.createInstance(input, { workspaceId })
    }

    if (input?.bindToSessionId) {
      return browserPaneManager.createForSession(input.bindToSessionId, {
        show: input.show ?? false,
        workspaceId,
      })
    }

    return browserPaneManager.createInstance(input?.id, { show: input?.show, workspaceId })
  })

  server.handle(RPC_CHANNELS.browserPane.DESTROY, (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    browserPaneManager.destroyInstance(id)
  })

  server.handle(RPC_CHANNELS.browserPane.LIST, (ctx) => {
    // Filter on the host. Using only client workspaceId would either leak
    // every workspace's tabs (previous behavior) or hide remote-mirror tabs.
    // Host local id + remoteServer.remoteWorkspaceId matches the renderer
    // filterInstancesForWorkspace contract.
    const { localId, remoteId } = resolveVisibleWorkspaceIds(deps, ctx)
    const all = browserPaneManager.listInstances()
    if (!localId && !remoteId) {
      // No trusted desktop identity — do not leak instance inventory.
      // CLI/agent harnesses that need browser panes go through session-owned
      // agent APIs (requireOwnedInstance), not this UI LIST channel.
      return []
    }
    return all.filter((instance) => instanceVisibleToWorkspace(instance, localId, remoteId))
  })

  server.handle(RPC_CHANNELS.browserPane.NAVIGATE, async (ctx, id: string, url: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.navigate(id, url)
    } catch (err) {
      platform.logger.error(`[browser-pane] navigate failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.GO_BACK, async (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.goBack(id)
    } catch (err) {
      platform.logger.error(`[browser-pane] goBack failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.GO_FORWARD, async (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.goForward(id)
    } catch (err) {
      platform.logger.error(`[browser-pane] goForward failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.RELOAD, (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    browserPaneManager.reload(id)
  })

  server.handle(RPC_CHANNELS.browserPane.STOP, (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    browserPaneManager.stop(id)
  })

  server.handle(RPC_CHANNELS.browserPane.FOCUS, (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    browserPaneManager.focus(id)
  })

  server.handle(RPC_CHANNELS.browserPane.EMBED, (ctx, id: string, bounds: BrowserPaneEmbedBounds) => {
    requireBrowserInstance(ctx, id)
    const hostContents = ctx.webContentsId ? webContents.fromId(ctx.webContentsId) : null
    const hostWindow = hostContents ? BrowserWindow.fromWebContents(hostContents) : null
    if (!hostWindow) {
      throw new Error('Browser module host window is unavailable')
    }
    browserPaneManager.embedInstance(id, hostWindow, bounds)
  })

  server.handle(RPC_CHANNELS.browserPane.DETACH, (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    browserPaneManager.detachInstance(id)
  })

  server.handle(RPC_CHANNELS.browserPane.LAUNCH, async (ctx, payload: BrowserEmptyStateLaunchPayload) => {
    try {
      return await browserPaneManager.handleEmptyStateLaunchFromRenderer(ctx.webContentsId!, payload)
    } catch (err) {
      platform.logger.error('[browser-pane] empty-state launch IPC failed:', err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.SNAPSHOT, async (ctx, id: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.getAccessibilitySnapshot(id)
    } catch (err) {
      platform.logger.error(`[browser-pane] snapshot failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.CLICK, async (ctx, id: string, ref: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.clickElement(id, ref)
    } catch (err) {
      platform.logger.error(`[browser-pane] click failed for ${id} ref=${ref}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.FILL, async (ctx, id: string, ref: string, value: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.fillElement(id, ref, value)
    } catch (err) {
      platform.logger.error(`[browser-pane] fill failed for ${id} ref=${ref}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.SELECT, async (ctx, id: string, ref: string, value: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.selectOption(id, ref, value)
    } catch (err) {
      platform.logger.error(`[browser-pane] select failed for ${id} ref=${ref}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.SCREENSHOT, async (ctx, id: string, options?: BrowserScreenshotOptions) => {
    requireBrowserInstance(ctx, id)
    try {
      const result = await browserPaneManager.screenshot(id, options)
      return {
        base64: result.imageBuffer.toString('base64'),
        imageFormat: result.imageFormat,
        metadata: result.metadata,
      }
    } catch (err) {
      platform.logger.error(`[browser-pane] screenshot failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.EVALUATE, async (ctx, id: string, expression: string) => {
    requireBrowserInstance(ctx, id)
    try {
      return await browserPaneManager.evaluate(id, expression)
    } catch (err) {
      platform.logger.error(`[browser-pane] evaluate failed for ${id}:`, err)
      throw err
    }
  })

  server.handle(RPC_CHANNELS.browserPane.SCROLL, async (ctx, id: string, direction: string, amount?: number) => {
    requireBrowserInstance(ctx, id)
    const validDirections = ['up', 'down', 'left', 'right']
    if (!validDirections.includes(direction)) {
      throw new Error(`Invalid scroll direction: ${direction}`)
    }
    try {
      return await browserPaneManager.scroll(id, direction as 'up' | 'down' | 'left' | 'right', amount)
    } catch (err) {
      platform.logger.error(`[browser-pane] scroll failed for ${id}:`, err)
      throw err
    }
  })

  // Forward browser events to all locally-connected renderers. Workspace
  // isolation for *mutations* is enforce above via requireBrowserInstance.
  // STATE_CHANGED still broadcasts to all because remote-mirror workspace ids
  // differ from transport-level workspaceId; renderers re-filter with
  // filterInstancesForWorkspace (local + remote ids).
  browserPaneManager.onStateChange((info) => {
    pushTyped(server, RPC_CHANNELS.browserPane.STATE_CHANGED, { to: 'all' }, info)
  })

  browserPaneManager.onRemoved((id) => {
    pushTyped(server, RPC_CHANNELS.browserPane.REMOVED, { to: 'all' }, id)
  })

  browserPaneManager.onInteracted((id) => {
    pushTyped(server, RPC_CHANNELS.browserPane.INTERACTED, { to: 'all' }, id)
  })
}

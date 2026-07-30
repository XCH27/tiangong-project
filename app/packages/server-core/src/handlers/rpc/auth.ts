import { unlink } from 'fs/promises'
import { join } from 'path'
import { homedir } from 'os'
import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getCredentialManager } from '@craft-agent/shared/credentials'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { requestClientConfirmDialog } from '@craft-agent/server-core/transport'
import { resolveCallerWorkspaceId } from '../utils'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.auth.LOGOUT,
  RPC_CHANNELS.auth.SHOW_LOGOUT_CONFIRMATION,
  RPC_CHANNELS.auth.SHOW_DELETE_SESSION_CONFIRMATION,
  RPC_CHANNELS.credentials.HEALTH_CHECK,
] as const

export function registerAuthHandlers(server: RpcServer, deps: HandlerDeps): void {
  // Show logout confirmation dialog (routed to client)
  server.handle(RPC_CHANNELS.auth.SHOW_LOGOUT_CONFIRMATION, async (ctx) => {
    const result = await requestClientConfirmDialog(server, ctx.clientId, {
      type: 'warning',
      buttons: ['Cancel', 'Log Out'],
      defaultId: 0,
      cancelId: 0,
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      detail: 'All conversations will be deleted. This action cannot be undone.',
    })
    // result.response is the index of the clicked button
    // 0 = Cancel, 1 = Log Out
    return result.response === 1
  })

  // Show delete session confirmation dialog (routed to client)
  server.handle(RPC_CHANNELS.auth.SHOW_DELETE_SESSION_CONFIRMATION, async (ctx, name: string) => {
    const result = await requestClientConfirmDialog(server, ctx.clientId, {
      type: 'warning',
      buttons: ['Cancel', 'Delete'],
      defaultId: 0,
      cancelId: 0,
      title: 'Delete Conversation',
      message: `Are you sure you want to delete: "${name}"?`,
      detail: 'This action cannot be undone.',
    })
    // result.response is the index of the clicked button
    // 0 = Cancel, 1 = Delete
    return result.response === 1
  })

  // Logout / factory reset — clears credentials and config.
  //
  // Security contract: a full host-wide wipe is ONLY permitted from a real
  // desktop window (verified via windowManager). Remote/headless WS clients
  // — even when token-authenticated — must not be able to wipe the host's
  // entire credential store or delete the global config.json. Such callers
  // are scoped to their own workspace credentials only.
  server.handle(RPC_CHANNELS.auth.LOGOUT, async (ctx) => {
    if (!ctx.clientId) {
      throw new Error('Unauthorized: logout requires an authenticated client')
    }

    // A caller is trusted to perform a host-wide reset only when the desktop
    // window manager recognises its webContentsId as a real BrowserWindow.
    // Remote/WS clients have no webContentsId (or an unrecognised one) and
    // are therefore blocked from the global wipe path.
    const isDesktopHost =
      !!deps.windowManager &&
      ctx.webContentsId != null &&
      !!deps.windowManager.getWindowByWebContentsId(ctx.webContentsId)

    try {
      const manager = getCredentialManager()

      if (isDesktopHost) {
        // Full factory reset — clears every credential and the global config.
        const allCredentials = await manager.list()
        for (const credId of allCredentials) {
          await manager.delete(credId)
        }

        const configPath = join(homedir(), '.craft-agent', 'config.json')
        await unlink(configPath).catch(() => {
          // Ignore if file doesn't exist
        })

        deps.platform.logger.info(`Logout complete - full reset (client ${ctx.clientId})`)
      } else {
        // Remote/headless caller: scope deletion to the resolved workspace.
        // If no workspace can be resolved, refuse the request entirely rather
        // than falling back to a global wipe.
        const workspaceId = resolveCallerWorkspaceId(ctx, deps)
        if (!workspaceId) {
          throw new Error('Unauthorized: remote logout requires a workspace binding')
        }
        await manager.deleteWorkspaceCredentials(workspaceId)
        deps.platform.logger.info(
          `Logout complete - workspace-scoped (${workspaceId}, client ${ctx.clientId})`,
        )
      }
    } catch (error) {
      deps.platform.logger.error('Logout error:', error)
      throw error
    }
  })

  // Credential health check - validates credential store is readable and usable
  // Called on app startup to detect corruption, machine migration, or missing credentials
  server.handle(RPC_CHANNELS.credentials.HEALTH_CHECK, async () => {
    const manager = getCredentialManager()
    return manager.checkHealth()
  })
}

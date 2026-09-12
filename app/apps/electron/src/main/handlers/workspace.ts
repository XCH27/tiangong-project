import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from './handler-deps'

export const GUI_HANDLED_CHANNELS = [
  RPC_CHANNELS.remote.TEST_CONNECTION,
  RPC_CHANNELS.window.OPEN_WORKSPACE,
  RPC_CHANNELS.window.OPEN_SESSION_IN_NEW_WINDOW,
  RPC_CHANNELS.window.CLOSE,
  RPC_CHANNELS.window.CONFIRM_CLOSE,
  RPC_CHANNELS.window.CANCEL_CLOSE,
  RPC_CHANNELS.window.SET_TRAFFIC_LIGHTS,
] as const

/**
 * Connect to a remote server and wait for handshake.
 * When workspaceId is provided, the handshake is scoped to that workspace so
 * workspace-context RPC handlers (for example sessions:export) can resolve it.
 * opts.requestTimeout overrides the 30s default — session transfers pull whole
 * bundles as one response frame and need more headroom over WAN.
 * Returns the connected client or null + error message.
 */
export async function connectToRemote(url: string, token: string, workspaceId?: string, opts?: { requestTimeout?: number }) {
  const { assertAllowedRemoteWsUrl } = await import('@craft-agent/shared/utils/remote-url')
  assertAllowedRemoteWsUrl(url)
  const { WsRpcClient } = await import('../../transport/client')
  const client = new WsRpcClient(url, {
    token,
    workspaceId,
    autoReconnect: false,
    requestTimeout: opts?.requestTimeout,
  })

  const connected = await new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => resolve(false), 10_000)
    const unsub = client.onConnectionStateChanged((state) => {
      if (state.status === 'connected') {
        clearTimeout(timeout)
        unsub()
        resolve(true)
      } else if (state.status === 'failed') {
        clearTimeout(timeout)
        unsub()
        resolve(false)
      }
    })
    client.connect()
  })

  if (!connected) {
    const error = client.getConnectionState().lastError?.message ?? 'Connection failed'
    client.destroy()
    return { client: null, error }
  }

  return { client, error: null }
}

export function registerWorkspaceGuiHandlers(server: RpcServer, deps: HandlerDeps): void {
  const windowManager = deps.windowManager

  // Test connection to a user-owned remote Fleet instance.
  // Pure discovery — returns list of existing workspaces or needsWorkspace flag.
  // Workspace creation is handled separately via invokeOnServer → server:createWorkspace.
  server.handle(RPC_CHANNELS.remote.TEST_CONNECTION, async (_ctx, url: string, token: string) => {
    const { client, error } = await connectToRemote(url, token)
    if (!client) return { ok: false, error }

    // Read server version from handshake_ack (null for old servers)
    const serverVersion = client.getServerVersion() ?? undefined

    try {
      // If we got in with a one-time invite, that invite is spent the moment the
      // handshake succeeded. Claim the grant the host minted on **this** connection —
      // a second connection with the spent invite would be refused, so there is no
      // later opportunity. Returned to the caller, which stores it as the device's token.
      const { parseInviteCredential } = await import('@craft-agent/shared/remote')
      const invite = parseInviteCredential(token)
      let deviceToken: string | undefined
      if (invite) {
        try {
          const { hostname, platform } = await import('node:os')
          const claimed = await client.invoke(
            RPC_CHANNELS.remote.CLAIM_DEVICE_TOKEN,
            invite.enrollmentId,
            // This machine names itself, so the host's device list is honest without
            // anyone typing a label for a computer they are not at.
            {
              deviceName: hostname(),
              platform: platform() === 'darwin' ? 'macos'
                : platform() === 'win32' ? 'windows'
                  : platform() === 'linux' ? 'linux' : 'unknown',
            },
          ) as { deviceId: string; deviceToken: string }
          deviceToken = claimed?.deviceToken
        } catch (claimError) {
          client.destroy()
          return {
            ok: false,
            error: claimError instanceof Error ? claimError.message : 'REMOTE_GRANT_NOT_ISSUED',
          }
        }
        if (!deviceToken) {
          client.destroy()
          return { ok: false, error: 'REMOTE_GRANT_NOT_ISSUED' }
        }
      }

      // The host's stable id. Every Workspace paired to the same computer carries it,
      // which is what makes one machine read as one device rather than several.
      let hostId: string | undefined
      try {
        const status = await client.invoke(RPC_CHANNELS.server.GET_STATUS) as { serverId?: string }
        hostId = typeof status?.serverId === 'string' ? status.serverId : undefined
      } catch {
        // An older host without a stable id still pairs; it groups by endpoint host.
      }

      console.log(`[TEST_CONNECTION] invoking ${RPC_CHANNELS.server.GET_WORKSPACES} on remote server...`)
      const workspaces = await client.invoke(RPC_CHANNELS.server.GET_WORKSPACES) as Array<{ id: string; name: string }>
      console.log(`[TEST_CONNECTION] remote returned ${workspaces?.length ?? 'null'} workspaces:`, JSON.stringify(workspaces?.map(w => ({ id: w.id, name: w.name }))))

      if (workspaces.length === 0) {
        console.log('[TEST_CONNECTION] → returning needsWorkspace=true')
        return { ok: true, needsWorkspace: true, serverVersion, deviceToken, hostId }
      }

      const result = {
        ok: true,
        serverVersion,
        deviceToken,
        hostId,
        remoteWorkspaces: workspaces,
        // Convenience: auto-select if exactly one
        remoteWorkspaceId: workspaces.length === 1 ? workspaces[0].id : undefined,
        remoteWorkspaceName: workspaces.length === 1 ? workspaces[0].name : undefined,
      }
      console.log(`[TEST_CONNECTION] → returning ${workspaces.length} workspaces`)
      return result
    } catch (err) {
      console.error('[TEST_CONNECTION] error:', err)
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
    } finally {
      client.destroy()
    }
  })

  // Open workspace in new window (or focus existing)
  server.handle(RPC_CHANNELS.window.OPEN_WORKSPACE, async (_ctx, workspaceId: string) => {
    if (!windowManager) return
    windowManager.focusOrCreateWindow(workspaceId)
  })

  // Open a session in a new window
  server.handle(RPC_CHANNELS.window.OPEN_SESSION_IN_NEW_WINDOW, async (_ctx, workspaceId: string, sessionId: string) => {
    if (!windowManager) return
    const deepLink = `craftagents://allSessions/session/${sessionId}`
    windowManager.createWindow({
      workspaceId,
      focused: true,
      initialDeepLink: deepLink,
    })
  })

  // Close the calling window (triggers close event which may be intercepted)
  server.handle(RPC_CHANNELS.window.CLOSE, (ctx) => {
    if (!windowManager) return
    windowManager.closeWindow(ctx.webContentsId!)
  })

  // Confirm close - force close the window (bypasses interception).
  server.handle(RPC_CHANNELS.window.CONFIRM_CLOSE, (ctx) => {
    if (!windowManager) return
    windowManager.forceCloseWindow(ctx.webContentsId!)
  })

  // Cancel close - renderer handled the request (closed a modal/panel).
  server.handle(RPC_CHANNELS.window.CANCEL_CLOSE, (ctx) => {
    if (!windowManager) return
    windowManager.cancelPendingClose(ctx.webContentsId!)
  })

  // Show/hide macOS traffic light buttons (for fullscreen overlays)
  server.handle(RPC_CHANNELS.window.SET_TRAFFIC_LIGHTS, (ctx, visible: boolean) => {
    if (!windowManager) return
    windowManager.setTrafficLightsVisible(ctx.webContentsId!, visible)
  })
}

import { RPC_CHANNELS } from '@craft-agent/shared/protocol'
import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import { pushTyped, type RpcServer, type RequestContext } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import type { WearAsk } from '@craft-agent/shared/assistants'

/**
 * A connection is bound to one Workspace. Trusting the `workspaceId` argument
 * alone would let any client — including one on the LAN listener — address a
 * Workspace it was never connected to, so the bound Workspace wins and a
 * mismatch is refused by name rather than silently redirected.
 */
function resolveWorkspace(ctx: RequestContext, requestedId: string) {
  if (ctx.workspaceId && requestedId && ctx.workspaceId !== requestedId) {
    throw new Error(
      `This connection is bound to workspace ${ctx.workspaceId}; it cannot act on ${requestedId}`,
    )
  }
  const workspace = getWorkspaceByNameOrId(ctx.workspaceId ?? requestedId)
  if (!workspace) throw new Error('Workspace not found')
  return workspace
}

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.assistants.LIST,
  RPC_CHANNELS.assistants.CREATE,
  RPC_CHANNELS.assistants.WEAR,
  RPC_CHANNELS.assistants.WORN,
] as const

export function registerAssistantsHandlers(server: RpcServer, deps: HandlerDeps): void {
  server.handle(RPC_CHANNELS.assistants.LIST, async (ctx, workspaceId: string) => {
    const workspace = resolveWorkspace(ctx, workspaceId)
    const { listAssistants } = await import('@craft-agent/shared/assistants')
    return listAssistants(workspace.rootPath)
  })

  server.handle(RPC_CHANNELS.assistants.WORN, async (ctx, workspaceId: string, sessionId: string) => {
    const workspace = resolveWorkspace(ctx, workspaceId)
    const session = await deps.sessionManager.getSession(sessionId)
    if (!session || session.workspaceId !== workspace.id) throw new Error('Session not found in this workspace')
    return session.assistantId ?? null
  })

  server.handle(
    RPC_CHANNELS.assistants.CREATE,
    async (
      ctx,
      workspaceId: string,
      input: { name: string; description?: string; systemPrompt?: string; source?: 'user' | 'generated' },
    ) => {
      const workspace = resolveWorkspace(ctx, workspaceId)
      const { createAssistant } = await import('@craft-agent/shared/assistants')
      const assistant = createAssistant(workspace.rootPath, input)
      pushTyped(server, RPC_CHANNELS.assistants.CHANGED, { to: 'workspace', workspaceId: workspace.id }, workspace.id)
      return assistant
    },
  )

  server.handle(
    RPC_CHANNELS.assistants.WEAR,
    async (ctx, workspaceId: string, sessionId: string, assistantId: string, asked: WearAsk) => {
      const workspace = resolveWorkspace(ctx, workspaceId)
      const result = await deps.sessionManager.wearAssistant(workspace.id, sessionId, assistantId, asked)

      pushTyped(server, RPC_CHANNELS.assistants.CHANGED, { to: 'workspace', workspaceId: workspace.id }, workspace.id)
      return result
    },
  )
}

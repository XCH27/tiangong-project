import { getWorkspaceByNameOrId } from '@craft-agent/shared/config'
import {
  RPC_CHANNELS,
  type ActionInvocation,
  type ActionSurface,
  type ActionVerb,
} from '@craft-agent/shared/protocol'
import type { RpcServer } from '@craft-agent/server-core/transport'
import type { HandlerDeps } from '../handler-deps'
import { FileMutationService } from '../../services/file-mutation-service'
import { InternalActionExecutorService } from '../../services/internal-action-executor'
import { createFilesInternalActions, InternalActionRegistryService } from '../../services/internal-action-registry'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.internalActions.LIST,
  RPC_CHANNELS.internalActions.INVOKE,
] as const

export function registerInternalActionHandlers(server: RpcServer, deps: HandlerDeps): void {
  const registry = new InternalActionRegistryService(createFilesInternalActions())
  const fileMutations = new FileMutationService()
  const executor = new InternalActionExecutorService({
    registry,
    fileMutations,
    emit: event => deps.sessionManager.emitSessionEvent(event),
    requestPermission: (sessionId, input) => deps.sessionManager.requestWorkflowPermission(sessionId, input),
  })

  server.handle(RPC_CHANNELS.internalActions.LIST, async (_ctx, filter?: { surface?: ActionSurface; verb?: ActionVerb }) => {
    return executor.list(filter)
  })

  server.handle(RPC_CHANNELS.internalActions.INVOKE, async (_ctx, sessionId: string, invocation: ActionInvocation) => {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('sessionId is required')
    }

    const session = await deps.sessionManager.getSession(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const workspace = getWorkspaceByNameOrId(session.workspaceId)
    if (!workspace?.rootPath) {
      throw new Error(`Workspace not found for session ${sessionId}`)
    }

    return executor.invoke({
      sessionId,
      workspaceRoot: workspace.rootPath,
      invocation,
    })
  })
}

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
import {
  createAllInternalActions,
  InternalActionRegistryService,
} from '../../services/internal-action-registry'
import type { InternalActionRuntimeBridge } from '../../services/internal-action-bridge'
import { createSessionManagerTeamRuntime, getTeamCoordinator } from '../../services/team-coordinator'
import { MemoryStore } from '../../services/memory-store'

export const HANDLED_CHANNELS = [
  RPC_CHANNELS.internalActions.LIST,
  RPC_CHANNELS.internalActions.INVOKE,
] as const

export function registerInternalActionHandlers(server: RpcServer, deps: HandlerDeps): void {
  const registry = new InternalActionRegistryService(createAllInternalActions())
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

    const bridge = createInternalActionBridge(deps, session.workspaceId, workspace.rootPath)

    return executor.invoke({
      sessionId,
      workspaceRoot: workspace.rootPath,
      invocation,
      bridge,
    })
  })
}

function createInternalActionBridge(
  deps: HandlerDeps,
  workspaceId: string,
  workspaceRoot: string,
): InternalActionRuntimeBridge {
  const sm = deps.sessionManager
  const teamCoordinator = getTeamCoordinator({
    workspaceRootPath: workspaceRoot,
    runtime: createSessionManagerTeamRuntime(sm, workspaceId, workspaceRoot),
  })
  const memoryStore = new MemoryStore(workspaceRoot)

  return {
    getSessionProgress: async (targetSessionId) => {
      const session = await sm.getSession(targetSessionId)
      return session?.progress ?? []
    },
    setSessionProgress: async (targetSessionId, tasks) => {
      await sm.setSessionProgress(targetSessionId, tasks)
    },
    listMemory: async query => memoryStore.list(query ?? {}),
    addMemory: async input => memoryStore.add(input),
    getTeamProjection: async () => {
      const projection = await teamCoordinator.getProjection()
      if (!projection) throw new Error('Team projection is unavailable')
      return projection
    },
    sendTeamMessage: (issuerSessionId, input, actor) =>
      teamCoordinator.handleCommand({
        type: 'sendTeamMessage',
        teamId: 'team-main',
        content: input.content,
        audienceSessionIds: input.audienceSessionIds,
        taskId: input.taskId,
        runId: input.runId,
      }, { issuerSessionId, actor }) as Promise<{ messageId: string }>,
    assignTeamTask: (issuerSessionId, input, actor) =>
      teamCoordinator.handleCommand({
        type: 'assignTeamTask',
        teamId: 'team-main',
        taskId: input.taskId,
        assigneeSessionId: input.assigneeSessionId,
        title: input.title,
        description: input.description,
        autoRun: input.autoRun,
      }, { issuerSessionId, actor }) as Promise<{ taskId: string; runId?: string }>,
  }
}

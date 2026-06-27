import type {
  ActorRef,
  AddMemoryInput,
  MemoryEntry,
  MemoryQuery,
  ProgressTask,
  TeamProjection,
} from '@craft-agent/shared/protocol'
import { normalizeProgressTasks } from '@craft-agent/shared/protocol'
import { getTeamCoordinator, type TeamRuntime } from './team-coordinator.ts'
import { MemoryStore } from './memory-store.ts'

export interface InternalActionRuntimeBridge {
  getSessionProgress(sessionId: string): Promise<ProgressTask[]>
  setSessionProgress(sessionId: string, tasks: ProgressTask[]): Promise<void>
  listMemory(query?: MemoryQuery): Promise<MemoryEntry[]>
  addMemory(input: AddMemoryInput): Promise<MemoryEntry>
  getTeamProjection(): Promise<TeamProjection>
  sendTeamMessage(
    sessionId: string,
    input: {
      content: string
      audienceSessionIds?: string[]
      taskId?: string
      runId?: string
    },
    actor: ActorRef,
  ): Promise<{ messageId: string }>
  assignTeamTask(
    sessionId: string,
    input: {
      taskId: string
      assigneeSessionId: string
      title: string
      description?: string
      autoRun?: boolean
    },
    actor: ActorRef,
  ): Promise<{ taskId: string; runId?: string }>
}

export function readOptionalSessionId(input: Record<string, unknown>, fallbackSessionId: string): string {
  return typeof input.sessionId === 'string' && input.sessionId.trim() ? input.sessionId.trim() : fallbackSessionId
}

export function readMemoryQuery(input: Record<string, unknown>): MemoryQuery {
  const query: MemoryQuery = {}
  if (typeof input.partition === 'string') query.partition = input.partition as MemoryQuery['partition']
  if (typeof input.tier === 'string') query.tier = input.tier as MemoryQuery['tier']
  if (typeof input.scopeId === 'string') query.scopeId = input.scopeId
  if (typeof input.contains === 'string') query.contains = input.contains
  if (typeof input.limit === 'number') query.limit = input.limit
  return query
}

export function readAddMemoryInput(input: Record<string, unknown>): AddMemoryInput {
  if (typeof input.partition !== 'string' || typeof input.content !== 'string') {
    throw new Error('partition and content are required')
  }
  const addInput: AddMemoryInput = {
    partition: input.partition as AddMemoryInput['partition'],
    content: input.content,
  }
  if (typeof input.tier === 'string') addInput.tier = input.tier as AddMemoryInput['tier']
  if (typeof input.sensitivity === 'string') addInput.sensitivity = input.sensitivity as AddMemoryInput['sensitivity']
  if (typeof input.scopeId === 'string') addInput.scopeId = input.scopeId
  if (typeof input.source === 'string') addInput.source = input.source
  return addInput
}

export function readTeamMessageInput(input: Record<string, unknown>): {
  content: string
  audienceSessionIds?: string[]
  taskId?: string
  runId?: string
} {
  if (typeof input.content !== 'string' || !input.content.trim()) {
    throw new Error('content is required')
  }
  return {
    content: input.content,
    audienceSessionIds: Array.isArray(input.audienceSessionIds)
      ? input.audienceSessionIds.filter((id): id is string => typeof id === 'string')
      : undefined,
    taskId: typeof input.taskId === 'string' ? input.taskId : undefined,
    runId: typeof input.runId === 'string' ? input.runId : undefined,
  }
}

export function readAssignTeamTaskInput(input: Record<string, unknown>): {
  taskId: string
  assigneeSessionId: string
  title: string
  description?: string
  autoRun?: boolean
} {
  if (
    typeof input.taskId !== 'string'
    || typeof input.assigneeSessionId !== 'string'
    || typeof input.title !== 'string'
  ) {
    throw new Error('taskId, assigneeSessionId, and title are required')
  }
  return {
    taskId: input.taskId,
    assigneeSessionId: input.assigneeSessionId,
    title: input.title,
    description: typeof input.description === 'string' ? input.description : undefined,
    autoRun: typeof input.autoRun === 'boolean' ? input.autoRun : undefined,
  }
}

export function readProgressTasks(input: Record<string, unknown>): ProgressTask[] {
  return normalizeProgressTasks(input.tasks)
}

/** SessionManager 侧创建 internal action bridge（与 RPC handler 共用逻辑） */
export interface InternalActionSessionPort {
  getSession(sessionId: string): Promise<{ progress?: ProgressTask[] } | null | undefined>
  setSessionProgress(sessionId: string, tasks: ProgressTask[]): Promise<void>
}

export function createInternalActionRuntimeBridge(
  sm: InternalActionSessionPort,
  workspaceRoot: string,
  teamRuntime: TeamRuntime,
): InternalActionRuntimeBridge {
  const teamCoordinator = getTeamCoordinator({ workspaceRootPath: workspaceRoot, runtime: teamRuntime })
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

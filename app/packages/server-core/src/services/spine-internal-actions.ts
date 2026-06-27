import type { InternalActionDefinition } from '@craft-agent/shared/protocol'
import { MEMORY_PARTITIONS, MEMORY_TIERS, PROGRESS_TASK_STATUSES } from '@craft-agent/shared/protocol'

/** Session / progress / memory / team actions wired to existing SessionManager + MemoryStore + TeamCoordinator. */
export function createSpineInternalActions(): InternalActionDefinition[] {
  return [
    ...createSessionProgressActions(),
    ...createMemoryActions(),
    ...createTeamActions(),
  ]
}

export function createDefaultInternalActions(): InternalActionDefinition[] {
  // createFilesInternalActions is imported at registry layer to avoid circular imports in tests
  return createSpineInternalActions()
}

function createSessionProgressActions(): InternalActionDefinition[] {
  return [
    {
      id: 'session.read_progress',
      contractVersion: 1,
      surface: 'session',
      verb: 'read',
      title: 'Read session progress',
      description: 'Return the current task progress checklist for a session.',
      inputSchema: {
        type: 'object',
        properties: {
          sessionId: { type: 'string', description: 'Target session id. Defaults to invoking session.' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          tasks: { type: 'array' },
        },
      },
      permissionLevel: 'L0',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'read-only action' },
      humanEntryPoints: ['SessionProgressCard', 'WorkspaceContextSidebar.progress'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      contextSummary: { reads: ['session.progress'], writes: [], tokenHint: 'tiny' },
    },
    {
      id: 'session.set_progress',
      contractVersion: 1,
      surface: 'session',
      verb: 'mutate',
      title: 'Set session progress',
      description: 'Replace the session task progress checklist (replace-all semantics).',
      inputSchema: {
        type: 'object',
        required: ['tasks'],
        properties: {
          sessionId: { type: 'string' },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'title'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string', enum: [...PROGRESS_TASK_STATUSES] },
                note: { type: 'string' },
              },
            },
          },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          tasks: { type: 'array' },
        },
      },
      permissionLevel: 'L1',
      timelineEvent: 'progress_updated',
      undoHandle: { type: 'none', noneReason: 'progress replace-all has no single inverse without snapshot' },
      humanEntryPoints: ['SessionProgressCard'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      contextSummary: { reads: ['session.progress'], writes: ['session.progress'], tokenHint: 'small' },
    },
  ]
}

function createMemoryActions(): InternalActionDefinition[] {
  return [
    {
      id: 'memory.list_entries',
      contractVersion: 1,
      surface: 'manager',
      verb: 'read',
      title: 'List memory entries',
      description: 'Query layered local memory with partition and scope isolation.',
      inputSchema: {
        type: 'object',
        properties: {
          partition: { type: 'string', enum: [...MEMORY_PARTITIONS] },
          tier: { type: 'string', enum: [...MEMORY_TIERS] },
          scopeId: { type: 'string' },
          contains: { type: 'string' },
          limit: { type: 'number', minimum: 1, maximum: 50 },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          entries: { type: 'array' },
        },
      },
      permissionLevel: 'L0',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'read-only action' },
      humanEntryPoints: ['MemorySettingsPage'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['content'],
      contextSummary: { reads: ['memory.store'], writes: [], tokenHint: 'small' },
    },
    {
      id: 'memory.add_entry',
      contractVersion: 1,
      surface: 'manager',
      verb: 'mutate',
      title: 'Add memory entry',
      description: 'Append a durable memory entry to the local layered store.',
      inputSchema: {
        type: 'object',
        required: ['partition', 'content'],
        properties: {
          partition: { type: 'string', enum: [...MEMORY_PARTITIONS] },
          content: { type: 'string' },
          tier: { type: 'string', enum: [...MEMORY_TIERS] },
          sensitivity: { type: 'string', enum: ['low', 'medium', 'high'] },
          scopeId: { type: 'string' },
          source: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          entry: { type: 'object' },
        },
      },
      permissionLevel: 'L2',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'memory delete is a separate L3 action' },
      humanEntryPoints: ['MemorySettingsPage.add'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      redactionPolicy: ['content'],
      contextSummary: { reads: ['memory.store'], writes: ['memory.store'], tokenHint: 'small' },
    },
  ]
}

function createTeamActions(): InternalActionDefinition[] {
  return [
    {
      id: 'team.get_projection',
      contractVersion: 1,
      surface: 'team',
      verb: 'read',
      title: 'Get team projection',
      description: 'Read the current workspace team roster, leader, statuses, and norms.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      outputSchema: { type: 'object' },
      permissionLevel: 'L0',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'read-only action' },
      humanEntryPoints: ['SessionList.team', 'FreeFormInput.teamMention'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      contextSummary: { reads: ['team.projection'], writes: [], tokenHint: 'medium' },
    },
    {
      id: 'team.send_message',
      contractVersion: 1,
      surface: 'team',
      verb: 'intent',
      title: 'Send team message',
      description: 'Queue a broadcast or private team message without auto-running agents.',
      inputSchema: {
        type: 'object',
        required: ['content'],
        properties: {
          content: { type: 'string' },
          audienceSessionIds: { type: 'array', items: { type: 'string' } },
          taskId: { type: 'string' },
          runId: { type: 'string' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          messageId: { type: 'string' },
        },
      },
      permissionLevel: 'L1',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'team messages are not undoable' },
      humanEntryPoints: ['FreeFormInput.teamMention'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      contextSummary: { reads: ['team.projection'], writes: ['team.inbox'], tokenHint: 'small' },
    },
    {
      id: 'team.assign_task',
      contractVersion: 1,
      surface: 'team',
      verb: 'mutate',
      title: 'Assign team task',
      description: 'Assign a structured task to a team member; autoRun requires L2 permission inside TeamCoordinator.',
      inputSchema: {
        type: 'object',
        required: ['taskId', 'assigneeSessionId', 'title'],
        properties: {
          taskId: { type: 'string' },
          assigneeSessionId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          autoRun: { type: 'boolean' },
        },
        additionalProperties: false,
      },
      outputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          runId: { type: 'string' },
        },
      },
      permissionLevel: 'L2',
      timelineEvent: 'internal_action_invoked',
      undoHandle: { type: 'none', noneReason: 'task assignment cancellation is a separate workflow' },
      humanEntryPoints: ['TeamCoordinator.assign'],
      agentCallable: true,
      locality: 'LOCAL_ONLY',
      replayPolicy: 'semantic',
      contextSummary: { reads: ['team.projection'], writes: ['team.tasks'], tokenHint: 'small' },
    },
  ]
}

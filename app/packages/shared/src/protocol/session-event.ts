import type { ActorRef } from './actor'
import type { UndoHandle } from './internal-action'

export type SessionEventKind =
  | 'action_invoked'
  | 'action_completed'
  | 'action_failed'
  | 'supervision_requested'
  | 'supervision_resolved'
  | 'conflict_superseded'
  | 'undo_applied'
  | 'timeline_note';

export interface AuditSessionEvent {
  id: string; // uuid
  sessionId: string;
  teamRunId?: string;
  taskRunId?: string;
  kind: SessionEventKind;
  actionId?: string;
  actorRef: ActorRef;
  payload: Record<string, unknown>;
  undoHandle?: UndoHandle;
  evidenceRefs: string[];
  occurredAt: string; // ISO 8601
  seq: number;
}

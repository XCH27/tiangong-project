export type ActorKind = 'human' | 'agent' | 'system';

export interface ActorRef {
  kind: ActorKind;
  id: string; // user id, agent seat id, or 'system'
  displayName: string;
}

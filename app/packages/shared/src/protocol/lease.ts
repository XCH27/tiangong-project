export type LeaseMode = 'read' | 'write' | 'exclusive_write';

export interface WorkspaceFileLease {
  leaseId: string;
  workspaceId: string;
  filePath: string;
  heldBy: string; // ActorRef id
  acquiredAt: string; // ISO 8601
  expiresAt: string; // ISO 8601
  active: boolean;
}

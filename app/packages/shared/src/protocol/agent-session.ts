export interface AgentSeat {
  seatId: string;
  role: 'lead' | 'worker' | 'reviewer';
  domainTags: ('media' | 'code' | 'ui' | 'data')[];
  trustLevel: 'internal' | 'host' | 'external';
}

export interface RuntimeLane {
  laneId: string;
  seatId: string;
  cwd: string;
  allowedCommandsPattern: string;
  status: 'idle' | 'running' | 'paused' | 'terminated';
}

export interface TeamRun {
  teamRunId: string;
  leaderSeatId: string;
  objective: string;
  status: 'pending' | 'active' | 'success' | 'failed';
  activeLanes: string[];
}

export interface RuntimeLaneEvent {
  type: 'lane_started' | 'lane_output' | 'lane_completed' | 'lane_error';
  laneId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface TeamContextSnapshot {
  teamRunId: string;
  snapshotId: string;
  laneStates: Record<string, string>;
  timelineSequence: number;
}

export interface LaneOutcome {
  laneId: string;
  exitCode: number;
  stdoutHash: string;
  generatedEvidenceRefs: string[];
}

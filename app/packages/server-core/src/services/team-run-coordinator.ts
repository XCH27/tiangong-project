/**
 * TeamRunCoordinator — D19 P1 skeleton（docs/38-API-CLI §5）
 * =====================================================================
 *
 * 跨 Runtime 团队编排的调度核心。CLI 队长通过 Fleet Bridge 发起 TeamRun，
 * Coordinator 负责创建/校验/调度/状态追踪/报告收集。
 *
 * 当前是 P1 skeleton：
 * - 内存存储 TeamRun（不持久化）
 * - 只实现 propose/getTeam/getStatus/getReport/cancel 的骨架
 * - startRun 暂不真正调度 API 队员（需要 RuntimeLauncherAdapter + Bridge 注入）
 *
 * 不引入第二套 session/permission/timeline 真相；所有 TeamRun 事件仍写回
 * craft SessionManager 的 SessionEvent。
 */

import type {
  AgentSeat,
  RuntimeLane,
  TeamRun,
  TeamRunStatus,
  TeamRunErrorCode,
  RunReport,
} from '@craft-agent/shared/protocol/team-run'

export interface TeamRunCoordinatorDeps {
  /** 发 TeamRun 事件回 craft session timeline */
  emitEvent: (event: TeamRunTimelineEvent) => void
}

export type TeamRunTimelineEvent =
  | { type: 'team_run_created'; sessionId: string; runId: string; initiatorSeatId: string; targetSeatId: string; taskDescription: string; timestamp: number }
  | { type: 'team_run_status_changed'; sessionId: string; runId: string; status: string; previousStatus?: string; errorCode?: string; timestamp: number }
  | { type: 'team_run_report_ready'; sessionId: string; runId: string; summary: string; changedFiles?: string[]; timestamp: number }
  | { type: 'team_run_lease_blocked'; sessionId: string; runId: string; conflictRunId: string; targets: string[]; timestamp: number }

let runIdCounter = 0
function generateRunId(): string {
  return `run-${Date.now()}-${++runIdCounter}`
}

export class TeamRunCoordinator {
  private readonly runs = new Map<string, TeamRun>()
  private readonly seats = new Map<string, AgentSeat>()
  private readonly lanes = new Map<string, RuntimeLane>()

  constructor(private readonly deps: TeamRunCoordinatorDeps) {}

  // ---------------------------------------------------------------------------
  // AgentSeat / RuntimeLane registry (in-memory, P1)
  // ---------------------------------------------------------------------------

  registerSeat(seat: AgentSeat): void {
    this.seats.set(seat.seatId, seat)
  }

  getSeat(seatId: string): AgentSeat | undefined {
    return this.seats.get(seatId)
  }

  registerLane(lane: RuntimeLane): void {
    this.lanes.set(lane.laneId, lane)
  }

  getLane(laneId: string): RuntimeLane | undefined {
    return this.lanes.get(laneId)
  }

  /** Return all known seats (for fleet.get_team). */
  getTeam(): AgentSeat[] {
    return Array.from(this.seats.values())
  }

  // ---------------------------------------------------------------------------
  // TeamRun lifecycle (P1 skeleton — propose only; startRun is stub)
  // ---------------------------------------------------------------------------

  /**
   * Propose a TeamRun without executing. Returns the proposed run with
   * status='proposed'. Fleet UI shows a suggestion card for human/leader
   * confirmation.
   */
  proposeRun(params: {
    initiatorSeatId: string
    initiatorLaneId: string
    targetSeatId: string
    targetLaneId: string
    taskDescription: string
    taskId?: string
    idempotencyKey?: string
  }): TeamRun {
    // Idempotency check
    if (params.idempotencyKey) {
      const existing = Array.from(this.runs.values()).find(
        r => r.idempotencyKey === params.idempotencyKey,
      )
      if (existing) return existing
    }

    const now = Date.now()
    const run: TeamRun = {
      runId: generateRunId(),
      initiatorSeatId: params.initiatorSeatId,
      initiatorLaneId: params.initiatorLaneId,
      targetSeatId: params.targetSeatId,
      targetLaneId: params.targetLaneId,
      taskDescription: params.taskDescription,
      taskId: params.taskId,
      status: 'proposed',
      attributionChain: {
        nodes: [
          {
            seatId: params.initiatorSeatId,
            laneId: params.initiatorLaneId,
            runtimeKind: this.lanes.get(params.initiatorLaneId)?.kind ?? 'cli',
            action: 'fleet.propose_member_run',
            actor: { kind: 'agent', agentId: params.initiatorSeatId },
          },
        ],
      },
      createdAt: now,
      updatedAt: now,
      idempotencyKey: params.idempotencyKey,
    }

    this.runs.set(run.runId, run)

    this.deps.emitEvent({
      type: 'team_run_created',
      sessionId: this.seats.get(params.targetSeatId)?.sessionId ?? '',
      runId: run.runId,
      initiatorSeatId: params.initiatorSeatId,
      targetSeatId: params.targetSeatId,
      taskDescription: params.taskDescription,
      timestamp: now,
    })

    return run
  }

  /**
   * Start a TeamRun. P1 skeleton: transitions proposed→approved→running
   * but does NOT actually dispatch to API member yet (needs Bridge adapter).
   */
  async startRun(runId: string): Promise<TeamRun> {
    const run = this.runs.get(runId)
    if (!run) throw new Error(`TeamRun not found: ${runId}`)

    this.transitionStatus(run, 'approved')
    this.transitionStatus(run, 'running')

    // P2 will add: dispatch to target seat's session via TeamCoordinator,
    // permission check, file lease acquisition, Bridge sync-blocking await.

    return run
  }

  getRunStatus(runId: string): TeamRunStatus | undefined {
    return this.runs.get(runId)?.status
  }

  getRun(runId: string): TeamRun | undefined {
    return this.runs.get(runId)
  }

  getRunReport(runId: string): RunReport | undefined {
    const run = this.runs.get(runId)
    return run?.report
  }

  cancelRun(runId: string, reason?: string): TeamRun | undefined {
    const run = this.runs.get(runId)
    if (!run) return undefined
    if (run.status === 'completed' || run.status === 'cancelled' || run.status === 'failed') {
      return run
    }
    this.transitionStatus(run, 'cancelled', undefined, reason)
    return run
  }

  /**
   * Submit a report for a running TeamRun (called by API member's session
   * when it completes). P1 skeleton — not wired to actual session events yet.
   */
  submitReport(runId: string, report: Omit<RunReport, 'runId'>): TeamRun | undefined {
    const run = this.runs.get(runId)
    if (!run) return undefined

    const fullReport: RunReport = { ...report, runId }
    run.report = fullReport
    run.updatedAt = Date.now()

    this.deps.emitEvent({
      type: 'team_run_report_ready',
      sessionId: this.seats.get(run.targetSeatId)?.sessionId ?? '',
      runId: run.runId,
      summary: report.summary,
      changedFiles: report.changedFiles,
      timestamp: run.updatedAt,
    })

    this.transitionStatus(run, 'completed')
    return run
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private transitionStatus(
    run: TeamRun,
    newStatus: TeamRunStatus,
    errorCode?: TeamRunErrorCode,
    errorMessage?: string,
  ): void {
    const prev = run.status
    run.status = newStatus
    run.updatedAt = Date.now()
    if (errorCode) run.errorCode = errorCode
    if (errorMessage) run.errorMessage = errorMessage

    this.deps.emitEvent({
      type: 'team_run_status_changed',
      sessionId: this.seats.get(run.targetSeatId)?.sessionId ?? '',
      runId: run.runId,
      status: newStatus,
      previousStatus: prev,
      errorCode,
      timestamp: run.updatedAt,
    })
  }
}

// ---------------------------------------------------------------------------
// Singleton accessor (per-process; P1 in-memory)
// ---------------------------------------------------------------------------

let coordinatorInstance: TeamRunCoordinator | null = null

export function getTeamRunCoordinator(deps?: TeamRunCoordinatorDeps): TeamRunCoordinator {
  if (!coordinatorInstance) {
    coordinatorInstance = new TeamRunCoordinator(
      deps ?? { emitEvent: () => {} },
    )
  }
  return coordinatorInstance
}

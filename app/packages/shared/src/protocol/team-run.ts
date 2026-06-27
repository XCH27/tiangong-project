/**
 * TeamRun 协议类型（D19 · docs/38-API-CLI分离与跨Runtime团队编排.md）
 * =====================================================================
 *
 * Fleet owns the team, CLI owns a run.
 *
 * 本文件是跨 Runtime 团队编排的**类型唯一真相**。它定义：
 * - AgentSeat：稳定身份（不随 runtime 变）
 * - RuntimeLane：执行面（API / CLI / terminal）
 * - TeamRun：一次跨成员执行任务（异步、可暂停、可授权、可报告）
 * - FleetBridge：暴露给 CLI lane 的受控工具层
 * - RunReport：给调用方的压缩报告
 * - AttributionChain：权限归属链
 * - 错误码：CLI 收到后必须停止该分支，不能重试
 *
 * 落地顺序见 docs/38-API-CLI §13。P0 只冻结类型，不接 UI / handler。
 * 共享协议文件必须按 AGENTS.md 规则 36/37 由 Lead 冻结后再改。
 */

import type { ActorRef } from './design'

// ---------------------------------------------------------------------------
// AgentSeat — 稳定身份
// ---------------------------------------------------------------------------

/**
 * 稳定身份标识。一个 AgentSeat 不随 runtime 变——队长就是队长，
 * 不管它当前编码用 API 还是 CLI。
 *
 * 不是 session id（session 可以重建）；不是 runtime（runtime 是 lane 的事）。
 * 序号（G-01 / G-02）由 session createdAt 派生，不存入 seat。
 */
export interface AgentSeat {
  /** 稳定 id，如 `seat:leader` / `seat:designer` / `seat:coder` */
  seatId: string
  /** 身份角色：队长 / 代码 / 设计 / 审查 / 测试 / 上下文 */
  role: AgentSeatRole
  /** 关联的 session id（会话重建时可能变，但 seat 稳定） */
  sessionId: string
  /** 当前绑定的 RuntimeLane id 列表（一个 seat 可绑多个 lane） */
  activeLaneIds: string[]
}

export type AgentSeatRole =
  | 'leader'
  | 'coder'
  | 'designer'
  | 'reviewer'
  | 'tester'
  | 'context'

// ---------------------------------------------------------------------------
// RuntimeLane — 执行面
// ---------------------------------------------------------------------------

/**
 * 执行面。Fleet 管理，runtime 执行。
 *
 * 队长可同时拥有：
 * - control lane（API）：用于规划、调度、调用 Fleet 内部能力
 * - harness lane（CLI）：用于编码、跑测试、处理本机命令
 */
export interface RuntimeLane {
  /** 稳定 id，如 `lane:api` / `lane:cli:codex` / `lane:terminal` */
  laneId: string
  /** lane 类型 */
  kind: RuntimeLaneKind
  /** 绑定的 AgentSeat */
  seatId: string
  /** CLI runtime id（仅 kind='cli'/'terminal' 时有意义）；null 表示 API lane */
  cliRuntimeId?: string | null
  /** CLI runtime 内的模型 id（由 ACP session/new 返回，Fleet 不猜） */
  cliRuntimeModelId?: string | null
  /** Bridge 是否可用（BRIDGE_UNAVAILABLE 时不能调团队工具） */
  bridgeStatus: BridgeStatus
}

export type RuntimeLaneKind = 'api' | 'cli' | 'terminal'

export type BridgeStatus =
  | 'available'
  | 'unavailable'
  | 'not_applicable' // API lane 不需要 Bridge

// ---------------------------------------------------------------------------
// TeamRun — 跨成员执行任务
// ---------------------------------------------------------------------------

export type TeamRunStatus =
  | 'proposed'
  | 'approved'
  | 'queued'
  | 'running'
  | 'blocked_waiting_for_permission'
  | 'blocked_waiting_for_user'
  | 'blocked_waiting_for_lease'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout_pending_report'

/**
 * 一次跨成员执行任务。
 *
 * CLI 队长通过 Fleet Bridge 发起，不直接调 API 队员工具。
 * Bridge 对外同步阻塞、对内异步 TeamRun。
 */
export interface TeamRun {
  /** 稳定 run id */
  runId: string
  /** 发起者 AgentSeat */
  initiatorSeatId: string
  /** 发起者 RuntimeLane */
  initiatorLaneId: string
  /** 目标 AgentSeat */
  targetSeatId: string
  /** 目标 RuntimeLane（通常是 API lane） */
  targetLaneId: string
  /** 任务描述（自然语言，给目标队员的系统提示） */
  taskDescription: string
  /** 任务 id（关联 docs/33 的 assignTeamTask） */
  taskId?: string
  /** 当前状态 */
  status: TeamRunStatus
  /** 归属链 */
  attributionChain: AttributionChain
  /** 完整 RunReport（status=completed 时才有） */
  report?: RunReport
  /** 错误码（status=failed 时才有） */
  errorCode?: TeamRunErrorCode
  /** 错误详情 */
  errorMessage?: string
  /** 成本归因 */
  cost?: TeamRunCost
  /** 创建时间 */
  createdAt: number
  /** 最后更新时间 */
  updatedAt: number
  /** 幂等 key（防止重复工具调用创建多个 run） */
  idempotencyKey?: string
}

// ---------------------------------------------------------------------------
// AttributionChain — 权限归属链
// ---------------------------------------------------------------------------

/**
 * 权限卡显示完整链路：
 * user → G-01 leader / cli:codex → fleet.start_member_run → G-02 designer / api → canvas.edit
 */
export interface AttributionChain {
  /** 链路节点，按调用顺序 */
  nodes: AttributionChainNode[]
}

export interface AttributionChainNode {
  /** AgentSeat id */
  seatId: string
  /** RuntimeLane id */
  laneId: string
  /** runtime 类型 */
  runtimeKind: RuntimeLaneKind
  /** 这一步的动作（如 `fleet.start_member_run` / `canvas.edit`） */
  action: string
  /** actor（人 / agent / manager） */
  actor: ActorRef
}

// ---------------------------------------------------------------------------
// RunReport — 压缩报告
// ---------------------------------------------------------------------------

/**
 * API 队员绝不把完整对话返回给 CLI 队长。只回压缩报告。
 * 完整细节留在成员 session 抽屉；群聊只显示卡片。
 */
export interface RunReport {
  /** 关联的 runId */
  runId: string
  /** 最终状态 */
  status: 'completed' | 'failed' | 'cancelled'
  /** 摘要（自然语言） */
  summary: string
  /** 变更文件列表 */
  changedFiles?: string[]
  /** diff 摘要（不回完整 diff） */
  diffSummary?: string
  /** 证据引用（指向 Fleet 内部 timeline event / screenshot 等） */
  evidenceRefs?: string[]
  /** 需要队长后续动作的提示 */
  requiresLeaderAction?: string
  /** 成本 */
  cost?: TeamRunCost
}

// ---------------------------------------------------------------------------
// Cost — 成本归因
// ---------------------------------------------------------------------------

export interface TeamRunCost {
  /** 成本来源 */
  source: TeamRunCostSource
  /** 真实 token（provider 返回的 usage） */
  real: number
  /** 估算 token（Fleet 估算） */
  estimated: number
  /** 未知（无法估算） */
  unknown: number
}

export type TeamRunCostSource =
  | 'LOCAL_COMPUTE' // 本机 CLI，不消耗 API token
  | 'BYOK_API' // 用户自带 API key
  | 'FLEET_CLOUD' // Fleet 云端 API

// ---------------------------------------------------------------------------
// Error codes — CLI 收到后必须停止该分支，不能重试
// ---------------------------------------------------------------------------

export type TeamRunErrorCode =
  | 'USER_PERMISSION_DENIED_FINAL' // 人拒绝，不可重试
  | 'RUN_TIMEOUT_PENDING_REPORT' // Bridge 等待超时但 run 未结束
  | 'RUN_BLOCKED_PENDING_USER' // 等待人工输入/确认
  | 'MEMBER_BUSY' // 目标队员已有 run
  | 'CAPABILITY_NOT_LOADED' // 目标 loadout 缺能力
  | 'WORKSPACE_WRITE_LOCKED' // 写租约冲突
  | 'BRIDGE_UNAVAILABLE' // CLI 未成功挂 Fleet Bridge
  | 'MCP_LAUNCH_FAILED' // Bridge MCP/stdio 启动失败
  | 'RUN_CANCELLED' // 被取消
  | 'INTERNAL_ERROR' // 内部错误

// ---------------------------------------------------------------------------
// Fleet Bridge 工具集 — CLI lane 只看到固定工具集
// ---------------------------------------------------------------------------

/**
 * CLI lane 注入的固定工具集（不动态生成成员工具）。
 * Bridge 对外同步阻塞、对内异步 TeamRun。
 *
 * 详见 docs/38-API-CLI §4。
 */
export const FLEET_BRIDGE_TOOLS = [
  'fleet.get_team',
  'fleet.propose_member_run',
  'fleet.start_member_run',
  'fleet.get_run_status',
  'fleet.get_run_report',
  'fleet.cancel_run',
  'fleet.send_team_message',
  'fleet.invoke_internal_action',
] as const

export type FleetBridgeTool = (typeof FLEET_BRIDGE_TOOLS)[number]

// ---------------------------------------------------------------------------
// WorkspaceFileLease — 文件租约
// ---------------------------------------------------------------------------

export type FileLeaseMode = 'read' | 'write' | 'git_write'

/**
 * 轻量文件租约。第一版只做"租约 + 冲突拒绝"，不做全量沙箱。
 * 详见 docs/38-API-CLI §7。
 */
export interface WorkspaceFileLease {
  leaseId: string
  /** 持有者 TeamRun 或 CLI run */
  ownerRunId: string
  /** 持有者 AgentSeat */
  ownerSeatId: string
  /** 目标：文件路径、目录、glob、`.git` 或 `workspace:*` 粗粒度锁 */
  targets: string[]
  /** 租约模式 */
  mode: FileLeaseMode
  /** TTL，防止崩溃后永久占用 */
  ttlMs: number
  /** 展示给用户的原因 */
  reason: string
  /** 创建时间 */
  acquiredAt: number
}

/**
 * CLI Runtime（本机 CLI / ACP runtime，docs/23–25）
 *
 * 让用户在同一个 craft session 里选择本机 CLI/ACP runtime 发消息，输出/权限/错误/停止/诊断
 * 全部写回现有 timeline。**不是第二套聊天系统、不是独立终端页**：接 craft 现有 SessionManager、
 * permission、RPC、renderer event flow 和配置系统。
 *
 * 三类 runtime（设置页可编辑边界不同，docs/23）：
 * - managed：内置托管，不可删/禁用/改启动参数。
 * - detected：对 AionUi 已验证的 ACP 入口做一键映射；仅在本机 PATH 上检测到命令后出现。
 *   不可改 command/args/env，可测试/禁用/删除。
 * - custom：用户自配 command/args/env，可完整编辑。
 *
 * browser-safe：只有类型 + 常量 + 纯函数，无 Node 依赖。
 */

export type CliRuntimeKind = 'managed' | 'detected' | 'custom'

/** 健康分级（docs/23）。untested = 还没测过。 */
export type CliRuntimeHealth = 'available' | 'fail_cli' | 'fail_acp' | 'disabled' | 'untested'

/** 附件能力（docs/25）：第一版硬拒绝；P1 才可能 inline_text。 */
export type CliRuntimeAttachmentCapability = 'none' | 'inline_text'

export interface CliRuntimeDefinition {
  id: string
  kind: CliRuntimeKind
  displayName: string
  /** 本机可执行命令（detected/custom）。 */
  command: string
  args: string[]
  /** 额外环境变量（custom 可编辑）。 */
  env?: Record<string, string>
  /** 是否在聊天选择器中可选。detected/custom 可禁用；managed 不可。 */
  enabled: boolean
  /** detected 来源的映射 id（如 'claude'/'codex'/'goose'）。 */
  mappingId?: string
  /** 附件能力，第一版固定 'none'。 */
  attachments: CliRuntimeAttachmentCapability
  /** detected 候选但官方入口未最终确认，接入前需用户确认。 */
  needsConfirmation?: boolean
}

/** ACP runtime 暴露的可选模型。模型属于运行中的 session，不属于 runtime 定义本身。 */
export interface CliRuntimeModel {
  id: string
  name: string
  description?: string
}

/**
 * 当前 ACP session 的真实模型状态。
 * - config_option: 通过 ACP `session/set_config_option` 切换；
 * - models: 通过兼容路径 `session/set_model` 切换；
 * - runtime_managed: CLI 未暴露模型清单，Fleet 不伪造模型。
 */
export interface CliRuntimeModelState {
  runtimeId: string
  source: 'config_option' | 'models' | 'runtime_managed'
  currentModelId: string | null
  availableModels: CliRuntimeModel[]
  canSwitch: boolean
  configOptionId?: string
}

/** 健康测试结果：保留阶段、原因、stdout/stderr tail（docs/23）。 */
export interface CliRuntimeHealthResult {
  runtimeId: string
  health: CliRuntimeHealth
  /** 失败发生的阶段：spawn=启动 CLI；handshake=ACP 握手。 */
  stage?: 'spawn' | 'handshake' | 'ok'
  reason?: string
  stdoutTail?: string
  stderrTail?: string
  checkedAt: number
}

// ---------------------------------------------------------------------------
// Detected 映射预设（只放已按 ACP stdio 方式接入的真实入口；docs/23 §第一版）
// ---------------------------------------------------------------------------

export interface DetectedRuntimeMapping {
  mappingId: string
  displayName: string
  command: string
  args: string[]
  /** 官方入口未最终确认（接入前需用户确认本机行为）。 */
  needsConfirmation?: boolean
}

export const DETECTED_RUNTIME_MAPPINGS: readonly DetectedRuntimeMapping[] = Object.freeze([
  { mappingId: 'goose', displayName: 'Goose', command: 'goose', args: ['acp'] },
])

/**
 * 未确认 ACP 入口的工具：不能假执行，只能返回中文可操作错误（docs/23）。
 * 这些不进 catalog 的可选 runtime。
 */
export const UNSUPPORTED_DETECTED_TOOLS: readonly { id: string; displayName: string }[] = Object.freeze([
  { id: 'claude', displayName: 'Claude Code' },
  { id: 'codex', displayName: 'Codex' },
  { id: 'grok', displayName: 'Grok Build' },
  { id: 'hermes', displayName: 'Hermes' },
  { id: 'opencode', displayName: 'OpenCode' },
  { id: 'gemini', displayName: 'Gemini CLI' },
  { id: 'qwen', displayName: 'Qwen Code' },
])

export function unsupportedDetectedMessage(displayName: string): string {
  return `${displayName} 暂未确认可作为 Fleet 的 stdio ACP runtime 自动接入，已不作为自动检测项接入以避免假识别。如需本机 CLI，请改用已支持的 ACP runtime（Goose），或新增一个 Custom ACP runtime 自配 command/args/env。Claude Code / Codex 需要单独 native adapter，不能伪装成 ACP。`
}

/** CLI Runtime 选了之后，附件第一版硬拒绝文案（docs/25）。 */
export const CLI_RUNTIME_ATTACHMENT_REJECTION =
  'CLI Runtime 暂不支持附件传递。请先移除附件后重试，或切回 API 模型发送带附件消息。'

/** reasoningEffort 白名单（docs/23 发送契约）。 */
export const CLI_RUNTIME_REASONING_EFFORTS = ['low', 'medium', 'high'] as const
export type CliRuntimeReasoningEffort = typeof CLI_RUNTIME_REASONING_EFFORTS[number]

export function isCliRuntimeReasoningEffort(value: unknown): value is CliRuntimeReasoningEffort {
  return typeof value === 'string' && (CLI_RUNTIME_REASONING_EFFORTS as readonly string[]).includes(value)
}

/** 从 detected 映射生成一个 runtime 定义（默认启用、附件 none）。 */
export function detectedRuntimeFromMapping(mapping: DetectedRuntimeMapping): CliRuntimeDefinition {
  return {
    id: `detected:${mapping.mappingId}`,
    kind: 'detected',
    displayName: mapping.displayName,
    command: mapping.command,
    args: [...mapping.args],
    enabled: true,
    mappingId: mapping.mappingId,
    attachments: 'none',
    needsConfirmation: mapping.needsConfirmation,
  }
}

// ---------------------------------------------------------------------------
// ACP 发送：归一化流事件（adapter 把 ACP session/update 翻成这些，再进 craft timeline）
// ---------------------------------------------------------------------------

export type CliRuntimeStopReason = 'end_turn' | 'max_tokens' | 'cancelled' | 'refusal' | 'error'

export type CliRuntimeToolStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

/**
 * runtime 一轮执行的归一化流事件。adapter 负责把不同 ACP runtime 的 `session/update`
 * 收敛成这个统一形状，SessionManager 再翻成 SessionEvent 写 timeline（不让 renderer 重推断）。
 */
export type CliRuntimeStreamEvent =
  | { type: 'text'; text: string }
  | { type: 'thought'; text: string }
  | { type: 'tool_call'; toolCallId: string; title: string; status: CliRuntimeToolStatus; rawInput?: string }
  | { type: 'models_changed'; state: CliRuntimeModelState }
  | { type: 'done'; stopReason: CliRuntimeStopReason }
  | { type: 'error'; message: string }

/** 一轮 prompt 的最终结果。 */
export interface CliRuntimePromptResult {
  stopReason: CliRuntimeStopReason
}

/** runtime 权限请求（ACP `session/request_permission`）→ 走 craft permission 后回这个。 */
export interface CliRuntimePermissionRequest {
  toolCallId: string
  title: string
  /** 可选项 id（ACP 提供 allow/reject 选项），adapter 选其一回传。 */
  options: { optionId: string; name: string; kind: 'allow_once' | 'allow_always' | 'reject_once' | 'reject_always' }[]
}

/** 设置页可编辑边界（docs/23）。 */
export function canEditRuntimeCommand(kind: CliRuntimeKind): boolean {
  return kind === 'custom'
}
export function canDeleteRuntime(kind: CliRuntimeKind): boolean {
  return kind !== 'managed'
}
export function canDisableRuntime(kind: CliRuntimeKind): boolean {
  return kind !== 'managed'
}

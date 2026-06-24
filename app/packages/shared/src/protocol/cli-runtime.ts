/**
 * CLI Runtime（本机 CLI / ACP runtime，docs/23–25）
 *
 * 让用户在同一个 craft session 里选择本机 CLI/ACP runtime 发消息，输出/权限/错误/停止/诊断
 * 全部写回现有 timeline。**不是第二套聊天系统、不是独立终端页**：接 craft 现有 SessionManager、
 * permission、RPC、renderer event flow 和配置系统。
 *
 * 三类 runtime（设置页可编辑边界不同，docs/23）：
 * - managed：内置托管，不可删/禁用/改启动参数。
 * - detected：扫描本机常见 Agent CLI；protocol='acp' 走 stdio ACP；部分
 *   native/subscription runtime 走官方 one-shot CLI adapter。
 *   不可改 command/args/env，可测试/禁用/删除。
 * - custom：用户自配 command/args/env，可完整编辑。
 *
 * browser-safe：只有类型 + 常量 + 纯函数，无 Node 依赖。
 */

export type CliRuntimeKind = 'managed' | 'detected' | 'custom'

/** 健康分级（docs/23）。untested = 还没测过；needs_adapter = 检测到但还没有发送 adapter。 */
export type CliRuntimeHealth = 'available' | 'fail_cli' | 'fail_acp' | 'disabled' | 'untested' | 'needs_adapter'

/** 附件能力（docs/25）：第一版硬拒绝；P1 才可能 inline_text。 */
export type CliRuntimeAttachmentCapability = 'none' | 'inline_text'
export type CliRuntimeProtocol = 'acp' | 'native' | 'subscription'

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
  /** 接入协议。acp 走 CliRuntimeHost；native/subscription 走专用 adapter 或标 needs_adapter。 */
  protocol: CliRuntimeProtocol
  /** detected 来源的映射 id（如 'claude'/'codex'/'goose'）。 */
  mappingId?: string
  /** 附件能力，第一版固定 'none'。 */
  attachments: CliRuntimeAttachmentCapability
  /** detected 候选但官方入口未最终确认，接入前需用户确认。 */
  needsConfirmation?: boolean
  /** 已知/静态模型清单；ACP runtime 的动态模型仍以 CliRuntimeModelState 为准。 */
  discoveredModels?: CliRuntimeModel[]
  /** native/subscription 的 adapter/发送方式提示。 */
  adapterHint?: string
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
  /** 失败发生的阶段：spawn=启动 CLI；handshake=ACP 握手；adapter=需要 native adapter。 */
  stage?: 'spawn' | 'handshake' | 'adapter' | 'ok'
  reason?: string
  stdoutTail?: string
  stderrTail?: string
  checkedAt: number
}

// ---------------------------------------------------------------------------
// Detected 映射预设（扫描本机常见 Agent CLI；ACP + 部分 native/subscription 可直接发送）
// ---------------------------------------------------------------------------

export interface DetectedRuntimeMapping {
  mappingId: string
  displayName: string
  command: string
  args: string[]
  protocol: CliRuntimeProtocol
  /** 官方入口未最终确认（接入前需用户确认本机行为）。 */
  needsConfirmation?: boolean
  discoveredModels?: readonly CliRuntimeModel[]
  adapterHint?: string
}

export const DETECTED_RUNTIME_MAPPINGS: readonly DetectedRuntimeMapping[] = Object.freeze([
  { mappingId: 'goose', displayName: 'Goose', command: 'goose', args: ['acp'], protocol: 'acp' },
  {
    mappingId: 'codex',
    displayName: 'Codex',
    command: 'codex',
    args: ['exec'],
    protocol: 'native',
    adapterHint: '使用 Codex CLI one-shot adapter：codex exec。',
    discoveredModels: [
      { id: 'gpt-5.3-codex', name: 'gpt-5.3-codex', description: 'Codex-optimized coding model' },
      { id: 'gpt-5.4', name: 'gpt-5.4', description: 'General model available to Codex CLI' },
      { id: 'gpt-5.2-codex', name: 'gpt-5.2-codex', description: 'Agentic coding model' },
      { id: 'gpt-5.1-codex-max', name: 'gpt-5.1-codex-max', description: 'Codex-optimized flagship' },
      { id: 'gpt-5.2', name: 'gpt-5.2', description: 'General model available to Codex CLI' },
      { id: 'gpt-5.1-codex-mini', name: 'gpt-5.1-codex-mini', description: 'Codex-optimized fast model' },
    ],
  },
  {
    mappingId: 'claude',
    displayName: 'Claude Code',
    command: 'claude',
    args: ['-p'],
    protocol: 'native',
    adapterHint: '使用 Claude Code one-shot adapter：claude -p。',
  },
  {
    mappingId: 'grok',
    displayName: 'Grok Build',
    command: 'grok',
    args: ['--single'],
    protocol: 'subscription',
    adapterHint: '使用 Grok Build subscription adapter：grok --single。',
    discoveredModels: [
      { id: 'grok-code-fast-1', name: 'grok-code-fast-1', description: 'Grok coding fast model' },
      { id: 'grok-4', name: 'grok-4', description: 'Grok flagship model' },
    ],
  },
  { mappingId: 'hermes', displayName: 'Hermes', command: 'hermes', args: ['acp'], protocol: 'acp', adapterHint: '使用 Hermes ACP：hermes acp。' },
  { mappingId: 'opencode', displayName: 'OpenCode', command: 'opencode', args: ['acp'], protocol: 'acp', adapterHint: '使用 OpenCode ACP：opencode acp。' },
  {
    mappingId: 'antigravity',
    displayName: 'Antigravity',
    command: 'agy',
    args: ['--print'],
    protocol: 'subscription',
    adapterHint: '使用 Antigravity one-shot adapter：agy --print。',
    discoveredModels: [
      { id: 'Gemini 3.5 Flash (Medium)', name: 'Gemini 3.5 Flash (Medium)' },
      { id: 'Gemini 3.5 Flash (High)', name: 'Gemini 3.5 Flash (High)' },
      { id: 'Gemini 3.5 Flash (Low)', name: 'Gemini 3.5 Flash (Low)' },
      { id: 'Gemini 3.1 Pro (High)', name: 'Gemini 3.1 Pro (High)' },
      { id: 'Claude Sonnet 4.6 (Thinking)', name: 'Claude Sonnet 4.6 (Thinking)' },
      { id: 'Claude Opus 4.6 (Thinking)', name: 'Claude Opus 4.6 (Thinking)' },
      { id: 'GPT-OSS 120B (Medium)', name: 'GPT-OSS 120B (Medium)' },
    ],
  },
  { mappingId: 'qwen', displayName: 'Qwen Code', command: 'qwen', args: ['--version'], protocol: 'native', adapterHint: '需要 Qwen native adapter。' },
  { mappingId: 'pi', displayName: 'Pi CLI', command: 'pi', args: ['--version'], protocol: 'native', adapterHint: '需要 Pi native adapter。' },
  { mappingId: 'cursor-agent', displayName: 'Cursor Agent', command: 'cursor-agent', args: ['--version'], protocol: 'native', adapterHint: '需要 Cursor Agent native adapter。' },
  { mappingId: 'openclaw', displayName: 'OpenClaw', command: 'openclaw', args: ['--version'], protocol: 'native', adapterHint: '需要 OpenClaw gateway/native adapter。' },
])

export const NATIVE_ONESHOT_RUNTIME_MAPPING_IDS: readonly string[] = Object.freeze([
  'codex',
  'claude',
  'grok',
  'antigravity',
])

export function hasCliRuntimeSendAdapter(runtime: Pick<CliRuntimeDefinition, 'protocol' | 'mappingId'>): boolean {
  return runtime.protocol === 'acp'
    || (runtime.mappingId ? NATIVE_ONESHOT_RUNTIME_MAPPING_IDS.includes(runtime.mappingId) : false)
}

/** @deprecated 旧 UI 兼容占位。现在 unsupported native/subscription CLI 会进入 catalog，并标记 needs_adapter。 */
export const UNSUPPORTED_DETECTED_TOOLS: readonly { id: string; displayName: string }[] = Object.freeze([
])

/** @deprecated 旧 UI 兼容占位。新路径使用 CliRuntimeHealthResult.health='needs_adapter'。 */
export function unsupportedDetectedMessage(displayName: string): string {
  return `${displayName} 已检测到，但暂未接入 Fleet 发送 adapter。请先使用已支持的 ACP 或 one-shot runtime，或等待对应 adapter 接入。`
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
    protocol: mapping.protocol,
    mappingId: mapping.mappingId,
    attachments: 'none',
    needsConfirmation: mapping.needsConfirmation,
    discoveredModels: mapping.discoveredModels ? [...mapping.discoveredModels] : undefined,
    adapterHint: mapping.adapterHint,
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

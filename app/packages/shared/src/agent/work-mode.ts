import type { PermissionMode } from './mode-types.ts'

/**
 * User-visible phase of work. This is intentionally separate from permission
 * approval: Execute may still ask before individual privileged actions.
 *
 * Open-source mechanism alignment (reuse behavior, not runtimes):
 * - OpenCode: default primary agent = `build` (search+edit); `plan` is opt-in;
 *   `explore` is a subagent; permission rules are a separate axis.
 * - Grok Build: default `PromptMode::Agent`; `enter_plan_mode` / `exit_plan_mode`
 *   tools; PlanModeTracker orthogonal to permission Auto.
 * - Phase (explore | plan | execute) is not a permission mode.
 * - Auto does not heuristically force Plan; tool-approval Auto is a different axis.
 * - Default productive phase is Execute (OpenCode build / Grok Agent).
 */
export type WorkMode = 'explore' | 'plan' | 'execute'
export type WorkModeSelection = 'auto' | 'manual'
export type ExecutionPermissionMode = Exclude<PermissionMode, 'safe'>
export type WorkModeOption = 'auto' | WorkMode

export const WORK_MODES = ['explore', 'plan', 'execute'] as const satisfies readonly WorkMode[]
export const WORK_MODE_OPTIONS =
  ['auto', ...WORK_MODES] as const satisfies readonly WorkModeOption[]
export const EXECUTION_PERMISSION_MODES =
  ['ask', 'allow-all'] as const satisfies readonly ExecutionPermissionMode[]

export function isWorkModeOption(value: unknown): value is WorkModeOption {
  return typeof value === 'string'
    && (WORK_MODE_OPTIONS as readonly string[]).includes(value)
}

export function isExecutionPermissionMode(value: unknown): value is ExecutionPermissionMode {
  return typeof value === 'string'
    && (EXECUTION_PERMISSION_MODES as readonly string[]).includes(value)
}

export interface WorkModeState {
  workMode: WorkMode
  workModeSelection: WorkModeSelection
  executionPermissionMode: ExecutionPermissionMode
  /** Effective value consumed by the existing permission authority. */
  permissionMode: PermissionMode
}

export type AutomaticWorkModeReason =
  | 'explicit'
  | 'read-only'
  | 'bounded-change'
  | 'sticky'
  | 'fallback'

export interface AutomaticWorkModeResolution {
  workMode: WorkMode
  reason: AutomaticWorkModeReason
}

export type WorkModeRequest = Pick<WorkModeState, 'workModeSelection'> &
  Partial<Pick<WorkModeState, 'workMode' | 'executionPermissionMode'>>

export interface InitialWorkModeStateInput {
  requested?: Partial<Pick<
    WorkModeState,
    'workModeSelection' | 'workMode' | 'executionPermissionMode'
  >> & {
    /** Compatibility input used by older create-session callers. */
    permissionMode?: PermissionMode
  }
  workspaceDefaults?: {
    defaultWorkMode?: WorkModeOption
    executionPermissionMode?: ExecutionPermissionMode
    /** Compatibility value from workspaces created before work modes. */
    permissionMode?: PermissionMode
  }
  fallbackPermissionMode: PermissionMode
}

export function workModeOptionToRequest(option: WorkModeOption): WorkModeRequest {
  return option === 'auto'
    ? { workModeSelection: 'auto' }
    : { workModeSelection: 'manual', workMode: option }
}

export function workModeStateToOption(
  state: Pick<WorkModeState, 'workModeSelection' | 'workMode'>,
): WorkModeOption {
  return state.workModeSelection === 'auto' ? 'auto' : state.workMode
}

/**
 * Resolve the initial session state without silently changing legacy workspace
 * behaviour. Only workspaces that persist defaultWorkMode opt into Auto.
 *
 * When Auto is configured, the starting phase is Execute (agent-default), matching
 * Grok/Cursor so users do not manually switch before ordinary implementation work.
 * The first user turn may still re-route via resolveAutomaticWorkMode.
 */
export function resolveInitialWorkModeState(
  input: InitialWorkModeStateInput,
): WorkModeState {
  const requested = input.requested
  const workspaceDefaults = input.workspaceDefaults
  const legacyPermissionMode = requested?.permissionMode
    ?? workspaceDefaults?.permissionMode
    ?? input.fallbackPermissionMode
  const legacyState = deriveLegacyWorkModeState(legacyPermissionMode)
  const configuredDefaultWorkMode = workspaceDefaults?.defaultWorkMode
  const hasExplicitWorkMode =
    requested?.workModeSelection !== undefined || requested?.workMode !== undefined
  const hasExplicitLegacyPermissionMode = requested?.permissionMode !== undefined

  const workModeSelection: WorkModeSelection = hasExplicitWorkMode
    ? (requested?.workModeSelection ?? 'manual')
    : hasExplicitLegacyPermissionMode || configuredDefaultWorkMode === undefined
      ? 'manual'
      : configuredDefaultWorkMode === 'auto'
        ? 'auto'
        : 'manual'
  const workMode: WorkMode = requested?.workMode
    ?? (hasExplicitLegacyPermissionMode || configuredDefaultWorkMode === undefined
      ? legacyState.workMode
      : configuredDefaultWorkMode === 'auto'
        ? 'execute'
        : configuredDefaultWorkMode)
  const executionPermissionMode: ExecutionPermissionMode =
    requested?.executionPermissionMode
    ?? (hasExplicitLegacyPermissionMode
      ? legacyState.executionPermissionMode
      : workspaceDefaults?.executionPermissionMode
        ?? legacyState.executionPermissionMode)

  return {
    workModeSelection,
    workMode,
    executionPermissionMode,
    permissionMode: projectPermissionMode(workMode, executionPermissionMode),
  }
}

const EXPLICIT_MODE_PREFIX = /^\/(explore|plan|execute)\b/i

/**
 * Verbs that mean "look at / report on" existing work. When these frame the
 * request, nouns like "修改/changes" describe the subject of review, not an
 * instruction to mutate — Auto must stay in Explore.
 */
const AUDIT_VERBS = [
  /\b(review|inspect|audit|examine)\b/i,
  /(审查|检查|评估|审阅|排查|检视)/,
]

const READ_ONLY_PATTERNS = [
  /\b(explain|review|inspect|investigate|diagnos(?:e|is)|analy[sz]e|report|compare|what|why|how)\b/i,
  /(解释|说明|审查|检查|调查|诊断|分析|汇报|报告|比较|对比|为什么|是什么|怎么)/,
]

/** Imperative change verbs. "修改" as a noun after an audit verb is not enough. */
const MUTATION_PATTERNS = [
  /\b(fix|add|create|implement|update|change|rename|remove|delete|refactor|migrate|build|write)\b/i,
  /(修复|新增|添加|创建|实现|更新|改造|改名|重命名|移除|删除|重构|迁移|构建|编写|动手)/,
  /(?:^|[，,。；;\s])修改/,
]

function matchesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(input))
}

/**
 * Parse route/deep-link values. Canonical Execute is approval-neutral; only
 * the explicit legacy `allow-all` alias requests bypass.
 */
export function parseWorkModeRequest(input: string): WorkModeRequest | null {
  switch (input.trim().toLowerCase()) {
    case 'auto':
      return { workModeSelection: 'auto' }
    case 'explore':
    case 'safe':
      return { workModeSelection: 'manual', workMode: 'explore' }
    case 'plan':
      return { workModeSelection: 'manual', workMode: 'plan' }
    case 'execute':
    case 'ask':
    case 'ask-to-edit':
      return { workModeSelection: 'manual', workMode: 'execute' }
    case 'allow-all':
      return {
        workModeSelection: 'manual',
        workMode: 'execute',
        executionPermissionMode: 'allow-all',
      }
    default:
      return null
  }
}

export interface ResolveAutomaticWorkModeOptions {
  /** When set, ambiguous turns keep this phase (Grok/Cursor: avoid thrashing). */
  currentWorkMode?: WorkMode
}

/**
 * Deterministic first-pass router for Auto phase selection.
 *
 * Cursor / Codex daily shape:
 * - Default Agent (Execute) can search and edit freely.
 * - Plan is opt-in: UI toggle, `/plan` prefix, or agent `EnterPlan` — never a
 *   heuristic that forces Plan on “broad” work.
 * - Explore is only for clearly read-only / audit questions (Ask-like).
 *
 * Weak/ambiguous turns stick to the current phase or fall back to Execute.
 */
export function resolveAutomaticWorkMode(
  input: string,
  options?: ResolveAutomaticWorkModeOptions,
): AutomaticWorkModeResolution {
  const text = input.trim()
  const explicit = text.match(EXPLICIT_MODE_PREFIX)?.[1]?.toLowerCase() as WorkMode | undefined
  if (explicit) return { workMode: explicit, reason: 'explicit' }

  const isAudit = matchesAny(text, AUDIT_VERBS)
  const isMutation = matchesAny(text, MUTATION_PATTERNS)

  // Pure review / diagnosis stays Ask-like. If the user also asks to change
  // something, prefer Execute (agent) — same as Cursor Agent, not Plan.
  if (isAudit && !isMutation) {
    return { workMode: 'explore', reason: 'read-only' }
  }
  if (isMutation) {
    return { workMode: 'execute', reason: 'bounded-change' }
  }
  if (matchesAny(text, READ_ONLY_PATTERNS)) {
    return { workMode: 'explore', reason: 'read-only' }
  }

  if (options?.currentWorkMode) {
    return { workMode: options.currentWorkMode, reason: 'sticky' }
  }
  return { workMode: 'execute', reason: 'fallback' }
}

/**
 * Whether Auto routing should write a new phase. Sticky resolutions that keep
 * the same mode skip persistence and events (less UI flicker).
 */
export function shouldApplyAutomaticWorkMode(
  current: WorkMode | undefined,
  resolution: AutomaticWorkModeResolution,
): boolean {
  if (resolution.reason === 'sticky' && current === resolution.workMode) return false
  if (current === resolution.workMode && resolution.reason === 'fallback') return false
  return current !== resolution.workMode || resolution.reason !== 'sticky'
}

export function projectPermissionMode(
  workMode: WorkMode,
  executionPermissionMode: ExecutionPermissionMode,
): PermissionMode {
  return workMode === 'execute' ? executionPermissionMode : 'safe'
}

export function formatWorkModeInstruction(workMode: WorkMode): string {
  switch (workMode) {
    case 'explore':
      return 'Work phase: Explore (Ask-like). Investigate, explain, and report. Do not modify project files or perform mutating actions. If the user wants implementation, they or you may switch to Execute; for a formal plan-first path use EnterPlan then SubmitPlan.'
    case 'plan':
      return 'Work phase: Plan (OpenCode plan / Grok plan mode). Investigate as needed, write a concrete plan under plansFolderPath only. Do not mutate other project files. When ready, call SubmitPlan and wait for approval before implementation.'
    case 'execute':
      return 'Work phase: Execute (OpenCode build / Grok Agent). Search, edit, and verify freely under the active permission policy. Stay here for ordinary work including multi-file changes. Call EnterPlan only when the approach is genuinely ambiguous or the user asks for a plan; call SubmitPlan only when a written plan needs human approval to implement.'
  }
}

/**
 * Compatibility migration for sessions created before work modes were stored.
 * Manual selection preserves their previous effective behavior exactly.
 */
export function deriveLegacyWorkModeState(permissionMode: PermissionMode): WorkModeState {
  const executionPermissionMode = permissionMode === 'allow-all' ? 'allow-all' : 'ask'
  const workMode = permissionMode === 'safe' ? 'explore' : 'execute'
  return {
    workMode,
    workModeSelection: 'manual',
    executionPermissionMode,
    permissionMode,
  }
}

export function resolvePlanApprovalTransition(state: WorkModeState): WorkModeState {
  return {
    ...state,
    workMode: 'execute',
    permissionMode: projectPermissionMode('execute', state.executionPermissionMode),
  }
}

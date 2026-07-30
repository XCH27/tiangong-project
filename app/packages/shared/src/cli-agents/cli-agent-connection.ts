/**
 * CLI agent connections.
 *
 * Fleet talks to three CLI agents and does it three different ways, each a
 * bespoke reverse-engineering of a tool that never promised stability:
 *
 *   - **OpenCode** — run `opencode models --verbose` and parse human-readable
 *     text by counting braces.
 *   - **Codex** — spawn `codex app-server --stdio` and hand-roll JSON-RPC with
 *     hardcoded request ids.
 *   - **Claude Code** — regex `claude --help` for `--effort <level>`, and read
 *     `~/.claude.json`'s `modelAccessCache`, which is another program's private
 *     state file.
 *
 * Every one of these breaks silently. Help text is written for humans and gets
 * reworded; a private cache is empty until the user has run that tool at least
 * once and its schema changes without notice; brace counting fails on the first
 * model whose description contains a brace. When they break the user sees "no
 * models" rather than "we could not read this", and adding a fourth agent means
 * inventing a fourth hack.
 *
 * There is a standard for exactly this. The Agent Client Protocol is JSON-RPC
 * 2.0 over stdio — LSP's idea applied to coding agents — created by Zed in
 * August 2025, joined by JetBrains, and by 2026 implemented by 25+ agents.
 * Gemini CLI speaks it natively via `--acp`; Claude Code and Codex have adapters
 * (`claude-agent-acp`, `codex-acp`). One client replaces all three probes, and a
 * fourth agent becomes a catalog entry.
 *
 * The second correction is structural, and it comes from AionUi's model:
 * **detection and configuration are different layers.** What is installed on
 * this machine is a fact to discover. What the user configured — which agent,
 * which model, which skills — references those facts and is not one of them.
 * The settings page currently renders discovery results as if they were the
 * configuration, which is why it cannot show an agent the user wants but has not
 * installed, and cannot keep a choice that a failed probe temporarily hid.
 */

export type CliAgentTransport =
  /** Agent Client Protocol over stdio. The target for every local agent. */
  | 'acp'
  /**
   * A hand-written probe for an agent with no ACP adapter yet. Named so it is
   * visible as debt rather than looking like a design.
   */
  | 'legacy-probe'
  /** A remote agent reached over a socket rather than a child process. */
  | 'remote'

// ── Binary resolution ───────────────────────────────────────────────────────

/**
 * How a command was found.
 *
 * This is the single most common practical failure: the probes call
 * `execFile('claude', …)` with a bare name, and a desktop app launched from
 * Finder or the Dock does not inherit the shell PATH. Anyone who installed
 * through nvm, fnm, mise, asdf, volta or Homebrew-on-ARM gets "not installed"
 * for a tool sitting in their terminal. Recording *where* a binary came from is
 * what lets the UI say something better than that.
 */
export type BinarySource =
  /** Found on the PATH the app actually inherited. */
  | 'inherited-path'
  /** Found by asking the user's login shell, which sources their profile. */
  | 'login-shell'
  /** An explicit path the user configured. Always wins. */
  | 'configured'
  /** A well-known install location checked as a last resort. */
  | 'well-known'

export interface ResolvedBinary {
  path: string
  source: BinarySource
  version?: string
}

/**
 * Candidate locations for a version-manager install, in the order to try.
 *
 * Checked only after PATH and the login shell fail, because a guessed path can
 * be a stale shim from an uninstalled version while the shell knows the truth.
 */
export function wellKnownBinaryPaths(command: string, home: string): readonly string[] {
  return [
    `${home}/.local/bin/${command}`,
    `${home}/.bun/bin/${command}`,
    `${home}/.volta/bin/${command}`,
    `${home}/.cargo/bin/${command}`,
    `/opt/homebrew/bin/${command}`,
    `/usr/local/bin/${command}`,
    `${home}/.npm-global/bin/${command}`,
  ]
}

/**
 * Order matters and is not arbitrary. A configured path is an instruction, not a
 * hint. The login shell outranks guessed locations because it reflects the
 * version manager's current selection, and a well-known path may be a shim for a
 * version the user has since removed.
 */
export const BINARY_SOURCE_PRIORITY: readonly BinarySource[] = [
  'configured',
  'inherited-path',
  'login-shell',
  'well-known',
]

export function preferBinary(
  candidates: readonly ResolvedBinary[],
): ResolvedBinary | undefined {
  for (const source of BINARY_SOURCE_PRIORITY) {
    const match = candidates.find((candidate) => candidate.source === source)
    if (match) return match
  }
  return undefined
}

// ── Catalog ─────────────────────────────────────────────────────────────────

export interface CliAgentDefinition {
  id: string
  name: string
  transport: CliAgentTransport
  /** Command to resolve, before any ACP adapter is applied. */
  command: string
  /** Arguments that put the agent into ACP mode. */
  acpArgs?: readonly string[]
  /**
   * Separate package that adapts a non-ACP agent. Named so the UI can offer to
   * install it instead of reporting the agent as broken.
   */
  acpAdapterPackage?: string
  docsUrl?: string
}

/**
 * Declarative, so a new agent is an entry rather than a new probe. Transport
 * records what is true today; the `acpAdapterPackage` entries are the migration
 * path off `legacy-probe`.
 */
export const CLI_AGENT_CATALOG: readonly CliAgentDefinition[] = [
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    transport: 'acp',
    command: 'gemini',
    acpArgs: ['--acp'],
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    transport: 'legacy-probe',
    command: 'claude',
    acpAdapterPackage: 'claude-agent-acp',
  },
  {
    id: 'codex',
    name: 'Codex',
    transport: 'legacy-probe',
    command: 'codex',
    acpAdapterPackage: 'codex-acp',
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    transport: 'legacy-probe',
    command: 'opencode',
  },
]

export function getCliAgentDefinition(id: string): CliAgentDefinition | undefined {
  return CLI_AGENT_CATALOG.find((entry) => entry.id === id)
}

// ── Detection ───────────────────────────────────────────────────────────────

export type CliAgentAvailability =
  /** Connected and reporting a model catalog. */
  | 'ready'
  /** Connected, but reported nothing usable. */
  | 'no-models'
  /** The binary was not found anywhere that was searched. */
  | 'not-installed'
  /** Found, but the ACP adapter it needs is missing. */
  | 'adapter-missing'
  /** Found and reachable, but the handshake failed. */
  | 'handshake-failed'
  /** The probe exceeded its budget. */
  | 'timed-out'

export interface CliAgentDetection {
  agentId: string
  availability: CliAgentAvailability
  binary?: ResolvedBinary
  models: readonly string[]
  /** Raw failure text, kept for the details view rather than the summary line. */
  error?: string
  checkedAt: number
}

/**
 * Whether a failure is worth telling the user how to fix.
 *
 * An agent that is simply not installed is not a problem — most users will never
 * install most of them, and surfacing four red rows teaches people to ignore the
 * page. A tool that *is* installed and still will not connect is a problem, and
 * it is the case where a next step exists.
 */
export function isActionableFailure(detection: CliAgentDetection): boolean {
  switch (detection.availability) {
    case 'adapter-missing':
    case 'handshake-failed':
    case 'timed-out':
    case 'no-models':
      return true
    case 'not-installed':
    case 'ready':
      return false
    default:
      return detection.availability satisfies never
  }
}

/** Ordering for the list: things needing attention, then usable, then absent. */
export function detectionRank(detection: CliAgentDetection): number {
  if (isActionableFailure(detection)) return 0
  return detection.availability === 'ready' ? 1 : 2
}

// ── Freshness ───────────────────────────────────────────────────────────────

/**
 * Detection is cached because it is expensive: every visit to the settings page
 * currently spawns three processes, one of which is a whole app-server. A
 * catalog changes when a tool is upgraded, not between two page views.
 */
export const DETECTION_TTL_MS = 5 * 60_000

export function isDetectionStale(
  detection: CliAgentDetection | undefined,
  now: number,
): boolean {
  if (!detection) return true
  // A failed probe is retried sooner: the usual fix is installing something,
  // and the user expects the page to notice.
  const ttl = detection.availability === 'ready' ? DETECTION_TTL_MS : DETECTION_TTL_MS / 5
  return now - detection.checkedAt > ttl
}

// ── Configuration, which is a different layer ───────────────────────────────

/**
 * What the user chose.
 *
 * Kept apart from detection so a selection survives a probe that fails, or a
 * machine where the tool is not installed yet. Collapsing the two — which is
 * what the current settings page does by rendering probe results directly — is
 * why a transient failure silently drops the user's configured agent.
 */
export interface CliAgentSelection {
  agentId: string
  modelId?: string
  /** Explicit binary path, when the user pinned one. */
  binaryPath?: string
}

export type SelectionState =
  | { usable: true; detection: CliAgentDetection }
  | { usable: false; reason: 'not-detected' | 'agent-unavailable' | 'model-missing' }

/**
 * Resolve a saved selection against current detection.
 *
 * Reports *why* a configured choice is not usable rather than dropping it, so
 * the surface can say "Claude Code is configured but not installed here" — which
 * is actionable — instead of quietly falling back to something else.
 */
export function resolveSelection(
  selection: CliAgentSelection,
  detections: readonly CliAgentDetection[],
): SelectionState {
  const detection = detections.find((entry) => entry.agentId === selection.agentId)
  if (!detection) return { usable: false, reason: 'not-detected' }
  if (detection.availability !== 'ready') {
    return { usable: false, reason: 'agent-unavailable' }
  }
  if (selection.modelId && !detection.models.includes(selection.modelId)) {
    return { usable: false, reason: 'model-missing' }
  }
  return { usable: true, detection }
}

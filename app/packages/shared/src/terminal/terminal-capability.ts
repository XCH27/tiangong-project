/**
 * Terminal capability and command admission.
 *
 * The terminal is `execFileAsync(shell, ['-l', '-c', command])` with a 30-second
 * timeout and a 1.5 MB buffer. That is a command runner, and calling it a
 * terminal sets an expectation it cannot meet:
 *
 *   - **No PTY.** An interactive program has no terminal to attach to. `vim`,
 *     `top`, `less`, and anything that prompts `Continue? [y/N]` simply hang
 *     until the timeout kills them. The user sees thirty seconds of nothing
 *     followed by an empty result.
 *   - **No streaming.** Output is buffered until exit, so a two-minute build
 *     shows nothing and then shows nothing again, because it was killed at
 *     thirty seconds.
 *   - **No cancellation.** Once started, the only exit is the timeout.
 *   - **No session.** Each command is a fresh login shell, so `cd` does not
 *     persist, exported variables vanish, and the profile is re-sourced every
 *     time.
 *
 * Every one of those is defensible for a *bounded command runner*, which is what
 * the R18 slice deliberately scoped. What is not defensible is discovering the
 * boundary by waiting thirty seconds for a hang. So commands are classified
 * before they run, and one that the current backend cannot host is refused with
 * the reason — the same rule the workbench toggle and the connect form follow.
 *
 * Adding a PTY backend later then means declaring a second capability here, not
 * rewriting the callers.
 */

export type TerminalBackend =
  /** `execFile` with a timeout. Buffered, non-interactive, uncancellable. */
  | 'one-shot'
  /** A real pseudo-terminal: streaming, interactive, cancellable, stateful. */
  | 'pty'

export interface TerminalCapability {
  backend: TerminalBackend
  /** Output arrives as it is produced rather than only at exit. */
  streaming: boolean
  /** The user can stop a running command. */
  cancellable: boolean
  /** Programs that require a terminal device can run. */
  interactive: boolean
  /** `cd` and exported variables survive between commands. */
  persistentState: boolean
  maxDurationMs: number
  maxOutputBytes: number
}

/** What ships today. Values mirror the RPC handler exactly. */
export const ONE_SHOT_CAPABILITY: TerminalCapability = {
  backend: 'one-shot',
  streaming: false,
  cancellable: false,
  interactive: false,
  persistentState: false,
  maxDurationMs: 30_000,
  maxOutputBytes: 1_500_000,
}

export const PTY_CAPABILITY: TerminalCapability = {
  backend: 'pty',
  streaming: true,
  cancellable: true,
  interactive: true,
  persistentState: true,
  // A PTY streams, so duration is bounded by the user rather than the transport.
  maxDurationMs: Number.POSITIVE_INFINITY,
  maxOutputBytes: Number.POSITIVE_INFINITY,
}

// ── Command classification ──────────────────────────────────────────────────

export type CommandRequirement =
  /** Runs fine inside a bounded, buffered execution. */
  | 'bounded'
  /** Needs a terminal device; will hang without one. */
  | 'interactive'
  /** Routinely outlives a 30-second budget. */
  | 'long-running'

/**
 * Programs that take over the terminal. Without a PTY these do not fail — they
 * block, which is worse, because the failure is indistinguishable from a slow
 * command until the timeout.
 */
const INTERACTIVE_PROGRAMS = new Set([
  'vi', 'vim', 'nvim', 'emacs', 'nano', 'pico',
  'less', 'more', 'man',
  'top', 'htop', 'btop',
  'ssh', 'sftp', 'telnet',
  'tmux', 'screen',
  'python', 'python3', 'node', 'irb', 'psql', 'mysql', 'sqlite3',
  'fzf', 'gdb', 'lldb',
])

/**
 * Commands that normally outlive the budget. Listed as a first token plus a
 * subcommand, because `git status` is bounded and `git clone` is not.
 */
const LONG_RUNNING: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['npm', ['install', 'ci', 'run', 'test', 'publish']],
  ['pnpm', ['install', 'run', 'test', 'build']],
  ['yarn', ['install', 'run', 'test', 'build']],
  ['bun', ['install', 'run', 'test', 'build']],
  ['git', ['clone', 'push', 'pull', 'fetch']],
  ['cargo', ['build', 'test', 'run', 'install']],
  ['go', ['build', 'test', 'install']],
  ['docker', ['build', 'pull', 'push', 'run']],
  ['make', []],
  ['gradle', []],
  ['mvn', []],
]

/**
 * An interactive flag turns an otherwise bounded command into one that waits for
 * input. `git rebase -i` is the common case; so is anything with `--interactive`.
 */
const INTERACTIVE_FLAGS = ['-i', '--interactive', '--watch', '-w']

export function classifyCommand(command: string): CommandRequirement {
  const tokens = command.trim().split(/\s+/).filter(Boolean)
  const program = tokens[0]?.split('/').pop()?.toLowerCase() ?? ''
  const subcommand = tokens[1]?.toLowerCase() ?? ''

  if (INTERACTIVE_PROGRAMS.has(program)) return 'interactive'

  // `git rebase -i` waits for an editor; `--watch` never exits at all.
  if (tokens.slice(1).some((token) => INTERACTIVE_FLAGS.includes(token.toLowerCase()))) {
    return 'interactive'
  }

  const longRunning = LONG_RUNNING.find(([name]) => name === program)
  if (longRunning) {
    const [, subcommands] = longRunning
    if (subcommands.length === 0 || subcommands.includes(subcommand)) return 'long-running'
  }

  return 'bounded'
}

// ── Admission ───────────────────────────────────────────────────────────────

export type CommandRefusal =
  /** Needs a terminal device the current backend does not provide. */
  | 'needs-pty'
  /** Would be killed by the duration budget before finishing. */
  | 'exceeds-budget'
  | 'empty'
  | 'too-long'

export type CommandAdmission =
  | { admitted: true; requirement: CommandRequirement }
  | { admitted: false; reason: CommandRefusal; requirement?: CommandRequirement }

/** Mirrors the handler's own guard so the UI can refuse before the round trip. */
export const MAX_COMMAND_LENGTH = 20_000

/**
 * Decide before running, so the boundary is stated rather than discovered.
 *
 * A refusal names what is missing, which is what lets the surface offer the
 * right next step — "run this in your own terminal", or later "this needs the
 * PTY backend" — instead of showing an empty result after a thirty-second wait.
 */
export function admitCommand(
  command: string,
  capability: TerminalCapability,
): CommandAdmission {
  const trimmed = command.trim()
  if (!trimmed) return { admitted: false, reason: 'empty' }
  if (trimmed.length > MAX_COMMAND_LENGTH) return { admitted: false, reason: 'too-long' }

  const requirement = classifyCommand(trimmed)

  if (requirement === 'interactive' && !capability.interactive) {
    return { admitted: false, reason: 'needs-pty', requirement }
  }
  // Without streaming a long command produces nothing at all: it is killed
  // before exit, and buffered output is discarded with the process.
  if (requirement === 'long-running' && !capability.streaming) {
    return { admitted: false, reason: 'exceeds-budget', requirement }
  }

  return { admitted: true, requirement }
}

// ── Result truncation ───────────────────────────────────────────────────────

export interface TerminalResult {
  output: string
  exitCode: number
  timedOut: boolean
  /** Set when output was cut; the UI must say so rather than imply completeness. */
  truncated?: boolean
}

/**
 * Keep the *end* of oversized output.
 *
 * `maxBuffer` currently kills the process and discards everything, so a build
 * that logged 2 MB and then failed shows nothing — including the error, which is
 * the only part anyone wanted. The tail is where failures live.
 */
export function truncateOutput(
  output: string,
  maxBytes: number,
): { output: string; truncated: boolean } {
  if (Number.isFinite(maxBytes) === false) return { output, truncated: false }
  const encoded = new TextEncoder().encode(output)
  if (encoded.length <= maxBytes) return { output, truncated: false }

  const tail = encoded.slice(encoded.length - maxBytes)
  // Decoding a slice can start mid-character; `fatal: false` replaces the
  // partial leading sequence rather than throwing.
  return { output: new TextDecoder().decode(tail), truncated: true }
}

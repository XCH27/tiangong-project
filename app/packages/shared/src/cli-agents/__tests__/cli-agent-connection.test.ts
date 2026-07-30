import { describe, expect, it } from 'bun:test'
import {
  CLI_AGENT_CATALOG,
  DETECTION_TTL_MS,
  detectionRank,
  getCliAgentDefinition,
  isActionableFailure,
  isDetectionStale,
  preferBinary,
  resolveSelection,
  wellKnownBinaryPaths,
  type CliAgentDetection,
  type ResolvedBinary,
} from '../cli-agent-connection'

const detection = (patch: Partial<CliAgentDetection> = {}): CliAgentDetection => ({
  agentId: 'claude-code',
  availability: 'ready',
  models: ['sonnet'],
  checkedAt: 0,
  ...patch,
})

describe('catalog', () => {
  it('records the ACP adapter for agents that need one', () => {
    expect(getCliAgentDefinition('claude-code')?.acpAdapterPackage).toBe('claude-agent-acp')
    expect(getCliAgentDefinition('codex')?.acpAdapterPackage).toBe('codex-acp')
  })

  // Gemini CLI speaks ACP natively, so it needs args rather than an adapter.
  it('records native ACP support as arguments', () => {
    const gemini = getCliAgentDefinition('gemini-cli')
    expect(gemini?.transport).toBe('acp')
    expect(gemini?.acpArgs).toEqual(['--acp'])
    expect(gemini?.acpAdapterPackage).toBeUndefined()
  })

  // `legacy-probe` is named so the hand-written probes read as debt rather than
  // as a design.
  it('marks hand-written probes as legacy', () => {
    for (const id of ['claude-code', 'codex', 'opencode']) {
      expect(getCliAgentDefinition(id)?.transport).toBe('legacy-probe')
    }
  })

  it('has no duplicate ids', () => {
    const ids = CLI_AGENT_CATALOG.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('binary resolution', () => {
  const binary = (source: ResolvedBinary['source']): ResolvedBinary => ({
    path: `/${source}/claude`,
    source,
  })

  // A configured path is an instruction, not a hint.
  it('lets a configured path win over everything', () => {
    expect(preferBinary([binary('well-known'), binary('inherited-path'), binary('configured')]))
      .toMatchObject({ source: 'configured' })
  })

  // The login shell reflects the version manager's current selection; a
  // well-known path may be a shim for a version the user has since removed.
  it('prefers the login shell over a guessed location', () => {
    expect(preferBinary([binary('well-known'), binary('login-shell')]))
      .toMatchObject({ source: 'login-shell' })
  })

  it('returns nothing when no candidate was found', () => {
    expect(preferBinary([])).toBeUndefined()
  })

  // The desktop app does not inherit the shell PATH when launched from Finder,
  // so version-manager installs need explicit candidates.
  it('covers the common version-manager locations', () => {
    const paths = wellKnownBinaryPaths('claude', '/Users/x')
    expect(paths).toContain('/Users/x/.bun/bin/claude')
    expect(paths).toContain('/Users/x/.volta/bin/claude')
    expect(paths).toContain('/opt/homebrew/bin/claude')
  })
})

describe('failure triage', () => {
  // Surfacing four red rows for tools the user never intended to install teaches
  // people to ignore the page.
  it('does not treat an uninstalled agent as a problem', () => {
    expect(isActionableFailure(detection({ availability: 'not-installed' }))).toBe(false)
    expect(isActionableFailure(detection({ availability: 'ready' }))).toBe(false)
  })

  it('treats an installed-but-unreachable agent as actionable', () => {
    for (const availability of ['adapter-missing', 'handshake-failed', 'timed-out', 'no-models'] as const) {
      expect(isActionableFailure(detection({ availability }))).toBe(true)
    }
  })

  it('sorts attention first, then usable, then absent', () => {
    const list = [
      detection({ availability: 'not-installed' }),
      detection({ availability: 'ready' }),
      detection({ availability: 'adapter-missing' }),
    ]
    expect([...list].sort((a, b) => detectionRank(a) - detectionRank(b)).map((d) => d.availability))
      .toEqual(['adapter-missing', 'ready', 'not-installed'])
  })
})

describe('freshness', () => {
  // Every settings-page visit currently spawns three processes, one of them a
  // whole app-server.
  it('reuses a recent successful detection', () => {
    expect(isDetectionStale(detection({ checkedAt: 0 }), DETECTION_TTL_MS - 1)).toBe(false)
    expect(isDetectionStale(detection({ checkedAt: 0 }), DETECTION_TTL_MS + 1)).toBe(true)
  })

  // The fix for a failure is usually installing something, and the user expects
  // the page to notice.
  it('retries a failure sooner than it re-probes a success', () => {
    const failed = detection({ availability: 'not-installed', checkedAt: 0 })
    const at = DETECTION_TTL_MS / 5 + 1
    expect(isDetectionStale(failed, at)).toBe(true)
    expect(isDetectionStale(detection({ checkedAt: 0 }), at)).toBe(false)
  })

  it('treats a missing detection as stale', () => {
    expect(isDetectionStale(undefined, 0)).toBe(true)
  })
})

describe('selection against detection', () => {
  // Collapsing configuration into detection is why a transient probe failure
  // silently drops the user's configured agent.
  it('keeps a selection and explains why it is unusable', () => {
    expect(resolveSelection({ agentId: 'claude-code' }, []))
      .toEqual({ usable: false, reason: 'not-detected' })

    expect(resolveSelection(
      { agentId: 'claude-code' },
      [detection({ availability: 'handshake-failed' })],
    )).toEqual({ usable: false, reason: 'agent-unavailable' })
  })

  it('reports a model that the agent no longer offers', () => {
    expect(resolveSelection(
      { agentId: 'claude-code', modelId: 'retired' },
      [detection({ models: ['sonnet'] })],
    )).toEqual({ usable: false, reason: 'model-missing' })
  })

  it('resolves a usable selection to its detection', () => {
    const result = resolveSelection(
      { agentId: 'claude-code', modelId: 'sonnet' },
      [detection()],
    )
    expect(result.usable).toBe(true)
  })

  it('accepts a selection with no pinned model', () => {
    expect(resolveSelection({ agentId: 'claude-code' }, [detection()]).usable).toBe(true)
  })
})

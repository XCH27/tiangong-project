/**
 * Data sources as part of a kit.
 *
 * Sources are currently their own concept: a user connects one globally, and
 * every session sees it. That made sense when a session had one shape, and it
 * stops making sense once kits define roles — a memory curator needs the chat
 * archives, a code reviewer needs the repository, and neither benefits from
 * seeing the other's. A globally-connected source is either always in scope
 * (attention spent on data this role cannot use) or manually toggled per session
 * (a step nobody performs reliably).
 *
 * So a kit declares what it reads, the same way it declares skills and tools,
 * and the binding carries the two things a global connection cannot express:
 * whether the kit *needs* it, and how sensitive the contents are.
 *
 * The second is the important one. A local archive of chat logs exported from
 * another application is somebody's correspondence. It is exactly the material a
 * memory curator wants and exactly the material that must never be injected
 * wholesale or promoted into durable memory without passing the floors in D5.
 * Treating it as "just another source" is how a private conversation ends up in
 * `MEMORY.md` with a source pointer attached.
 */

export type KitSourceKind =
  /** Files already inside the workspace: project notes, decisions, specs. */
  | 'workspace-files'
  /**
   * An export from another application — chat logs, notes, message history.
   * Read-only by construction: Fleet did not write it and cannot maintain it.
   */
  | 'local-archive'
  /** A live connector: an API, an MCP server, a database. */
  | 'connector'
  /**
   * Reference material the kit is built around — papers, standards, style
   * guides. Stable, citable, and safe to quote.
   */
  | 'reference-corpus'

/**
 * Mirrors the memory sensitivity vocabulary so a source and the entries derived
 * from it cannot disagree about how careful to be.
 */
export type SourceSensitivity = 'normal' | 'sensitive' | 'uncertain'

export interface KitSourceBinding {
  id: string
  kind: KitSourceKind
  label: string
  /** Path, URL, or connector id. Interpreted by kind. */
  locator: string
  /**
   * Whether the kit is usable without it.
   *
   * A missing required source refuses activation; a missing optional one
   * degrades and says so. Silently running a curator with no archives attached
   * produces an empty result that reads like the archives had nothing in them.
   */
  required: boolean
  /**
   * Writing is opt-in and separate, because a source a kit can write is a
   * different risk from one it can read. Most bindings never need it.
   */
  access?: 'read' | 'read-write'
  sensitivity?: SourceSensitivity
}

/**
 * Sensitivity when the binding does not state one.
 *
 * Unknown defaults to the most restrictive answer, and a local archive is
 * *always* treated as sensitive regardless of what the binding claims — the
 * author of a kit is not the person whose correspondence it points at, and their
 * judgement is not the one that should decide.
 */
export function effectiveSensitivity(binding: KitSourceBinding): SourceSensitivity {
  if (binding.kind === 'local-archive') return 'sensitive'
  return binding.sensitivity ?? 'uncertain'
}

/** Reference material is the only kind safe to quote verbatim into a prompt. */
export function isQuotableSource(binding: KitSourceBinding): boolean {
  return binding.kind === 'reference-corpus' && effectiveSensitivity(binding) === 'normal'
}

// ── Activation ──────────────────────────────────────────────────────────────

export type SourceRefusal =
  | 'missing-required'
  /** Declared read-write but the kit was granted read-only. */
  | 'write-not-granted'

export interface SourceActivation {
  /** Bindings that resolved and may be read. */
  active: readonly KitSourceBinding[]
  /** Optional bindings that did not resolve; the kit runs degraded. */
  degraded: readonly KitSourceBinding[]
  /** Present when the kit cannot run at all. */
  refusal?: { reason: SourceRefusal; bindings: readonly KitSourceBinding[] }
}

/**
 * Resolve a kit's sources against what is actually available.
 *
 * Degradation is reported rather than absorbed. A curator that quietly ran over
 * two of its five archives produces a *plausible* result, which is worse than an
 * obviously empty one: nobody re-runs a result that looks fine.
 */
export function activateSources(input: {
  bindings: readonly KitSourceBinding[]
  resolved: ReadonlySet<string>
  /** Bindings the user granted write access to. */
  writeGranted?: ReadonlySet<string>
}): SourceActivation {
  const missingRequired = input.bindings.filter(
    (binding) => binding.required && !input.resolved.has(binding.id),
  )
  if (missingRequired.length > 0) {
    return {
      active: [],
      degraded: [],
      refusal: { reason: 'missing-required', bindings: missingRequired },
    }
  }

  const ungrantedWrites = input.bindings.filter(
    (binding) => binding.access === 'read-write' && !(input.writeGranted?.has(binding.id) ?? false),
  )
  if (ungrantedWrites.length > 0) {
    // Downgrading to read silently would leave the kit failing later at a write
    // it was told it could perform, which reads as the kit being broken.
    return {
      active: [],
      degraded: [],
      refusal: { reason: 'write-not-granted', bindings: ungrantedWrites },
    }
  }

  const active = input.bindings.filter((binding) => input.resolved.has(binding.id))
  const degraded = input.bindings.filter((binding) => !input.resolved.has(binding.id))
  return { active, degraded }
}

// ── Ingestion ───────────────────────────────────────────────────────────────

export type IngestDisposition =
  /** May be read and reasoned over in the session. */
  | 'readable'
  /** Readable, and findings from it may be proposed for durable memory. */
  | 'promotable'
  /** Readable only through search results; never injected wholesale. */
  | 'search-only'

/**
 * What a kit may do with a source's contents.
 *
 * A local archive is `search-only`: a curator can search it, cite a passage, and
 * derive a claim, but the archive itself never enters the window and nothing
 * from it is promotable without the human reviewing the specific entry. That is
 * the difference between "learn from my history" and "copy my history into a
 * file the agent quotes forever".
 */
export function ingestDisposition(binding: KitSourceBinding): IngestDisposition {
  if (binding.kind === 'local-archive') return 'search-only'
  if (effectiveSensitivity(binding) !== 'normal') return 'search-only'
  return binding.kind === 'reference-corpus' ? 'readable' : 'promotable'
}

/**
 * Whether a finding derived from this source may be nominated for memory.
 *
 * Deliberately narrow. The value of an archive is the *pattern* across it — that
 * this team always ships behind a flag, that this API is the one that keeps
 * breaking — and a pattern is a new claim the curator states and sources, not a
 * quote it lifts.
 */
export function mayPromoteFrom(binding: KitSourceBinding): boolean {
  return ingestDisposition(binding) === 'promotable'
}

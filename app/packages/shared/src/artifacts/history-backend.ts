/**
 * Artifact history routing.
 *
 * The previous snapshot design hardcoded git as the store. That is correct for
 * code and wrong for everything else this product is heading toward, and the
 * failure modes are not subtle:
 *
 *   - **Media.** Git stores every version of a video whole. Delta compression
 *     does nothing on compressed formats, so a repository grows by the full file
 *     size per edit, and `git diff` on it is meaningless. This is the exact
 *     problem git-lfs exists to solve, and it solves it by keeping *pointers* in
 *     git and the bytes in a separate content-addressed store.
 *
 *   - **Canvas and timelines.** A canvas document is one JSON file, so a file
 *     diff of "moved one node" is a whole-file rewrite. History has to be at the
 *     record level to mean anything. tldraw's store carries exactly this shape —
 *     `{added, updated: [from, to], removed}` plus a reversible diff — and needs
 *     no snapshot to undo.
 *
 * So history is routed by artifact kind rather than assumed. Three mechanisms,
 * and the third is shared: a canvas and an edit timeline are the same problem
 * (references plus operations), which is why this is two new backends and not
 * three.
 */

export type ArtifactKind =
  /** Source files, config, documents — anything git handles well. */
  | 'text'
  /** Images, audio, video, and any other opaque binary. */
  | 'media'
  /** Canvases, edit timelines: a graph of records mutated by operations. */
  | 'document-graph'

export type HistoryBackendId = 'git-tree' | 'content-store' | 'operation-log'

/**
 * Which mechanism owns an artifact's history.
 *
 * This is the routing decision the rest of the system asks for by name, so the
 * reason each kind lands where it does stays in one place.
 */
export function historyBackendFor(kind: ArtifactKind): HistoryBackendId {
  switch (kind) {
    case 'text': return 'git-tree'
    case 'media': return 'content-store'
    case 'document-graph': return 'operation-log'
    default: return kind satisfies never
  }
}

/**
 * Extensions that must never enter a git tree.
 *
 * Deliberately a denylist of known-binary formats rather than a heuristic: a
 * size threshold would put a small PNG in git and a large generated `.ts` in the
 * content store, and both are the wrong home. Anything unrecognized is treated
 * as text, because misfiling a text file costs storage while misfiling a binary
 * costs a diff nobody can read.
 */
const MEDIA_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'tiff', 'ico', 'heic',
  'mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v',
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a',
  'psd', 'ai', 'sketch', 'fig', 'blend', 'aep', 'prproj',
  'zip', 'tar', 'gz', '7z', 'rar', 'pdf',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
])

/** Extensions whose contents are a record graph, not a text document. */
const DOCUMENT_GRAPH_EXTENSIONS = new Set([
  'tldr', 'canvas', 'timeline',
])

export function artifactKindForPath(path: string): ArtifactKind {
  const extension = path.split('.').pop()?.toLowerCase() ?? ''
  if (DOCUMENT_GRAPH_EXTENSIONS.has(extension)) return 'document-graph'
  if (MEDIA_EXTENSIONS.has(extension)) return 'media'
  return 'text'
}

// ── Attribution ─────────────────────────────────────────────────────────────

/**
 * Who produced a change.
 *
 * Orthogonal to the history mechanism and required by all three. With one agent
 * this looks like bookkeeping; with several it is the difference between a
 * review that can be read and a pile of interleaved edits, and between reverting
 * your own work and reverting a colleague's.
 *
 * tldraw's `HistoryEntry` carries the same field (`source: 'user' | 'remote'`)
 * for the same reason — it just needs fewer values than a fleet of agents does.
 */
export interface ChangeAttribution {
  /** Session that produced the change. */
  sessionId: string
  /**
   * Agent identity within that session. Absent means the human acted directly —
   * which must stay distinguishable from an agent acting on their behalf.
   */
  agentId?: string
  /** Turn boundary, so a revert can address "everything after this point". */
  messageId?: string
  at: number
}

export function isHumanChange(attribution: ChangeAttribution): boolean {
  return attribution.agentId === undefined
}

/**
 * Group changes by author so a review can be read one agent at a time.
 * Human edits collect under a reserved key rather than being dropped.
 */
export const HUMAN_AUTHOR_KEY = 'human'

export function groupByAuthor<T extends { attribution: ChangeAttribution }>(
  changes: readonly T[],
): ReadonlyMap<string, readonly T[]> {
  const grouped = new Map<string, T[]>()
  for (const change of changes) {
    const key = change.attribution.agentId ?? HUMAN_AUTHOR_KEY
    const bucket = grouped.get(key)
    if (bucket) bucket.push(change)
    else grouped.set(key, [change])
  }
  return grouped
}

// ── Write admission ─────────────────────────────────────────────────────────

/**
 * Concurrent writes are refused, not merged.
 *
 * Two agents editing one file cannot be reconciled by git in a live session:
 * there is no commit to merge and no human watching the conflict markers. The
 * only honest answer is to admit one writer at a time per path and make the
 * second wait — which is a permission decision, so it belongs on the existing
 * permission path rather than in a new lock manager.
 *
 * `document-graph` is the exception. Record-level operations on disjoint nodes
 * genuinely commute, which is the whole reason canvases can be collaborative
 * while source files cannot.
 */
export interface WriteLease {
  path: string
  holder: ChangeAttribution
  expiresAt: number
}

export type WriteAdmission =
  | { admitted: true }
  | { admitted: false; reason: 'held-by-another'; holder: ChangeAttribution }

export function admitWrite(input: {
  path: string
  requester: ChangeAttribution
  leases: readonly WriteLease[]
  now: number
}): WriteAdmission {
  // Record-level operations on a graph commute; serializing them would remove
  // the only reason that format exists.
  if (artifactKindForPath(input.path) === 'document-graph') return { admitted: true }

  const held = input.leases.find(
    (lease) => lease.path === input.path && lease.expiresAt > input.now,
  )
  if (!held) return { admitted: true }

  // The same agent re-entering its own lease is not a conflict; a crashed agent
  // that never released one is handled by expiry rather than by a stuck file.
  if (held.holder.agentId === input.requester.agentId
    && held.holder.sessionId === input.requester.sessionId) {
    return { admitted: true }
  }

  return { admitted: false, reason: 'held-by-another', holder: held.holder }
}

// ── Isolation ───────────────────────────────────────────────────────────────

/**
 * What a parallel agent needs beyond its own files.
 *
 * Git worktrees are the established isolation primitive for parallel coding
 * agents and are what Claude Code, Codex and Cursor all use. They are also
 * incomplete: a worktree stops one agent from overwriting another's *files* and
 * does nothing about the ports, databases, caches, and environment they share.
 * Two agents running the same dev server race for the same port and the failure
 * looks like a flaky test rather than a collision.
 *
 * So an isolation profile is worktree *plus* the runtime facets, declared
 * together. Listing them here means adding a facet is one edit rather than a
 * bug found in production.
 */
export interface AgentIsolation {
  /** Dedicated git worktree path, when the artifact kind is text. */
  worktreePath?: string
  /** Branch checked out in that worktree. */
  branch?: string
  /** Port offset so two agents' dev servers do not collide. */
  portOffset: number
  /** Scratch directory for caches and temp files. */
  scratchDir: string
  /** Environment overrides applied to this agent's processes. */
  env: Readonly<Record<string, string>>
}

/**
 * Ports are assigned by index rather than found free, so an agent's ports are
 * reproducible across restarts. A found-free port changes every run, which makes
 * a failure impossible to reproduce and a log impossible to read.
 */
export const AGENT_PORT_STRIDE = 100

export function agentPortOffset(agentIndex: number): number {
  return agentIndex * AGENT_PORT_STRIDE
}

export function resolveAgentPort(basePort: number, isolation: AgentIsolation): number {
  return basePort + isolation.portOffset
}

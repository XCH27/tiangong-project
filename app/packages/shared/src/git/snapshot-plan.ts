/**
 * Git-backed session snapshots.
 *
 * Both the review surface and message revert need the same missing capability:
 * a cheap, content-addressed record of the working tree at a point in time.
 * Fleet has read-only git access (`git.GET_BRANCH`, `GET_WORKING_TREE`,
 * `GET_FILE_DIFF`) and no snapshot layer, which is why review can only show the
 * repository's dirty state and revert can only fork the conversation.
 *
 * The store is git itself — objects and trees, the way OpenCode's `Git.TreeID`
 * does it. Content-addressing, deduplication, and diffing already exist there;
 * a parallel blob store would reimplement all three and drift from the files it
 * describes.
 *
 * The rule that makes this safe is a single hard boundary:
 *
 *   **A snapshot writes objects. It never moves HEAD, the index, a ref,
 *   a branch, a tag, or a stash.**
 *
 * Loose objects are invisible to `git status`, `git log`, and every UI the user
 * has open, and they are collected by `gc` if abandoned. Anything that touches a
 * ref is visible history — an agent silently committing, stashing, or moving a
 * branch under a user is the single most destructive thing this feature could
 * do, and it is exactly what "just stash it" would produce.
 *
 * This module plans and validates. It runs no git commands: the plan is
 * inspectable and testable, and the executor's only job is to refuse anything
 * this module did not authorize.
 */

/** A captured tree, addressed by its git object id. */
export type TreeId = string

export type SnapshotCapability =
  | 'ready'
  /** Not a git repository — snapshots are unavailable, not broken. */
  | 'not-a-repository'
  /** A repository with no commits yet; there is no baseline tree to diff from. */
  | 'unborn-head'
  /** Mid-merge/rebase/cherry-pick: the index is not the user's to borrow. */
  | 'operation-in-progress'

export interface RepositoryState {
  isRepository: boolean
  hasCommits: boolean
  /** True during merge, rebase, cherry-pick, bisect, or revert. */
  operationInProgress: boolean
}

/**
 * Snapshots degrade rather than fail. A user working outside a repository still
 * gets a working product; they get forking instead of reverting, and review
 * shows the working tree instead of the session delta.
 */
export function snapshotCapability(state: RepositoryState): SnapshotCapability {
  if (!state.isRepository) return 'not-a-repository'
  if (state.operationInProgress) return 'operation-in-progress'
  if (!state.hasCommits) return 'unborn-head'
  return 'ready'
}

export function canSnapshot(state: RepositoryState): boolean {
  return snapshotCapability(state) === 'ready'
}

// ── What goes into a snapshot ───────────────────────────────────────────────

export interface SnapshotScopeInput {
  /** Tracked files with uncommitted modifications. */
  modified: readonly string[]
  /** Files git does not track and does not ignore. */
  untracked: readonly string[]
  /** Paths the agent declared it would write, even if currently ignored. */
  declaredWrites: readonly string[]
  /** Ignored paths, from `.gitignore` and friends. */
  ignored: readonly string[]
}

export interface SnapshotScope {
  include: readonly string[]
  /** Ignored paths pulled in only because the agent wrote them. */
  forcedIncludes: readonly string[]
}

/**
 * Which paths a snapshot covers.
 *
 * Ignored files are excluded — `node_modules` and `dist` would dwarf the actual
 * work and make capture slow enough that it would get switched off. The one
 * exception is an ignored path the agent declared it would write: reverting has
 * to be able to put back a generated file the agent edited on purpose, and
 * silently skipping it would leave the tree half-reverted.
 */
export function planSnapshotScope(input: SnapshotScopeInput): SnapshotScope {
  const ignored = new Set(input.ignored.map(normalizeSnapshotPath))
  const declared = input.declaredWrites.map(normalizeSnapshotPath)

  const forcedIncludes = [...new Set(declared.filter((path) => ignored.has(path)))]
  const include = [...new Set([
    ...input.modified.map(normalizeSnapshotPath),
    ...input.untracked.map(normalizeSnapshotPath).filter((path) => !ignored.has(path)),
    ...forcedIncludes,
  ])].sort()

  return { include, forcedIncludes }
}

export function normalizeSnapshotPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '')
}

// ── The safety boundary ─────────────────────────────────────────────────────

/**
 * Git operations a snapshot is allowed to perform. Everything else is a bug in
 * the caller, and the executor must treat it as one.
 */
export const SNAPSHOT_ALLOWED_OPERATIONS = [
  /** Write a blob for one file's contents. */
  'hash-object',
  /** Build a tree from an isolated, temporary index. */
  'write-tree',
  /** Read a tree into an isolated, temporary index. */
  'read-tree',
  /** Materialize files from a tree into the worktree. */
  'checkout-index',
  /** Compare two trees. */
  'diff-tree',
  /** Read object contents. */
  'cat-file',
] as const

export type SnapshotOperation = (typeof SNAPSHOT_ALLOWED_OPERATIONS)[number]

/**
 * Operations that would make the snapshot visible in the user's history. Listed
 * explicitly rather than inferred, so the reason each one is refused survives in
 * the code instead of living in someone's memory.
 */
export const SNAPSHOT_FORBIDDEN_OPERATIONS: Readonly<Record<string, string>> = {
  commit: 'creates history the user did not author',
  stash: 'moves the user’s uncommitted work somewhere they did not put it',
  'update-ref': 'moves a ref, making the snapshot visible as history',
  branch: 'creates a ref',
  tag: 'creates a ref',
  reset: 'moves HEAD or the real index',
  checkout: 'switches the user’s branch; use checkout-index for files',
  clean: 'deletes untracked files irrecoverably',
  push: 'publishes to a remote',
  merge: 'rewrites the worktree and creates history',
  rebase: 'rewrites history',
}

export function isSnapshotOperationAllowed(operation: string): operation is SnapshotOperation {
  return (SNAPSHOT_ALLOWED_OPERATIONS as readonly string[]).includes(operation)
}

export function snapshotRefusalReason(operation: string): string | null {
  if (isSnapshotOperationAllowed(operation)) return null
  return SNAPSHOT_FORBIDDEN_OPERATIONS[operation]
    ?? 'not on the snapshot allow-list'
}

/**
 * A snapshot builds its tree through `GIT_INDEX_FILE` pointing at a scratch
 * file, never the repository's own index. Borrowing the real index would drop
 * the user's staged work the moment a snapshot ran.
 */
export function isIsolatedIndexPath(indexPath: string, gitDir: string): boolean {
  const normalizedIndex = normalizeSnapshotPath(indexPath)
  const normalizedGitDir = normalizeSnapshotPath(gitDir).replace(/\/$/, '')
  return normalizedIndex !== `${normalizedGitDir}/index`
}

// ── Restore planning ────────────────────────────────────────────────────────

export interface RestoreEntry {
  path: string
  /** Tree to take the content from. */
  from: TreeId
}

export interface RestorePlan {
  entries: readonly RestoreEntry[]
  /** Paths present in the worktree but absent from their tree: restoring deletes them. */
  deletions: readonly string[]
}

/**
 * Restoring a path absent from its tree means the file did not exist at that
 * point, so putting the tree back means removing it. Surfaced separately because
 * deletion is the part a user must be able to see before agreeing to it.
 */
export function planRestore(
  files: ReadonlyMap<string, TreeId>,
  treeContents: ReadonlyMap<TreeId, ReadonlySet<string>>,
): RestorePlan {
  const entries: RestoreEntry[] = []
  const deletions: string[] = []

  for (const [rawPath, from] of files) {
    const path = normalizeSnapshotPath(rawPath)
    if (treeContents.get(from)?.has(path)) entries.push({ path, from })
    else deletions.push(path)
  }

  return {
    entries: entries.sort((a, b) => a.path.localeCompare(b.path)),
    deletions: deletions.sort(),
  }
}

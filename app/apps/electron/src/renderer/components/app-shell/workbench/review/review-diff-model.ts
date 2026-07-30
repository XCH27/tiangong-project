import type { GitWorkingTreeFile } from '../../../../../shared/types'

/**
 * Review domain model.
 *
 * The review surface answers one question — *what changed* — but the answer has
 * more than one source, and the previous implementation only knew about one of
 * them (the git working tree). That makes it a repository viewer, not a review
 * of the session: it cannot distinguish what the agent touched this turn from
 * what was already dirty before the session started.
 *
 * So diffs are normalized into one shape here, the way OpenCode unifies
 * `FileDiffInfo | SnapshotFileDiff | VcsFileDiff` behind a single `RenderDiff`.
 * The panel renders `ReviewDiff` and never branches on where it came from.
 */

export type ReviewFileStatus =
  | 'added'
  | 'deleted'
  | 'modified'
  | 'renamed'
  | 'untracked'

export type ReviewDiffSource =
  /** Uncommitted state of the repository. */
  | 'working-tree'
  /** Files this session's agent changed, relative to its starting snapshot. */
  | 'session-snapshot'

export interface ReviewDiff {
  path: string
  status: ReviewFileStatus
  source: ReviewDiffSource
  additions: number
  deletions: number
  /**
   * Unified patch text, absent until loaded. Patches are fetched per file
   * because a session can touch hundreds of files and almost all of them are
   * never opened.
   */
  patch?: string
}

// ── Normalization ───────────────────────────────────────────────────────────

/**
 * Git reports two independent status columns (index, working tree) using
 * porcelain codes. Collapsing them needs a rule rather than a lookup: a file can
 * be added in the index and modified since, and the review answer for that is
 * "added" — the reviewer cares that the file is new, not about the staging
 * boundary, which this surface is read-only about anyway.
 */
export function normalizeGitStatus(file: GitWorkingTreeFile): ReviewFileStatus {
  const codes = `${file.indexStatus}${file.workingTreeStatus}`
  if (codes.includes('?')) return 'untracked'
  if (codes.includes('A')) return 'added'
  if (codes.includes('D')) return 'deleted'
  if (codes.includes('R')) return 'renamed'
  return 'modified'
}

export function fromGitWorkingTree(
  files: readonly GitWorkingTreeFile[],
): readonly ReviewDiff[] {
  return files.map((file) => ({
    path: file.path,
    status: normalizeGitStatus(file),
    source: 'working-tree' as const,
    additions: file.additions,
    deletions: file.deletions,
  }))
}

/**
 * Accepts an unvalidated payload and keeps only entries that can actually be
 * rendered. A diff arriving over RPC from a snapshot store or a tool result is
 * not guaranteed well-formed, and one malformed row should drop that row rather
 * than throw out the whole review.
 */
export function coerceReviewDiffs(value: unknown): readonly ReviewDiff[] {
  if (!Array.isArray(value)) return []
  return value.filter(isReviewDiff)
}

function isReviewDiff(value: unknown): value is ReviewDiff {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const diff = value as Record<string, unknown>
  if (typeof diff.path !== 'string' || !diff.path) return false
  if (typeof diff.additions !== 'number' || typeof diff.deletions !== 'number') return false
  if (diff.patch !== undefined && typeof diff.patch !== 'string') return false
  return isReviewFileStatus(diff.status) && isReviewDiffSource(diff.source)
}

function isReviewFileStatus(value: unknown): value is ReviewFileStatus {
  return value === 'added' || value === 'deleted' || value === 'modified'
    || value === 'renamed' || value === 'untracked'
}

function isReviewDiffSource(value: unknown): value is ReviewDiffSource {
  return value === 'working-tree' || value === 'session-snapshot'
}

// ── Lazy patch loading ──────────────────────────────────────────────────────

/**
 * Whether this file's patch still has to be fetched.
 *
 * A file with no line changes has nothing to show — a pure rename or mode change
 * would otherwise trigger a request that returns nothing. A stored `patch` still
 * counts as missing when it carries no hunk header, because a truncated or
 * error-substituted body renders as an empty diff and looks like "no changes".
 */
export function reviewDiffNeedsLoad(diff: ReviewDiff): boolean {
  if (diff.additions === 0 && diff.deletions === 0) return false
  return !diff.patch || !/^@@ /m.test(diff.patch)
}

// ── Tree projection ─────────────────────────────────────────────────────────

/** `mix` marks a directory holding more than one kind of change. */
export type ReviewTreeKind = 'add' | 'del' | 'mix'

/**
 * Status for every path *and every ancestor directory*, so a collapsed folder
 * still shows whether anything under it was added or deleted. A flat file list
 * forces the reviewer to expand every folder to find out.
 */
export function reviewDiffKinds(
  diffs: readonly ReviewDiff[],
): ReadonlyMap<string, ReviewTreeKind> {
  const merge = (current: ReviewTreeKind | undefined, next: ReviewTreeKind): ReviewTreeKind => {
    if (!current) return next
    return current === next ? current : 'mix'
  }

  const kinds = new Map<string, ReviewTreeKind>()
  for (const diff of diffs) {
    const path = normalizeReviewPath(diff.path)
    const kind: ReviewTreeKind = diff.status === 'added' || diff.status === 'untracked'
      ? 'add'
      : diff.status === 'deleted'
        ? 'del'
        : 'mix'

    kinds.set(path, kind)

    const segments = path.split('/')
    segments.slice(0, -1).forEach((_, index) => {
      const directory = segments.slice(0, index + 1).join('/')
      if (!directory) return
      kinds.set(directory, merge(kinds.get(directory), kind))
    })
  }
  return kinds
}

/** Windows separators are normalized so path keys match across platforms. */
export function normalizeReviewPath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//, '')
}

// ── Filtering and totals ────────────────────────────────────────────────────

export function filterReviewDiffs(
  diffs: readonly ReviewDiff[],
  query: string,
): readonly ReviewDiff[] {
  const value = query.trim().toLowerCase()
  if (!value) return diffs
  return diffs.filter((diff) => normalizeReviewPath(diff.path).toLowerCase().includes(value))
}

export interface ReviewTotals {
  files: number
  additions: number
  deletions: number
}

export function reviewTotals(diffs: readonly ReviewDiff[]): ReviewTotals {
  return diffs.reduce<ReviewTotals>(
    (totals, diff) => ({
      files: totals.files + 1,
      additions: totals.additions + diff.additions,
      deletions: totals.deletions + diff.deletions,
    }),
    { files: 0, additions: 0, deletions: 0 },
  )
}

/**
 * Merge the sources into one list.
 *
 * When both describe the same file the session snapshot wins: the reviewer's
 * question is "what did this run change", and the working-tree row for the same
 * path would otherwise render as a duplicate with different numbers.
 */
export function mergeReviewSources(
  sessionSnapshot: readonly ReviewDiff[],
  workingTree: readonly ReviewDiff[],
): readonly ReviewDiff[] {
  const seen = new Set(sessionSnapshot.map((diff) => normalizeReviewPath(diff.path)))
  return [
    ...sessionSnapshot,
    ...workingTree.filter((diff) => !seen.has(normalizeReviewPath(diff.path))),
  ]
}

// ── Presentation ────────────────────────────────────────────────────────────

export type ReviewDiffStyle = 'unified' | 'split'

/**
 * A side-by-side diff is two content columns; below this it renders as two
 * unusable slivers, so the panel falls back to unified rather than honouring a
 * preference that cannot be displayed.
 */
export const REVIEW_SPLIT_MIN_WIDTH = 800

export function effectiveDiffStyle(
  preferred: ReviewDiffStyle,
  availableWidth: number,
): ReviewDiffStyle {
  if (preferred === 'unified') return 'unified'
  return availableWidth >= REVIEW_SPLIT_MIN_WIDTH ? 'split' : 'unified'
}

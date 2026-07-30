import { describe, expect, it } from 'bun:test'
import {
  REVIEW_SPLIT_MIN_WIDTH,
  coerceReviewDiffs,
  effectiveDiffStyle,
  filterReviewDiffs,
  fromGitWorkingTree,
  mergeReviewSources,
  normalizeGitStatus,
  normalizeReviewPath,
  reviewDiffKinds,
  reviewDiffNeedsLoad,
  reviewTotals,
  type ReviewDiff,
} from '../review-diff-model'

const gitFile = (path: string, index: string, tree: string, add = 1, del = 1) => ({
  path,
  indexStatus: index,
  workingTreeStatus: tree,
  additions: add,
  deletions: del,
})

const diff = (patch: Partial<ReviewDiff> & { path: string }): ReviewDiff => ({
  status: 'modified',
  source: 'working-tree',
  additions: 1,
  deletions: 1,
  ...patch,
})

describe('git status normalization', () => {
  it('collapses the two porcelain columns into one review answer', () => {
    expect(normalizeGitStatus(gitFile('a', '?', '?'))).toBe('untracked')
    expect(normalizeGitStatus(gitFile('a', 'A', ' '))).toBe('added')
    expect(normalizeGitStatus(gitFile('a', ' ', 'D'))).toBe('deleted')
    expect(normalizeGitStatus(gitFile('a', 'R', ' '))).toBe('renamed')
    expect(normalizeGitStatus(gitFile('a', ' ', 'M'))).toBe('modified')
  })

  // Staged-then-edited is still a new file as far as review is concerned; this
  // surface is read-only about the staging boundary.
  it('reports a file added in the index and edited since as added', () => {
    expect(normalizeGitStatus(gitFile('a', 'A', 'M'))).toBe('added')
  })

  it('carries line counts through', () => {
    expect(fromGitWorkingTree([gitFile('src/a.ts', ' ', 'M', 4, 2)])).toEqual([
      { path: 'src/a.ts', status: 'modified', source: 'working-tree', additions: 4, deletions: 2 },
    ])
  })
})

describe('payload coercion', () => {
  // One malformed row should drop that row, not the whole review.
  it('keeps renderable entries and drops the rest', () => {
    const result = coerceReviewDiffs([
      { path: 'a.ts', status: 'modified', source: 'working-tree', additions: 1, deletions: 0 },
      { path: '', status: 'modified', source: 'working-tree', additions: 1, deletions: 0 },
      { path: 'b.ts', status: 'exploded', source: 'working-tree', additions: 1, deletions: 0 },
      { path: 'c.ts', status: 'modified', source: 'elsewhere', additions: 1, deletions: 0 },
      { path: 'd.ts', status: 'modified', source: 'working-tree', additions: '1', deletions: 0 },
      null,
    ])

    expect(result.map((entry) => entry.path)).toEqual(['a.ts'])
  })

  it('returns nothing for a non-array payload', () => {
    expect(coerceReviewDiffs({ file: 'a.ts' })).toEqual([])
    expect(coerceReviewDiffs(undefined)).toEqual([])
  })
})

describe('lazy patch loading', () => {
  it('does not fetch a patch for a file with no line changes', () => {
    expect(reviewDiffNeedsLoad(diff({ path: 'a', additions: 0, deletions: 0 }))).toBe(false)
  })

  it('fetches when no patch is present', () => {
    expect(reviewDiffNeedsLoad(diff({ path: 'a' }))).toBe(true)
  })

  // A truncated or error-substituted body renders as an empty diff, which reads
  // as "no changes" — treat it as still missing.
  it('treats a patch with no hunk header as missing', () => {
    expect(reviewDiffNeedsLoad(diff({ path: 'a', patch: 'diff --git a/a b/a' }))).toBe(true)
    expect(reviewDiffNeedsLoad(diff({ path: 'a', patch: '@@ -1 +1 @@\n-x\n+y' }))).toBe(false)
  })
})

describe('tree projection', () => {
  it('marks every ancestor directory so a collapsed folder still reads', () => {
    const kinds = reviewDiffKinds([
      diff({ path: 'src/app/a.ts', status: 'added' }),
      diff({ path: 'src/app/b.ts', status: 'added' }),
    ])

    expect(kinds.get('src/app/a.ts')).toBe('add')
    expect(kinds.get('src/app')).toBe('add')
    expect(kinds.get('src')).toBe('add')
  })

  it('reports a directory holding different kinds as mixed', () => {
    const kinds = reviewDiffKinds([
      diff({ path: 'src/a.ts', status: 'added' }),
      diff({ path: 'src/b.ts', status: 'deleted' }),
    ])

    expect(kinds.get('src')).toBe('mix')
  })

  it('counts an untracked file as an addition', () => {
    expect(reviewDiffKinds([diff({ path: 'a.ts', status: 'untracked' })]).get('a.ts')).toBe('add')
  })

  it('normalizes separators so paths match across platforms', () => {
    expect(normalizeReviewPath('src\\app\\a.ts')).toBe('src/app/a.ts')
    expect(normalizeReviewPath('./src/a.ts')).toBe('src/a.ts')
    expect(reviewDiffKinds([diff({ path: 'src\\a.ts', status: 'added' })]).get('src')).toBe('add')
  })
})

describe('source merge', () => {
  // "What did this run change" is the review question, so the snapshot row wins
  // and the working-tree row for the same path is not rendered twice.
  it('prefers the session snapshot when both describe one file', () => {
    const merged = mergeReviewSources(
      [diff({ path: 'src/a.ts', source: 'session-snapshot', additions: 9 })],
      [diff({ path: 'src/a.ts', additions: 3 }), diff({ path: 'src/b.ts' })],
    )

    expect(merged).toHaveLength(2)
    expect(merged[0]).toMatchObject({ path: 'src/a.ts', source: 'session-snapshot', additions: 9 })
    expect(merged[1]).toMatchObject({ path: 'src/b.ts', source: 'working-tree' })
  })

  it('deduplicates across separator styles', () => {
    const merged = mergeReviewSources(
      [diff({ path: 'src/a.ts', source: 'session-snapshot' })],
      [diff({ path: 'src\\a.ts' })],
    )
    expect(merged).toHaveLength(1)
  })
})

describe('filtering and totals', () => {
  it('filters on the normalized path', () => {
    const diffs = [diff({ path: 'src/app/a.ts' }), diff({ path: 'docs/b.md' })]
    expect(filterReviewDiffs(diffs, 'app').map((entry) => entry.path)).toEqual(['src/app/a.ts'])
    expect(filterReviewDiffs(diffs, '  ')).toBe(diffs)
  })

  it('sums files and lines', () => {
    expect(reviewTotals([
      diff({ path: 'a', additions: 3, deletions: 1 }),
      diff({ path: 'b', additions: 2, deletions: 5 }),
    ])).toEqual({ files: 2, additions: 5, deletions: 6 })
  })
})

describe('diff style', () => {
  // Two content columns in a narrow pane are two unusable slivers.
  it('falls back to unified when split cannot be displayed', () => {
    expect(effectiveDiffStyle('split', REVIEW_SPLIT_MIN_WIDTH - 1)).toBe('unified')
    expect(effectiveDiffStyle('split', REVIEW_SPLIT_MIN_WIDTH)).toBe('split')
  })

  it('never widens a unified preference', () => {
    expect(effectiveDiffStyle('unified', 4_000)).toBe('unified')
  })
})

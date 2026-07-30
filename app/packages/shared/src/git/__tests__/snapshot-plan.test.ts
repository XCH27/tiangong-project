import { describe, expect, it } from 'bun:test'
import {
  SNAPSHOT_ALLOWED_OPERATIONS,
  canSnapshot,
  isIsolatedIndexPath,
  isSnapshotOperationAllowed,
  normalizeSnapshotPath,
  planRestore,
  planSnapshotScope,
  snapshotCapability,
  snapshotRefusalReason,
} from '../snapshot-plan'

describe('capability', () => {
  const state = {
    isRepository: true,
    hasCommits: true,
    operationInProgress: false,
  }

  it('is ready in a normal repository', () => {
    expect(snapshotCapability(state)).toBe('ready')
    expect(canSnapshot(state)).toBe(true)
  })

  // Snapshots degrade rather than fail: outside a repository the product still
  // works, it just offers forking instead of reverting.
  it('reports each unavailable case distinctly', () => {
    expect(snapshotCapability({ ...state, isRepository: false })).toBe('not-a-repository')
    expect(snapshotCapability({ ...state, hasCommits: false })).toBe('unborn-head')
    expect(snapshotCapability({ ...state, operationInProgress: true })).toBe('operation-in-progress')
  })

  // Mid-merge the index is not ours to borrow, even though the repo is valid.
  it('refuses during a merge or rebase before checking anything else', () => {
    expect(snapshotCapability({
      isRepository: true,
      hasCommits: false,
      operationInProgress: true,
    })).toBe('operation-in-progress')
  })
})

describe('scope', () => {
  const base = { modified: [], untracked: [], declaredWrites: [], ignored: [] }

  it('captures modified and untracked files', () => {
    expect(planSnapshotScope({
      ...base,
      modified: ['src/a.ts'],
      untracked: ['src/b.ts'],
    }).include).toEqual(['src/a.ts', 'src/b.ts'])
  })

  // node_modules and dist would dwarf the actual work and make capture slow
  // enough that it gets switched off.
  it('excludes ignored paths', () => {
    expect(planSnapshotScope({
      ...base,
      untracked: ['src/a.ts', 'node_modules/x.js'],
      ignored: ['node_modules/x.js'],
    }).include).toEqual(['src/a.ts'])
  })

  // Reverting must be able to put back a generated file the agent edited on
  // purpose; skipping it leaves the tree half-reverted.
  it('force-includes an ignored path the agent declared it would write', () => {
    const scope = planSnapshotScope({
      ...base,
      declaredWrites: ['dist/bundle.js'],
      ignored: ['dist/bundle.js', 'dist/other.js'],
    })

    expect(scope.include).toEqual(['dist/bundle.js'])
    expect(scope.forcedIncludes).toEqual(['dist/bundle.js'])
  })

  it('does not report a non-ignored declared write as forced', () => {
    expect(planSnapshotScope({ ...base, declaredWrites: ['src/a.ts'] }).forcedIncludes)
      .toEqual([])
  })

  it('deduplicates across sources and normalizes separators', () => {
    expect(planSnapshotScope({
      ...base,
      modified: ['src\\a.ts'],
      untracked: ['./src/a.ts'],
      declaredWrites: ['src/a.ts'],
    }).include).toEqual(['src/a.ts'])
  })
})

describe('the safety boundary', () => {
  it('allows only plumbing that writes objects', () => {
    for (const operation of SNAPSHOT_ALLOWED_OPERATIONS) {
      expect(isSnapshotOperationAllowed(operation)).toBe(true)
      expect(snapshotRefusalReason(operation)).toBeNull()
    }
  })

  // An agent silently committing, stashing, or moving a branch under a user is
  // the most destructive thing this feature could do.
  it('refuses everything that would become visible history', () => {
    for (const operation of ['commit', 'stash', 'update-ref', 'branch', 'tag', 'reset', 'checkout', 'clean', 'push', 'merge', 'rebase']) {
      expect(isSnapshotOperationAllowed(operation)).toBe(false)
      expect(snapshotRefusalReason(operation)).toBeTruthy()
    }
  })

  it('refuses an unknown operation rather than assuming it is harmless', () => {
    expect(isSnapshotOperationAllowed('filter-branch')).toBe(false)
    expect(snapshotRefusalReason('filter-branch')).toBe('not on the snapshot allow-list')
  })

  // `checkout` is refused but `checkout-index` is the file-level primitive the
  // restore path needs; the names are close enough to be worth pinning.
  it('separates checkout from checkout-index', () => {
    expect(isSnapshotOperationAllowed('checkout-index')).toBe(true)
    expect(isSnapshotOperationAllowed('checkout')).toBe(false)
  })
})

describe('index isolation', () => {
  // Borrowing the real index would drop the user's staged work the moment a
  // snapshot ran.
  it('rejects the repository’s own index', () => {
    expect(isIsolatedIndexPath('/repo/.git/index', '/repo/.git')).toBe(false)
    expect(isIsolatedIndexPath('/repo/.git/index', '/repo/.git/')).toBe(false)
  })

  it('accepts a scratch index', () => {
    expect(isIsolatedIndexPath('/tmp/fleet-snap-1.index', '/repo/.git')).toBe(true)
  })

  it('compares across separator styles', () => {
    expect(isIsolatedIndexPath('C:\\repo\\.git\\index', 'C:\\repo\\.git')).toBe(false)
  })
})

describe('restore planning', () => {
  const trees = new Map([['tree-a', new Set(['src/a.ts', 'src/b.ts'])]])

  it('restores paths the tree contains', () => {
    const plan = planRestore(new Map([['src/a.ts', 'tree-a']]), trees)
    expect(plan.entries).toEqual([{ path: 'src/a.ts', from: 'tree-a' }])
    expect(plan.deletions).toEqual([])
  })

  // A path absent from its tree did not exist then, so restoring removes it —
  // surfaced separately because deletion is what a user must see before agreeing.
  it('reports a path missing from its tree as a deletion', () => {
    const plan = planRestore(new Map([['src/new.ts', 'tree-a']]), trees)
    expect(plan.entries).toEqual([])
    expect(plan.deletions).toEqual(['src/new.ts'])
  })

  it('treats an unknown tree as a deletion rather than throwing', () => {
    expect(planRestore(new Map([['src/a.ts', 'missing']]), trees).deletions)
      .toEqual(['src/a.ts'])
  })

  it('normalizes separators before matching tree contents', () => {
    expect(planRestore(new Map([['src\\a.ts', 'tree-a']]), trees).entries)
      .toEqual([{ path: 'src/a.ts', from: 'tree-a' }])
  })

  it('sorts both lists for a stable summary', () => {
    const plan = planRestore(
      new Map([['src/b.ts', 'tree-a'], ['src/a.ts', 'tree-a'], ['z.ts', 'tree-a'], ['m.ts', 'tree-a']]),
      trees,
    )
    expect(plan.entries.map((entry) => entry.path)).toEqual(['src/a.ts', 'src/b.ts'])
    expect(plan.deletions).toEqual(['m.ts', 'z.ts'])
  })
})

describe('path normalization', () => {
  it('folds windows separators and leading ./', () => {
    expect(normalizeSnapshotPath('src\\app\\a.ts')).toBe('src/app/a.ts')
    expect(normalizeSnapshotPath('./a.ts')).toBe('a.ts')
  })
})

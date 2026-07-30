import { describe, expect, it } from 'bun:test'
import {
  mergeRevertRestores,
  planRestoreBeforeRevert,
  planRevert,
  revertAvailability,
  summarizeStagedRevert,
  type StagedRevert,
  type TurnSnapshot,
} from '../revert-model'

const turn = (
  messageId: string,
  seq: number,
  startSnapshot: string,
  files: string[],
): TurnSnapshot => ({ messageId, seq, startSnapshot, files })

const history: TurnSnapshot[] = [
  turn('m1', 1, 'snap-a', ['src/a.ts']),
  turn('m2', 2, 'snap-b', ['src/a.ts', 'src/b.ts']),
  turn('m3', 3, 'snap-c', ['src/b.ts', 'src/c.ts']),
]

describe('planRevert', () => {
  it('collects only the turns after the boundary', () => {
    const plan = planRevert(history, 'm1')
    expect(plan?.revertedTurnCount).toBe(2)
    expect([...(plan?.files.keys() ?? [])].sort()).toEqual(['src/a.ts', 'src/b.ts', 'src/c.ts'])
  })

  // Later turns captured the file mid-edit; only the first snapshot after the
  // boundary holds the state as of the boundary. Taking the latest would leave
  // partially-applied work matching no point in the history.
  it('restores each path from the earliest snapshot that recorded it', () => {
    const plan = planRevert(history, 'm1')
    expect(plan?.files.get('src/a.ts')).toBe('snap-b')
    expect(plan?.files.get('src/b.ts')).toBe('snap-b')
    expect(plan?.files.get('src/c.ts')).toBe('snap-c')
  })

  it('plans nothing when the boundary is the newest turn', () => {
    expect(planRevert(history, 'm3')?.revertedTurnCount).toBe(0)
    expect(planRevert(history, 'm3')?.files.size).toBe(0)
  })

  it('returns null for a message that is not in the history', () => {
    expect(planRevert(history, 'nope')).toBeNull()
  })

  it('orders by turn sequence rather than array order', () => {
    const shuffled = [history[2]!, history[0]!, history[1]!]
    expect(planRevert(shuffled, 'm1')?.files.get('src/b.ts')).toBe('snap-b')
  })
})

describe('availability', () => {
  it('refuses while the session is mid-turn', () => {
    expect(revertAvailability({ turns: history, boundaryMessageId: 'm1', isProcessing: true }))
      .toEqual({ canRevert: false, reason: 'session-busy', turnCount: 0 })
  })

  it('refuses when nothing came after the boundary', () => {
    expect(revertAvailability({ turns: history, boundaryMessageId: 'm3', isProcessing: false }))
      .toMatchObject({ canRevert: false, reason: 'nothing-after' })
  })

  // Turns that touched no files are a pure conversation exchange: forking is the
  // operation that fits, because there is nothing on disk to roll back.
  it('refuses when the turns after the boundary touched no files', () => {
    const talkOnly = [turn('m1', 1, 'snap-a', []), turn('m2', 2, 'snap-b', [])]
    expect(revertAvailability({ turns: talkOnly, boundaryMessageId: 'm1', isProcessing: false }))
      .toEqual({ canRevert: false, reason: 'no-snapshot', turnCount: 1 })
  })

  it('allows a revert that has files to restore', () => {
    expect(revertAvailability({ turns: history, boundaryMessageId: 'm1', isProcessing: false }))
      .toEqual({ canRevert: true, reason: null, turnCount: 2 })
  })
})

describe('re-reverting', () => {
  const staged: StagedRevert = {
    boundaryMessageId: 'm2',
    originalSnapshot: 'snap-live',
    files: ['src/b.ts', 'src/c.ts'],
    revertedTurnCount: 1,
    stagedAt: 0,
  }

  it('puts the previous revert back before applying a new one', () => {
    const undo = planRestoreBeforeRevert(staged)
    expect(undo.get('src/b.ts')).toBe('snap-live')
    expect(undo.get('src/c.ts')).toBe('snap-live')
  })

  it('has nothing to undo when no revert is staged', () => {
    expect(planRestoreBeforeRevert(undefined).size).toBe(0)
  })

  // Files touched only by the first revert must return to live state; files in
  // both take the new plan. Otherwise the tree matches no point in the history.
  it('lets the new plan win on overlap while still restoring the rest', () => {
    const next = planRevert(history, 'm1')!
    const merged = mergeRevertRestores(planRestoreBeforeRevert(staged), next.files)

    expect(merged.get('src/a.ts')).toBe('snap-b')
    expect(merged.get('src/b.ts')).toBe('snap-b')
    expect(merged.get('src/c.ts')).toBe('snap-c')
  })

  it('restores a file the new plan does not mention', () => {
    const orphaned: StagedRevert = { ...staged, files: ['docs/old.md'] }
    const merged = mergeRevertRestores(
      planRestoreBeforeRevert(orphaned),
      planRevert(history, 'm2')!.files,
    )
    expect(merged.get('docs/old.md')).toBe('snap-live')
  })
})

describe('multi-agent scoping', () => {
  const shared: TurnSnapshot[] = [
    { messageId: 'm1', seq: 1, agentId: 'a1', startSnapshot: 'snap-1', files: ['src/a.ts'] },
    { messageId: 'm2', seq: 2, agentId: 'a2', startSnapshot: 'snap-2', files: ['src/b.ts'] },
    { messageId: 'm3', seq: 3, agentId: 'a1', startSnapshot: 'snap-3', files: ['src/c.ts'] },
  ]

  // Unscoped, a revert rolls back whatever happened to touch a file after the
  // boundary — including another agent's in-flight work.
  it('reverts only the requested agent’s turns', () => {
    const plan = planRevert(shared, 'm1', { agentId: 'a1' })
    expect(plan?.revertedTurnCount).toBe(1)
    expect([...(plan?.files.keys() ?? [])]).toEqual(['src/c.ts'])
    expect(plan?.agentId).toBe('a1')
  })

  it('still covers every agent when unscoped', () => {
    expect(planRevert(shared, 'm1')?.revertedTurnCount).toBe(2)
    expect(planRevert(shared, 'm1')?.agentId).toBeUndefined()
  })

  it('reports nothing to revert when the agent has no later turns', () => {
    expect(revertAvailability({
      turns: shared,
      boundaryMessageId: 'm1',
      isProcessing: false,
      agentId: 'a2',
    })).toMatchObject({ canRevert: true, turnCount: 1 })

    expect(revertAvailability({
      turns: shared,
      boundaryMessageId: 'm3',
      isProcessing: false,
      agentId: 'a1',
    })).toMatchObject({ canRevert: false, reason: 'nothing-after' })
  })
})

describe('dock summary', () => {
  // Counts come from what actually happened, not from a re-derived plan: the
  // plan changes as new turns arrive.
  it('describes the staged revert rather than the current history', () => {
    expect(summarizeStagedRevert({
      boundaryMessageId: 'm2',
      originalSnapshot: 'snap-live',
      files: ['a', 'b', 'c'],
      revertedTurnCount: 4,
      stagedAt: 0,
    })).toEqual({ fileCount: 3, turnCount: 4, boundaryMessageId: 'm2' })
  })
})

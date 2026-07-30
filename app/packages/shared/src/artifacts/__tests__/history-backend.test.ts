import { describe, expect, it } from 'bun:test'
import {
  AGENT_PORT_STRIDE,
  HUMAN_AUTHOR_KEY,
  admitWrite,
  agentPortOffset,
  artifactKindForPath,
  groupByAuthor,
  historyBackendFor,
  isHumanChange,
  resolveAgentPort,
  type ChangeAttribution,
  type WriteLease,
} from '../history-backend'

const attribution = (patch: Partial<ChangeAttribution> = {}): ChangeAttribution => ({
  sessionId: 's1',
  at: 0,
  ...patch,
})

describe('routing', () => {
  it('sends each artifact kind to the mechanism that fits it', () => {
    expect(historyBackendFor('text')).toBe('git-tree')
    expect(historyBackendFor('media')).toBe('content-store')
    expect(historyBackendFor('document-graph')).toBe('operation-log')
  })

  // Git stores every version of a compressed file whole and diffs it into
  // nothing readable.
  it('keeps media out of git', () => {
    for (const path of ['a.mp4', 'b.PNG', 'c/d.psd', 'e.wav', 'f.zip']) {
      expect(artifactKindForPath(path)).toBe('media')
      expect(historyBackendFor(artifactKindForPath(path))).toBe('content-store')
    }
  })

  // A canvas is one JSON file, so "moved one node" file-diffs as a whole-file
  // rewrite; history has to be record-level to mean anything.
  it('routes canvases and timelines to the operation log', () => {
    expect(artifactKindForPath('board.tldr')).toBe('document-graph')
    expect(artifactKindForPath('edit.timeline')).toBe('document-graph')
  })

  // Misfiling a text file costs storage; misfiling a binary costs a diff nobody
  // can read. So the unknown case goes to git.
  it('treats an unrecognized extension as text', () => {
    expect(artifactKindForPath('README')).toBe('text')
    expect(artifactKindForPath('a.somethingnew')).toBe('text')
    expect(artifactKindForPath('src/a.ts')).toBe('text')
  })
})

describe('attribution', () => {
  // An agent acting on the human's behalf must stay distinguishable from the
  // human acting directly.
  it('separates a human edit from an agent edit', () => {
    expect(isHumanChange(attribution())).toBe(true)
    expect(isHumanChange(attribution({ agentId: 'a1' }))).toBe(false)
  })

  it('groups changes so a review can be read one agent at a time', () => {
    const grouped = groupByAuthor([
      { attribution: attribution({ agentId: 'a1' }) },
      { attribution: attribution({ agentId: 'a2' }) },
      { attribution: attribution({ agentId: 'a1' }) },
      { attribution: attribution() },
    ])

    expect(grouped.get('a1')).toHaveLength(2)
    expect(grouped.get('a2')).toHaveLength(1)
    expect(grouped.get(HUMAN_AUTHOR_KEY)).toHaveLength(1)
  })
})

describe('write admission', () => {
  const now = 1_000
  const lease = (patch: Partial<WriteLease> = {}): WriteLease => ({
    path: 'src/a.ts',
    holder: attribution({ agentId: 'a1' }),
    expiresAt: now + 1_000,
    ...patch,
  })

  it('admits a write to an unheld path', () => {
    expect(admitWrite({
      path: 'src/a.ts',
      requester: attribution({ agentId: 'a2' }),
      leases: [],
      now,
    })).toEqual({ admitted: true })
  })

  // Git cannot reconcile two live writers: there is no commit to merge and no
  // human watching conflict markers.
  it('refuses a second writer and names the holder', () => {
    const result = admitWrite({
      path: 'src/a.ts',
      requester: attribution({ agentId: 'a2' }),
      leases: [lease()],
      now,
    })

    expect(result.admitted).toBe(false)
    expect(result).toMatchObject({ reason: 'held-by-another' })
  })

  it('lets the holder re-enter its own lease', () => {
    expect(admitWrite({
      path: 'src/a.ts',
      requester: attribution({ agentId: 'a1' }),
      leases: [lease()],
      now,
    })).toEqual({ admitted: true })
  })

  it('does not confuse the same agent id in a different session', () => {
    expect(admitWrite({
      path: 'src/a.ts',
      requester: attribution({ agentId: 'a1', sessionId: 's2' }),
      leases: [lease()],
      now,
    }).admitted).toBe(false)
  })

  // A crashed agent must not hold a file forever.
  it('ignores an expired lease', () => {
    expect(admitWrite({
      path: 'src/a.ts',
      requester: attribution({ agentId: 'a2' }),
      leases: [lease({ expiresAt: now - 1 })],
      now,
    })).toEqual({ admitted: true })
  })

  // Record-level operations on disjoint nodes commute — serializing them would
  // remove the only reason that format exists.
  it('never serializes writes to a document graph', () => {
    expect(admitWrite({
      path: 'board.tldr',
      requester: attribution({ agentId: 'a2' }),
      leases: [lease({ path: 'board.tldr' })],
      now,
    })).toEqual({ admitted: true })
  })

  it('does not block a different path', () => {
    expect(admitWrite({
      path: 'src/b.ts',
      requester: attribution({ agentId: 'a2' }),
      leases: [lease()],
      now,
    })).toEqual({ admitted: true })
  })
})

describe('runtime isolation', () => {
  // A worktree stops agents overwriting each other's files and does nothing
  // about the ports they share; two dev servers racing for one port looks like
  // a flaky test rather than a collision.
  it('spaces ports so parallel agents do not collide', () => {
    expect(agentPortOffset(0)).toBe(0)
    expect(agentPortOffset(1)).toBe(AGENT_PORT_STRIDE)
    expect(agentPortOffset(3)).toBe(3 * AGENT_PORT_STRIDE)
  })

  // A found-free port changes every run, which makes a failure impossible to
  // reproduce and a log impossible to read.
  it('is reproducible across restarts', () => {
    const isolation = {
      portOffset: agentPortOffset(2),
      scratchDir: '/tmp/a2',
      env: {},
    }
    expect(resolveAgentPort(3_000, isolation)).toBe(3_200)
    expect(resolveAgentPort(3_000, isolation)).toBe(3_200)
  })
})

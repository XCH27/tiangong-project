import { describe, expect, it } from 'bun:test'
import {
  TOOL_FACT_MIN_OBSERVATIONS,
  admitMemoryWrite,
  decidePromotion,
  isDurableToolFact,
  isToolFactStale,
  memoryReadScope,
  type DelegateFinding,
  type MemoryLayer,
  type MemoryWriteRole,
  type ToolFact,
} from '../memory-scope'

const finding = (patch: Partial<DelegateFinding> = {}): DelegateFinding => ({
  sessionId: 's1', agentId: 'a1', claim: 'c', sources: ['ev1'],
  partition: 'session', confidence: 'high', ...patch,
})

const fact = (patch: Partial<ToolFact> = {}): ToolFact => ({
  kind: 'project-convention', claim: 'uses pnpm', toolName: 'bash',
  sources: ['ev1'], observationCount: 2, ...patch,
})

describe('who may write', () => {
  // A private scratch layer nothing reads wastes disk and attention; one that
  // something reads is an echo chamber with source pointers attached.
  it('refuses a delegate every layer', () => {
    for (const layer of ['working-notes', 'long-term', 'domain', 'user-profile'] as MemoryLayer[]) {
      expect(admitMemoryWrite({ role: 'delegate', layer, partition: 'session' }))
        .toEqual({ admitted: false, reason: 'delegate-may-not-write-memory' })
    }
  })

  it('lets a captain write working notes', () => {
    expect(admitMemoryWrite({ role: 'captain', layer: 'working-notes', partition: 'session' }).admitted)
      .toBe(true)
  })

  // A captain writing MEMORY.md mid-turn bypasses the log and rewrites the
  // cached prefix it is running on.
  it('reserves curated layers for the consolidation pass', () => {
    expect(admitMemoryWrite({ role: 'captain', layer: 'long-term', partition: 'session' }))
      .toEqual({ admitted: false, reason: 'curated-layer-is-consolidation-only' })
    expect(admitMemoryWrite({ role: 'consolidation', layer: 'long-term', partition: 'session' }).admitted)
      .toBe(true)
  })

  // Otherwise "archived" stops meaning "superseded by a logged pass".
  it('lets nothing but consolidation write archive', () => {
    expect(admitMemoryWrite({ role: 'consolidation', layer: 'archive', partition: 'archive' }).admitted)
      .toBe(true)
    expect(admitMemoryWrite({ role: 'captain', layer: 'archive', partition: 'archive' }))
      .toEqual({ admitted: false, reason: 'archive-is-not-writable-directly' })
  })

  it('refuses the quarantine partition to every role', () => {
    for (const role of ['captain', 'delegate', 'consolidation'] as MemoryWriteRole[]) {
      expect(admitMemoryWrite({ role, layer: 'working-notes', partition: 'sensitive-quarantine' }))
        .toEqual({ admitted: false, reason: 'quarantined-partition' })
    }
  })
})

describe('promoting a delegate finding', () => {
  // Refusals are the point: each names something the captain could go and fix.
  it('refuses a claim with no evidence behind it', () => {
    expect(decidePromotion({ finding: finding({ sources: [] }), sensitivity: 'normal' }))
      .toEqual({ promote: false, reason: 'no-source-pointer' })
  })

  it('refuses a low-confidence claim rather than making it a fact', () => {
    expect(decidePromotion({ finding: finding({ confidence: 'low' }), sensitivity: 'normal' }))
      .toEqual({ promote: false, reason: 'low-confidence' })
  })

  it('treats unknown sensitivity as restrictively as known-sensitive', () => {
    expect(decidePromotion({ finding: finding(), sensitivity: 'sensitive' }).promote).toBe(false)
    expect(decidePromotion({ finding: finding(), sensitivity: 'uncertain' }).promote).toBe(false)
  })

  // Cross-project promotion is an explicit origin-marked transfer, never a
  // consequence of a delegate having been there.
  it('refuses to carry a project fact into another project', () => {
    expect(decidePromotion({
      finding: finding({ partition: 'project' }),
      captainProjectId: 'p1',
      findingProjectId: 'p2',
      sensitivity: 'normal',
    })).toEqual({ promote: false, reason: 'cross-project' })

    expect(decidePromotion({
      finding: finding({ partition: 'project' }),
      captainProjectId: 'p1',
      findingProjectId: 'p1',
      sensitivity: 'normal',
    }).promote).toBe(true)
  })

  // "This repo uses pnpm" is project memory; "this API 429s above 10 rps" is not.
  it('lands a tool fact in the domain layer', () => {
    expect(decidePromotion({ finding: finding({ partition: 'tool' }), sensitivity: 'normal' }))
      .toMatchObject({ promote: true, layer: 'domain' })
  })
})

describe('what each role reads', () => {
  // Handing a specialist the whole memory is the same attention tax as handing
  // it every tool.
  it('gives a delegate only its domains and the tool partition', () => {
    const scope = memoryReadScope({ role: 'delegate', domains: ['git'] })
    expect(scope.layers).toEqual(['domain'])
    expect(scope.partitions).toEqual(['tool'])
  })

  it('gives a delegate with no domains nothing to read', () => {
    expect(memoryReadScope({ role: 'delegate' }).layers).toEqual([])
  })

  it('gives the captain the durable layers', () => {
    expect(memoryReadScope({ role: 'captain' }).layers)
      .toEqual(['manual', 'user-profile', 'long-term'])
  })

  // Quarantine is never injected; an archived entry reaching a prompt would undo
  // the consolidation that archived it.
  it('excludes quarantine and archive from every scope', () => {
    for (const role of ['captain', 'delegate', 'consolidation'] as MemoryWriteRole[]) {
      const scope = memoryReadScope({ role, domains: ['d'] })
      expect(scope.partitions).not.toContain('sensitive-quarantine')
      expect(scope.layers).not.toContain('archive')
    }
  })
})

describe('tool facts', () => {
  // A single failure is as likely a transient as a rule, and writing it down
  // teaches the agent to avoid something that works.
  it('requires repetition before a tool fact is durable', () => {
    expect(isDurableToolFact(fact({ observationCount: TOOL_FACT_MIN_OBSERVATIONS - 1 }))).toBe(false)
    expect(isDurableToolFact(fact({ observationCount: TOOL_FACT_MIN_OBSERVATIONS }))).toBe(true)
  })

  it('still requires evidence however often it was seen', () => {
    expect(isDurableToolFact(fact({ sources: [], observationCount: 9 }))).toBe(false)
  })

  // Time-based expiry drops a correct fact about a stable repository while
  // keeping a wrong one about a moving API.
  it('invalidates on the tool disappearing rather than on age', () => {
    expect(isToolFactStale({ fact: fact({ toolName: 'gone' }), availableTools: new Set(['bash']) }))
      .toBe(true)
    expect(isToolFactStale({ fact: fact(), availableTools: new Set(['bash']) })).toBe(false)
  })
})

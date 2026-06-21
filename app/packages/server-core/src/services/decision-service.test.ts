import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DecisionService } from './decision-service'
import type { MemoryRecord } from '@craft-agent/shared/protocol'

describe('DecisionService (L0-L3 pure rules + audit)', () => {
  let svc: DecisionService
  let memHit: MemoryRecord
  let dataDir: string

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'decision-'))
    svc = new DecisionService(dataDir)
    memHit = {
      id: 'm1',
      partition: 'user',
      value: { pref: 'go' },
      createdAt: 1,
      updatedAt: 1,
    }
  })

  afterEach(async () => {
    if (dataDir) await rm(dataDir, { recursive: true, force: true })
  })

  it('L0: local read-only always allowed, no confirm', () => {
    const a = svc.decide({ action: 'read', scope: 'local', risk: 'read-only' })
    expect(a.level).toBe('L0')
    expect(a.allowed).toBe(true)
    expect(a.ruleRef).toBe('L0-READ-ONLY')
  })

  it('L1: low-risk local reversible needs preauth or memory hit', () => {
    const no = svc.decide({ action: 'select', scope: 'local', risk: 'reversible' })
    expect(no.level).toBe('L1')
    expect(no.allowed).toBe(false)

    const yes = svc.decide({ action: 'select', scope: 'local', risk: 'reversible', hasPreAuth: true })
    expect(yes.allowed).toBe(true)
    expect(yes.level).toBe('L1')
  })

  it('L2: write/execute/external needs preauth or memory hit', () => {
    const w = svc.decide({ action: 'write-file', scope: 'local', risk: 'reversible' })
    expect(w.level).toBe('L2')
    expect(w.allowed).toBe(false)

    const ok = svc.decide({ action: 'write-file', scope: 'local', risk: 'reversible', hasPreAuth: true })
    expect(ok.allowed).toBe(true)

    const ext = svc.decide({ action: 'submit', scope: 'external', hasPreAuth: true })
    expect(ext.level).toBe('L2')
    expect(ext.allowed).toBe(true)
  })

  it('L3: delete/publish/login/sensitive/irreversible always deny + explicit', () => {
    const del = svc.decide({ action: 'delete-memory', scope: 'local' })
    expect(del.level).toBe('L3')
    expect(del.allowed).toBe(false)
    expect(del.reason).toContain('explicit user confirmation')

    const pub = svc.decide({ action: 'publish', scope: 'external', risk: 'irreversible' })
    expect(pub.level).toBe('L3')
  })

  it('audits accumulate and can be cleared', () => {
    svc.decide({ action: 'read', scope: 'local', risk: 'read-only' })
    svc.decide({ action: 'delete', scope: 'local' })
    expect(svc.listAudits().length).toBe(2)
    svc.clearAudits()
    expect(svc.listAudits().length).toBe(0)
  })

  it('L2 can use memoryHit as rule basis', () => {
    const a = svc.decide({ action: 'execute', scope: 'local', risk: 'reversible', memoryHit: memHit })
    expect(a.allowed).toBe(true)
    expect(a.ruleRef).toBe('L2-PREAUTH')
  })

  it('evaluate returns structured outcome', () => {
    const r = svc.evaluate({ action: 'read', scope: 'local', risk: 'read-only' })
    expect(r.outcome).toBe('allow')
    expect(r.level).toBe('L0')
    expect(r.requiresExplicitConfirm).toBe(false)
  })
})

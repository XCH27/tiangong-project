import { describe, expect, it, beforeEach } from 'bun:test'
import { AgentLifecycleService } from './agent-lifecycle'

describe('AgentLifecycleService', () => {
  let now = 1000
  let svc: AgentLifecycleService

  beforeEach(() => {
    now = 1000
    svc = new AgentLifecycleService({
      now: () => now,
      simulatePid: (id) => (id.includes('manager') ? 42 : 1001),
    })
  })

  it('starts a manager agent and transitions to running with pid', () => {
    const h = svc.start('manager:ws-1')
    expect(h.agentId).toBe('manager:ws-1')
    expect(h.kind).toBe('manager')
    expect(h.status).toBe('running')
    expect(h.pid).toBe(42)
    expect(h.startedAt).toBe(1000)
    expect(h.lastTransitionAt).toBe(1000)
  })

  it('starts a project agent and tracks kind separately', () => {
    const h = svc.start('project:sess-xyz')
    expect(h.kind).toBe('project')
    expect(h.status).toBe('running')
    expect(h.pid).toBe(1001)
  })

  it('idempotent start keeps existing running handle', () => {
    const first = svc.start('project:s1')
    now = 2000
    const second = svc.start('project:s1')
    expect(second.startedAt).toBe(first.startedAt)
    expect(second.status).toBe('running')
  })

  it('blocks running agent with reason', () => {
    svc.start('project:s1')
    now = 3000
    const b = svc.block('project:s1', 'user-pause')
    expect(b.status).toBe('blocked')
    expect(b.reason).toBe('user-pause')
    expect(b.lastTransitionAt).toBe(3000)
  })

  it('resumes blocked agent back to running', () => {
    svc.start('project:s1')
    svc.block('project:s1')
    now = 4000
    const r = svc.resume('project:s1')
    expect(r.status).toBe('running')
    expect(r.reason).toBeUndefined()
  })

  it('stops agent and records stoppedAt', () => {
    svc.start('manager:ws-1')
    now = 5000
    const s = svc.stop('manager:ws-1')
    expect(s.status).toBe('stopped')
    expect(s.stoppedAt).toBe(5000)
  })

  it('resume from stopped re-arms startedAt', () => {
    svc.start('project:s2')
    svc.stop('project:s2')
    now = 6000
    const r = svc.resume('project:s2')
    expect(r.status).toBe('running')
    expect(r.startedAt).toBe(6000)
    expect(r.stoppedAt).toBeUndefined()
  })

  it('lists and separates manager vs project handles', () => {
    svc.start('manager:global')
    svc.start('manager:ws-a')
    svc.start('project:s1')
    svc.start('project:s2')
    svc.block('project:s2')

    const managers = svc.getManagerHandles()
    const projects = svc.getProjectHandles()
    expect(managers.length).toBe(2)
    expect(projects.length).toBe(2)
    expect(managers.every((m) => m.kind === 'manager')).toBe(true)
    expect(projects.every((p) => p.kind === 'project')).toBe(true)
  })

  it('get returns copy and null for unknown', () => {
    svc.start('manager:ws-1')
    const h = svc.get('manager:ws-1')
    expect(h?.agentId).toBe('manager:ws-1')
    expect(svc.get('does-not-exist')).toBeNull()
  })

  it('cannot block a stopped agent', () => {
    svc.start('project:x')
    svc.stop('project:x')
    expect(() => svc.block('project:x')).toThrow('cannot block a stopped agent')
  })
})

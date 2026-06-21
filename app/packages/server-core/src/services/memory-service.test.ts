import { describe, expect, it, beforeEach, afterAll } from 'bun:test'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryService } from './memory-service'

describe('MemoryService (7 partitions, project isolation)', () => {
  let dir: string
  let svc: MemoryService

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-svc-'))
    svc = new MemoryService(dir)
  })

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('creates user/app/project/agent/task/design/review without projectId (project still needs projectId)', async () => {
    const r1 = await svc.create({ partition: 'user', value: { name: 'alice' } })
    const r2 = await svc.create({ partition: 'app', value: { stage: 'm0' } })
    const r3 = await svc.create({ partition: 'agent', agentId: 'manager:ws-1', value: { skill: 'pack' } })
    const r4 = await svc.create({ partition: 'task', value: { goal: 'fix' } })
    const r5 = await svc.create({ partition: 'design', value: { font: 'Inter' } })
    const r6 = await svc.create({ partition: 'review', value: { platform: 'x' } })

    expect(r1.partition).toBe('user')
    expect(r6.partition).toBe('review')
    const got = await svc.get(r3.id)
    expect(got?.agentId).toBe('manager:ws-1')
  })

  it('enforces projectId for project partition', async () => {
    await expect(svc.create({ partition: 'project', value: { foo: 1 } })).rejects.toThrow('project partition requires projectId')
    const rec = await svc.create({ partition: 'project', projectId: 'p1', value: { foo: 1 } })
    expect(rec.projectId).toBe('p1')
  })

  it('project memory is isolated by default (query without projectId excludes project partition)', async () => {
    await svc.create({ partition: 'project', projectId: 'p1', value: { secret: 'alpha' } })
    await svc.create({ partition: 'project', projectId: 'p2', value: { secret: 'beta' } })
    await svc.create({ partition: 'user', value: { note: 'global' } })

    const all = await svc.query()
    const projectHits = all.filter((r) => r.partition === 'project')
    expect(projectHits.length).toBe(0)
  })

  it('queryForProject only returns that project items', async () => {
    await svc.create({ partition: 'project', projectId: 'p1', value: { k: 'v1' } })
    await svc.create({ partition: 'project', projectId: 'p2', value: { k: 'v2' } })

    const p1 = await svc.queryForProject('p1')
    expect(p1.length).toBe(1)
    expect(p1[0].value).toEqual({ k: 'v1' })
  })

  it('update and delete work and persist', async () => {
    const rec = await svc.create({ partition: 'user', value: { a: 1 } })
    const updated = await svc.update({ id: rec.id, value: { a: 2 } })
    expect(updated.value).toEqual({ a: 2 })

    const ok = await svc.delete(rec.id)
    expect(ok).toBe(true)
    const gone = await svc.get(rec.id)
    expect(gone).toBeNull()
  })

  it('query supports keyword and limit', async () => {
    await svc.create({ partition: 'user', key: 'pref', value: 'dark mode' })
    await svc.create({ partition: 'user', value: 'light mode' })
    const res = await svc.query({ keyword: 'dark', limit: 10 })
    expect(res.length).toBe(1)
    expect(res[0].key).toBe('pref')
  })

  it('clear removes only that partition/scope', async () => {
    await svc.create({ partition: 'project', projectId: 'px', value: 1 })
    await svc.create({ partition: 'project', projectId: 'py', value: 2 })
    const n = await svc.clear('project', 'px')
    expect(n).toBe(1)
    const left = await svc.queryForProject('px')
    expect(left.length).toBe(0)
    const py = await svc.queryForProject('py')
    expect(py.length).toBe(1)
  })
})

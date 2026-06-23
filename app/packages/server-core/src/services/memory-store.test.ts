/**
 * MemoryStore：分区隔离 + 可查可删（docs/05）。
 * 关键不变量：项目/任务记忆按 scopeId 隔离，跨项目默认不可见；scoped 分区检索必须带 scopeId。
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { MemoryStore } from './memory-store'

describe('MemoryStore', () => {
  let root: string
  let store: MemoryStore

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'memory-'))
    store = new MemoryStore(root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('add + list：默认敏感度按分区，落盘可重载', () => {
    store.add({ partition: 'user', content: '用户喜欢 TS' })
    const reloaded = new MemoryStore(root)
    const userMem = reloaded.list({ partition: 'user' })
    expect(userMem.length).toBe(1)
    expect(userMem[0]?.sensitivity).toBe('medium') // user 默认 medium
    expect(userMem[0]?.tier).toBe('semantic')
  })

  it('外部审查分区默认高敏感', () => {
    const e = store.add({ partition: 'external_review', content: '提交到平台X' })
    expect(e.sensitivity).toBe('high')
  })

  it('scoped 分区必须带 scopeId（add 拒绝缺失）', () => {
    expect(() => store.add({ partition: 'project', content: '项目目标' })).toThrow(/scopeId/)
    expect(store.add({ partition: 'project', content: '项目目标', scopeId: 'projA' }).scopeId).toBe('projA')
  })

  it('项目记忆隔离：跨项目默认不可见；同 scopeId 才可见', () => {
    store.add({ partition: 'project', content: 'A 的秘密', scopeId: 'projA' })
    store.add({ partition: 'project', content: 'B 的秘密', scopeId: 'projB' })
    // 不带 scopeId 检索 project → 隔离规则返回空
    expect(store.list({ partition: 'project' })).toEqual([])
    // 带 projA → 只看到 A
    const a = store.list({ partition: 'project', scopeId: 'projA' })
    expect(a.length).toBe(1)
    expect(a[0]?.content).toBe('A 的秘密')
    // projB 看不到 A
    expect(store.list({ partition: 'project', scopeId: 'projB' }).some(e => e.content.includes('A 的'))).toBe(false)
  })

  it('contains 关键词过滤', () => {
    store.add({ partition: 'software', content: 'Fleet 有 4 个工作面' })
    store.add({ partition: 'software', content: '无关内容' })
    expect(store.list({ partition: 'software', contains: '工作面' }).length).toBe(1)
  })

  it('可改 + 可删', () => {
    const e = store.add({ partition: 'user', content: '旧偏好' })
    store.update(e.id, { content: '新偏好' })
    expect(store.get(e.id)?.content).toBe('新偏好')
    expect(store.delete(e.id)).toBe(true)
    expect(store.get(e.id)).toBeNull()
    expect(store.delete(e.id)).toBe(false) // 已删，再删返回 false
  })
})

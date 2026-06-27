import { describe, it, expect, beforeEach } from 'bun:test'
import { SemanticCache } from '../semantic-cache.ts'
import type { CacheKey } from '../fusion-types.ts'

function makeKey(overrides: Partial<CacheKey> = {}): CacheKey {
  return {
    workspaceId: 'ws-1',
    connectionSlug: 'conn-1',
    modelId: 'model-1',
    taskType: 'chat-text',
    toolSetHash: 'tools-1',
    memoryInjectionHash: 'mem-1',
    permissionMode: 'normal',
    normalizedMessage: '你好',
    attachmentHashes: [],
    ...overrides,
  }
}

describe('SemanticCache', () => {
  let cache: SemanticCache

  beforeEach(() => {
    cache = new SemanticCache({ memoryOnly: true })
    cache.setEnabled(true)
  })

  describe('命中', () => {
    it('相似 embedding 命中', () => {
      const key = makeKey()
      const embedding = [1, 0, 0, 0]
      cache.store(key, '你好呀', embedding, 'high')

      const result = cache.lookup(key, [0.99, 0.01, 0, 0])
      expect(result.hit).toBe(true)
      expect(result.answer).toBe('你好呀')
      expect(result.similarity).toBeGreaterThan(0.95)
    })

    it('同 workspace + 同 toolSet 命中', () => {
      const key = makeKey({ normalizedMessage: '今天天气如何' })
      cache.store(key, '晴天', [1, 0], 'high')

      const result = cache.lookup(key, [1, 0])
      expect(result.hit).toBe(true)
      expect(result.answer).toBe('晴天')
    })
  })

  describe('未命中', () => {
    it('低相似度不命中', () => {
      const key = makeKey()
      cache.store(key, '答案', [1, 0, 0, 0], 'high')

      const result = cache.lookup(key, [0, 0, 0, 1])
      expect(result.hit).toBe(false)
    })

    it('不同 workspace 不命中', () => {
      const keyA = makeKey({ workspaceId: 'ws-a' })
      cache.store(keyA, '答案', [1, 0], 'high')

      const keyB = makeKey({ workspaceId: 'ws-b' })
      const result = cache.lookup(keyB, [1, 0])
      expect(result.hit).toBe(false)
    })

    it('不同 toolSet 不命中', () => {
      cache.store(makeKey({ toolSetHash: 'tools-a' }), '答案', [1, 0], 'high')
      const result = cache.lookup(makeKey({ toolSetHash: 'tools-b' }), [1, 0])
      expect(result.hit).toBe(false)
    })

    it('空缓存不命中', () => {
      const result = cache.lookup(makeKey(), [1, 0])
      expect(result.hit).toBe(false)
    })
  })

  describe('低 confidence 不存', () => {
    it('confidence=low 不存储', () => {
      const key = makeKey()
      cache.store(key, '答案', [1, 0], 'low')

      const result = cache.lookup(key, [1, 0])
      expect(result.hit).toBe(false)
    })

    it('审计日志记录拒绝原因', () => {
      const key = makeKey()
      cache.store(key, '答案', [1, 0], 'low')
      const audit = cache.getAuditLog()
      expect(audit.some(a => a.action === 'reject-low-confidence')).toBe(true)
    })
  })

  describe('默认关闭', () => {
    it('未 setEnabled 时 lookup 返回未命中', () => {
      const disabled = new SemanticCache({ memoryOnly: true })
      const result = disabled.lookup(makeKey(), [1, 0])
      expect(result.hit).toBe(false)
    })

    it('未 setEnabled 时 store 不存', () => {
      const disabled = new SemanticCache({ memoryOnly: true })
      disabled.store(makeKey(), '答案', [1, 0], 'high')
      expect(disabled.size()).toBe(0)
    })
  })

  describe('动作型任务禁用', () => {
    it('code-tools 不缓存', () => {
      const key = makeKey({ taskType: 'code-tools' })
      cache.store(key, '代码答案', [1, 0], 'high')
      expect(cache.size()).toBe(0)
    })

    it('design-canvas 不缓存', () => {
      const key = makeKey({ taskType: 'design-canvas' })
      cache.store(key, '设计答案', [1, 0], 'high')
      expect(cache.size()).toBe(0)
    })

    it('automation 不缓存', () => {
      const key = makeKey({ taskType: 'automation' })
      cache.store(key, '自动化答案', [1, 0], 'high')
      expect(cache.size()).toBe(0)
    })
  })

  describe('阈值', () => {
    it('自定义阈值生效', () => {
      const key = makeKey()
      cache.store(key, '答案', [1, 0], 'high')

      const result = cache.lookup(key, [0.7, 0.71], 0.99)
      expect(result.hit).toBe(false)
    })

    it('刚好高于阈值命中', () => {
      const key = makeKey()
      cache.store(key, '答案', [3, 4], 'high')

      const result = cache.lookup(key, [3, 4], 0.95)
      expect(result.hit).toBe(true)
      expect(result.similarity).toBe(1)
    })
  })

  describe('审计', () => {
    it('记录 store 和 lookup-hit', () => {
      const key = makeKey()
      cache.store(key, '答案', [1, 0], 'high')
      cache.lookup(key, [1, 0])

      const audit = cache.getAuditLog()
      expect(audit.some(a => a.action === 'store')).toBe(true)
      expect(audit.some(a => a.action === 'lookup-hit')).toBe(true)
    })

    it('记录 lookup-miss', () => {
      cache.lookup(makeKey(), [1, 0])
      const audit = cache.getAuditLog()
      expect(audit.some(a => a.action === 'lookup-miss')).toBe(true)
    })
  })
})

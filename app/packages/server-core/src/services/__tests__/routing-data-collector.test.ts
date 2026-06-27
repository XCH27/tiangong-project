import { describe, it, expect, beforeEach } from 'bun:test'
import { RoutingDataCollector } from '../routing-data-collector.ts'
import { RouteLLMTrainer } from '../routellm-trainer.ts'
import type { RoutingTrainingRecord } from '../routing-data-collector.ts'
import type { RoutingDecision, ModelTier } from '../fusion-types.ts'

function makeDecision(overrides: Partial<RoutingDecision> = {}): RoutingDecision {
  return {
    taskType: 'chat-text',
    complexity: 1,
    tier: 'fast',
    fusionMode: 'none',
    cascadeEligible: false,
    basis: 'test',
    ...overrides,
  }
}

describe('RoutingDataCollector', () => {
  let collector: RoutingDataCollector

  beforeEach(() => {
    collector = new RoutingDataCollector()
  })

  describe('record', () => {
    it('记录请求', () => {
      collector.record({
        decision: makeDecision(),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      expect(collector.size()).toBe(1)
    })

    it('记录多条请求', () => {
      for (let i = 0; i < 5; i++) {
        collector.record({
          decision: makeDecision({ complexity: 2, tier: 'balanced' }),
          modelId: `model-${i}`,
          tokens: 50 * i,
          latencyMs: 100 * i,
        })
      }
      expect(collector.size()).toBe(5)
    })
  })

  describe('recordPreference', () => {
    it('记录接受信号', () => {
      collector.record({
        decision: makeDecision(),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      collector.recordPreference({
        type: 'accepted',
        sessionId: 's-1',
        taskType: 'chat-text',
        complexity: 1,
        tier: 'fast',
        modelId: 'model-1',
      })
      expect(collector.preferenceCount()).toBe(1)
    })

    it('记录重试信号', () => {
      collector.recordPreference({
        type: 'retried',
        sessionId: 's-1',
        taskType: 'chat-text',
        complexity: 1,
        tier: 'fast',
        modelId: 'model-1',
      })
      expect(collector.preferenceCount()).toBe(1)
    })

    it('记录换模型信号', () => {
      collector.recordPreference({
        type: 'switched_model',
        sessionId: 's-1',
        taskType: 'code-tools',
        complexity: 3,
        tier: 'balanced',
        modelId: 'model-a',
      })
      expect(collector.preferenceCount()).toBe(1)
    })

    it('记录回滚信号', () => {
      collector.recordPreference({
        type: 'rolled_back',
        sessionId: 's-1',
        taskType: 'code-tools',
        complexity: 3,
        tier: 'best',
        modelId: 'model-a',
      })
      expect(collector.preferenceCount()).toBe(1)
    })
  })

  describe('exportDataset', () => {
    it('导出带 accepted 字段的训练记录', () => {
      collector.record({
        decision: makeDecision({ taskType: 'chat-text', complexity: 1, tier: 'fast' }),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      collector.recordPreference({
        type: 'accepted',
        sessionId: 's-1',
        taskType: 'chat-text',
        complexity: 1,
        tier: 'fast',
        modelId: 'model-1',
      })

      const dataset = collector.exportDataset()
      expect(dataset).toHaveLength(1)
      expect(dataset[0].taskType).toBe('chat-text')
      expect(dataset[0].accepted).toBe(true)
      expect(dataset[0].preferenceSignal).toBe('accepted')
    })

    it('无偏好信号时 accepted=false', () => {
      collector.record({
        decision: makeDecision(),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })

      const dataset = collector.exportDataset()
      expect(dataset[0].accepted).toBe(false)
      expect(dataset[0].preferenceSignal).toBeNull()
    })
  })

  describe('getStats', () => {
    it('空数据返回零', () => {
      const stats = collector.getStats()
      expect(stats.totalRecords).toBe(0)
      expect(stats.acceptanceRate).toBe(0)
    })

    it('计算接受率', () => {
      for (let i = 0; i < 4; i++) {
        collector.record({
          decision: makeDecision(),
          modelId: 'model-1',
          tokens: 100,
          latencyMs: 200,
        })
      }
      collector.recordPreference({
        type: 'accepted',
        sessionId: 's-1',
        taskType: 'chat-text',
        complexity: 1,
        tier: 'fast',
        modelId: 'model-1',
      })

      const stats = collector.getStats()
      expect(stats.totalRecords).toBe(4)
      expect(stats.acceptanceRate).toBe(0.25)
    })

    it('计算回滚率', () => {
      collector.record({
        decision: makeDecision({ taskType: 'code-tools', complexity: 3, tier: 'balanced' }),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      collector.recordPreference({
        type: 'rolled_back',
        sessionId: 's-1',
        taskType: 'code-tools',
        complexity: 3,
        tier: 'balanced',
        modelId: 'model-1',
      })

      const stats = collector.getStats()
      expect(stats.rollbackRate).toBe(1)
    })

    it('按任务类型聚合', () => {
      collector.record({
        decision: makeDecision({ taskType: 'chat-text', complexity: 1, tier: 'fast' }),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      collector.record({
        decision: makeDecision({ taskType: 'code-tools', complexity: 3, tier: 'balanced' }),
        modelId: 'model-2',
        tokens: 500,
        latencyMs: 1000,
      })

      const stats = collector.getStats()
      expect(stats.fusionBenefitByTaskType['chat-text'].count).toBe(1)
      expect(stats.fusionBenefitByTaskType['chat-text'].avgLatencyMs).toBe(200)
      expect(stats.fusionBenefitByTaskType['code-tools'].avgTokens).toBe(500)
    })
  })

  describe('toJSON', () => {
    it('可序列化', () => {
      collector.record({
        decision: makeDecision(),
        modelId: 'model-1',
        tokens: 100,
        latencyMs: 200,
      })
      const json = collector.toJSON()
      const parsed = JSON.parse(json)
      expect(parsed.requests).toHaveLength(1)
    })
  })
})

describe('RouteLLMTrainer', () => {
  function makeRecord(
    taskType: string,
    complexity: number,
    tier: ModelTier,
    accepted: boolean,
    tokens = 100,
  ): RoutingTrainingRecord {
    return {
      taskType: taskType as RoutingTrainingRecord['taskType'],
      complexity: complexity as RoutingTrainingRecord['complexity'],
      tier,
      modelId: 'model-1',
      accepted,
      preferenceSignal: accepted ? 'accepted' : 'rejected',
      tokens,
      latencyMs: 200,
    }
  }

  describe('train', () => {
    it('产出路由表', () => {
      const dataset: RoutingTrainingRecord[] = [
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
      ]

      const trainer = new RouteLLMTrainer()
      const result = trainer.train(dataset)
      expect(result.groups).toBeGreaterThan(0)
    })

    it('低样本组回退默认档位', () => {
      const dataset: RoutingTrainingRecord[] = [
        makeRecord('chat-text', 1, 'fast', true),
      ]

      const trainer = new RouteLLMTrainer()
      const result = trainer.train(dataset)
      expect(result.lowSampleGroups).toBe(1)
    })

    it('minSamples 控制低样本判定', () => {
      const dataset: RoutingTrainingRecord[] = [
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
      ]

      const trainer = new RouteLLMTrainer()
      const result = trainer.train(dataset, { minSamplesPerGroup: 10 })
      expect(result.lowSampleGroups).toBe(1)
    })
  })

  describe('predict', () => {
    it('返回推荐 tier', () => {
      const dataset: RoutingTrainingRecord[] = [
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'fast', true),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
        makeRecord('chat-text', 1, 'best', false),
      ]

      const trainer = new RouteLLMTrainer()
      const { router } = trainer.train(dataset)
      const pred = router.predict('chat-text', 1)
      expect(pred.tier).toBe('fast')
      expect(pred.confidence).toBeGreaterThan(0)
    })

    it('未训练组回退默认', () => {
      const trainer = new RouteLLMTrainer()
      const { router } = trainer.train([])
      const pred = router.predict('unknown', 3)
      expect(pred.tier).toBe('balanced')
      expect(pred.confidence).toBe(0)
    })
  })

  describe('evaluate', () => {
    it('返回准确率和成本节省', () => {
      const dataset: RoutingTrainingRecord[] = [
        makeRecord('chat-text', 1, 'fast', true, 50),
        makeRecord('chat-text', 1, 'fast', true, 50),
        makeRecord('chat-text', 1, 'fast', true, 50),
        makeRecord('chat-text', 1, 'fast', true, 50),
        makeRecord('chat-text', 1, 'fast', true, 50),
        makeRecord('chat-text', 1, 'best', false, 200),
        makeRecord('chat-text', 1, 'best', false, 200),
        makeRecord('chat-text', 1, 'best', false, 200),
        makeRecord('chat-text', 1, 'best', false, 200),
        makeRecord('chat-text', 1, 'best', false, 200),
      ]

      const trainer = new RouteLLMTrainer()
      const result = trainer.evaluate(dataset)
      expect(result.evaluated).toBe(10)
      expect(result.accuracy).toBeGreaterThan(0)
      expect(result.costSavings).toBeGreaterThanOrEqual(0)
    })

    it('空数据集返回零', () => {
      const trainer = new RouteLLMTrainer()
      const result = trainer.evaluate([])
      expect(result.evaluated).toBe(0)
      expect(result.accuracy).toBe(0)
    })
  })
})

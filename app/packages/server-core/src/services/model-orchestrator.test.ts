import { describe, it, expect } from 'bun:test'
import { plan, identifyTaskType, assessComplexity, complexityToTier, decideFusionMode, isCascadeEligible } from './model-orchestrator.ts'
import { DEFAULT_MODEL_ROUTING_PREFS } from './fusion-types.ts'
import type { RoutingInput, ModelRoutingPrefs } from './fusion-types.ts'

function makeInput(overrides: Partial<RoutingInput> = {}): RoutingInput {
  return {
    message: '你好',
    attachmentsCount: 0,
    hasCodeBlocks: false,
    hasFileMentions: false,
    hasToolIntent: false,
    conversationTurns: 0,
    ...overrides,
  }
}

describe('model-orchestrator', () => {
  describe('identifyTaskType', () => {
    it('识别闲聊为 chat-text', () => {
      expect(identifyTaskType(makeInput({ message: '你好，今天天气怎么样' }))).toBe('chat-text')
    })

    it('识别代码任务', () => {
      expect(identifyTaskType(makeInput({ message: '帮我重构这个函数', hasCodeBlocks: true }))).toBe('code-tools')
    })

    it('识别审查任务', () => {
      expect(identifyTaskType(makeInput({ message: '请做安全审查' }))).toBe('review-analysis')
    })

    it('识别视频任务', () => {
      expect(identifyTaskType(makeInput({ message: '帮我剪辑视频' }))).toBe('video-edit')
    })

    it('识别记忆任务', () => {
      expect(identifyTaskType(makeInput({ message: '检索记忆' }))).toBe('memory-op')
    })

    it('尊重 taskTypeHint', () => {
      expect(identifyTaskType(makeInput({ message: 'hello', taskTypeHint: 'design-canvas' }))).toBe('design-canvas')
    })
  })

  describe('assessComplexity', () => {
    it('闲聊 = 1', () => {
      expect(assessComplexity(makeInput({ message: '你好' }), 'chat-text')).toBe(1)
    })

    it('带工具意图至少 3', () => {
      expect(assessComplexity(makeInput({ message: '改文件', hasToolIntent: true }), 'code-tools')).toBeGreaterThanOrEqual(3)
    })

    it('架构关键词 = 4', () => {
      expect(assessComplexity(makeInput({ message: '这个架构需要重写' }), 'code-tools')).toBe(4)
    })

    it('视频默认 4', () => {
      expect(assessComplexity(makeInput({ message: '剪辑' }), 'video-edit')).toBe(4)
    })
  })

  describe('complexityToTier', () => {
    it('C1→fast, C3→balanced, C4→best', () => {
      expect(complexityToTier(1)).toBe('fast')
      expect(complexityToTier(3)).toBe('balanced')
      expect(complexityToTier(4)).toBe('best')
    })
  })

  describe('decideFusionMode', () => {
    it('Fusion 关 = none', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'off' } }
      expect(decideFusionMode('review-analysis', 4, prefs)).toBe('none')
    })

    it('C4 + Fusion on + review → synthesis', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'on' } }
      expect(decideFusionMode('review-analysis', 4, prefs)).toBe('synthesis')
    })

    it('C4 + Fusion on + code → plan', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'on' } }
      expect(decideFusionMode('code-tools', 4, prefs)).toBe('plan')
    })

    it('C3 不触发 Fusion', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'on' } }
      expect(decideFusionMode('review-analysis', 3, prefs)).toBe('none')
    })

    it('smart 模式：闲聊不 Fusion', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'smart' } }
      expect(decideFusionMode('chat-text', 4, prefs)).toBe('none')
    })
  })

  describe('isCascadeEligible', () => {
    it('C1 不级联', () => {
      expect(isCascadeEligible('chat-text', 1, false, DEFAULT_MODEL_ROUTING_PREFS)).toBe(false)
    })

    it('C4 不级联', () => {
      expect(isCascadeEligible('code-tools', 4, false, DEFAULT_MODEL_ROUTING_PREFS)).toBe(false)
    })

    it('C2/C3 可级联', () => {
      expect(isCascadeEligible('code-tools', 2, false, DEFAULT_MODEL_ROUTING_PREFS)).toBe(true)
      expect(isCascadeEligible('code-tools', 3, false, DEFAULT_MODEL_ROUTING_PREFS)).toBe(true)
    })

    it('低延迟任务不级联', () => {
      expect(isCascadeEligible('code-tools', 3, true, DEFAULT_MODEL_ROUTING_PREFS)).toBe(false)
    })
  })

  describe('plan（集成）', () => {
    it('闲聊 → fast + none', () => {
      const d = plan(makeInput({ message: '你好' }), DEFAULT_MODEL_ROUTING_PREFS)
      expect(d.tier).toBe('fast')
      expect(d.fusionMode).toBe('none')
      expect(d.taskType).toBe('chat-text')
      expect(d.complexity).toBe(1)
    })

    it('代码审查 + Fusion on → synthesis', () => {
      const prefs: ModelRoutingPrefs = { ...DEFAULT_MODEL_ROUTING_PREFS, fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'on' } }
      const d = plan(makeInput({ message: '请做安全审查，这个模块有漏洞风险' }), prefs)
      expect(d.taskType).toBe('review-analysis')
      expect(d.complexity).toBe(4)
      expect(d.fusionMode).toBe('synthesis')
    })

    it('routingHint 可升级 tier', () => {
      const d = plan(
        makeInput({ message: '你好', routingHint: { tierHint: 'best' } }),
        DEFAULT_MODEL_ROUTING_PREFS,
      )
      expect(d.tier).toBe('best')
    })

    it('routingHint 建议 Fusion 但复杂度不足 → 记录覆写理由', () => {
      const d = plan(
        makeInput({ message: '你好', routingHint: { suggestFusion: true, fusionForm: 'synthesis' } }),
        DEFAULT_MODEL_ROUTING_PREFS,
      )
      expect(d.fusionMode).toBe('none')
      expect(d.hintOverrideReason).toContain('复杂度不足')
    })
  })
})

import { describe, it, expect } from 'bun:test'
import { enforceAgentPolicy, validateRoutingHint, resolveExecutorSurface } from '../agent-routing-policy.ts'
import { DEFAULT_MODEL_ROUTING_PREFS } from '../fusion-types.ts'
import type { RoutingDecision, ModelRoutingPrefs, RoutingHint } from '../fusion-types.ts'

function makeDecision(overrides: Partial<RoutingDecision> = {}): RoutingDecision {
  return {
    taskType: 'code-tools',
    complexity: 4,
    tier: 'best',
    fusionMode: 'synthesis',
    cascadeEligible: false,
    basis: 'test',
    ...overrides,
  }
}

function makePrefs(overrides: Partial<ModelRoutingPrefs> = {}): ModelRoutingPrefs {
  return { ...DEFAULT_MODEL_ROUTING_PREFS, ...overrides }
}

function makeFusionOnPrefs(overrides: Partial<ModelRoutingPrefs['fusion']> = {}): ModelRoutingPrefs {
  return makePrefs({
    fusion: {
      ...DEFAULT_MODEL_ROUTING_PREFS.fusion,
      enabled: 'on',
      ...overrides,
    },
  })
}

describe('enforceAgentPolicy', () => {
  describe('管理 Agent', () => {
    it('拒绝 Fusion 并覆写为 none', () => {
      const decision = makeDecision({ fusionMode: 'synthesis' })
      const result = enforceAgentPolicy('manager', decision, DEFAULT_MODEL_ROUTING_PREFS)
      expect(result.allowed).toBe(false)
      expect(result.overriddenDecision?.fusionMode).toBe('none')
      expect(result.reason).toContain('管理 Agent')
    })

    it('非 Fusion 决策允许', () => {
      const decision = makeDecision({ fusionMode: 'none' })
      const result = enforceAgentPolicy('manager', decision, DEFAULT_MODEL_ROUTING_PREFS)
      expect(result.allowed).toBe(true)
    })
  })

  describe('队长 Agent', () => {
    it('允许 Fusion（默认触发者）', () => {
      const prefs = makeFusionOnPrefs()
      const decision = makeDecision({ fusionMode: 'synthesis' })
      const result = enforceAgentPolicy('leader', decision, prefs)
      expect(result.allowed).toBe(true)
    })

    it('Fusion 被策略禁用时拒绝', () => {
      const prefs = makePrefs({
        agentPolicy: {
          ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy,
          leader: { ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy.leader, allowFusion: false },
        },
      })
      const decision = makeDecision({ fusionMode: 'synthesis' })
      const result = enforceAgentPolicy('leader', decision, prefs)
      expect(result.allowed).toBe(false)
      expect(result.overriddenDecision?.fusionMode).toBe('none')
    })

    it('CLI 可用时发警告', () => {
      const prefs = makePrefs({
        agentPolicy: {
          ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy,
          leader: { allowAuto: true, allowFusion: true, allowCli: true },
        },
      })
      const decision = makeDecision({ fusionMode: 'none' })
      const result = enforceAgentPolicy('leader', decision, prefs)
      expect(result.allowed).toBe(true)
      expect(result.warning).toContain('CLI')
    })
  })

  describe('执行 Agent', () => {
    it('leader-only scope 下拒绝自触发 Fusion', () => {
      const prefs = makeFusionOnPrefs({ scope: 'leader-only' })
      const decision = makeDecision({ fusionMode: 'synthesis' })
      const result = enforceAgentPolicy('executor', decision, prefs)
      expect(result.allowed).toBe(false)
      expect(result.overriddenDecision?.fusionMode).toBe('none')
      expect(result.reason).toContain('leader-only')
    })

    it('all-agents scope 下允许自触发 Fusion', () => {
      const prefs = makeFusionOnPrefs({ scope: 'all-agents' })
      const decision = makeDecision({ fusionMode: 'synthesis' })
      const result = enforceAgentPolicy('executor', decision, prefs)
      expect(result.allowed).toBe(true)
    })

    it('非 Fusion 决策允许', () => {
      const prefs = makeFusionOnPrefs({ scope: 'leader-only' })
      const decision = makeDecision({ fusionMode: 'none' })
      const result = enforceAgentPolicy('executor', decision, prefs)
      expect(result.allowed).toBe(true)
    })
  })
})

describe('validateRoutingHint', () => {
  it('管理 Agent hint 带 suggestFusion 被拒', () => {
    const hint: RoutingHint = { suggestFusion: true, fusionForm: 'synthesis' }
    const result = validateRoutingHint(hint, 'manager', DEFAULT_MODEL_ROUTING_PREFS)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('管理 Agent')
  })

  it('管理 Agent hint 带 preferredSurface=cli 被拒', () => {
    const hint: RoutingHint = { preferredSurface: 'cli' }
    const result = validateRoutingHint(hint, 'manager', DEFAULT_MODEL_ROUTING_PREFS)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('CLI')
  })

  it('管理 Agent 无 Fusion 无 CLI 的 hint 合法', () => {
    const hint: RoutingHint = { tierHint: 'fast', budgetTokens: 1000 }
    const result = validateRoutingHint(hint, 'manager', DEFAULT_MODEL_ROUTING_PREFS)
    expect(result.valid).toBe(true)
  })

  it('执行 Agent 在 leader-only scope 下 suggestFusion 被拒', () => {
    const prefs = makeFusionOnPrefs({ scope: 'leader-only' })
    const hint: RoutingHint = { suggestFusion: true }
    const result = validateRoutingHint(hint, 'executor', prefs)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('leader-only')
  })

  it('执行 Agent 在 all-agents scope 下 suggestFusion 合法', () => {
    const prefs = makeFusionOnPrefs({ scope: 'all-agents' })
    const hint: RoutingHint = { suggestFusion: true }
    const result = validateRoutingHint(hint, 'executor', prefs)
    expect(result.valid).toBe(true)
  })

  it('执行 Agent 在 Fusion 全局关时 suggestFusion 被拒', () => {
    const prefs = makePrefs({
      fusion: { ...DEFAULT_MODEL_ROUTING_PREFS.fusion, enabled: 'off', scope: 'all-agents' },
    })
    const hint: RoutingHint = { suggestFusion: true }
    const result = validateRoutingHint(hint, 'executor', prefs)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('全局关闭')
  })

  it('队长 allowFusion=false 时 suggestFusion 被拒', () => {
    const prefs = makePrefs({
      agentPolicy: {
        ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy,
        leader: { allowAuto: true, allowFusion: false, allowCli: true },
      },
    })
    const hint: RoutingHint = { suggestFusion: true }
    const result = validateRoutingHint(hint, 'leader', prefs)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('禁用')
  })

  it('budgetTokens 为负被拒', () => {
    const hint: RoutingHint = { budgetTokens: -100 }
    const result = validateRoutingHint(hint, 'executor', DEFAULT_MODEL_ROUTING_PREFS)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('负')
  })

  it('执行 Agent CLI 被禁时 preferredSurface=cli 被拒', () => {
    const prefs = makePrefs({
      agentPolicy: {
        ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy,
        executor: { allowAuto: true, allowCli: false },
      },
    })
    const hint: RoutingHint = { preferredSurface: 'cli' }
    const result = validateRoutingHint(hint, 'executor', prefs)
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('CLI')
  })

  it('空 hint 合法', () => {
    const result = validateRoutingHint({}, 'executor', DEFAULT_MODEL_ROUTING_PREFS)
    expect(result.valid).toBe(true)
  })
})

describe('resolveExecutorSurface', () => {
  it('surfaceByTaskType 覆写', () => {
    const prefs = makePrefs({
      agentPolicy: {
        ...DEFAULT_MODEL_ROUTING_PREFS.agentPolicy,
        executor: {
          allowAuto: true,
          allowCli: true,
          surfaceByTaskType: { 'code-tools': 'cli', 'design-canvas': 'api' },
        },
      },
    })
    expect(resolveExecutorSurface('code-tools', prefs)).toBe('cli')
    expect(resolveExecutorSurface('design-canvas', prefs)).toBe('api')
  })

  it('无覆写默认 api', () => {
    expect(resolveExecutorSurface('chat-text', DEFAULT_MODEL_ROUTING_PREFS)).toBe('api')
  })
})

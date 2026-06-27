import { describe, it, expect, beforeEach } from 'bun:test'
import { BudgetTracker } from '../budget-gatekeeper.ts'
import { DEFAULT_MODEL_ROUTING_PREFS } from '../fusion-types.ts'
import type { ModelRoutingPrefs } from '../fusion-types.ts'

function makePrefs(overrides: Partial<ModelRoutingPrefs> = {}): ModelRoutingPrefs {
  return { ...DEFAULT_MODEL_ROUTING_PREFS, ...overrides }
}

describe('BudgetTracker', () => {
  let tracker: BudgetTracker

  beforeEach(() => {
    tracker = new BudgetTracker()
  })

  describe('checkBudget', () => {
    it('未超预算允许', () => {
      const prefs = makePrefs({
        fusion: {
          ...DEFAULT_MODEL_ROUTING_PREFS.fusion,
          budgetCap: { maxTokens: 50000, maxPanelists: 3, perWorkspaceDaily: 10000 },
        },
      })
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 3000, 0.05)
      const result = tracker.checkBudget('ws-1', 'agent-1', 2000, prefs)
      expect(result.allowed).toBe(true)
    })

    it('超 perWorkspaceDaily 被 deny', () => {
      const prefs = makePrefs({
        fusion: {
          ...DEFAULT_MODEL_ROUTING_PREFS.fusion,
          budgetCap: { maxTokens: 50000, maxPanelists: 3, perWorkspaceDaily: 5000 },
        },
      })
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 4000, 0.05)
      const result = tracker.checkBudget('ws-1', 'agent-1', 2000, prefs)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('超预算上限')
      expect(result.reason).toContain('4000')
      expect(result.reason).toContain('5000')
    })

    it('超 maxTokens 硬上限被 deny', () => {
      const prefs = makePrefs({
        fusion: {
          ...DEFAULT_MODEL_ROUTING_PREFS.fusion,
          budgetCap: { maxTokens: 5000, maxPanelists: 3 },
        },
      })
      tracker.recordUsage('ws-1', 'agent-1', 'leader', 'fusion-panel', 4000, 0.05)
      const result = tracker.checkBudget('ws-1', 'agent-1', 2000, prefs)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('超预算上限')
      expect(result.reason).toContain('5000')
    })

    it('空 workspace 允许', () => {
      const result = tracker.checkBudget('ws-empty', 'agent-1', 1000, DEFAULT_MODEL_ROUTING_PREFS)
      expect(result.allowed).toBe(true)
    })
  })

  describe('管理 Agent 成本单列', () => {
    it('管理 Agent 消耗不计入项目预算', () => {
      const prefs = makePrefs({
        fusion: {
          ...DEFAULT_MODEL_ROUTING_PREFS.fusion,
          budgetCap: { maxTokens: 50000, maxPanelists: 3, perWorkspaceDaily: 5000 },
        },
      })
      tracker.recordUsage('ws-1', 'manager-1', 'manager', 'routing', 10000, 0.01)
      const result = tracker.checkBudget('ws-1', 'manager-1', 1000, prefs)
      expect(result.allowed).toBe(true)
    })

    it('getUsageSummary 区分管理 Agent 与项目 Agent', () => {
      tracker.recordUsage('ws-1', 'manager-1', 'manager', 'routing', 1000, 0.01)
      tracker.recordUsage('ws-1', 'leader-1', 'leader', 'fusion-panel', 2000, 0.05)
      tracker.recordUsage('ws-1', 'executor-1', 'executor', 'fusion-panel', 3000, 0.03)

      const summary = tracker.getUsageSummary('ws-1')
      expect(summary.totalTokens).toBe(5000)
      expect(summary.totalCost).toBe(0.08)
      expect(summary.managerTokens).toBe(1000)
      expect(summary.managerCost).toBe(0.01)
      expect(summary.byAgent['leader-1']?.tokens).toBe(2000)
      expect(summary.byAgent['executor-1']?.tokens).toBe(3000)
      expect(summary.byAgent['manager-1']).toBeUndefined()
    })
  })

  describe('recordUsage + getUsageSummary', () => {
    it('按 agentId 聚合多次记录', () => {
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 1000, 0.01)
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-judge', 500, 0.02)
      tracker.recordUsage('ws-1', 'agent-2', 'executor', 'fusion-panel', 2000, 0.03)

      const summary = tracker.getUsageSummary('ws-1')
      expect(summary.byAgent['agent-1']?.tokens).toBe(1500)
      expect(summary.byAgent['agent-1']?.cost).toBe(0.03)
      expect(summary.byAgent['agent-2']?.tokens).toBe(2000)
      expect(summary.totalTokens).toBe(3500)
    })

    it('不同 workspace 独立', () => {
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 1000, 0.01)
      tracker.recordUsage('ws-2', 'agent-1', 'executor', 'fusion-panel', 2000, 0.02)

      const s1 = tracker.getUsageSummary('ws-1')
      const s2 = tracker.getUsageSummary('ws-2')
      expect(s1.totalTokens).toBe(1000)
      expect(s2.totalTokens).toBe(2000)
    })

    it('空 workspace 返回零值', () => {
      const summary = tracker.getUsageSummary('ws-empty')
      expect(summary.totalTokens).toBe(0)
      expect(summary.totalCost).toBe(0)
      expect(summary.byAgent).toEqual({})
      expect(summary.managerTokens).toBe(0)
      expect(summary.managerCost).toBe(0)
    })
  })

  describe('reset', () => {
    it('reset 单个 workspace', () => {
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 1000, 0.01)
      tracker.recordUsage('ws-2', 'agent-1', 'executor', 'fusion-panel', 2000, 0.02)
      tracker.reset('ws-1')
      expect(tracker.getUsageSummary('ws-1').totalTokens).toBe(0)
      expect(tracker.getUsageSummary('ws-2').totalTokens).toBe(2000)
    })

    it('reset 全部', () => {
      tracker.recordUsage('ws-1', 'agent-1', 'executor', 'fusion-panel', 1000, 0.01)
      tracker.recordUsage('ws-2', 'agent-1', 'executor', 'fusion-panel', 2000, 0.02)
      tracker.reset()
      expect(tracker.getUsageSummary('ws-1').totalTokens).toBe(0)
      expect(tracker.getUsageSummary('ws-2').totalTokens).toBe(0)
    })
  })
})

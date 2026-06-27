import type { ModelRoutingPrefs } from './fusion-types.ts'

export type AgentRole = 'manager' | 'leader' | 'executor'
export type CostLayer = 'routing' | 'fusion-panel' | 'fusion-judge' | 'fusion-writer' | 'cli' | 'cache'

export interface UsageRecord {
  workspaceId: string
  agentId: string
  role: AgentRole
  layer: CostLayer
  tokens: number
  costUsd: number
  recordedAt: number
}

export interface BudgetCheckResult {
  allowed: boolean
  reason?: string
  usedTokens?: number
  capTokens?: number
}

export interface AgentUsageSummary {
  tokens: number
  cost: number
}

export interface WorkspaceUsageSummary {
  totalTokens: number
  totalCost: number
  byAgent: Record<string, AgentUsageSummary>
  managerTokens: number
  managerCost: number
}

interface WorkspaceBucket {
  projectRecords: UsageRecord[]
  managerRecords: UsageRecord[]
}

export class BudgetTracker {
  private readonly store = new Map<string, WorkspaceBucket>()

  private ensureBucket(workspaceId: string): WorkspaceBucket {
    let bucket = this.store.get(workspaceId)
    if (!bucket) {
      bucket = { projectRecords: [], managerRecords: [] }
      this.store.set(workspaceId, bucket)
    }
    return bucket
  }

  checkBudget(
    workspaceId: string,
    agentId: string,
    estimatedTokens: number,
    prefs: ModelRoutingPrefs,
  ): BudgetCheckResult {
    const summary = this.getUsageSummary(workspaceId)
    const used = summary.totalTokens
    const dailyCap = prefs.fusion.budgetCap.perWorkspaceDaily
    const hardCap = prefs.fusion.budgetCap.maxTokens

    if (dailyCap !== undefined && used + estimatedTokens > dailyCap) {
      return {
        allowed: false,
        reason: `超预算上限：今日已用 ${used} / ${dailyCap} tokens`,
        usedTokens: used,
        capTokens: dailyCap,
      }
    }

    if (used + estimatedTokens > hardCap) {
      return {
        allowed: false,
        reason: `超预算上限：今日已用 ${used} / ${hardCap} tokens`,
        usedTokens: used,
        capTokens: hardCap,
      }
    }

    return { allowed: true, usedTokens: used, capTokens: dailyCap ?? hardCap }
  }

  recordUsage(
    workspaceId: string,
    agentId: string,
    role: AgentRole,
    layer: CostLayer,
    tokens: number,
    costUsd: number,
  ): void {
    const bucket = this.ensureBucket(workspaceId)
    const record: UsageRecord = {
      workspaceId,
      agentId,
      role,
      layer,
      tokens,
      costUsd,
      recordedAt: Date.now(),
    }
    if (role === 'manager') {
      bucket.managerRecords.push(record)
    } else {
      bucket.projectRecords.push(record)
    }
  }

  getUsageSummary(workspaceId: string): WorkspaceUsageSummary {
    const bucket = this.store.get(workspaceId)
    if (!bucket) {
      return {
        totalTokens: 0,
        totalCost: 0,
        byAgent: {},
        managerTokens: 0,
        managerCost: 0,
      }
    }

    const byAgent: Record<string, AgentUsageSummary> = {}
    let totalTokens = 0
    let totalCost = 0

    for (const rec of bucket.projectRecords) {
      totalTokens += rec.tokens
      totalCost += rec.costUsd
      const entry = byAgent[rec.agentId] ?? { tokens: 0, cost: 0 }
      entry.tokens += rec.tokens
      entry.cost += rec.costUsd
      byAgent[rec.agentId] = entry
    }

    let managerTokens = 0
    let managerCost = 0
    for (const rec of bucket.managerRecords) {
      managerTokens += rec.tokens
      managerCost += rec.costUsd
    }

    return {
      totalTokens,
      totalCost,
      byAgent,
      managerTokens,
      managerCost,
    }
  }

  reset(workspaceId?: string): void {
    if (workspaceId) {
      this.store.delete(workspaceId)
    } else {
      this.store.clear()
    }
  }
}

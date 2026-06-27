/**
 * 路由数据采集 + 偏好信号管线
 *
 * 单一真相：docs/03 §8
 *
 * 记录每条 LLM 请求的路由决策、模型组合、token、延迟、Judge 质量与结果采纳情况，
 * 以及用户的偏好信号（接受/重试/换模型/回滚/重渲染）。
 * 产出可供 RouteLLM 训练器消费的训练数据集。
 *
 * 存储为内存数组，不持久化；exportDataset 可序列化为 JSON。
 */

import type { RoutingDecision, TaskType, ModelTier } from './fusion-types.ts'

export interface RoutingRequestRecord {
  ts: number
  decision: RoutingDecision
  modelId: string
  tokens: number
  latencyMs: number
  agentId?: string
}

export type PreferenceSignalType =
  | 'accepted'
  | 'rejected'
  | 'retried'
  | 'switched_model'
  | 'rolled_back'
  | 're-rendered'

export interface PreferenceSignal {
  type: PreferenceSignalType
  sessionId: string
  taskType: TaskType
  complexity: number
  tier: string
  modelId: string
  ts: number
}

export interface RoutingTrainingRecord {
  taskType: TaskType
  complexity: number
  tier: ModelTier
  modelId: string
  accepted: boolean
  preferenceSignal: PreferenceSignalType | null
  tokens: number
  latencyMs: number
}

export interface RoutingStats {
  totalRecords: number
  acceptanceRate: number
  retryRate: number
  rollbackRate: number
  fusionBenefitByTaskType: Record<string, { count: number; avgLatencyMs: number; avgTokens: number }>
}

export class RoutingDataCollector {
  private readonly requests: RoutingRequestRecord[] = []
  private readonly preferences: PreferenceSignal[] = []

  record(request: {
    decision: RoutingDecision
    modelId: string
    tokens: number
    latencyMs: number
    agentId?: string
  }): void {
    this.requests.push({
      ts: Date.now(),
      decision: request.decision,
      modelId: request.modelId,
      tokens: request.tokens,
      latencyMs: request.latencyMs,
      agentId: request.agentId,
    })
  }

  recordPreference(signal: {
    type: PreferenceSignalType
    sessionId: string
    taskType: TaskType
    complexity: number
    tier: string
    modelId: string
  }): void {
    this.preferences.push({
      ...signal,
      ts: Date.now(),
    })
  }

  exportDataset(): RoutingTrainingRecord[] {
    const records: RoutingTrainingRecord[] = []
    const prefByIdx = this.matchPreferencesToRequests()

    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i]
      const pref = prefByIdx.get(i)
      const accepted = pref?.type === 'accepted'
      records.push({
        taskType: req.decision.taskType,
        complexity: req.decision.complexity,
        tier: req.decision.tier,
        modelId: req.modelId,
        accepted,
        preferenceSignal: pref?.type ?? null,
        tokens: req.tokens,
        latencyMs: req.latencyMs,
      })
    }
    return records
  }

  getStats(): RoutingStats {
    const total = this.requests.length
    if (total === 0) {
      return {
        totalRecords: 0,
        acceptanceRate: 0,
        retryRate: 0,
        rollbackRate: 0,
        fusionBenefitByTaskType: {},
      }
    }

    const dataset = this.exportDataset()
    const accepted = dataset.filter(r => r.accepted).length
    const retried = this.preferences.filter(p => p.type === 'retried').length
    const rolledBack = this.preferences.filter(p => p.type === 'rolled_back').length

    const byTask: Record<string, { count: number; totalLatency: number; totalTokens: number }> = {}
    for (const req of this.requests) {
      const t = req.decision.taskType
      if (!byTask[t]) byTask[t] = { count: 0, totalLatency: 0, totalTokens: 0 }
      byTask[t].count++
      byTask[t].totalLatency += req.latencyMs
      byTask[t].totalTokens += req.tokens
    }

    const fusionBenefitByTaskType: RoutingStats['fusionBenefitByTaskType'] = {}
    for (const [t, agg] of Object.entries(byTask)) {
      fusionBenefitByTaskType[t] = {
        count: agg.count,
        avgLatencyMs: agg.totalLatency / agg.count,
        avgTokens: agg.totalTokens / agg.count,
      }
    }

    return {
      totalRecords: total,
      acceptanceRate: accepted / total,
      retryRate: retried / total,
      rollbackRate: rolledBack / total,
      fusionBenefitByTaskType,
    }
  }

  toJSON(): string {
    return JSON.stringify({
      requests: this.requests,
      preferences: this.preferences,
    }, null, 2)
  }

  size(): number {
    return this.requests.length
  }

  preferenceCount(): number {
    return this.preferences.length
  }

  clear(): void {
    this.requests.length = 0
    this.preferences.length = 0
  }

  private matchPreferencesToRequests(): Map<number, PreferenceSignal> {
    const matched = new Map<number, PreferenceSignal>()
    const used = new Set<number>()
    for (let i = 0; i < this.requests.length; i++) {
      const req = this.requests[i]
      const matchIdx = this.preferences.findIndex(
        (p, idx) =>
          !used.has(idx)
          && p.taskType === req.decision.taskType
          && p.complexity === req.decision.complexity
          && p.tier === req.decision.tier
          && p.modelId === req.modelId,
      )
      if (matchIdx >= 0) {
        used.add(matchIdx)
        matched.set(i, this.preferences[matchIdx])
      }
    }
    return matched
  }
}

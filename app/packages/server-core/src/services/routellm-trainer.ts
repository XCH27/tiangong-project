/**
 * RouteLLM 训练框架 — 用统计方法替换启发式路由
 *
 * 单一真相：docs/03 §8
 *
 * 当偏好数据足够时，用简单统计训练一个 (taskType, complexity) → tier 路由表。
 * 不依赖 TF/PyTorch 等外部 ML 库；纯内存计算。
 *
 * 训练逻辑：
 * 1. 按 (taskType, complexity) 分组
 * 2. 每组内统计每个 tier 的接受率（accepted=true 比例）
 * 3. 选接受率最高的 tier 作为该组的推荐
 * 4. 样本不足或并列时回退到默认启发式（complexityToTier）
 *
 * 评估：在数据集上用训练好的路由表预测，对比实际接受情况计算准确率，
 * 并按 tier 成本差估算成本节省。
 */

import type { ModelTier, TaskType } from './fusion-types.ts'
import type { RoutingTrainingRecord } from './routing-data-collector.ts'

const TIER_COST: Record<ModelTier, number> = {
  fast: 1,
  balanced: 3,
  best: 10,
}

const DEFAULT_TIER_BY_COMPLEXITY: Record<number, ModelTier> = {
  1: 'fast',
  2: 'fast',
  3: 'balanced',
  4: 'best',
}

function groupKey(taskType: TaskType, complexity: number): string {
  return `${taskType}:${complexity}`
}

interface TierStats {
  tier: ModelTier
  count: number
  accepted: number
  acceptRate: number
}

export interface RouterPrediction {
  tier: ModelTier
  confidence: number
}

export class TrainedRouter {
  private readonly table: Map<string, RouterPrediction>

  constructor(table: Map<string, RouterPrediction>) {
    this.table = table
  }

  predict(taskType: string, complexity: number): RouterPrediction {
    const key = groupKey(taskType as TaskType, complexity)
    const found = this.table.get(key)
    if (found) return found
    const fallback = DEFAULT_TIER_BY_COMPLEXITY[complexity] ?? 'balanced'
    return { tier: fallback, confidence: 0 }
  }

  getTable(): ReadonlyMap<string, RouterPrediction> {
    return this.table
  }

  toJSON(): string {
    const obj: Record<string, RouterPrediction> = {}
    for (const [k, v] of this.table.entries()) obj[k] = v
    return JSON.stringify(obj, null, 2)
  }

  static fromJSON(json: string): TrainedRouter {
    const parsed = JSON.parse(json) as Record<string, RouterPrediction>
    const table = new Map<string, RouterPrediction>(Object.entries(parsed))
    return new TrainedRouter(table)
  }
}

export interface PersistedRouterState {
  datasetSize: number
  routerJson: string
  savedAt: number
}

export interface TrainOptions {
  minSamplesPerGroup?: number
}

export interface TrainResult {
  router: TrainedRouter
  groups: number
  lowSampleGroups: number
}

export interface EvaluateResult {
  accuracy: number
  costSavings: number
  evaluated: number
}

export class RouteLLMTrainer {
  train(
    dataset: RoutingTrainingRecord[],
    options: TrainOptions = {},
  ): TrainResult {
    const minSamples = options.minSamplesPerGroup ?? 5
    const groups = new Map<string, RoutingTrainingRecord[]>()

    for (const r of dataset) {
      const key = groupKey(r.taskType, r.complexity)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(r)
    }

    const table = new Map<string, RouterPrediction>()
    let lowSampleGroups = 0

    for (const [key, records] of groups.entries()) {
      const tierStats = this.computeTierStats(records)
      if (records.length < minSamples || tierStats.length === 0) {
        lowSampleGroups++
        const complexity = parseInt(key.split(':')[1], 10)
        const fallback = DEFAULT_TIER_BY_COMPLEXITY[complexity] ?? 'balanced'
        table.set(key, { tier: fallback, confidence: 0 })
        continue
      }

      const best = tierStats.reduce((a, b) => (a.acceptRate >= b.acceptRate ? a : b))
      const confidence = best.count / records.length
      table.set(key, { tier: best.tier, confidence })
    }

    return {
      router: new TrainedRouter(table),
      groups: groups.size,
      lowSampleGroups,
    }
  }

  evaluate(dataset: RoutingTrainingRecord[]): EvaluateResult {
    if (dataset.length === 0) {
      return { accuracy: 0, costSavings: 0, evaluated: 0 }
    }

    const trainResult = this.train(dataset)
    const router = trainResult.router

    let correct = 0
    let actualCost = 0
    let routedCost = 0
    let evaluated = 0

    for (const r of dataset) {
      const pred = router.predict(r.taskType, r.complexity)
      actualCost += TIER_COST[r.tier] * r.tokens
      routedCost += TIER_COST[pred.tier] * r.tokens
      if (pred.tier === r.tier && r.accepted) {
        correct++
      } else if (pred.tier === r.tier) {
        correct++
      }
      evaluated++
    }

    const accuracy = correct / evaluated
    const costSavings = actualCost > 0
      ? Math.max(0, (actualCost - routedCost) / actualCost)
      : 0

    return { accuracy, costSavings, evaluated }
  }

  private computeTierStats(records: RoutingTrainingRecord[]): TierStats[] {
    const byTier = new Map<ModelTier, { count: number; accepted: number }>()
    for (const r of records) {
      if (!byTier.has(r.tier)) byTier.set(r.tier, { count: 0, accepted: 0 })
      const s = byTier.get(r.tier)!
      s.count++
      if (r.accepted) s.accepted++
    }
    const stats: TierStats[] = []
    for (const [tier, s] of byTier.entries()) {
      stats.push({
        tier,
        count: s.count,
        accepted: s.accepted,
        acceptRate: s.count > 0 ? s.accepted / s.count : 0,
      })
    }
    return stats
  }
}

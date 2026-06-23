/**
 * 分层记忆系统（D2 / docs/05）——按归属分区 + 按时效分层，全本地、可查可删、管理 Agent 拥有。
 *
 * 这里只定义类型与隔离规则（browser-safe）。存储/检索在 `server-core/services/memory-store`，
 * 写进 craft 现有本地真相，不另起第二套。跨分区纪律：项目/任务记忆默认按 scopeId 隔离，不互相可见。
 */

/** 七个分区（按归属，docs/05 §2）。 */
export const MEMORY_PARTITIONS = [
  'user',            // 用户长期记忆（偏好/惯用栈/长期目标）
  'software',        // 软件状态记忆（项目/能力目录/设置）
  'project',         // 项目记忆（按 scopeId 隔离）
  'agent',           // Agent 记忆（角色配置/惯例/技能）
  'task',            // 任务记忆（按 scopeId 隔离）
  'design_asset',    // 设计资产记忆（来源/许可证/hash）
  'external_review', // 外部审查记忆（外发记录，最高敏感）
] as const
export type MemoryPartition = typeof MEMORY_PARTITIONS[number]

/** 四层时效（叠加在分区之上，docs/05 §3）。 */
export const MEMORY_TIERS = ['working', 'episodic', 'semantic', 'procedural'] as const
export type MemoryTier = typeof MEMORY_TIERS[number]

export type MemorySensitivity = 'low' | 'medium' | 'high'

/** 分区默认敏感度（docs/05 §2）。 */
export const PARTITION_DEFAULT_SENSITIVITY: Readonly<Record<MemoryPartition, MemorySensitivity>> = Object.freeze({
  user: 'medium',
  software: 'low',
  project: 'medium',
  agent: 'low',
  task: 'medium',
  design_asset: 'medium',
  external_review: 'high',
})

/** 需要 scopeId 隔离的分区（项目/任务/Agent/设计资产按归属隔离）。 */
export const SCOPED_PARTITIONS: ReadonlySet<MemoryPartition> = new Set<MemoryPartition>(['project', 'task', 'agent'])

export function isScopedPartition(partition: MemoryPartition): boolean {
  return SCOPED_PARTITIONS.has(partition)
}

export interface MemoryEntry {
  id: string
  partition: MemoryPartition
  tier: MemoryTier
  content: string
  sensitivity: MemorySensitivity
  /** 归属 id（项目/任务/Agent 分区隔离用）。scoped 分区必填。 */
  scopeId?: string
  /** 来源引用（哪条会话/任务/用户输入提取），用于可审计。 */
  source?: string
  createdAt: number
  updatedAt: number
}

export interface AddMemoryInput {
  partition: MemoryPartition
  content: string
  tier?: MemoryTier
  sensitivity?: MemorySensitivity
  scopeId?: string
  source?: string
}

export interface MemoryQuery {
  partition?: MemoryPartition
  tier?: MemoryTier
  /** scoped 分区检索必须带 scopeId，否则按隔离规则返回空。 */
  scopeId?: string
  /** 简单关键词（content 包含）。v1 不做向量检索。 */
  contains?: string
  limit?: number
}

/**
 * 隔离规则（纯函数，可单测）：检索一个 scoped 分区却没给 scopeId → 不可见（返回 false）。
 * 这保证"项目记忆默认不互相可见"，调用方据此过滤。
 */
export function memoryQueryAllowed(query: MemoryQuery): boolean {
  if (query.partition && isScopedPartition(query.partition) && !query.scopeId) return false
  return true
}

/** 单条 entry 是否匹配 query（含隔离）。 */
export function memoryEntryMatches(entry: MemoryEntry, query: MemoryQuery): boolean {
  if (query.partition && entry.partition !== query.partition) return false
  if (query.tier && entry.tier !== query.tier) return false
  // scoped 分区：只有同 scopeId 才可见；跨项目不可见。
  if (isScopedPartition(entry.partition)) {
    if (!query.scopeId || entry.scopeId !== query.scopeId) return false
  }
  if (query.contains && !entry.content.toLowerCase().includes(query.contains.toLowerCase())) return false
  return true
}

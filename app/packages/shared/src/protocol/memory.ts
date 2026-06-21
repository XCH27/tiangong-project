export type MemoryPartition =
  | 'user'
  | 'app'
  | 'project'
  | 'agent'
  | 'task'
  | 'design'
  | 'review'

export interface MemoryRecord {
  id: string
  partition: MemoryPartition
  projectId?: string
  agentId?: string
  key?: string
  value: unknown
  createdAt: number
  updatedAt: number
  meta?: Record<string, unknown>
  risk?: 'low' | 'medium' | 'high'
}

export interface MemoryAddInput {
  partition: MemoryPartition
  projectId?: string
  agentId?: string
  key?: string
  value: unknown
  meta?: Record<string, unknown>
  risk?: 'low' | 'medium' | 'high'
}

export interface MemoryGetInput { id: string }
export interface MemoryListInput {
  partition?: MemoryPartition
  projectId?: string
  agentId?: string
  limit?: number
}
export interface MemorySearchInput {
  keyword: string
  partition?: MemoryPartition
  projectId?: string
  agentId?: string
  limit?: number
}
export interface MemoryDeleteInput {
  id: string
  /** High-risk deletes must be explicitly confirmed by caller before calling */
  confirmed?: boolean
}

export interface MemoryListResult { records: MemoryRecord[] }
export interface MemorySearchResult { records: MemoryRecord[] }
export interface MemoryDeleteResult { deleted: boolean; id: string; risk?: 'low' | 'medium' | 'high' }

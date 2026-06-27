import { FolderOpen, GitBranch, ListTodo } from 'lucide-react'

import type { LucideIcon } from 'lucide-react'

export type ToolDockModuleId = 'progress' | 'files' | 'review'

export interface ToolDockModuleDefinition {
  id: ToolDockModuleId
  labelKey: string
  icon: LucideIcon
}

/** Right-side dock modules (terminal and browser are separate per docs/37). */
export const TOOL_DOCK_MODULES: ToolDockModuleDefinition[] = [
  { id: 'progress', labelKey: 'toolDock.progress', icon: ListTodo },
  { id: 'files', labelKey: 'toolDock.files', icon: FolderOpen },
  { id: 'review', labelKey: 'toolDock.review', icon: GitBranch },
]

export const DEFAULT_TOOL_DOCK_ACTIVE: ToolDockModuleId[] = ['progress', 'files']

export function normalizeToolDockActive(modules: unknown): ToolDockModuleId[] {
  if (!Array.isArray(modules)) return [...DEFAULT_TOOL_DOCK_ACTIVE]
  const allowed = new Set<ToolDockModuleId>(['progress', 'files', 'review'])
  const filtered = modules.filter((id): id is ToolDockModuleId => typeof id === 'string' && allowed.has(id as ToolDockModuleId))
  return filtered.length > 0 ? filtered : [...DEFAULT_TOOL_DOCK_ACTIVE]
}

export function equalToolDockRatios(modules: ToolDockModuleId[]): Record<ToolDockModuleId, number> {
  const weight = modules.length > 0 ? 1 / modules.length : 1
  return Object.fromEntries(modules.map((id) => [id, weight])) as Record<ToolDockModuleId, number>
}

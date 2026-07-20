import { Columns3, Plus } from 'lucide-react'

import { KanbanProjectFilter, type KanbanProjectFilterOption } from './KanbanProjectFilter'

interface KanbanBoardHeaderProps {
  allTasksLabel: string
  newTaskLabel: string
  addColumnLabel?: string
  projects: KanbanProjectFilterOption[]
  selectedProjectIds: string[]
  onProjectFilterChange: (next: string[]) => void
  columnsFromLabel?: string
  onCreateTask: () => void
  onAddColumn?: () => void
  createDisabled: boolean
}

/** Stable board page header: project filtering remains available even for an empty project list. */
export function KanbanBoardHeader({
  allTasksLabel,
  newTaskLabel,
  addColumnLabel,
  projects,
  selectedProjectIds,
  onProjectFilterChange,
  columnsFromLabel,
  onCreateTask,
  onAddColumn,
  createDisabled,
}: KanbanBoardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="text-sm font-medium">{allTasksLabel}</span>
        <KanbanProjectFilter
          projects={projects}
          value={selectedProjectIds}
          onChange={onProjectFilterChange}
        />
        {columnsFromLabel && (
          <span className="truncate text-[11px] text-foreground/45">{columnsFromLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onAddColumn && addColumnLabel && (
          <button
            type="button"
            onClick={onAddColumn}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[12.5px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Columns3 className="h-3.5 w-3.5" strokeWidth={2.5} /> {addColumnLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onCreateTask}
          disabled={createDisabled}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[12.5px] font-semibold text-foreground transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> {newTaskLabel}
        </button>
      </div>
    </div>
  )
}

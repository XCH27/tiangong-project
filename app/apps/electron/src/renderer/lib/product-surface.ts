/**
 * Product surface readiness gates.
 *
 * Incomplete surfaces that still render clickable chrome make the app feel broken.
 * Gate them here until each path is end-to-end usable (docs status vocabulary).
 *
 * Prefer hiding or hard-redirecting over leaving dead controls visible.
 */

/** Full-width Board / Kanban is not the default product surface (R1). */
export const BOARD_VIEW_ENABLED = false

/**
 * Right-workbench modules openable from the "+" menu (R18).
 * Top-level Board/Kanban stays hidden via BOARD_VIEW_ENABLED — the task-board
 * entry here is the R18 session projection, not a second Board home.
 * Canvas is honest display-only (no document authority).
 */
export const WORKBENCH_OPENABLE_MODULES = [
  'side-task',
  'task-board',
  'browser',
  'review',
  'terminal',
  'canvas',
] as const

export type WorkbenchOpenableModule = (typeof WORKBENCH_OPENABLE_MODULES)[number]

export function isWorkbenchModuleOpenable(kind: string): boolean {
  return (WORKBENCH_OPENABLE_MODULES as readonly string[]).includes(kind)
}

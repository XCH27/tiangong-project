import { FileText, FolderOpen, Globe, History, type LucideIcon } from 'lucide-react'
import type { ComponentContribution } from '@craft-agent/shared/components'

/**
 * Host registry for `slot: 'right-workbench'` contributions.
 *
 * Converged 2026-09-21 (WORK-ORDER step 2). This host previously carried its own
 * `RightSidebarToolDefinition`, so the project had two registries for one concept: this one, which
 * was live, and `@craft-agent/shared/components`, which nothing imported. Built-ins are now
 * `ComponentContribution` values, so a Component and a built-in are the same shape and an installed
 * Component registers without editing the shell.
 *
 * The icon stays here on purpose. `shared/components` is data-only and browser-safe and must not
 * reference React components, so the contract carries an icon *name* and this host resolves it.
 */

/** Icon names built-ins use. A Component supplying an unknown name renders without an icon. */
const ICONS: Record<string, LucideIcon> = {
  'folder-open': FolderOpen,
  globe: Globe,
  'file-text': FileText,
  history: History,
}

const BUILT_INS: ComponentContribution[] = [
  { id: 'files', slot: 'right-workbench', label: 'chat.sessionFiles', entry: 'builtin:files', order: 10, icon: 'folder-open' },
  { id: 'browser', slot: 'right-workbench', label: 'browser.newWindow', entry: 'builtin:browser', order: 20, icon: 'globe' },
  { id: 'notes', slot: 'right-workbench', label: 'settings.preferences.notes', entry: 'builtin:notes', order: 30, icon: 'file-text' },
  { id: 'history', slot: 'right-workbench', label: 'chat.sessionInfo', entry: 'builtin:history', order: 40, icon: 'history' },
]

const BUILT_IN_IDS: ReadonlySet<string> = new Set(BUILT_INS.map(entry => entry.id))

/** A contribution plus what this host needs to draw it. */
export interface RightSidebarTool extends ComponentContribution {
  /** Resolved from `icon`; undefined when the name is unknown to this host. */
  iconComponent?: LucideIcon
  /** Built-ins ship with the shell; everything else arrived through registration. */
  source: 'builtin' | 'component'
}

const registry = new Map<string, ComponentContribution>(BUILT_INS.map(entry => [entry.id, entry]))

const toTool = (contribution: ComponentContribution): RightSidebarTool => ({
  ...contribution,
  iconComponent: contribution.icon ? ICONS[contribution.icon] : undefined,
  source: BUILT_IN_IDS.has(contribution.id) ? 'builtin' : 'component',
})

/** Right-workbench entries in rail order. Contributions without an `order` sort last. */
export function listRightSidebarTools(): RightSidebarTool[] {
  return [...registry.values()]
    .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map(toTool)
}

/**
 * Register one right-workbench contribution. Returns a disposer so activation is reversible and a
 * revoked Component leaves no entry behind.
 */
export function registerRightSidebarTool(contribution: ComponentContribution): () => void {
  if (contribution.slot !== 'right-workbench') {
    throw new Error(`right-sidebar host only accepts right-workbench contributions: ${contribution.id} is ${contribution.slot}`)
  }
  if (registry.has(contribution.id)) throw new Error(`right-sidebar tool already registered: ${contribution.id}`)
  registry.set(contribution.id, contribution)
  return () => {
    if (registry.get(contribution.id) === contribution) registry.delete(contribution.id)
  }
}

export function getRightSidebarTool(id: string | undefined): RightSidebarTool | undefined {
  if (!id) return undefined
  const contribution = registry.get(id)
  return contribution ? toTool(contribution) : undefined
}

import * as React from 'react'
import { ChevronDown, ChevronRight, FileCode, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  normalizeReviewPath,
  reviewDiffKinds,
  reviewTotals,
  type ReviewDiff,
  type ReviewTreeKind,
} from './review-diff-model'

/**
 * Review as a tree rather than a flat list.
 *
 * The previous surface listed every changed path at one level. That is readable
 * for three files and useless for eighty: the reviewer has to scan the whole
 * list to find out whether anything under `src/api` changed, and a folder that
 * was deleted wholesale looks identical to one with a typo fix.
 *
 * Directories carry the colour of what is under them — `reviewDiffKinds` rolls
 * add/delete/mixed up every ancestor — so a collapsed folder still answers the
 * question. Everything is expanded by default because a review that opens
 * collapsed hides the thing it exists to show; collapsing is for getting a large
 * change back under control, not the starting state.
 */

interface TreeNode {
  name: string
  path: string
  kind?: ReviewTreeKind
  diff?: ReviewDiff
  children: TreeNode[]
}

function buildTree(diffs: readonly ReviewDiff[]): TreeNode {
  const kinds = reviewDiffKinds(diffs)
  const root: TreeNode = { name: '', path: '', children: [] }

  for (const diff of diffs) {
    const segments = normalizeReviewPath(diff.path).split('/').filter(Boolean)
    let cursor = root

    segments.forEach((segment, index) => {
      const path = segments.slice(0, index + 1).join('/')
      const isLeaf = index === segments.length - 1
      let next = cursor.children.find((child) => child.name === segment)
      if (!next) {
        next = { name: segment, path, children: [] }
        const kind = kinds.get(path)
        if (kind) next.kind = kind
        cursor.children.push(next)
      }
      if (isLeaf) next.diff = diff
      cursor = next
    })
  }

  // Directories before files, then alphabetical — the order a reviewer scans in.
  const sort = (node: TreeNode) => {
    node.children.sort((a, b) =>
      Number(b.children.length > 0) - Number(a.children.length > 0)
      || a.name.localeCompare(b.name))
    node.children.forEach(sort)
  }
  sort(root)
  return root
}

export interface ReviewFileTreeProps {
  diffs: readonly ReviewDiff[]
  selectedPath: string | null
  onSelect: (path: string) => void
  emptyLabel: string
}

export function ReviewFileTree({
  diffs,
  selectedPath,
  onSelect,
  emptyLabel,
}: ReviewFileTreeProps) {
  const tree = React.useMemo(() => buildTree(diffs), [diffs])
  const totals = React.useMemo(() => reviewTotals(diffs), [diffs])
  const [collapsed, setCollapsed] = React.useState<ReadonlySet<string>>(new Set())

  const toggle = (path: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  if (diffs.length === 0) {
    return <div className="px-3 py-6 text-center text-xs text-foreground/50">{emptyLabel}</div>
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-foreground/50">
        <span>{totals.files}</span>
        <span className="text-success">+{totals.additions}</span>
        <span className="text-destructive">−{totals.deletions}</span>
      </div>
      <div className="min-h-0 overflow-y-auto pb-1">
        {tree.children.map((node) => (
          <TreeRow
            key={node.path}
            node={node}
            depth={0}
            collapsed={collapsed}
            onToggle={toggle}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

function TreeRow({
  node,
  depth,
  collapsed,
  onToggle,
  selectedPath,
  onSelect,
}: {
  node: TreeNode
  depth: number
  collapsed: ReadonlySet<string>
  onToggle: (path: string) => void
  selectedPath: string | null
  onSelect: (path: string) => void
}) {
  const isDirectory = node.children.length > 0
  const isCollapsed = collapsed.has(node.path)
  const isSelected = !isDirectory && selectedPath === node.path

  return (
    <>
      <button
        type="button"
        onClick={() => (isDirectory ? onToggle(node.path) : onSelect(node.path))}
        aria-expanded={isDirectory ? !isCollapsed : undefined}
        className={cn(
          'flex w-full items-center gap-1 px-2 py-1 text-left text-xs',
          'hover:bg-foreground/5 focus-visible:outline-none focus-visible:bg-foreground/5',
          isSelected && 'bg-foreground/[0.07]',
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {isDirectory
          ? (isCollapsed
              ? <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              : <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />)
          : <span className="w-3 shrink-0" />}

        {isDirectory
          ? <Folder className={cn('h-3.5 w-3.5 shrink-0', kindClass(node.kind))} />
          : <FileCode className={cn('h-3.5 w-3.5 shrink-0', kindClass(node.kind))} />}

        <span className="flex-1 truncate">{node.name}</span>

        {node.diff && (
          <span className="shrink-0 whitespace-nowrap text-[11px]">
            {node.diff.additions > 0 && (
              <span className="text-success">+{node.diff.additions}</span>
            )}
            {node.diff.deletions > 0 && (
              <span className="ml-1 text-destructive">−{node.diff.deletions}</span>
            )}
          </span>
        )}
      </button>

      {isDirectory && !isCollapsed && node.children.map((child) => (
        <TreeRow
          key={child.path}
          node={child}
          depth={depth + 1}
          collapsed={collapsed}
          onToggle={onToggle}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </>
  )
}

/**
 * `mix` stays neutral on purpose. Colouring a mixed folder as either an addition
 * or deletion asserts something untrue, and a third colour for "both" reads as a
 * third kind of change rather than as the absence of a single answer.
 */
function kindClass(kind: ReviewTreeKind | undefined): string {
  switch (kind) {
    case 'add': return 'text-success'
    case 'del': return 'text-destructive'
    default: return 'text-foreground/50'
  }
}

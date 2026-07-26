/**
 * Infinite Canvas — R7 preview surface (Decision G6 frontend track).
 *
 * Status: display-only. Data flows through a typed adapter over mocks; no
 * store, no RPC, no product navigation. The interaction model follows
 * docs/design-library/07-canvas-spatial-orchestration-VISION.md:
 * artifact-graph first, cards are projections of native entities (§4),
 * relationship classes stay distinct edge types (§5), and the renderer is the
 * committed DOM family — translate3d viewport, SVG edge underlay, and
 * visible-node virtualization (matrix §G canvas route). Wiring to real
 * Session/Artifact state is R7 work behind R4/R5.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Bot, FileText, StickyNote, Play, GitBranch } from 'lucide-react'
import type { ComponentEntry } from './types'

// ─── Typed adapter boundary (G6): the preview only sees this contract ────────

export type CanvasNodeKind = 'session' | 'artifact' | 'note'
export type CanvasEdgeKind = 'produces' | 'references' | 'depends'

export interface CanvasNodeProjection {
  id: string
  kind: CanvasNodeKind
  title: string
  subtitle?: string
  x: number
  y: number
  /** session-only: live production loop state (§7) */
  running?: boolean
  /** artifact-only: exact version chip (§4 — projections carry identity) */
  version?: string
}

export interface CanvasEdgeProjection {
  id: string
  kind: CanvasEdgeKind
  from: string
  to: string
}

export interface CanvasGraphAdapter {
  nodes(): CanvasNodeProjection[]
  edges(): CanvasEdgeProjection[]
}

export function createMockCanvasAdapter(): CanvasGraphAdapter {
  const nodes: CanvasNodeProjection[] = [
    { id: 's1', kind: 'session', title: '重构结算模块', subtitle: 'Session · 运行中', x: 80, y: 120, running: true },
    { id: 's2', kind: 'session', title: '竞品调研', subtitle: 'Session · 已完成', x: 60, y: 420 },
    { id: 'a1', kind: 'artifact', title: '结算方案.md', version: 'v3', subtitle: 'Artifact', x: 520, y: 80 },
    { id: 'a2', kind: 'artifact', title: '调研报告.md', version: 'v1', subtitle: 'Artifact', x: 500, y: 380 },
    { id: 'a3', kind: 'artifact', title: '架构草图.png', version: 'v2', subtitle: 'Artifact', x: 900, y: 220 },
    { id: 'n1', kind: 'note', title: '边界：先本地后云端', x: 320, y: 620 },
    { id: 'n2', kind: 'note', title: '4K 素材走媒体层（§8）', x: 940, y: 520 },
  ]
  const edges: CanvasEdgeProjection[] = [
    { id: 'e1', kind: 'produces', from: 's1', to: 'a1' },
    { id: 'e2', kind: 'produces', from: 's2', to: 'a2' },
    { id: 'e3', kind: 'references', from: 'a1', to: 'a2' },
    { id: 'e4', kind: 'depends', from: 'a3', to: 'a1' },
    { id: 'e5', kind: 'references', from: 'n1', to: 's2' },
  ]
  return { nodes: () => nodes, edges: () => edges }
}

// ─── Geometry ────────────────────────────────────────────────────────────────

const NODE_W = 220
const NODE_H = 84
const MIN_SCALE = 0.25
const MAX_SCALE = 2.5

interface Viewport {
  x: number
  y: number
  scale: number
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }): string {
  const x1 = a.x + NODE_W
  const y1 = a.y + NODE_H / 2
  const x2 = b.x
  const y2 = b.y + NODE_H / 2
  const dx = Math.max(48, Math.abs(x2 - x1) / 2)
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
}

const EDGE_STYLE: Record<CanvasEdgeKind, { dash?: string; label: string }> = {
  produces: { label: '产出' },
  references: { dash: '6 4', label: '引用' },
  depends: { dash: '2 4', label: '依赖' },
}

// ─── The canvas ──────────────────────────────────────────────────────────────

export function InfiniteCanvasPreview({ adapter }: { adapter?: CanvasGraphAdapter }) {
  const graph = React.useMemo(() => adapter ?? createMockCanvasAdapter(), [adapter])
  const [positions, setPositions] = React.useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(graph.nodes().map(n => [n.id, { x: n.x, y: n.y }])),
  )
  const [viewport, setViewport] = React.useState<Viewport>({ x: 40, y: 20, scale: 0.9 })
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<
    | { mode: 'pan'; startX: number; startY: number; originX: number; originY: number }
    | { mode: 'node'; id: string; startX: number; startY: number; originX: number; originY: number }
    | null
  >(null)

  const handleWheel = React.useCallback((event: React.WheelEvent) => {
    event.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setViewport(prev => {
      if (event.ctrlKey || event.metaKey || Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (event.deltaY > 0 ? 0.92 : 1.08)))
        // Zoom keeps the cursor's world point fixed.
        const cx = event.clientX - rect.left
        const cy = event.clientY - rect.top
        const worldX = (cx - prev.x) / prev.scale
        const worldY = (cy - prev.y) / prev.scale
        return { scale: nextScale, x: cx - worldX * nextScale, y: cy - worldY * nextScale }
      }
      return { ...prev, x: prev.x - event.deltaX, y: prev.y - event.deltaY }
    })
  }, [])

  const handlePointerDown = React.useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    const nodeEl = (event.target as Element).closest('[data-canvas-node]')
    if (nodeEl) {
      const id = nodeEl.getAttribute('data-canvas-node')!
      setSelectedId(id)
      const origin = positions[id]
      dragRef.current = { mode: 'node', id, startX: event.clientX, startY: event.clientY, originX: origin.x, originY: origin.y }
    } else {
      setSelectedId(null)
      dragRef.current = { mode: 'pan', startX: event.clientX, startY: event.clientY, originX: viewport.x, originY: viewport.y }
    }
  }, [positions, viewport.x, viewport.y])

  const handlePointerMove = React.useCallback((event: React.PointerEvent) => {
    const drag = dragRef.current
    if (!drag) return
    const dx = event.clientX - drag.startX
    const dy = event.clientY - drag.startY
    if (drag.mode === 'pan') {
      setViewport(prev => ({ ...prev, x: drag.originX + dx, y: drag.originY + dy }))
    } else {
      setPositions(prev => ({
        ...prev,
        [drag.id]: { x: drag.originX + dx / viewport.scale, y: drag.originY + dy / viewport.scale },
      }))
    }
  }, [viewport.scale])

  const endDrag = React.useCallback(() => {
    dragRef.current = null
  }, [])

  // Visible-node virtualization (route requirement): only nodes intersecting
  // the viewport render. With mock counts this is about honoring the shape,
  // not saving work.
  const rect = containerRef.current?.getBoundingClientRect()
  const visibleNodes = graph.nodes().filter(node => {
    if (!rect) return true
    const pos = positions[node.id]
    const left = pos.x * viewport.scale + viewport.x
    const top = pos.y * viewport.scale + viewport.y
    return left > -NODE_W * viewport.scale - 100 && left < rect.width + 100
      && top > -NODE_H * viewport.scale - 100 && top < rect.height + 100
  })

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-[520px] w-full touch-none select-none overflow-hidden rounded-lg border border-border bg-background"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{ cursor: dragRef.current?.mode === 'pan' ? 'grabbing' : 'default' }}
    >
      {/* Dot grid scales with the viewport so space feels continuous */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
          backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      {/* World layer */}
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{ transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})`, transformOrigin: '0 0' }}
      >
        {/* Edge underlay — one SVG, distinct dash per relationship class (§5) */}
        <svg className="pointer-events-none absolute -left-[4000px] -top-[4000px] h-[12000px] w-[12000px] overflow-visible" aria-hidden>
          <g transform="translate(4000 4000)" className="stroke-muted-foreground/60">
            {graph.edges().map(edge => {
              const from = positions[edge.from]
              const to = positions[edge.to]
              if (!from || !to) return null
              return (
                <path
                  key={edge.id}
                  d={edgePath(from, to)}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray={EDGE_STYLE[edge.kind].dash}
                />
              )
            })}
          </g>
        </svg>

        {visibleNodes.map(node => {
          const pos = positions[node.id]
          const selected = selectedId === node.id
          return (
            <div
              key={node.id}
              data-canvas-node={node.id}
              className={cn(
                'absolute flex cursor-grab flex-col justify-between rounded-lg border bg-card p-3 shadow-minimal',
                'active:cursor-grabbing',
                selected ? 'border-ring ring-1 ring-ring' : 'border-border/70 hover:border-border',
              )}
              style={{ width: NODE_W, height: NODE_H, transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
            >
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md',
                    node.kind === 'session' && 'bg-purple-500/12 text-purple-600 dark:text-purple-300',
                    node.kind === 'artifact' && 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-300',
                    node.kind === 'note' && 'bg-amber-500/12 text-amber-600 dark:text-amber-300',
                  )}
                >
                  {node.kind === 'session' ? <Bot className="h-3.5 w-3.5" /> : node.kind === 'artifact' ? <FileText className="h-3.5 w-3.5" /> : <StickyNote className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-foreground">{node.title}</div>
                  {node.subtitle && <div className="truncate text-[11px] text-muted-foreground">{node.subtitle}</div>}
                </div>
                {node.version && (
                  <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{node.version}</span>
                )}
              </div>
              {node.running && (
                <div className="flex items-center gap-1.5 text-[10px] text-purple-600 dark:text-purple-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-500/60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
                  </span>
                  生产环运行中（§7）
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Honest-status + controls overlay */}
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2">
        <span className="rounded-md bg-foreground/[0.06] px-2 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur">
          display-only · G6 预览 · R7 接线待 R4/R5
        </span>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" />
        拖拽平移 · 滚轮缩放（{Math.round(viewport.scale * 100)}%）· 拖动卡片重排
      </div>
      <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" className="stroke-muted-foreground/60" strokeWidth="1.5" /></svg>产出</span>
        <span className="flex items-center gap-1"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" className="stroke-muted-foreground/60" strokeWidth="1.5" strokeDasharray="6 4" /></svg>引用</span>
        <span className="flex items-center gap-1"><svg width="18" height="6"><line x1="0" y1="3" x2="18" y2="3" className="stroke-muted-foreground/60" strokeWidth="1.5" strokeDasharray="2 4" /></svg>依赖</span>
        <span className="flex items-center gap-1"><Play className="h-3 w-3" />异步生产环</span>
      </div>
    </div>
  )
}

export const canvasComponents: ComponentEntry[] = [
  {
    id: 'canvas-infinite',
    name: 'Infinite Canvas（R7 预览）',
    category: 'Canvas',
    description:
      '无限画布预览：制品图优先，卡片是 Session/Artifact/Note 的投影，三类关系边（产出/引用/依赖）各自可辨，DOM+translate3d 视口与 SVG 边层遵循已定的渲染家族。display-only：数据来自 typed adapter 的 mock，接线是 R7 在 R4/R5 之后的工作。',
    component: InfiniteCanvasPreview,
    props: [],
    layout: 'full',
    previewOverflow: 'hidden',
  },
]

import * as React from 'react'

import { cn } from '@/lib/utils'

interface PanelDragGhostProps {
  pointer: { x: number; y: number }
  label: string
  icon?: React.ComponentType<{ className?: string; strokeWidth?: string | number }>
  className?: string
}

/**
 * Floating label that follows the pointer during Claude-style panel reorder.
 */
export function PanelDragGhost({ pointer, label, icon: Icon, className }: PanelDragGhostProps) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[200] flex max-w-[240px] items-center gap-2',
        'rounded-[10px] border border-primary/40 bg-background px-3 py-2 shadow-strong',
        className,
      )}
      style={{
        left: pointer.x,
        top: pointer.y,
        transform: 'translate(-50%, -120%) scale(1.02)',
      }}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} /> : null}
      <span className="truncate text-[12px] font-semibold text-foreground">{label}</span>
    </div>
  )
}

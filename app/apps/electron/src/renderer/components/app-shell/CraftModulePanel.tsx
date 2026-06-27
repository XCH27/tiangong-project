import * as React from 'react'

import { cn } from '@/lib/utils'
import { RADIUS_INNER } from './panel-constants'

export interface CraftModulePanelProps {
  title: React.ReactNode
  icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }>
  children: React.ReactNode
  className?: string
  contentClassName?: string
  style?: React.CSSProperties
  onClose?: () => void
  closeLabel?: string
  dragTitle?: string
  onDragPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
  onHeaderPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void
  gripMode?: 'move' | 'resize-y'
  isDragging?: boolean
  isDragSource?: boolean
  isHighlighted?: boolean
  ariaLabel?: string
}

/**
 * Compact module chrome for Tool Dock tiles and the bottom terminal card.
 */
export const CraftModulePanel = React.forwardRef<HTMLElement, CraftModulePanelProps>(
  function CraftModulePanel({
    title,
    icon: Icon,
    children,
    className,
    contentClassName,
    style,
    onClose,
    closeLabel,
    dragTitle,
    onDragPointerDown,
    onHeaderPointerDown,
    gripMode = 'move',
    isDragging,
    isDragSource,
    isHighlighted,
    ariaLabel,
  }, ref) {
    const handleHeaderPointerDown = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
      if (!onHeaderPointerDown) return
      const target = event.target as HTMLElement | null
      if (target?.closest('button, a, input, textarea, select, [role="button"]')) return
      onHeaderPointerDown(event)
    }, [onHeaderPointerDown])

    return (
      <section
        ref={ref}
        className={cn(
          'group/workbench-module relative flex min-w-0 flex-col overflow-hidden',
          'border border-border bg-background text-foreground shadow-middle',
          isHighlighted && 'ring-2 ring-primary/60',
          isDragging && 'z-30 scale-[1.02] shadow-strong ring-2 ring-primary/70',
          isDragSource && 'pointer-events-none opacity-35',
          className,
        )}
        style={{ borderRadius: RADIUS_INNER, ...style }}
        aria-label={ariaLabel}
      >
        {onDragPointerDown && (
          <div
            className={cn(
              'absolute left-0 right-0 top-0 z-10 flex h-8 touch-none justify-center pt-1.5',
              'opacity-50 transition-opacity hover:opacity-100',
              gripMode === 'resize-y' ? 'cursor-row-resize' : 'cursor-grab active:cursor-grabbing',
              isDragSource && 'cursor-grabbing opacity-100',
            )}
            title={dragTitle}
            onPointerDown={onDragPointerDown}
          >
            <div
              className={cn(
                'h-1 w-12 rounded-full bg-foreground/30 shadow-sm dark:bg-white/80',
                isDragSource && 'bg-primary dark:bg-primary',
              )}
            />
          </div>
        )}

        <div
          className={cn(
            'flex h-10 shrink-0 touch-none items-center justify-between gap-2 border-b border-border/50 px-3',
            onHeaderPointerDown && 'cursor-grab select-none active:cursor-grabbing',
          )}
          onPointerDown={handleHeaderPointerDown}
        >
          <div className="flex min-w-0 items-center gap-2">
            <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="truncate text-[13px] font-semibold text-foreground">{title}</span>
          </div>
          {onClose && (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-[14px] leading-none text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onClose}
              aria-label={closeLabel}
            >
              ×
            </button>
          )}
        </div>

        <div className={cn('min-h-0 flex-1 overflow-hidden', contentClassName)}>
          {children}
        </div>
      </section>
    )
  },
)

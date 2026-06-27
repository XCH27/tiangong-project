import * as React from 'react'

import { cn } from '@/lib/utils'

interface WorkbenchModuleFrameProps {
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
  isHighlighted?: boolean
  ariaLabel?: string
}

export const WorkbenchModuleFrame = React.forwardRef<HTMLElement, WorkbenchModuleFrameProps>(
  function WorkbenchModuleFrame({
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
          'group/workbench-module relative flex min-h-[120px] min-w-0 flex-col overflow-hidden rounded-[10px]',
          'border border-border bg-background text-foreground shadow-middle',
          isHighlighted && 'ring-1 ring-primary/50',
          isDragging && 'ring-1 ring-primary/60',
          className,
        )}
        style={style}
        aria-label={ariaLabel}
      >
        {onDragPointerDown && (
          <div
            className={cn(
              'absolute left-0 right-0 top-0 z-10 flex h-6 justify-center pt-1 opacity-0 transition-opacity hover:opacity-100',
              gripMode === 'resize-y' ? 'cursor-row-resize' : 'cursor-grab active:cursor-grabbing',
            )}
            title={dragTitle}
            onPointerDown={onDragPointerDown}
          >
            <div
              className={cn(
                'h-1 w-12 rounded-full bg-foreground/25 shadow-sm dark:bg-white/80',
                isDragging && 'bg-primary dark:bg-primary',
              )}
            />
          </div>
        )}

        <div
          className={cn(
            'flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-3',
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

/**
 * Vertical resize sash between stacked Tool Dock modules.
 */

import { useCallback, useRef } from 'react'
import { useResizeGradient } from '@/hooks/useResizeGradient'
import {
  PANEL_SASH_HALF_HIT_WIDTH,
  PANEL_SASH_LINE_WIDTH,
} from './panel-constants'

interface ModuleResizeSashProps {
  onResize: (deltaY: number) => void
  onResizeEnd?: () => void
  onDoubleClick?: () => void
}

export function ModuleResizeSash({ onResize, onResizeEnd, onDoubleClick }: ModuleResizeSashProps) {
  const { ref, handlers, gradientStyle } = useResizeGradient()
  const startYRef = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handlers.onMouseDown()
    startYRef.current = e.clientY

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onResize(moveEvent.clientY - startYRef.current)
      startYRef.current = moveEvent.clientY
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      onResizeEnd?.()
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handlers, onResize, onResizeEnd])

  return (
    <div
      ref={ref}
      className="relative h-1.5 shrink-0 cursor-row-resize"
      onMouseDown={handleMouseDown}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center"
        style={{ height: PANEL_SASH_LINE_WIDTH }}
      >
        <div
          className="h-full rounded-full"
          style={{
            ...gradientStyle,
            width: 48,
          }}
        />
      </div>
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: PANEL_SASH_HALF_HIT_WIDTH * 2, marginTop: -PANEL_SASH_HALF_HIT_WIDTH }}
      />
    </div>
  )
}

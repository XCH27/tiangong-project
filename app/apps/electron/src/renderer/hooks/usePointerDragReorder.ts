import * as React from 'react'

const DRAG_THRESHOLD_PX = 6

interface DragPointer {
  x: number
  y: number
}

interface UsePointerDragReorderOptions<TIndex extends number> {
  enabled: boolean
  getDropIndex: (clientX: number, clientY: number) => TIndex | null
  onReorder: (fromIndex: TIndex, toIndex: TIndex) => void
}

interface DragState<TIndex extends number> {
  from: TIndex | null
  over: TIndex | null
  active: boolean
  pointer: DragPointer | null
}

/**
 * Claude-style panel reorder: press → move past threshold → panel "lifts" → drop on release.
 * Listeners attach synchronously on pointerdown (no useEffect race).
 */
export function usePointerDragReorder<TIndex extends number>({
  enabled,
  getDropIndex,
  onReorder,
}: UsePointerDragReorderOptions<TIndex>) {
  const dragFromRef = React.useRef<TIndex | null>(null)
  const isActiveRef = React.useRef(false)
  const startClientRef = React.useRef({ x: 0, y: 0 })
  const getDropIndexRef = React.useRef(getDropIndex)
  const onReorderRef = React.useRef(onReorder)
  const detachRef = React.useRef<(() => void) | null>(null)

  getDropIndexRef.current = getDropIndex
  onReorderRef.current = onReorder

  const [dragState, setDragState] = React.useState<DragState<TIndex>>({
    from: null,
    over: null,
    active: false,
    pointer: null,
  })

  const cleanup = React.useCallback(() => {
    detachRef.current?.()
    detachRef.current = null
    dragFromRef.current = null
    isActiveRef.current = false
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    setDragState({ from: null, over: null, active: false, pointer: null })
  }, [])

  React.useEffect(() => () => cleanup(), [cleanup])

  const startDrag = React.useCallback((index: TIndex, event: React.PointerEvent) => {
    if (!enabled) return

    event.preventDefault()
    event.stopPropagation()

    cleanup()

    dragFromRef.current = index
    isActiveRef.current = false
    startClientRef.current = { x: event.clientX, y: event.clientY }

    const captureTarget = event.currentTarget as HTMLElement
    try {
      captureTarget.setPointerCapture(event.pointerId)
    } catch {
      // ignore — window listeners still work
    }

    const handleMove = (moveEvent: PointerEvent) => {
      if (dragFromRef.current === null) return

      const dx = moveEvent.clientX - startClientRef.current.x
      const dy = moveEvent.clientY - startClientRef.current.y

      if (!isActiveRef.current) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        isActiveRef.current = true
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'grabbing'
      }

      const over = getDropIndexRef.current(moveEvent.clientX, moveEvent.clientY) ?? dragFromRef.current
      setDragState({
        from: dragFromRef.current,
        over,
        active: true,
        pointer: { x: moveEvent.clientX, y: moveEvent.clientY },
      })
    }

    const handleEnd = (endEvent: PointerEvent) => {
      try {
        captureTarget.releasePointerCapture(endEvent.pointerId)
      } catch {
        // ignore
      }

      const from = dragFromRef.current
      if (from !== null && isActiveRef.current) {
        const drop = getDropIndexRef.current(endEvent.clientX, endEvent.clientY)
        if (drop !== null && drop !== from) {
          onReorderRef.current(from, drop)
        }
      }

      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
      cleanup()
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
    window.addEventListener('pointercancel', handleEnd)

    detachRef.current = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
      window.removeEventListener('pointercancel', handleEnd)
    }
  }, [enabled, cleanup])

  return {
    dragFromIndex: dragState.active ? dragState.from : null,
    dragOverIndex: dragState.active ? dragState.over : null,
    dragPointer: dragState.active ? dragState.pointer : null,
    isDragging: dragState.active,
    startDrag,
  }
}

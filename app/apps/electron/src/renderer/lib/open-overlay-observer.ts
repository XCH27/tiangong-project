import { hasOpenOverlay } from './overlay-detection'

/**
 * Observe the renderer's shared overlay layer. Embedded BrowserViews are
 * native children of the host window and always composite above renderer DOM,
 * so callers use this signal to detach them while menus or dialogs are open.
 */
export function observeOpenOverlay(onChange: (open: boolean) => void): () => void {
  let lastOpen = hasOpenOverlay()
  let disposed = false
  onChange(lastOpen)

  const observer = new MutationObserver(() => {
    if (disposed) return
    const open = hasOpenOverlay()
    if (open === lastOpen) return
    lastOpen = open
    onChange(open)
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state', 'data-slot', 'role'],
  })

  return () => {
    disposed = true
    observer.disconnect()
  }
}

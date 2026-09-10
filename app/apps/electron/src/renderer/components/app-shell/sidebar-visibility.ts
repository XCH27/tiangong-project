/**
 * Single authoritative left-sidebar visibility projection.
 *
 * Toggle state, focus mode, auto-compact, stored preference, rendered width,
 * resize offset, and aria/title must all derive from one resolver so they
 * never disagree (R0 shell repair; REUSE of Craft v0.10.5/v0.11.4 toggle
 * semantics with an explicit projection layer).
 */

export interface SidebarVisibilityInput {
  /** User preference / stored visibility (CMD+B target when not in focus mode). */
  storedVisible: boolean
  /** Stored pixel width when the sidebar is rendered. */
  storedWidth: number
  /** Focus mode (CMD+.) — hides both sidebar and navigator. */
  focusMode: boolean
  /** Auto-compact / mobile shell — hides desktop chrome entirely. */
  autoCompact: boolean
}

export interface SidebarVisibilityProjection {
  /** Width to paint. Zero when hidden for any reason. */
  renderedWidth: number
  /** Whether the sidebar panel is painted. */
  isRendered: boolean
  /** Whether the top-bar toggle control is shown (hidden in compact). */
  showToggle: boolean
  /** aria-pressed / visual pressed: true only when the sidebar is actually on screen. */
  ariaPressed: boolean
  /**
   * Title attribution for the middle navigator when the global sidebar is
   * considered "user-visible" (stored preference), even if focus mode is
   * currently hiding it — matches Craft header title behaviour.
   */
  titleFromSidebar: boolean
  /** Compensate stoplight padding when the sidebar is not user-visible. */
  compensateForStoplight: boolean
  /** Horizontal offset for the session-list sash (sidebar width when rendered). */
  resizeOffset: number
  /**
   * What the next desktop toggle click does:
   * - `exit-focus` — leave focus mode first (sidebar preference unchanged)
   * - `show` / `hide` — flip stored visibility
   * - `noop-compact` — compact shell owns layout; toggle is not offered
   */
  toggleAction: 'exit-focus' | 'show' | 'hide' | 'noop-compact'
}

/**
 * Project stored + mode state into a single consistent chrome description.
 * Responsive yielding must never call this with a synthetic "hidden" preference;
 * only focus/auto-compact and the user's stored preference hide the sidebar.
 */
export function resolveSidebarVisibility(
  input: SidebarVisibilityInput,
): SidebarVisibilityProjection {
  if (input.autoCompact) {
    return {
      renderedWidth: 0,
      isRendered: false,
      showToggle: false,
      ariaPressed: false,
      titleFromSidebar: input.storedVisible,
      compensateForStoplight: !input.storedVisible,
      resizeOffset: 0,
      toggleAction: 'noop-compact',
    }
  }

  if (input.focusMode) {
    return {
      renderedWidth: 0,
      isRendered: false,
      showToggle: true,
      ariaPressed: false,
      titleFromSidebar: input.storedVisible,
      compensateForStoplight: !input.storedVisible,
      resizeOffset: 0,
      toggleAction: 'exit-focus',
    }
  }

  const isRendered = input.storedVisible
  const renderedWidth = isRendered ? input.storedWidth : 0
  return {
    renderedWidth,
    isRendered,
    showToggle: true,
    ariaPressed: isRendered,
    titleFromSidebar: input.storedVisible,
    compensateForStoplight: !input.storedVisible,
    resizeOffset: renderedWidth,
    toggleAction: isRendered ? 'hide' : 'show',
  }
}

/**
 * Apply one desktop sidebar toggle action. Returns the next stored-visible and
 * focus-mode pair. Compact is a no-op (caller should not offer the control).
 */
export function applySidebarToggle(
  input: SidebarVisibilityInput,
): { storedVisible: boolean; focusMode: boolean } {
  const projection = resolveSidebarVisibility(input)
  switch (projection.toggleAction) {
    case 'exit-focus':
      return { storedVisible: input.storedVisible, focusMode: false }
    case 'show':
      return { storedVisible: true, focusMode: false }
    case 'hide':
      return { storedVisible: false, focusMode: false }
    case 'noop-compact':
      return { storedVisible: input.storedVisible, focusMode: input.focusMode }
  }
}

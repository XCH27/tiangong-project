import type { WorkbenchModuleKind } from '@/atoms/right-workbench'

/**
 * Two-pane session layout.
 *
 * Replaces the four fixed columns (sidebar · navigator · main · workbench) that
 * required ~1440px before the shell reached its intended shape — which is why
 * the app degraded badly under display scaling. The model here is OpenCode's:
 *
 *   > The review pane has no width of its own: it takes whatever the chat panel
 *   > leaves behind. Instead of capping the chat panel at a fraction of the
 *   > window (which forces the review pane to grow with the monitor), reserve a
 *   > fixed minimum for the review pane and let the chat panel take everything
 *   > else.
 *
 * Two panes, one resizable seam. The chat pane owns a stored width; the
 * workbench takes the remainder and is hidden when its floor cannot be met.
 *
 * The floor is per-module rather than global. A side-by-side diff genuinely
 * needs room a task checklist does not, and a single global minimum either
 * starves the diff or hides the checklist for no reason.
 */

/** The chat pane never shrinks below this; it is the product's primary surface. */
export const CHAT_PANE_WIDTH_MIN = 450

/** Floor for a workbench module that is mostly a list or a form. */
export const WORKBENCH_WIDTH_MIN_COMPACT = 320

/** Floor for reading content — a unified diff, a terminal transcript, a page. */
export const WORKBENCH_WIDTH_MIN_CONTENT = 480

/** Floor for a side-by-side diff, which is two content columns. */
export const WORKBENCH_WIDTH_MIN_SPLIT = 800

export type WorkbenchDiffStyle = 'unified' | 'split'

/**
 * What a module needs to be usable, not merely present. Rendering a split diff
 * into 320px is the same failure as not rendering it at all, but louder.
 */
export function workbenchModuleWidthMin(
  kind: WorkbenchModuleKind,
  options: { diffStyle?: WorkbenchDiffStyle } = {},
): number {
  switch (kind) {
    case 'review':
      return options.diffStyle === 'split'
        ? WORKBENCH_WIDTH_MIN_SPLIT
        : WORKBENCH_WIDTH_MIN_CONTENT
    case 'browser':
    case 'terminal':
    case 'canvas':
      return WORKBENCH_WIDTH_MIN_CONTENT
    case 'task-board':
    case 'side-task':
      return WORKBENCH_WIDTH_MIN_COMPACT
    default:
      return kind satisfies never
  }
}

export interface SessionPaneLayoutInput {
  /** Measured width of the pane row. `0` means "not measured yet". */
  containerWidth: number
  /** Stored, user-resized chat pane width. */
  chatWidth: number
  /** Whether the user has asked for the workbench at all. */
  workbenchRequested: boolean
  /** Active module, which decides the workbench floor. */
  workbenchKind?: WorkbenchModuleKind
  diffStyle?: WorkbenchDiffStyle
  /** Horizontal space consumed by window chrome (insets, seam). */
  chromeWidth: number
}

export interface SessionPaneLayout {
  chatWidth: number
  workbenchWidth: number
  /** False when the workbench was requested but its floor cannot be met. */
  workbenchVisible: boolean
  /**
   * True when the workbench was requested and refused. The toggle uses this to
   * explain itself rather than flipping state with nothing on screen — the
   * failure mode the four-column resolver shipped with.
   */
  workbenchBlockedByWidth: boolean
}

/**
 * Largest chat width that still leaves the workbench its floor. Mirrors
 * OpenCode's `sessionPanelWidthMax`.
 */
export function chatPaneWidthMax(input: {
  available: number
  workbenchMin: number
}): number {
  return Math.max(CHAT_PANE_WIDTH_MIN, input.available - input.workbenchMin)
}

/**
 * Clamp a stored chat width against currently available space.
 *
 * `available` is undefined until the row is first measured; return the stored
 * width untouched until then so the pane does not snap on the first frame.
 */
export function clampChatPaneWidth(input: {
  width: number
  available: number | undefined
  workbenchMin: number
}): number {
  if (input.available === undefined) return input.width
  return Math.min(
    input.width,
    chatPaneWidthMax({ available: input.available, workbenchMin: input.workbenchMin }),
  )
}

export function resolveSessionPaneLayout(
  input: SessionPaneLayoutInput,
): SessionPaneLayout {
  const available = input.containerWidth - input.chromeWidth

  // Preserve the requested shape until a real measurement arrives.
  if (input.containerWidth <= 0) {
    return {
      chatWidth: input.chatWidth,
      workbenchWidth: 0,
      workbenchVisible: input.workbenchRequested,
      workbenchBlockedByWidth: false,
    }
  }

  if (!input.workbenchRequested) {
    return {
      chatWidth: Math.max(CHAT_PANE_WIDTH_MIN, available),
      workbenchWidth: 0,
      workbenchVisible: false,
      workbenchBlockedByWidth: false,
    }
  }

  const workbenchMin = workbenchModuleWidthMin(
    input.workbenchKind ?? 'task-board',
    { diffStyle: input.diffStyle },
  )

  // Both floors must fit before the seam is worth drawing.
  if (available < CHAT_PANE_WIDTH_MIN + workbenchMin) {
    return {
      chatWidth: Math.max(CHAT_PANE_WIDTH_MIN, available),
      workbenchWidth: 0,
      workbenchVisible: false,
      workbenchBlockedByWidth: true,
    }
  }

  const chatWidth = clampChatPaneWidth({
    width: input.chatWidth,
    available,
    workbenchMin,
  })

  return {
    chatWidth,
    workbenchWidth: available - chatWidth,
    workbenchVisible: true,
    workbenchBlockedByWidth: false,
  }
}

/**
 * Stacking, mirroring OpenCode's six-line `sessionPanelLayout`. Two content
 * modules open at once share the workbench vertically instead of competing for
 * a width neither can use.
 */
export function resolveWorkbenchStacking(input: {
  kinds: readonly WorkbenchModuleKind[]
}): { visible: boolean; stacked: boolean } {
  const contentModules = input.kinds.filter(
    (kind) => workbenchModuleWidthMin(kind) >= WORKBENCH_WIDTH_MIN_CONTENT,
  )
  return {
    visible: input.kinds.length > 0,
    stacked: contentModules.length > 1,
  }
}

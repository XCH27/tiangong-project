export const TASK_BOARD_SECTION_KEYS = [
  'todos',
  'extensions',
  'memory',
  'sources',
] as const

export type TaskBoardSectionKey = typeof TASK_BOARD_SECTION_KEYS[number]
export type TaskBoardContentState = Record<TaskBoardSectionKey, boolean>

export function getInitialTaskBoardSections(
  content: TaskBoardContentState,
): Set<TaskBoardSectionKey> {
  const firstPopulated = TASK_BOARD_SECTION_KEYS.find((key) => content[key])
  return firstPopulated
    ? new Set([firstPopulated])
    : new Set(TASK_BOARD_SECTION_KEYS)
}

export function resolveTaskBoardSections({
  current,
  previousContent,
  nextContent,
  sessionChanged,
}: {
  current: ReadonlySet<TaskBoardSectionKey>
  previousContent: TaskBoardContentState
  nextContent: TaskBoardContentState
  sessionChanged: boolean
}): Set<TaskBoardSectionKey> {
  if (!TASK_BOARD_SECTION_KEYS.some((key) => nextContent[key])) {
    return new Set(TASK_BOARD_SECTION_KEYS)
  }

  if (sessionChanged) {
    return getInitialTaskBoardSections(nextContent)
  }

  const newlyPopulated = TASK_BOARD_SECTION_KEYS.find(
    (key) => nextContent[key] && !previousContent[key],
  )
  if (newlyPopulated) {
    return new Set([newlyPopulated])
  }

  const expandedContentWasCleared = TASK_BOARD_SECTION_KEYS.some(
    (key) => current.has(key) && previousContent[key] && !nextContent[key],
  )
  if (expandedContentWasCleared || current.size === 0) {
    return getInitialTaskBoardSections(nextContent)
  }

  return new Set(current)
}

export function toggleTaskBoardSection(
  current: ReadonlySet<TaskBoardSectionKey>,
  section: TaskBoardSectionKey,
): Set<TaskBoardSectionKey> {
  const next = new Set(current)
  if (next.has(section)) next.delete(section)
  else next.add(section)
  return next
}

export function shouldUseEqualHeightTaskBoardLayout(
  content: TaskBoardContentState,
  openSections: ReadonlySet<TaskBoardSectionKey>,
): boolean {
  return (
    !TASK_BOARD_SECTION_KEYS.some((section) => content[section])
    && TASK_BOARD_SECTION_KEYS.every((section) => openSections.has(section))
  )
}

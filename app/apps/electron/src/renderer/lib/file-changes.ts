import type { ActivityItem, FileChange } from '@craft-agent/ui'

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getFilePath(input: Record<string, unknown>): string {
  return asString(input.file_path) || asString(input.path) || 'unknown'
}

function getEditChangeId(activityId: string, editIndex: number, editCount: number): string {
  return editCount <= 1 ? activityId : `${activityId}:${editIndex}`
}

export function collectFileChangesFromActivities(activities: ActivityItem[]): FileChange[] {
  const changes: FileChange[] = []

  for (const activity of activities) {
    const input = activity.toolInput as Record<string, unknown> | undefined
    if (!input) continue

    if (activity.toolName === 'Edit') {
      // Codex format: { changes: Array<{ path, kind, diff }> }
      if (Array.isArray(input.changes)) {
        for (const codexChange of input.changes as Array<{ path?: string; diff?: string }>) {
          changes.push({
            id: `${activity.id}-${codexChange.path || 'unknown'}`,
            filePath: codexChange.path || 'unknown',
            toolType: 'Edit',
            original: '',
            modified: '',
            unifiedDiff: codexChange.diff,
            error: activity.error || undefined,
          })
        }
        continue
      }

      // Pi SDK >= 0.63.2 edit format: { path, edits: [{ oldText, newText }] }
      if (Array.isArray(input.edits) && input.edits.length > 0) {
        const filePath = getFilePath(input)
        for (const [index, edit] of input.edits.entries()) {
          const currentEdit = (edit ?? {}) as { oldText?: unknown; newText?: unknown }
          changes.push({
            id: getEditChangeId(activity.id, index, input.edits.length),
            filePath,
            toolType: 'Edit',
            original: asString(currentEdit.oldText) || '',
            modified: asString(currentEdit.newText) || '',
            error: activity.error || undefined,
          })
        }
        continue
      }

      // Claude fields take precedence; legacy Pi fields are additive fallbacks.
      changes.push({
        id: activity.id,
        filePath: getFilePath(input),
        toolType: 'Edit',
        original: asString(input.old_string) || asString(input.oldText) || '',
        modified: asString(input.new_string) || asString(input.newText) || '',
        error: activity.error || undefined,
      })
      continue
    }

    if (activity.toolName === 'Write') {
      changes.push({
        id: activity.id,
        filePath: getFilePath(input),
        toolType: 'Write',
        original: '',
        modified: asString(input.content) || '',
        error: activity.error || undefined,
      })
    }
  }

  return changes
}

export function getFirstFileChangeIdForActivity(activityId: string, changes: FileChange[]): string | undefined {
  const exact = changes.find((change) => change.id === activityId)
  if (exact) return exact.id

  return changes.find((change) =>
    change.id.startsWith(`${activityId}:`) ||
    change.id.startsWith(`${activityId}-`),
  )?.id
}

export interface FileChangeSummary {
  fileCount: number
  additions: number
  deletions: number
}

function countTextLines(text: string): number {
  if (!text) return 0
  return text.split(/\r?\n/).filter((line, index, lines) => line.length > 0 || index < lines.length - 1).length
}

/**
 * Summarize the same authoritative Edit/Write activity data used by the diff
 * overlay. This deliberately does not run a second git scan: the composer chip
 * and the overlay must describe the same session-owned changes.
 */
export function summarizeFileChanges(changes: FileChange[]): FileChangeSummary {
  const files = new Set<string>()
  let additions = 0
  let deletions = 0

  for (const change of changes) {
    if (change.error) continue
    files.add(change.filePath)

    if (change.unifiedDiff) {
      for (const line of change.unifiedDiff.split(/\r?\n/)) {
        if (line.startsWith('+++') || line.startsWith('---')) continue
        if (line.startsWith('+')) additions += 1
        if (line.startsWith('-')) deletions += 1
      }
      continue
    }

    additions += countTextLines(change.modified)
    deletions += countTextLines(change.original)
  }

  return { fileCount: files.size, additions, deletions }
}

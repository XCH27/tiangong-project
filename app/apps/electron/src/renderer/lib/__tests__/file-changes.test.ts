import { describe, expect, it } from 'bun:test'
import type { ActivityItem, AssistantTurn } from '@craft-agent/ui'
import { collectFileChangesFromActivities, collectTurnReviewChanges, getFirstFileChangeIdForActivity } from '../file-changes'

function activity(overrides: Partial<ActivityItem>): ActivityItem {
  return {
    id: overrides.id ?? 'activity-1',
    type: overrides.type ?? 'tool',
    toolName: overrides.toolName ?? 'Edit',
    toolInput: overrides.toolInput ?? {},
    status: overrides.status ?? 'completed',
    timestamp: overrides.timestamp ?? Date.now(),
    error: overrides.error,
  }
}

describe('collectFileChangesFromActivities', () => {
  it('expands Pi edits[] into one FileChange per replacement', () => {
    const changes = collectFileChangesFromActivities([
      activity({
        id: 'edit-1',
        toolName: 'Edit',
        toolInput: {
          file_path: '/src/app.ts',
          edits: [
            { oldText: 'const a = 1', newText: 'const a = 2' },
            { oldText: 'const b = 1', newText: 'const b = 2' },
          ],
        },
      }),
    ])

    expect(changes).toHaveLength(2)
    expect(changes.map((change) => change.id)).toEqual(['edit-1:0', 'edit-1:1'])
    expect(changes.map((change) => change.filePath)).toEqual(['/src/app.ts', '/src/app.ts'])
    expect(changes.map((change) => change.original)).toEqual(['const a = 1', 'const b = 1'])
    expect(changes.map((change) => change.modified)).toEqual(['const a = 2', 'const b = 2'])
  })

  it('keeps single-edit activities on the original activity id', () => {
    const changes = collectFileChangesFromActivities([
      activity({
        id: 'edit-2',
        toolName: 'Edit',
        toolInput: {
          path: '/src/app.ts',
          edits: [
            { oldText: 'const a = 1', newText: 'const a = 2' },
          ],
        },
      }),
    ])

    expect(changes).toHaveLength(1)
    expect(changes[0]?.id).toBe('edit-2')
  })

  it('finds the first expanded change id for a multi-edit activity', () => {
    const changes = collectFileChangesFromActivities([
      activity({
        id: 'edit-3',
        toolName: 'Edit',
        toolInput: {
          file_path: '/src/app.ts',
          edits: [
            { oldText: 'alpha', newText: 'beta' },
            { oldText: 'gamma', newText: 'delta' },
          ],
        },
      }),
    ])

    expect(getFirstFileChangeIdForActivity('edit-3', changes)).toBe('edit-3:0')
  })

  it('finds the first per-file change id for Codex-style edit activities', () => {
    const changes = collectFileChangesFromActivities([
      activity({
        id: 'edit-4',
        toolName: 'Edit',
        toolInput: {
          changes: [
            { path: '/src/a.ts', diff: '@@ -1 +1 @@' },
            { path: '/src/b.ts', diff: '@@ -1 +1 @@' },
          ],
        },
      }),
    ])

    expect(getFirstFileChangeIdForActivity('edit-4', changes)).toBe('edit-4-/src/a.ts')
  })
})

describe('turn review projection', () => {
  const turn = (id: string, activities: ActivityItem[]): AssistantTurn => ({ type: 'assistant', turnId: id, timestamp: 1, isComplete: true, isStreaming: false, activities })
  const edit = (id: string, status: ActivityItem['status'] = 'completed') => activity({ id, status, toolInput: { file_path: '/a.ts', old_string: id, new_string: 'changed' } })
  it('pins a historical turn even after later edits arrive; missing targets stay empty', () => {
    const turns = [turn('first', [edit('one')]), turn('second', [edit('two')])]
    expect(collectTurnReviewChanges(turns, 'first').map(c => c.id)).toEqual(['one'])
    expect(collectTurnReviewChanges(turns).map(c => c.id)).toEqual(['one', 'two'])
    expect(collectTurnReviewChanges(turns, 'missing')).toEqual([])
  })
  it('does not present in-flight calls as completed changes; failed operations retain their error', () => {
    const changes = collectTurnReviewChanges([turn('t', [edit('running', 'running'), edit('done'), activity({ id: 'failed', status: 'error', error: 'Permission denied', toolInput: { file_path: '/b.ts', old_string: 'a', new_string: 'b' } })])])
    expect(changes.map(c => c.id)).toEqual(['done', 'failed'])
    expect(changes[1]?.error).toBe('Permission denied')
  })
})

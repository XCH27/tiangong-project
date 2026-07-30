import { describe, expect, it } from 'bun:test'
import {
  getInitialTaskBoardSections,
  resolveTaskBoardSections,
  shouldUseEqualHeightTaskBoardLayout,
  TASK_BOARD_SECTION_KEYS,
  toggleTaskBoardSection,
  type TaskBoardContentState,
} from '../task-board-state'

const emptyContent = (): TaskBoardContentState => ({
  todos: false,
  extensions: false,
  memory: false,
  sources: false,
})

describe('task board section state', () => {
  it('expands all four sections when every section is empty', () => {
    expect([...getInitialTaskBoardSections(emptyContent())]).toEqual([...TASK_BOARD_SECTION_KEYS])
  })

  it('expands a newly populated section and collapses the others', () => {
    const nextContent = { ...emptyContent(), extensions: true }
    const next = resolveTaskBoardSections({
      current: new Set(TASK_BOARD_SECTION_KEYS),
      previousContent: emptyContent(),
      nextContent,
      sessionChanged: false,
    })

    expect([...next]).toEqual(['extensions'])
  })

  it('chooses the first populated section when switching tasks', () => {
    const next = resolveTaskBoardSections({
      current: new Set(['sources']),
      previousContent: { ...emptyContent(), sources: true },
      nextContent: { ...emptyContent(), todos: true, sources: true },
      sessionChanged: true,
    })

    expect([...next]).toEqual(['todos'])
  })

  it('keeps the user-selected section until content state changes', () => {
    const content = { ...emptyContent(), todos: true }
    const next = resolveTaskBoardSections({
      current: new Set(['memory']),
      previousContent: content,
      nextContent: content,
      sessionChanged: false,
    })

    expect([...next]).toEqual(['memory'])
  })

  it('restores all sections after the last content is cleared', () => {
    const next = resolveTaskBoardSections({
      current: new Set(['todos']),
      previousContent: { ...emptyContent(), todos: true },
      nextContent: emptyContent(),
      sessionChanged: false,
    })

    expect([...next]).toEqual([...TASK_BOARD_SECTION_KEYS])
  })

  it('toggles sections independently like the existing conversation groups', () => {
    expect([...toggleTaskBoardSection(new Set(['todos']), 'sources')]).toEqual(['todos', 'sources'])
    expect([...toggleTaskBoardSection(new Set(['todos', 'sources']), 'sources')]).toEqual(['todos'])
  })

  it('equalizes empty sections only while all four remain expanded', () => {
    expect(shouldUseEqualHeightTaskBoardLayout(
      emptyContent(),
      new Set(TASK_BOARD_SECTION_KEYS),
    )).toBe(true)
    expect(shouldUseEqualHeightTaskBoardLayout(
      emptyContent(),
      new Set(['todos']),
    )).toBe(false)
    expect(shouldUseEqualHeightTaskBoardLayout(
      { ...emptyContent(), todos: true },
      new Set(['todos']),
    )).toBe(false)
  })
})

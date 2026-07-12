import { describe, expect, test } from 'bun:test'
import * as React from 'react'

import { KanbanProjectFilter } from '../KanbanProjectFilter'
import { KanbanBoardHeader } from '../KanbanBoardHeader'

function containsElementType(node: React.ReactNode, type: React.ElementType): boolean {
  if (!React.isValidElement(node)) return false
  if (node.type === type) return true
  return React.Children.toArray((node.props as { children?: React.ReactNode }).children)
    .some(child => containsElementType(child, type))
}

describe('KanbanBoardHeader', () => {
  test('keeps the All Projects filter visible when the backend returns no projects', () => {
    const header = KanbanBoardHeader({
      allTasksLabel: 'All tasks',
      newTaskLabel: 'New task',
      projects: [],
      selectedProjectIds: [],
      onProjectFilterChange: () => {},
      onCreateTask: () => {},
      createDisabled: false,
    })

    expect(containsElementType(header, KanbanProjectFilter)).toBe(true)
  })
})

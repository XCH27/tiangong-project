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

function findButtonByText(node: React.ReactNode, text: string): React.ReactElement | undefined {
  if (!React.isValidElement(node)) return undefined
  if (node.type === 'button') {
    const content = React.Children.toArray((node.props as { children?: React.ReactNode }).children).join('')
    if (content.includes(text)) return node
  }
  for (const child of React.Children.toArray((node.props as { children?: React.ReactNode }).children)) {
    const match = findButtonByText(child, text)
    if (match) return match
  }
  return undefined
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

  test('shows Add column beside New task only for an editable project', () => {
    let additions = 0
    const header = KanbanBoardHeader({
      allTasksLabel: 'All tasks',
      newTaskLabel: 'New task',
      addColumnLabel: 'Add column',
      projects: [{ id: 'project-1', name: 'Project 1' }],
      selectedProjectIds: ['project-1'],
      onProjectFilterChange: () => {},
      onCreateTask: () => {},
      onAddColumn: () => { additions += 1 },
      createDisabled: false,
    })

    const addColumnButton = findButtonByText(header, 'Add column')
    expect(addColumnButton).toBeDefined()
    ;(addColumnButton!.props as { onClick: () => void }).onClick()
    expect(additions).toBe(1)

    const allProjectsHeader = KanbanBoardHeader({
      allTasksLabel: 'All tasks',
      newTaskLabel: 'New task',
      addColumnLabel: 'Add column',
      projects: [{ id: 'project-1', name: 'Project 1' }],
      selectedProjectIds: [],
      onProjectFilterChange: () => {},
      onCreateTask: () => {},
      createDisabled: false,
    })

    expect(findButtonByText(allProjectsHeader, 'Add column')).toBeUndefined()
  })
})

import { describe, expect, test } from 'bun:test'

import { createBoardSidebarItem } from '../sidebar-navigation'

describe('board sidebar navigation', () => {
  test('creates a standalone primary navigation item', () => {
    const onClick = () => {}
    const item = createBoardSidebarItem({
      title: '看板',
      active: true,
      onClick,
    })

    expect(item.id).toBe('nav:board')
    expect(item.title).toBe('看板')
    expect(item.variant).toBe('default')
    expect(item.onClick).toBe(onClick)
    expect(item.expandable).toBeUndefined()
    expect(item.items).toBeUndefined()
  })

  test('is not highlighted outside the board page', () => {
    const item = createBoardSidebarItem({
      title: 'Board',
      active: false,
      onClick: () => {},
    })

    expect(item.variant).toBe('ghost')
  })
})

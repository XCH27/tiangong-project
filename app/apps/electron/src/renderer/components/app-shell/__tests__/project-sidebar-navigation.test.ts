import { describe, expect, test } from 'bun:test'

import { createProjectSidebarItems } from '../project-sidebar-navigation'

describe('project sidebar navigation', () => {
  test('nests active top-level sessions under their project in recent-first order', () => {
    const opened: string[] = []
    const items = createProjectSidebarItems({
      projects: [{ id: 'project-1', name: 'Fleet' }],
      sessions: [
        { id: 'older', workspaceId: 'ws', projectId: 'project-1', name: 'Older', lastMessageAt: 10 },
        { id: 'newer', workspaceId: 'ws', projectId: 'project-1', name: 'Newer', lastMessageAt: 20 },
        { id: 'archived', workspaceId: 'ws', projectId: 'project-1', name: 'Archived', isArchived: true },
        { id: 'child', workspaceId: 'ws', projectId: 'project-1', name: 'Child', parentSessionId: 'newer' },
      ],
      activeSessionId: 'newer',
      activeProjectIds: new Set(['project-1']),
      isExpanded: () => true,
      onToggle: () => {},
      onSelectProject: id => opened.push(`project:${id}`),
      onSelectSession: id => opened.push(`session:${id}`),
    })

    expect(items).toHaveLength(1)
    expect(items[0]?.title).toBe('Fleet')
    expect(items[0]?.variant).toBe('default')
    expect(items[0]?.expandable).toBe(true)
    expect(items[0]?.items?.map(item => 'type' in item ? item.id : item.title)).toEqual(['Newer', 'Older'])
    const firstSession = items[0]?.items?.[0]
    expect(firstSession && !('type' in firstSession) ? firstSession.variant : undefined).toBe('default')
    if (firstSession && !('type' in firstSession)) firstSession.onClick?.()
    expect(opened).toEqual(['session:newer'])
  })
})

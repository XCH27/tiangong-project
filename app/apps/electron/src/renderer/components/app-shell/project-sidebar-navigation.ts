import { Folder, MessageSquareText } from 'lucide-react'

import type { SessionMeta } from '@/atoms/sessions'
import { getSessionTitle } from '@/utils/session'
import type { LinkItem } from './LeftSidebar'

interface ProjectSummary {
  id: string
  name: string
}

interface CreateProjectSidebarItemsOptions {
  projects: ProjectSummary[]
  sessions: SessionMeta[]
  activeSessionId?: string | null
  activeProjectIds?: ReadonlySet<string>
  isExpanded: (id: string) => boolean
  onToggle: (id: string) => void
  onSelectProject: (id: string) => void
  onSelectSession: (id: string) => void
}

/**
 * Project navigation is a projection of the existing project/session authorities:
 * projects are folders, and their active top-level sessions are recent-first children.
 */
export function createProjectSidebarItems({
  projects,
  sessions,
  activeSessionId,
  activeProjectIds,
  isExpanded,
  onToggle,
  onSelectProject,
  onSelectSession,
}: CreateProjectSidebarItemsOptions): LinkItem[] {
  const sessionsByProject = new Map<string, SessionMeta[]>()
  for (const session of sessions) {
    if (!session.projectId || session.isArchived || session.hidden || session.parentSessionId || session.taskDraft) continue
    const bucket = sessionsByProject.get(session.projectId)
    if (bucket) bucket.push(session)
    else sessionsByProject.set(session.projectId, [session])
  }
  for (const bucket of sessionsByProject.values()) {
    bucket.sort((a, b) => (b.lastMessageAt ?? b.createdAt ?? 0) - (a.lastMessageAt ?? a.createdAt ?? 0))
  }

  return projects.map(project => {
    const expansionId = `nav:project:${project.id}`
    const projectSessions = sessionsByProject.get(project.id) ?? []
    return {
      id: `nav:projects:${project.id}`,
      title: project.name,
      label: projectSessions.length > 0 ? String(projectSessions.length) : undefined,
      icon: Folder,
      variant: activeProjectIds?.has(project.id) ? 'default' : 'ghost',
      onClick: () => onSelectProject(project.id),
      expandable: projectSessions.length > 0,
      expanded: projectSessions.length > 0 && isExpanded(expansionId),
      onToggle: () => onToggle(expansionId),
      items: projectSessions.map(session => ({
        id: `nav:projects:${project.id}:session:${session.id}`,
        title: getSessionTitle(session),
        icon: MessageSquareText,
        compact: true,
        variant: session.id === activeSessionId ? 'default' : 'ghost',
        onClick: () => onSelectSession(session.id),
      })),
    }
  })
}

import { SquareKanban } from 'lucide-react'

import type { LinkItem } from '../LeftSidebar'

interface CreateBoardSidebarItemOptions {
  title: string
  active: boolean
  onClick: () => void
}

/** Build the standalone, primary-level navigation entry for the Kanban page. */
export function createBoardSidebarItem({
  title,
  active,
  onClick,
}: CreateBoardSidebarItemOptions): LinkItem {
  return {
    id: 'nav:board',
    title,
    icon: SquareKanban,
    variant: active ? 'default' : 'ghost',
    onClick,
  }
}

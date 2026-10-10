import { Folder, FolderOpen, Plus, Ellipsis } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuTrigger, StyledDropdownMenuContent, StyledDropdownMenuItem } from '@/components/ui/styled-dropdown'

/** Adapted from ZCode WorkspaceSidebarItem: folder row expands its conversations,
 * sibling actions start a draft or open project tools. Project details are never
 * the primary row action. Craft primitives provide all visual values. */
export function SessionGroupHeader({ label, collapsed, project, onToggle, onStart, onDetails }: {
  label: string
  collapsed: boolean
  project: boolean
  onToggle: () => void
  onStart?: () => void
  onDetails?: () => void
}) {
  const { t } = useTranslation()
  if (!project) return <div className="px-4 pt-3 pb-2 text-xs text-foreground/50">{label}</div>
  return <div className="group/project mx-2 mt-2 flex min-w-0 items-center gap-1">
    <Button variant="ghost" onClick={onToggle} aria-expanded={!collapsed}
      className="min-w-0 flex-1 justify-start gap-2 rounded-[6px] px-2 py-[5px] text-[13px] font-normal text-foreground/60">
      {collapsed ? <Folder className="h-3.5 w-3.5 shrink-0" /> : <FolderOpen className="h-3.5 w-3.5 shrink-0" />}
      <span className="truncate">{label}</span>
    </Button>
    <div className="flex shrink-0 items-center opacity-0 group-hover/project:opacity-100 group-focus-within/project:opacity-100 [@media(hover:none)]:opacity-100">
      {onStart && <Button size="icon" variant="ghost" className="h-6 w-6 rounded-[6px]"
        title={t('session.newSession')} aria-label={t('session.newSession')} onClick={onStart}><Plus className="h-4 w-4" /></Button>}
      {onDetails && <DropdownMenu><DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-[6px]" aria-label={t('common.more')}><Ellipsis className="h-4 w-4" /></Button>
      </DropdownMenuTrigger><StyledDropdownMenuContent align="start">
        <StyledDropdownMenuItem onClick={onDetails}>{t('sidebar.settings')}</StyledDropdownMenuItem>
      </StyledDropdownMenuContent></DropdownMenu>}
    </div>
  </div>
}

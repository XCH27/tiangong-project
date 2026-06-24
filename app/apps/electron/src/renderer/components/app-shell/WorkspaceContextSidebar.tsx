import * as React from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SessionProgressCard } from './SessionProgressCard'
import { FilesListPanel } from '../files/FilesListPanel'
import type { ProgressTask } from '@craft-agent/shared/protocol'

interface WorkspaceContextSidebarProps {
  visible: boolean
  rootPath?: string | null
  progressTasks?: ProgressTask[]
  selectedFilePath?: string | null
  onFileClick: (path: string) => void
  onToggle: () => void
}

export function WorkspaceContextSidebar({
  visible,
  rootPath,
  progressTasks,
  selectedFilePath,
  onFileClick,
  onToggle,
}: WorkspaceContextSidebarProps) {
  const { t } = useTranslation()

  if (!visible) {
    return (
      <Button
        type="button"
        size="icon"
        variant="outline"
        onClick={onToggle}
        className="absolute right-3 top-[74px] z-panel h-9 w-9 rounded-[9px] bg-background/95 shadow-middle"
        aria-label={t('workspaceContext.show')}
        title={t('workspaceContext.show')}
      >
        <PanelRightOpen className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <aside
      className={cn(
        'z-panel mr-3 flex h-full w-[320px] shrink-0 flex-col overflow-hidden',
        'rounded-[10px] border border-border bg-background shadow-middle',
      )}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <h2 className="text-[13px] font-semibold text-foreground">{t('workspaceContext.progress')}</h2>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onToggle}
          className="h-7 w-7 rounded-[7px] text-muted-foreground"
          aria-label={t('workspaceContext.hide')}
          title={t('workspaceContext.hide')}
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="shrink-0 border-b border-border px-4 py-3">
        {progressTasks && progressTasks.length > 0 ? (
          <SessionProgressCard tasks={progressTasks} variant="plain" />
        ) : (
          <div className="py-3 text-center text-[12px] leading-relaxed text-muted-foreground">
            {t('workspaceContext.noProgress')}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1">
        <FilesListPanel
          rootPath={rootPath}
          selectedFilePath={selectedFilePath}
          onFileClick={onFileClick}
          title={rootPath ? undefined : t('workspaceContext.files')}
          hideSearch={false}
        />
      </div>
    </aside>
  )
}

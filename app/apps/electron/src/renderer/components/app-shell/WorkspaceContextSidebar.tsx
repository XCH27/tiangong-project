import * as React from 'react'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
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
        'rounded-[10px] border border-border/60 bg-background shadow-middle',
      )}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 p-3">
          <section className="rounded-[9px] border border-border/60 bg-foreground/[0.02]">
            <div className="flex h-11 items-center justify-between px-3">
              <h2 className="text-[15px] font-semibold text-foreground">{t('workspaceContext.progress')}</h2>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={onToggle}
                className="h-8 w-8 rounded-[8px]"
                aria-label={t('workspaceContext.hide')}
                title={t('workspaceContext.hide')}
              >
                <PanelRightClose className="h-4 w-4" />
              </Button>
            </div>
            <div className="px-3 pb-3">
              {progressTasks && progressTasks.length > 0 ? (
                <SessionProgressCard tasks={progressTasks} />
              ) : (
                <div className="rounded-[8px] bg-muted/40 px-3 py-5 text-center text-[12px] text-muted-foreground">
                  {t('workspaceContext.noProgress')}
                </div>
              )}
            </div>
          </section>

          <section className="h-[min(520px,48vh)] min-h-[280px] overflow-hidden rounded-[9px] border border-border/60 bg-foreground/[0.02]">
            <FilesListPanel
              rootPath={rootPath}
              selectedFilePath={selectedFilePath}
              onFileClick={onFileClick}
              title={rootPath ? undefined : t('workspaceContext.files')}
              hideSearch={false}
            />
          </section>
        </div>
      </ScrollArea>
    </aside>
  )
}

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { FolderOpen, GitBranch, ListTodo } from 'lucide-react'

import { SessionProgressCard } from './SessionProgressCard'
import { WorkbenchModuleFrame } from './WorkbenchModuleFrame'
import { ModuleResizeSash } from './ModuleResizeSash'
import { FilesListPanel } from '../files/FilesListPanel'
import { GitReviewPanel } from '../git/GitReviewPanel'
import { TOOL_DOCK_MODULE_MIN_HEIGHT } from './workbench-layout'
import type { ToolDockModuleId } from './tool-dock-config'
import type { ProgressTask } from '@craft-agent/shared/protocol'

const MODULE_META: Record<ToolDockModuleId, { labelKey: string; icon: React.ComponentType<{ className?: string; strokeWidth?: string | number }> }> = {
  progress: { labelKey: 'toolDock.progress', icon: ListTodo },
  files: { labelKey: 'toolDock.files', icon: FolderOpen },
  review: { labelKey: 'toolDock.review', icon: GitBranch },
}

interface WorkspaceContextSidebarProps {
  visible: boolean
  width: number
  rootPath?: string | null
  progressTasks?: ProgressTask[]
  selectedFilePath?: string | null
  compact?: boolean
  activeModules: ToolDockModuleId[]
  moduleRatios: Record<ToolDockModuleId, number>
  onFileClick: (path: string) => void
  onCloseModule: (moduleId: ToolDockModuleId) => void
  onResizeAdjacentModules?: (upperId: ToolDockModuleId, lowerId: ToolDockModuleId, deltaRatio: number) => void
  onResetModuleRatios?: () => void
}

export function WorkspaceContextSidebar({
  visible,
  width,
  rootPath,
  progressTasks,
  selectedFilePath,
  compact = false,
  activeModules,
  moduleRatios,
  onFileClick,
  onCloseModule,
  onResizeAdjacentModules,
  onResetModuleRatios,
}: WorkspaceContextSidebarProps) {
  const { t } = useTranslation()
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  if (!visible || activeModules.length === 0) {
    return null
  }

  return (
    <aside
      ref={containerRef}
      className="z-panel flex h-full min-w-0 shrink-0 flex-col overflow-hidden"
      style={{ width }}
    >
      {activeModules.map((moduleId, index) => {
        const meta = MODULE_META[moduleId]
        const flexWeight = moduleRatios[moduleId] ?? 1 / activeModules.length
        const canClose = activeModules.length > 1
        const nextModuleId = activeModules[index + 1]

        return (
          <React.Fragment key={moduleId}>
            <WorkbenchModuleFrame
              className="min-h-0"
              style={{
                flex: `${flexWeight} 1 0`,
                minHeight: TOOL_DOCK_MODULE_MIN_HEIGHT,
              }}
              title={t(meta.labelKey)}
              icon={meta.icon}
              onClose={canClose ? () => onCloseModule(moduleId) : undefined}
              closeLabel={t('common.close')}
              ariaLabel={t(meta.labelKey)}
            >
              {moduleId === 'progress' && (
                progressTasks && progressTasks.length > 0 ? (
                  <div className="px-3 py-2">
                    <SessionProgressCard tasks={progressTasks} variant="plain" compact={compact} />
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center text-[12px] leading-relaxed text-muted-foreground">
                    {t('workspaceContext.noProgress')}
                  </div>
                )
              )}
              {moduleId === 'files' && (
                <FilesListPanel
                  rootPath={rootPath}
                  selectedFilePath={selectedFilePath}
                  onFileClick={onFileClick}
                  title={rootPath ? undefined : t('workspaceContext.files')}
                  hideSearch={compact}
                />
              )}
              {moduleId === 'review' && (
                <GitReviewPanel
                  rootPath={rootPath}
                  compact={compact}
                  onOpenFile={onFileClick}
                />
              )}
            </WorkbenchModuleFrame>

            {nextModuleId && onResizeAdjacentModules && (
              <ModuleResizeSash
                onResize={(deltaY) => {
                  const containerHeight = containerRef.current?.clientHeight ?? 1
                  onResizeAdjacentModules(moduleId, nextModuleId, deltaY / containerHeight)
                }}
                onDoubleClick={onResetModuleRatios}
              />
            )}
          </React.Fragment>
        )
      })}
    </aside>
  )
}

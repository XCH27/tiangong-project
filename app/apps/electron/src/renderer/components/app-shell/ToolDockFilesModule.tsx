import * as React from 'react'

import { FilesListPanel } from '../files/FilesListPanel'
import { ToolDockDocumentPreview } from './ToolDockDocumentPreview'

interface ToolDockFilesModuleProps {
  rootPath?: string | null
  selectedFilePath?: string | null
  compact?: boolean
  title?: string
  onFileClick: (path: string) => void
  onOpenFile?: (path: string) => void
  onOpenUrl?: (url: string) => void
}

export function ToolDockFilesModule({
  rootPath,
  selectedFilePath,
  compact = false,
  title,
  onFileClick,
  onOpenFile,
  onOpenUrl,
}: ToolDockFilesModuleProps) {
  const showPreview = Boolean(selectedFilePath)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="min-h-0 shrink basis-0 overflow-hidden"
        style={{ flex: showPreview ? '1 1 42%' : '1 1 100%' }}
      >
        <FilesListPanel
          rootPath={rootPath}
          selectedFilePath={selectedFilePath}
          onFileClick={onFileClick}
          title={title}
          hideSearch={compact}
        />
      </div>
      {showPreview && (
        <div
          className="min-h-0 shrink basis-0 overflow-hidden border-t border-border/40"
          style={{ flex: '1 1 58%' }}
        >
          <ToolDockDocumentPreview
            filePath={selectedFilePath ?? null}
            compact={compact}
            onOpenFile={onOpenFile}
            onOpenUrl={onOpenUrl}
          />
        </div>
      )}
    </div>
  )
}

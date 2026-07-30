import * as React from 'react'
import { CornerDownRight, FilePenLine, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ComposerQueuedItem {
  id: string
  text: string
}

export interface ComposerFileSummary {
  fileCount: number
  additions: number
  deletions: number
}

export interface ComposerContextStackProps {
  fileSummary?: ComposerFileSummary
  queuedItems?: ComposerQueuedItem[]
  onOpenFileChanges?: () => void
  onEditQueued?: (item: ComposerQueuedItem) => void
  onRemoveQueued?: (item: ComposerQueuedItem) => void
  className?: string
}

function compactText(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > 120 ? `${normalized.slice(0, 119).trimEnd()}…` : normalized
}

/**
 * One document-flow stack for transient composer context. Every row owns its
 * height, so file changes and queued follow-ups can coexist without covering
 * the input, its menus, or each other.
 */
export function ComposerContextStack({
  fileSummary,
  queuedItems = [],
  onOpenFileChanges,
  onEditQueued,
  onRemoveQueued,
  className,
}: ComposerContextStackProps) {
  const { t } = useTranslation()
  const hasFileChanges = !!fileSummary && fileSummary.fileCount > 0
  if (!hasFileChanges && queuedItems.length === 0) return null

  return (
    <div className={cn('mb-1 flex flex-col gap-1', className)}>
      {hasFileChanges && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenFileChanges}
            className="h-8 gap-1.5 rounded-full bg-background px-3 text-[13px] shadow-minimal"
          >
            <FilePenLine className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{t('composer.changes.files', { count: fileSummary.fileCount })}</span>
            <span className="text-success">+{fileSummary.additions}</span>
            <span className="text-destructive">-{fileSummary.deletions}</span>
          </Button>
        </div>
      )}

      {queuedItems.map((item) => (
        <div
          key={item.id}
          className="group flex min-h-9 min-w-0 items-center gap-2 rounded-[10px] bg-muted px-3 py-1.5 text-[13px]"
        >
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate font-medium">{compactText(item.text)}</span>
          {onEditQueued && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEditQueued(item)}
              className="h-7 shrink-0 gap-1 px-2 text-muted-foreground"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>{t('common.edit')}</span>
            </Button>
          )}
          {onRemoveQueued && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t('composer.queue.remove')}
              onClick={() => onRemoveQueued(item)}
              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

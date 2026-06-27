import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, FileText, Maximize2 } from 'lucide-react'
import { classifyFile, Markdown, ShikiCodeViewer, Spinner } from '@craft-agent/ui'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/useTheme'
import { getLanguageFromPath } from '@/lib/file-utils'
import { cn } from '@/lib/utils'

interface ToolDockDocumentPreviewProps {
  filePath: string | null
  compact?: boolean
  onOpenFile?: (path: string) => void
  onOpenUrl?: (url: string) => void
}

function basename(path: string): string {
  const normalized = path.replace(/\\/g, '/')
  return normalized.split('/').filter(Boolean).pop() || path
}

export function ToolDockDocumentPreview({
  filePath,
  compact = false,
  onOpenFile,
  onOpenUrl,
}: ToolDockDocumentPreviewProps) {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const [content, setContent] = React.useState('')
  const [dataUrl, setDataUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const classification = React.useMemo(
    () => (filePath ? classifyFile(filePath) : { type: null, canPreview: false }),
    [filePath],
  )

  React.useEffect(() => {
    if (!filePath || !classification.canPreview) {
      setContent('')
      setDataUrl(null)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      setContent('')
      setDataUrl(null)

      try {
        if (classification.type === 'image') {
          const url = await window.electronAPI.readFileDataUrl(filePath)
          if (!cancelled) setDataUrl(url)
          return
        }

        if (classification.type === 'pdf') {
          if (!cancelled) setContent('')
          return
        }

        const text = await window.electronAPI.readFile(filePath)
        if (!cancelled) setContent(text)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('fileViewer.errorLoading'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [classification.canPreview, classification.type, filePath, t])

  if (!filePath) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-6 text-center text-muted-foreground">
        <FileText className="mb-2 size-5 opacity-50" />
        <p className="text-[12px] leading-relaxed">{t('toolDock.selectFileToPreview')}</p>
      </div>
    )
  }

  const fileName = basename(filePath)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-t border-border/40 bg-muted/30 px-2 py-1.5">
        <FileText className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground" title={filePath}>
          {fileName}
        </p>
        {onOpenFile && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            title={t('toolDock.openFullscreen')}
            aria-label={t('toolDock.openFullscreen')}
            onClick={() => onOpenFile(filePath)}
          >
            <Maximize2 className="size-3.5" />
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className={cn('min-h-full', compact ? 'px-3 py-3' : 'px-4 py-4')}>
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <Spinner className="text-base" />
              <span className="text-[12px]">{t('fileViewer.loadingContent')}</span>
            </div>
          ) : error ? (
            <div className="py-6 text-center text-destructive">
              <p className="text-[12px] font-medium">{t('fileViewer.errorLoading')}</p>
              <p className="mt-1 text-[11px] opacity-80">{error}</p>
            </div>
          ) : classification.type === 'markdown' ? (
            <div className="text-sm leading-relaxed">
              <Markdown
                mode="full"
                onUrlClick={onOpenUrl}
                onFileClick={onOpenFile}
                hideFirstMermaidExpand={compact}
              >
                {content}
              </Markdown>
            </div>
          ) : classification.type === 'image' && dataUrl ? (
            <div className="flex justify-center">
              <img
                src={dataUrl}
                alt={fileName}
                className="max-h-[420px] max-w-full rounded-md object-contain"
              />
            </div>
          ) : classification.type === 'pdf' ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <p className="text-[12px] leading-relaxed">{t('toolDock.pdfUseFullscreen')}</p>
              {onOpenFile && (
                <Button type="button" variant="secondary" size="sm" onClick={() => onOpenFile(filePath)}>
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {t('toolDock.openFullscreen')}
                </Button>
              )}
            </div>
          ) : classification.type === 'code' || classification.type === 'json' || classification.type === 'text' ? (
            <ShikiCodeViewer
              code={content}
              filePath={filePath}
              language={getLanguageFromPath(filePath)}
              theme={isDark ? 'dark' : 'light'}
              className="text-[12px]"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <p className="text-[12px] leading-relaxed">{t('toolDock.noInlinePreview')}</p>
              {onOpenFile && (
                <Button type="button" variant="secondary" size="sm" onClick={() => onOpenFile(filePath)}>
                  <ExternalLink className="mr-1.5 size-3.5" />
                  {t('toolDock.openExternal')}
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

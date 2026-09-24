import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, Code2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CodePreviewOverlay, DocumentFormattedMarkdownOverlay } from '@craft-agent/ui'
import { LOCAL_HELP_EVENT, formatLocalHelpMarkdown, localHelpPathFromUrl } from '@/lib/local-help'
import { cn } from '@/lib/utils'

type BundledDocModule = Record<string, string>

// Vite packages the same Markdown files that the runtime copies into the
// active profile's docs/ directory. The renderer never calls the hosted docs
// site, and the Agent and Help overlay use identical source text.
const bundledDocModules = import.meta.glob('../../../../resources/docs/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as BundledDocModule

const bundledDocs = new Map<string, string>(
  Object.entries(bundledDocModules).map(([modulePath, content]) => {
    const marker = '/resources/docs/'
    const index = modulePath.indexOf(marker)
    const path = index >= 0 ? modulePath.slice(index + marker.length) : modulePath
    return [path, content]
  }),
)

const imageModules = import.meta.glob('../../../../resources/docs/craft/images/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as BundledDocModule
const localImages = new Map<string, string>(
  Object.entries(imageModules).map(([modulePath, assetUrl]) => [modulePath.split('/images/').pop() ?? '', assetUrl]),
)

function titleFromMarkdown(path: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading.replace(/[`*_]/g, '')
  const filename = path.split('/').pop()?.replace(/\.md$/, '') ?? 'Documentation'
  return filename.replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}

function resolveDocumentPath(requestedPath: string): string | null {
  const path = requestedPath.replace(/^\/+/, '').replace(/^docs\//, '')
  const candidates = [
    path,
    path.endsWith('.md') ? path.slice(0, -3) : `${path}.md`,
    path.replace(/^craft\/sources\/(?:apis|mcp-servers)\//, 'craft/sources/'),
  ]
  return candidates.find(candidate => bundledDocs.has(candidate)) ?? null
}

export function LocalHelpOverlay() {
  const { t, i18n } = useTranslation()
  const [history, setHistory] = useState<string[]>([])
  const [sourceOpen, setSourceOpen] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)
  const requestedPath = history.at(-1) ?? null

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ path?: string }>).detail
      if (!detail?.path) return
      setHistory([detail.path])
      setSourceOpen(false)
      setShowOriginal(false)
    }
    window.addEventListener(LOCAL_HELP_EVENT, handleOpen)
    return () => window.removeEventListener(LOCAL_HELP_EVENT, handleOpen)
  }, [])

  const resolvedPath = useMemo(
    () => requestedPath ? resolveDocumentPath(requestedPath) : null,
    [requestedPath],
  )
  const locale = i18n.resolvedLanguage ?? i18n.language
  const translatedPath = resolvedPath ? `i18n/${locale}/${resolvedPath}` : null
  const translatedContent = translatedPath ? bundledDocs.get(translatedPath) : undefined
  const displayedPath = translatedContent && !showOriginal ? translatedPath! : resolvedPath
  const rawContent = displayedPath ? bundledDocs.get(displayedPath) ?? '' : ''
  const content = rawContent ? formatLocalHelpMarkdown(rawContent, filename => localImages.get(filename)) : ''
  const title = resolvedPath ? titleFromMarkdown(resolvedPath, rawContent) : t('menu.helpAndDocs')

  const handleClose = () => {
    setHistory([])
    setSourceOpen(false)
    setShowOriginal(false)
  }

  const handleBack = () => {
    setHistory(previous => previous.length > 1
      ? previous.slice(0, -1)
      : previous[0] !== 'craft/index.md' ? ['craft/index.md'] : [])
    setSourceOpen(false)
    setShowOriginal(false)
  }

  const navigateToLocalLink = (url: string): boolean => {
    const localPath = localHelpPathFromUrl(url, resolvedPath ?? undefined)
    if (localPath && resolveDocumentPath(localPath)) {
      setHistory(previous => previous.at(-1) === localPath ? previous : [...previous, localPath])
      setSourceOpen(false)
      setShowOriginal(false)
      return true
    }
    return false
  }

  const handleOpenUrl = (url: string) => {
    if (navigateToLocalLink(url)) return
    window.electronAPI.openUrl(url)
  }

  return (
    <>
      <DocumentFormattedMarkdownOverlay
        isOpen={!!requestedPath && !sourceOpen}
        onClose={handleClose}
        content={content || `# ${t('menu.helpAndDocs')}\n\n${t('common.unavailable')}`}
        title={title}
        accessibleTitle={title}
        typeBadge={{ icon: BookOpen, label: t('menu.helpAndDocs'), variant: 'blue' }}
        headerActions={resolvedPath ? (
          <span className="inline-flex items-center gap-2">
            {resolvedPath !== 'craft/index.md' && <button
              type="button"
              onClick={handleBack}
              aria-label={t('common.back')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[6px] bg-background px-2 py-1.5',
                'text-xs text-muted-foreground shadow-minimal transition-colors hover:text-foreground',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              )}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t('common.back')}</span>
            </button>}
            {translatedContent && <button
              type="button"
              onClick={() => setShowOriginal(value => !value)}
              className="rounded-[6px] bg-background px-2 py-1.5 text-xs text-muted-foreground shadow-minimal transition-colors hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {t(showOriginal ? 'help.translation' : 'help.original')}
            </button>}
            <button
              type="button"
              onClick={() => setSourceOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[6px] bg-background px-2 py-1.5',
                'text-xs text-muted-foreground shadow-minimal transition-colors hover:text-foreground',
                'focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              )}
              title={t('overlay.code')}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>{t('overlay.code')}</span>
            </button>
          </span>
        ) : undefined}
        onOpenUrl={handleOpenUrl}
        onOpenFile={path => { navigateToLocalLink(path) }}
      />
      {resolvedPath && (
        <CodePreviewOverlay
          isOpen={sourceOpen}
          onClose={() => setSourceOpen(false)}
          content={rawContent}
          filePath={displayedPath ?? resolvedPath}
          enableFilePathActions={false}
          language="markdown"
        />
      )}
    </>
  )
}

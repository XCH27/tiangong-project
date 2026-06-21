import * as React from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { MousePointer2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { activeArtifactIdAtom, designClient, workbenchSessionIdAtom } from '@/atoms/design'
import { sessionAtomFamily } from '@/atoms/sessions'
import { USER_ACTOR } from '@craft-agent/shared/protocol'
import {
  installArtifactPreviewBridge,
  registerArtifactPreview,
  unregisterArtifactPreview,
} from '@/lib/artifact-preview-registry'
import {
  DEMO_ARTIFACT_SOURCE,
  extractSessionArtifactSources,
  loadSessionArtifactHtml,
  type SessionArtifactSource,
} from '@/lib/session-artifact-catalog'

function cssPath(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`
  const parts: string[] = []
  let current: Element | null = element
  while (current && current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() !== 'html') {
    let selector = current.tagName.toLowerCase()
    if (current.id) {
      selector += `#${CSS.escape(current.id)}`
      parts.unshift(selector)
      break
    }
    const parentElement: Element | null = current.parentElement
    if (parentElement) {
      const siblings = Array.from(parentElement.children).filter((child: Element) => child.tagName === current!.tagName)
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`
      }
    }
    parts.unshift(selector)
    current = parentElement
  }
  return parts.join(' > ')
}

export interface ArtifactPreviewSurfaceProps {
  artifactId?: string
}

export function ArtifactPreviewSurface({ artifactId: artifactIdProp }: ArtifactPreviewSurfaceProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const workbenchSessionId = useAtomValue(workbenchSessionIdAtom)
  const session = useAtomValue(sessionAtomFamily(workbenchSessionId ?? '__no-session__'))
  const setActiveArtifactId = useSetAtom(activeArtifactIdAtom)
  const [error, setError] = React.useState<string | null>(null)
  const [selecting, setSelecting] = React.useState(false)
  const [previewHtml, setPreviewHtml] = React.useState<string>(DEMO_ARTIFACT_SOURCE.html ?? '')
  const [loadingPreview, setLoadingPreview] = React.useState(false)

  const catalog = React.useMemo(() => {
    const messages = (session?.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      content: typeof message.content === 'string' ? message.content : '',
    }))
    const extracted = extractSessionArtifactSources(messages)
    return extracted.length > 0 ? extracted : [DEMO_ARTIFACT_SOURCE]
  }, [session?.messages])

  const [activeSourceId, setActiveSourceId] = React.useState<string>(artifactIdProp ?? catalog[0]?.artifactId ?? DEMO_ARTIFACT_SOURCE.artifactId)
  const activeSource = catalog.find((source) => source.artifactId === activeSourceId) ?? catalog[0] ?? DEMO_ARTIFACT_SOURCE
  const artifactId = activeSource.artifactId

  React.useEffect(() => {
    if (artifactIdProp) setActiveSourceId(artifactIdProp)
  }, [artifactIdProp])

  React.useEffect(() => {
    if (!catalog.some((source) => source.artifactId === activeSourceId)) {
      setActiveSourceId(catalog[0]?.artifactId ?? DEMO_ARTIFACT_SOURCE.artifactId)
    }
  }, [activeSourceId, catalog])

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoadingPreview(true)
      setError(null)
      try {
        const html = await loadSessionArtifactHtml(activeSource)
        if (!cancelled) setPreviewHtml(html)
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : String(cause))
          if (activeSource.html) setPreviewHtml(activeSource.html)
        }
      } finally {
        if (!cancelled) setLoadingPreview(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [activeSource])

  React.useEffect(() => {
    installArtifactPreviewBridge()
  }, [])

  React.useEffect(() => {
    setActiveArtifactId(artifactId)
    return () => setActiveArtifactId(null)
  }, [artifactId, setActiveArtifactId])

  React.useEffect(() => {
    const iframe = iframeRef.current
    const sessionId = workbenchSessionId
    if (!iframe || !sessionId || !previewHtml) return

    const register = () => registerArtifactPreview(sessionId, artifactId, iframe)
    if (iframe.contentDocument?.readyState === 'complete') register()
    iframe.addEventListener('load', register)
    return () => {
      iframe.removeEventListener('load', register)
      unregisterArtifactPreview(sessionId, artifactId)
    }
  }, [artifactId, previewHtml, workbenchSessionId])

  React.useEffect(() => {
    const sessionId = workbenchSessionId
    const bridge = window.electronAPI?.artifactPreview
    if (!sessionId || !bridge) return

    void bridge.bindSession(sessionId).catch((cause) => {
      setError(cause instanceof Error ? cause.message : String(cause))
    })

    return () => {
      void bridge.unbindSession(sessionId)
    }
  }, [workbenchSessionId])

  const selectElement = React.useCallback(async () => {
    const iframe = iframeRef.current
    const sessionId = workbenchSessionId
    if (!iframe || !sessionId || selecting) return

    const doc = iframe.contentDocument
    const view = iframe.contentWindow
    if (!doc || !view) {
      setError('Artifact preview iframe is not ready')
      return
    }

    setSelecting(true)
    setError(null)

    try {
      const picked = await new Promise<Element | null>((resolve) => {
        const cleanup = (element: Element | null) => {
          doc.removeEventListener('click', onClick, true)
          view.clearTimeout(timeoutId)
          resolve(element)
        }

        const onClick = (event: MouseEvent) => {
          event.preventDefault()
          event.stopPropagation()
          cleanup(event.target instanceof Element ? event.target : null)
        }

        const timeoutId = view.setTimeout(() => cleanup(null), 30_000)
        doc.addEventListener('click', onClick, true)
      })

      if (!picked) return

      const selector = cssPath(picked)
      const computedStyle: Record<string, string> = {}
      const style = view.getComputedStyle(picked)
      for (const key of ['color', 'width', 'height', 'borderRadius', 'opacity'] as const) {
        computedStyle[key] = style[key]
      }

      await designClient.setSelection({
        sessionId,
        selection: {
          selectionId: `artifact-sel-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
          sessionId,
          createdBy: USER_ACTOR,
          createdAt: Date.now(),
          label: `${picked.tagName.toLowerCase()} · ${selector}`,
          objects: [{
            type: 'design_node',
            surface: 'artifact',
            locator: {
              artifactId,
              selector,
              computedStyle,
              textContent: picked.textContent ?? '',
              source: activeSource.src ? 'session-html-preview' : 'demo-preview',
              src: activeSource.src,
              messageId: activeSource.messageId,
            },
            preview: { text: picked.textContent ?? picked.tagName.toLowerCase() },
          }],
        },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSelecting(false)
    }
  }, [activeSource.messageId, activeSource.src, artifactId, selecting, workbenchSessionId])

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="h-9 shrink-0 px-2 border-b border-border/60 flex items-center gap-2">
        <select
          value={activeSource.artifactId}
          onChange={(event) => setActiveSourceId(event.target.value)}
          className="h-7 min-w-0 max-w-[220px] rounded-[6px] border border-border bg-background px-2 text-xs"
          aria-label="当前 Artifact"
        >
          {catalog.map((source: SessionArtifactSource) => (
            <option key={source.artifactId} value={source.artifactId}>
              {source.title}
            </option>
          ))}
        </select>
        <span className="text-[11px] text-muted-foreground truncate max-w-[180px]">{artifactId}</span>
        <Button
          variant={selecting ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={selectElement}
          disabled={!workbenchSessionId || selecting || loadingPreview}
          title={workbenchSessionId ? '点击 iframe 内元素创建 artifact 选区' : '请从一个会话进入工作台'}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          {selecting ? '点击预览元素' : '选择元素'}
        </Button>
      </div>

      <div className="relative flex-1 min-h-0 bg-background">
        <iframe
          ref={iframeRef}
          title="Artifact preview"
          className="h-full w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
          srcDoc={previewHtml}
        />
        {error && (
          <div className="absolute left-3 right-3 bottom-3 z-10 rounded-[7px] border border-destructive/30 bg-background px-3 py-2 text-xs text-destructive">
            Artifact preview：{error}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArtifactPreviewSurface

import * as React from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { ExternalLink, MousePointer2, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  activeBrowserInstanceIdAtom,
  browserInstancesAtom,
  filterInstancesForWorkspace,
} from '@/atoms/browser-pane'
import { useAppShellContext } from '@/context/AppShellContext'
import { designClient, workbenchSessionIdAtom } from '@/atoms/design'
import { USER_ACTOR } from '@craft-agent/shared/protocol'

function boundsFor(element: HTMLElement) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  }
}

export function BrowserStageSurface() {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const lastBoundsRef = React.useRef('')
  const [error, setError] = React.useState<string | null>(null)
  const [creating, setCreating] = React.useState(false)
  const [selecting, setSelecting] = React.useState(false)
  const workbenchSessionId = useAtomValue(workbenchSessionIdAtom)
  const [activeId, setActiveId] = useAtom(activeBrowserInstanceIdAtom)
  const allInstances = useAtomValue(browserInstancesAtom)
  const { activeWorkspaceId, workspaces } = useAppShellContext()
  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId)
  const remoteWorkspaceId = activeWorkspace?.remoteServer?.remoteWorkspaceId ?? null
  const instances = React.useMemo(
    () => filterInstancesForWorkspace(allInstances, activeWorkspaceId, remoteWorkspaceId),
    [activeWorkspaceId, allInstances, remoteWorkspaceId],
  )
  const activeInstance = instances.find((instance) => instance.id === activeId) ?? instances[0] ?? null
  const activeInstanceId = activeInstance?.id ?? null

  React.useEffect(() => {
    if (activeInstanceId && activeInstanceId !== activeId) setActiveId(activeInstanceId)
  }, [activeId, activeInstanceId, setActiveId])

  React.useEffect(() => {
    const element = hostRef.current
    const browserPane = window.electronAPI?.browserPane
    if (!element || !activeInstanceId || !browserPane) return

    let disposed = false
    let frame = 0
    const syncBounds = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (disposed || !hostRef.current) return
        const bounds = boundsFor(hostRef.current)
        if (bounds.width < 320 || bounds.height < 240) return
        const key = [bounds.x, bounds.y, bounds.width, bounds.height].map(Math.round).join(':')
        if (lastBoundsRef.current === key) return
        lastBoundsRef.current = key
        void browserPane.dock(activeInstanceId, bounds).catch((cause) => {
          if (!disposed) setError(cause instanceof Error ? cause.message : String(cause))
        })
      })
    }

    setError(null)
    syncBounds()
    const observer = new ResizeObserver(syncBounds)
    observer.observe(element)
    window.addEventListener('resize', syncBounds)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', syncBounds)
      lastBoundsRef.current = ''
      void browserPane.undock(activeInstanceId)
    }
  }, [activeInstanceId])

  const createBrowser = React.useCallback(async () => {
    const browserPane = window.electronAPI?.browserPane
    if (!browserPane || creating) return
    setCreating(true)
    setError(null)
    try {
      const id = await browserPane.create({ show: false })
      setActiveId(id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setCreating(false)
    }
  }, [creating, setActiveId])

  const selectElement = React.useCallback(async () => {
    const browserPane = window.electronAPI?.browserPane
    if (!browserPane || !activeInstanceId || !workbenchSessionId || selecting) return
    setSelecting(true)
    setError(null)
    try {
      const element = await browserPane.pickElement(activeInstanceId)
      if (!element) return
      await designClient.setSelection({
        sessionId: workbenchSessionId,
        selection: {
          selectionId: `browser-sel-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
          sessionId: workbenchSessionId,
          createdBy: USER_ACTOR,
          createdAt: Date.now(),
          label: `${element.tagName} · ${element.selector}`,
          objects: [{
            type: 'web_element',
            surface: 'browser',
            locator: {
              browserPaneId: activeInstanceId,
              browserInstanceId: activeInstanceId,
              selector: element.selector,
              rect: element.rect,
              styles: element.styles,
            },
            preview: { text: element.text || element.tagName },
          }],
        },
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setSelecting(false)
    }
  }, [activeInstanceId, selecting, workbenchSessionId])

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="h-9 shrink-0 px-2 border-b border-border/60 flex items-center gap-2">
        <select
          value={activeInstance?.id ?? ''}
          onChange={(event) => setActiveId(event.target.value)}
          className="h-7 min-w-0 max-w-[280px] rounded-[6px] border border-border bg-background px-2 text-xs"
          aria-label="当前浏览器"
        >
          {instances.length === 0 && <option value="">没有浏览器</option>}
          {instances.map((instance) => (
            <option key={instance.id} value={instance.id}>
              {instance.title || instance.url || instance.id}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={createBrowser} disabled={creating}>
          {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          新建
        </Button>
        <Button
          variant={selecting ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
          onClick={selectElement}
          disabled={!activeInstance || !workbenchSessionId || selecting}
          title={workbenchSessionId ? '点击后在网页中选择一个元素' : '请从一个会话进入工作台'}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
          {selecting ? '点击网页元素' : '选择元素'}
        </Button>
        {activeInstance && (
          <div className="ml-auto min-w-0 flex items-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[360px]">{activeInstance.url}</span>
          </div>
        )}
      </div>

      <div ref={hostRef} className="relative flex-1 min-h-0 bg-background">
        {!activeInstance && (
          <div className="absolute inset-0 grid place-items-center p-6">
            <div className="text-center">
              <div className="text-sm font-medium">在 Stage 中打开浏览器</div>
              <p className="mt-1 text-xs text-muted-foreground">复用 Craft BrowserPane、登录态、CDP 和 Agent 工具链。</p>
              <Button size="sm" className="mt-4 h-8 gap-1.5" onClick={createBrowser} disabled={creating}>
                <Plus className="h-3.5 w-3.5" />
                新建浏览器
              </Button>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute left-3 right-3 bottom-3 z-10 rounded-[7px] border border-destructive/30 bg-background px-3 py-2 text-xs text-destructive">
            浏览器停靠失败：{error}
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowserStageSurface

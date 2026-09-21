import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, X, Plus } from 'lucide-react'
import { useAtomValue } from 'jotai'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { HeaderIconButton } from '@/components/ui/HeaderIconButton'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SessionFilesSection } from './SessionFilesSection'
import { BrowserTabStrip } from '@/components/browser/BrowserTabStrip'
import { browserInstancesAtom, filterInstancesForWorkspace } from '@/atoms/browser-pane'
import { useActiveWorkspace } from '@/context/AppShellContext'
import { useNavigation, useNavigationState } from '@/contexts/NavigationContext'
import { cn } from '@/lib/utils'
import type { RightSidebarPanel } from '../../../shared/types'
import { getRightSidebarTool, listRightSidebarTools } from './registry'

/** Cindy's host/body split, composed with Craft's actual header, file tree and browser API. */
export function RightSidebar({ sessionId, width }: { sessionId?: string; width: number }) {
  const { t } = useTranslation()
  const { updateRightSidebar } = useNavigation()
  const active = useNavigationState().rightSidebar?.type
  const tools = listRightSidebarTools()
  if (!active || active === 'none') return null
  const activeTool = getRightSidebarTool(active)
  return <aside style={{ width }} className="flex h-full min-w-0 shrink-0 overflow-hidden rounded-lg bg-background shadow-minimal" data-right-tools>
    {/* Cindy/OpenChamber use a narrow, reorderable tool rail beside one
        context panel. Fleet keeps the rail deliberately small and static for
        now; each tool still resolves through the one RightSidebar route state. */}
    <div className="order-2 flex w-11 shrink-0 flex-col items-center gap-1 border-l border-foreground/10 py-2" aria-label={t('settings.tools.title')}>
      {tools.map(({id, label: labelKey, iconComponent: Icon}) => {
        const label = t(labelKey)
        return (
        <button
          key={id}
          type="button"
          aria-label={label}
          aria-pressed={active === id}
          title={label}
          onClick={() => updateRightSidebar({ type: id } as RightSidebarPanel)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[6px] text-foreground/50 transition-colors',
            'hover:bg-foreground/[0.03] hover:text-foreground',
            active === id && 'bg-foreground/[0.07] text-foreground',
          )}
        >
          {Icon ? <Icon className="h-4 w-4" /> : null}
        </button>
        )
      })}
    </div>
    <div className="flex min-w-0 flex-1 flex-col">
      <PanelHeader title={activeTool ? t(activeTool.label) : t('chat.sessionInfo')} actions={
        <HeaderIconButton icon={<X className="h-4 w-4" />} aria-label={t('common.close')} tooltip={t('common.close')} onClick={() => updateRightSidebar(undefined)} />
      } />
      {/* Keep tool bodies mounted while switching tabs, as in Cindy's
          RightSidebarShell. This preserves browser/file-tree/notes state and
          prevents an unsaved note from disappearing when another tool is chosen. */}
      <div className="flex min-h-0 flex-1 flex-col" hidden={active !== 'files'} aria-hidden={active !== 'files'}>
        {sessionId ? <SessionFilesSection key={sessionId} sessionId={sessionId} hideHeader /> : <EmptyToolState message={t('chat.sessionFilesEmpty')} />}
      </div>
      <div className="flex min-h-0 flex-1 flex-col" hidden={active !== 'notes'} aria-hidden={active !== 'notes'}>
        {sessionId ? <SessionNotes key={sessionId} sessionId={sessionId} /> : <EmptyToolState message={t('chat.sessionFilesEmpty')} />}
      </div>
      <div className="flex min-h-0 flex-1 flex-col" hidden={active !== 'browser'} aria-hidden={active !== 'browser'}>
        <BrowserTools sessionId={sessionId} />
      </div>
      <div className="flex min-h-0 flex-1 flex-col" hidden={active !== 'history'} aria-hidden={active !== 'history'}>
        <EmptyToolState message={t('chat.sessionInfo')} />
      </div>
    </div>
  </aside>
}

function EmptyToolState({ message }: { message: string }) {
  return <div className="flex min-h-0 flex-1 items-start px-4 py-3 text-sm text-foreground/50">{message}</div>
}

function SessionNotes({sessionId}: {sessionId?: string}) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [loadedText, setLoadedText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    window.electronAPI.getSessionNotes(sessionId).then(notes => {
      if (!cancelled) { setText(notes); setLoadedText(notes) }
    }).catch(err => { if (!cancelled) setError(String(err)) }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [sessionId])
  if (!sessionId) return null
  return <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <Textarea className="min-h-0 flex-1 resize-none" aria-label={t('settings.preferences.notes')} value={text} disabled={loading || saving} onChange={e => setText(e.target.value)} />
    <Button size="sm" disabled={loading || saving || text === loadedText} onClick={() => {
      setSaving(true); setError(null)
      window.electronAPI.setSessionNotes(sessionId, text).then(() => setLoadedText(text)).catch(err => setError(String(err))).finally(() => setSaving(false))
    }}>{saving ? t('common.saving') : t('common.save')}</Button>
  </div>
}

function BrowserTools({sessionId}: {sessionId?: string}) {
  const { t } = useTranslation()
  const workspace = useActiveWorkspace()
  const all = useAtomValue(browserInstancesAtom)
  const instances = filterInstancesForWorkspace(all, workspace?.id ?? null, workspace?.remoteServer?.remoteWorkspaceId ?? null)
  const [error, setError] = useState<string | null>(null)
  const run = async (fn: () => Promise<unknown>) => { try { setError(null); await fn() } catch(err) { setError(String(err)) } }
  return <div className="flex min-h-0 flex-1 flex-col gap-2 p-3">
    <div className="flex min-w-0 items-center gap-1"><BrowserTabStrip activeSessionId={sessionId} />
      <HeaderIconButton icon={<Plus className="h-4 w-4" />} aria-label={t('browser.newWindow')} tooltip={t('browser.newWindow')} onClick={() => void run(() => window.electronAPI.browserPane.create({show:true}))} />
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    <ScrollArea className="min-h-0 flex-1">
      {instances.map(instance => <div key={instance.id} className="flex items-center gap-1">
        <Button variant="ghost" className="min-w-0 flex-1 justify-start" onClick={() => void run(() => window.electronAPI.browserPane.focus(instance.id))}>
          <Globe className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{instance.title || instance.url || 'about:blank'}</span>
        </Button>
        <HeaderIconButton icon={<X className="h-4 w-4" />} aria-label={t('common.close')} onClick={() => void run(() => window.electronAPI.browserPane.destroy(instance.id))} />
      </div>)}
    </ScrollArea>
  </div>
}

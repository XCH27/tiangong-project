import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, Check, Plus } from 'lucide-react'
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import type { Assistant, WearAsk } from '@craft-agent/shared/assistants'

interface CompactAssistantSelectorProps {
  sessionId?: string
}

export function CompactAssistantSelector({ sessionId }: CompactAssistantSelectorProps) {
  const { t } = useTranslation()
  const appShell = useOptionalAppShellContext()
  const workspaceId = appShell?.activeWorkspaceId ?? null
  const [open, setOpen] = React.useState(false)
  const [assistants, setAssistants] = React.useState<Assistant[]>([])
  const [wornId, setWornId] = React.useState<string | null>(null)
  const [draftName, setDraftName] = React.useState('')
  const [creating, setCreating] = React.useState(false)

  const refresh = React.useCallback(async () => {
    if (!workspaceId || !window.electronAPI.listAssistants) return
    const list = await window.electronAPI.listAssistants(workspaceId)
    setAssistants(list)
    if (sessionId && window.electronAPI.assistantWornBy) {
      setWornId(await window.electronAPI.assistantWornBy(workspaceId, sessionId))
    }
  }, [workspaceId, sessionId])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  React.useEffect(() => {
    if (!workspaceId || !window.electronAPI.onAssistantsChanged) return
    return window.electronAPI.onAssistantsChanged((changed) => {
      if (changed === workspaceId) void refresh()
    })
  }, [workspaceId, refresh])

  const worn = assistants.find((a) => a.id === wornId)

  const wear = async (assistantId: string, asked: WearAsk) => {
    if (!workspaceId || !sessionId) return
    const result = await window.electronAPI.wearAssistant(workspaceId, sessionId, assistantId, asked)
    if (result.decision.wearer === 'session' && result.decision.applied) {
      setWornId(assistantId)
    }
    setOpen(false)
  }

  const create = async () => {
    if (!workspaceId || !draftName.trim()) return
    setCreating(true)
    try {
      const created = await window.electronAPI.createAssistant(workspaceId, { name: draftName.trim() })
      setDraftName('')
      await refresh()
      if (sessionId) await wear(created.id, 'apply')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-7 max-w-[140px] items-center gap-1 rounded-md px-1.5 text-xs',
            worn ? 'bg-foreground/5 text-foreground' : 'text-foreground/50 hover:text-foreground/80',
          )}
        >
          <Bot className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{worn ? worn.name : t('assistant.none')}</span>
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{t('assistant.title')}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 px-3 pb-3">
          {assistants.map((assistant) => (
            <div key={assistant.id} className="flex items-center gap-1">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-foreground/5"
                onClick={() => void wear(assistant.id, 'apply')}
              >
                {wornId === assistant.id ? <Check className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5" />}
                <span className="truncate">{assistant.name}</span>
              </button>
              {wornId && wornId !== assistant.id && sessionId && (
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] text-foreground/60 hover:bg-foreground/5"
                  onClick={() => void wear(assistant.id, 'specialist')}
                >
                  {t('assistant.specialist')}
                </button>
              )}
            </div>
          ))}
          <div className="mt-2 flex items-center gap-1">
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder={t('assistant.namePlaceholder')}
              className="h-8 min-w-0 flex-1 rounded-md bg-foreground/5 px-2 text-sm outline-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void create()
                }
              }}
            />
            <button
              type="button"
              disabled={creating || !draftName.trim()}
              className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs disabled:opacity-40"
              onClick={() => void create()}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('assistant.create')}
            </button>
          </div>
        </div>
        <DrawerClose className="sr-only" />
      </DrawerContent>
    </Drawer>
  )
}

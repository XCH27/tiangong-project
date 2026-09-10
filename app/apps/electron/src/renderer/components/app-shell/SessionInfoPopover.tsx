import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { useAppShellContext, useSession } from '@/context/AppShellContext'
import { cn } from '@/lib/utils'
import { SessionFilesSection } from '../right-sidebar/SessionFilesSection'
import { SettingsMenuSelectRow } from '@/components/settings'
import {
  EXECUTION_PERMISSION_MODES,
  type ExecutionPermissionMode,
} from '@craft-agent/shared/agent/work-mode'
import { defaultSessionOptions } from '@/hooks/useSessionOptions'
import { currentContextTokens } from './input/context-usage'

interface SessionInfoPopoverProps {
  sessionId: string
  sessionFolderPath?: string
  trigger: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  contentClassName?: string
  presentation?: 'popover' | 'drawer'
}

const DEFAULT_POPOVER_CONTENT_CLASS = 'w-[360px] h-[460px] min-w-[200px] max-w-[420px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small p-0'
const DEFAULT_DRAWER_CONTENT_CLASS = [
  'data-[vaul-drawer-direction=bottom]:inset-x-2',
  'data-[vaul-drawer-direction=bottom]:bottom-2',
  'data-[vaul-drawer-direction=bottom]:mt-0',
  'data-[vaul-drawer-direction=bottom]:max-h-[min(82vh,42rem)]',
  'overflow-hidden rounded-[14px] border border-border/60 bg-background shadow-modal-small',
].join(' ')

export function SessionInfoPopover({
  sessionId,
  sessionFolderPath,
  trigger,
  side = 'top',
  align = 'end',
  sideOffset = 6,
  contentClassName,
  presentation = 'popover',
}: SessionInfoPopoverProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('craft:focus-input', {
          detail: { sessionId },
        }))
      })
    }
  }, [sessionId])

  if (presentation === 'drawer') {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange} direction="bottom">
        <DrawerTrigger asChild>
          {trigger}
        </DrawerTrigger>
        <DrawerContent
          className={cn(DEFAULT_DRAWER_CONTENT_CLASS, contentClassName)}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
        >
          <DrawerHeader className="border-b border-border/50 px-4 py-3 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <DrawerTitle className="text-sm font-medium">{t('chat.sessionInfo')}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <SessionInfoPopoverContent sessionId={sessionId} sessionFolderPath={sessionFolderPath} />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent
        className={contentClassName ?? DEFAULT_POPOVER_CONTENT_CLASS}
        side={side}
        align={align}
        sideOffset={sideOffset}
        onOpenAutoFocus={(e) => {
          e.preventDefault()
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault()
        }}
      >
        <SessionInfoPopoverContent sessionId={sessionId} sessionFolderPath={sessionFolderPath} />
      </PopoverContent>
    </Popover>
  )
}

function SessionInfoPopoverContent({ sessionId, sessionFolderPath }: { sessionId: string; sessionFolderPath?: string }) {
  const { t } = useTranslation()
  const session = useSession(sessionId)
  const {
    onRenameSession,
    onSessionOptionsChange,
    sessionOptions,
  } = useAppShellContext()
  const executionPermissionMode =
    sessionOptions.get(sessionId)?.executionPermissionMode
      ?? defaultSessionOptions.executionPermissionMode
  const tokenUsage = session?.tokenUsage
  const currentContext = currentContextTokens(tokenUsage)
  const contextPercent = tokenUsage?.contextWindow && tokenUsage.contextWindow > 0 && currentContext != null
    ? Math.min(100, (currentContext / tokenUsage.contextWindow) * 100)
    : null
  const [name, setName] = React.useState('')
  const renameTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    setName(session?.name || '')
  }, [session?.name])

  React.useEffect(() => {
    return () => {
      if (renameTimeoutRef.current) {
        clearTimeout(renameTimeoutRef.current)
      }
    }
  }, [])

  const handleNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setName(newName)

    if (renameTimeoutRef.current) {
      clearTimeout(renameTimeoutRef.current)
    }

    renameTimeoutRef.current = setTimeout(() => {
      const trimmed = newName.trim()
      if (trimmed) {
        onRenameSession(sessionId, trimmed)
      }
    }, 500)
  }, [onRenameSession, sessionId])

  const handleExecutionPermissionModeChange = React.useCallback((value: string) => {
    if (!EXECUTION_PERMISSION_MODES.includes(value as ExecutionPermissionMode)) return
    onSessionOptionsChange(sessionId, {
      executionPermissionMode: value as ExecutionPermissionMode,
    })
  }, [onSessionOptionsChange, sessionId])

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 p-3 border-b border-border/50">
        <label className="text-xs font-medium text-muted-foreground block mb-1.5 select-none">
          {t("chat.title")}
        </label>
        <div className="rounded-lg bg-foreground-2 has-[:focus]:bg-background shadow-minimal transition-colors">
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder={t("chat.titlePlaceholder")}
            className="h-9 py-2 text-sm border-0 shadow-none bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>
      <div className="shrink-0 border-b border-border/50">
        <SettingsMenuSelectRow
          inCard={false}
          className="px-3"
          label={t('mode.executionApproval')}
          value={executionPermissionMode}
          onValueChange={handleExecutionPermissionModeChange}
          options={EXECUTION_PERMISSION_MODES.map((mode) => ({
            value: mode,
            label: t(`mode.execution.${mode}.title`),
            description: t(`mode.execution.${mode}.description`),
          }))}
        />
      </div>
      {tokenUsage && (
        <div className="shrink-0 border-b border-border/50 px-3 py-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{t('chat.context')}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <div className="text-muted-foreground">{t('chat.contextCurrent')}</div>
              <div className="font-medium">{formatInfoTokens(currentContext ?? 0)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('chat.contextWindow')}</div>
              <div className="font-medium">
                {tokenUsage.contextWindow ? formatInfoTokens(tokenUsage.contextWindow) : t('common.unknown')}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('chat.contextOutput')}</div>
              <div className="font-medium">{formatInfoTokens(tokenUsage.outputTokens)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">{t('chat.contextCost')}</div>
              <div className="font-medium">${tokenUsage.costUsd.toFixed(4)}</div>
            </div>
          </div>
          {contextPercent !== null && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${contextPercent}%` }} />
            </div>
          )}
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden">
        <SessionFilesSection
          sessionId={sessionId}
          sessionFolderPath={sessionFolderPath}
          hideHeader={false}
          className="h-full min-h-0"
        />
      </div>
    </div>
  )
}

function formatInfoTokens(value: number): string {
  if (value < 1000) return String(value)
  if (value < 1_000_000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}K`
  return `${(value / 1_000_000).toFixed(1)}M`
}

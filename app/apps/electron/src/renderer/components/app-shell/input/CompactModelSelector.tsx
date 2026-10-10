import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Check, ChevronDown, LayoutGrid } from 'lucide-react'
import { ModelCapabilityBadges } from '@/components/apisetup/ModelCapabilityBadges'
import { Spinner } from '@craft-agent/ui'
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import * as storage from '@/lib/local-storage'
import { navigate, routes } from '@/lib/navigate'
import { getConnectionDisplayName } from '@/lib/connection-labels'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { getModelDisplayName, getModelContextWindow } from '@config/models'
import { resolveEffectiveConnectionSlug } from '@config/llm-connections'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'
import { getModelPickerGroups, stripPiPrefixForDisplay } from './model-picker-helpers'
import { getContextDisplay, getContextDisplayLabels, type ContextStatus } from './context-display'

interface CompactModelSelectorProps {
  currentModel: string
  currentConnection?: string
  onModelChange: (model: string, connection?: string) => void
  isEmptySession?: boolean
  connectionUnavailable?: boolean
  contextStatus?: ContextStatus
  /** Both presentations share Cindy's source rail and source/model row identity. */
  presentation?: 'drawer' | 'popover'
}

export function CompactModelSelector({
  currentModel, currentConnection, onModelChange, isEmptySession = false,
  connectionUnavailable = false, contextStatus, presentation = 'drawer',
}: CompactModelSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [source, setSource] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState('')
  const ctx = useOptionalAppShellContext()
  const connections = ctx?.llmConnections ?? []
  const effectiveConnection = resolveEffectiveConnectionSlug(currentConnection, ctx?.workspaceDefaultLlmConnection, connections)
  const active = connections.find(connection => connection.slug === effectiveConnection)
  const selected = active?.models?.find(model => (typeof model === 'string' ? model : model.id) === currentModel)
  const modelUnavailable = active?.models !== undefined && !selected
  const definition = typeof selected === 'string' ? undefined : selected
  const displayName = definition?.name ?? stripPiPrefixForDisplay(getModelDisplayName(currentModel))
  const triggerLabel = active && connections.length > 1 ? `${getConnectionDisplayName(active, connections)} / ${displayName}` : displayName
  const groups = getModelPickerGroups(connections, effectiveConnection, isEmptySession)
  // Searching spans every eligible source, as in Cindy's unified list.
  const visibleGroups = groups.filter(group => query.trim() || !source || group.connection.slug === source)
  const contextDisplay = getContextDisplay(contextStatus, definition?.contextWindow ?? getModelContextWindow(currentModel))
  const contextLabels = getContextDisplayLabels(contextDisplay, t)
  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) { setSource(null); setQuery('') }
  }
  const openSettings = () => { setOpen(false); navigate(routes.view.settings('ai')) }
  const trigger = (
    <button type="button" aria-label={`${t('common.model')}: ${connectionUnavailable ? t('common.unavailable') : triggerLabel}`}
      title={active ? getConnectionDisplayName(active, connections) : undefined}
      className={cn('input-toolbar-btn inline-flex h-7 min-w-0 items-center gap-1.5 rounded-[6px] px-1.5 text-[13px] select-none hover:bg-foreground/5',
        presentation === 'drawer' && 'bg-foreground/5 text-foreground/70', (connectionUnavailable || modelUnavailable) && 'text-destructive')}>
      {connectionUnavailable ? <><AlertCircle className="h-3.5 w-3.5" />{t('common.unavailable')}</> : <>
        {modelUnavailable && <AlertCircle className="h-3.5 w-3.5" />}
        {active && connections.length > 1 && storage.get(storage.KEYS.showConnectionIcons, true) && <ConnectionIcon connection={active} size={14} />}
        <span className="max-w-56 truncate">{triggerLabel}</span>
      </>}
      <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
    </button>
  )
  const content = <>
    {connectionUnavailable ? <div className="px-4 py-6 text-center text-sm">
      <p>{t('chat.connectionUnavailable')}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t('chat.connectionUnavailableDescription')}</p>
    </div> : <Command>
      {modelUnavailable && <p className="px-3 py-2 text-xs text-destructive">{t('chat.modelUnavailableForConnection')}</p>}
      <CommandInput placeholder={t('apiSetup.searchModels')} value={query} onValueChange={setQuery} />
      <div className="flex max-h-[300px] min-h-0">
        {groups.length > 1 && <div className="flex w-32 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border/60 p-1.5" aria-label={t('settings.ai.connections')}>
          <button type="button" title={t('settings.ai.modelFilter.all')} aria-label={t('settings.ai.modelFilter.all')} aria-pressed={!source}
            onClick={() => { setSource(null); setQuery('') }} className={cn('flex h-8 shrink-0 items-center gap-2 px-2 rounded-md hover:bg-foreground/5', !source && 'bg-foreground/10')}>
            <LayoutGrid className="h-4 w-4 shrink-0" /><span className="truncate text-xs">{t('settings.ai.modelFilter.all')}</span>
          </button>
          {groups.map(({ connection }) => <button key={connection.slug} type="button"
            title={getConnectionDisplayName(connection, connections)} aria-label={getConnectionDisplayName(connection, connections)} aria-pressed={source === connection.slug}
            onClick={() => { setSource(connection.slug); setQuery('') }} className={cn('flex h-8 shrink-0 items-center gap-2 px-2 rounded-md hover:bg-foreground/5', source === connection.slug && 'bg-foreground/10')}>
            <ConnectionIcon connection={connection} size={16} /><span className="truncate text-xs">{getConnectionDisplayName(connection, connections)}</span>
          </button>)}
        </div>}
        <CommandList className="min-h-0 flex-1">
          <CommandEmpty>{t('settings.ai.noModels')}</CommandEmpty>
          {visibleGroups.map(({ connection, models }) => <CommandGroup key={connection.slug} heading={getConnectionDisplayName(connection, connections)}>
            {!connection.isAuthenticated && <p className="px-2 py-1 text-xs text-muted-foreground">{t('settings.ai.notAuthenticated')}</p>}
            {models.map(model => {
              const id = typeof model === 'string' ? model : model.id
              const name = typeof model === 'string' ? stripPiPrefixForDisplay(model) : model.name ?? stripPiPrefixForDisplay(id)
              const isSelected = effectiveConnection === connection.slug && currentModel === id
              return <CommandItem key={id} value={`${connection.slug}/${id}`} keywords={[name, getConnectionDisplayName(connection, connections)]}
                disabled={!connection.isAuthenticated} onSelect={() => { onModelChange(id, connection.slug); setOpen(false) }} className="gap-2 text-[13px]">
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block truncate">{name}</span>
                  <ModelCapabilityBadges model={typeof model === 'string' ? undefined : model} />
                </span>
                <Check className={cn('h-3 w-3 shrink-0', !isSelected && 'invisible')} />
              </CommandItem>
            })}
          </CommandGroup>)}
        </CommandList>
      </div>
    </Command>}
    {contextDisplay.visible && <div className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-3"><span>{contextLabels.window}</span><span className="flex items-center gap-1.5">
        {contextStatus?.isCompacting && <Spinner className="h-3 w-3" />}{contextLabels.usage}</span></div>
      {(contextLabels.percent || contextLabels.qualifier) && <div className="mt-0.5 text-[10px] text-foreground/40">{[contextLabels.percent, contextLabels.qualifier].filter(Boolean).join(' · ')}</div>}
    </div>}
    <button type="button" onClick={openSettings} className="w-full border-t border-border/60 px-3 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/5">{t('chat.modelPicker.openAiSettings')}</button>
  </>
  return presentation === 'popover' ? <Popover open={open} onOpenChange={handleOpenChange}>
    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
    <PopoverContent side="top" align="end" sideOffset={8} className="w-[480px] max-w-[calc(100vw-2rem)] overflow-hidden p-0">{content}</PopoverContent>
  </Popover> : <Drawer open={open} onOpenChange={handleOpenChange}>
    <DrawerTrigger asChild>{trigger}</DrawerTrigger>
    <DrawerContent><DrawerHeader><DrawerTitle>{t('common.model')}</DrawerTitle></DrawerHeader>{content}</DrawerContent>
  </Drawer>
}

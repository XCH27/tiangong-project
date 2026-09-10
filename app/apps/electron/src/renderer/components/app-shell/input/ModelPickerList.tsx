import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronDown,
  Search,
  SlidersHorizontal,
  SquareTerminal,
  Zap,
} from 'lucide-react'
import { ConnectionIcon } from '@/components/icons/ConnectionIcon'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@craft-agent/ui'
import { cn } from '@/lib/utils'
import { getThinkingLevelsForModel } from '@config/models'
import { connectionSupportsFastMode } from '@config/llm-connections'
import {
  filterModelPickerGroups,
  formatTokenCount,
  type ModelPickerGroup,
  type ModelPickerItem,
} from './model-picker-helpers'

interface ModelPickerListProps {
  groups: readonly ModelPickerGroup[]
  currentConnection?: string
  currentModel: string
  onSelect: (connectionSlug: string, modelId: string) => void
  renderItemAction?: (item: ModelPickerItem) => React.ReactNode
  onManageModels?: () => void
  selectable?: boolean
  /** Compact is used by chat menus; catalog is the full Settings projection. */
  variant?: 'compact' | 'catalog'
  className?: string
}

/**
 * Shared model inventory used by the desktop menu and compact drawer.
 *
 * It deliberately keeps the interaction flat: provider/account identity is a
 * group header, while every model remains directly searchable and selectable.
 * Container choice (popover vs drawer) must not create a second picker model.
 */
export function ModelPickerList({
  groups,
  currentConnection,
  currentModel,
  onSelect,
  renderItemAction,
  onManageModels,
  selectable = true,
  variant = 'compact',
  className,
}: ModelPickerListProps) {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const filteredGroups = React.useMemo(
    () => filterModelPickerGroups(groups, query),
    [groups, query],
  )
  const [collapsedGroups, setCollapsedGroups] = React.useState<Set<string>>(
    () => new Set(),
  )

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className={cn(variant === 'catalog' ? 'p-3' : 'px-1.5 pb-1.5')}>
        <div className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground/40"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('chat.modelPicker.searchPlaceholder')}
            aria-label={t('chat.modelPicker.searchPlaceholder')}
            className={cn(
              'w-full border-0 bg-foreground/5 pl-8 pr-2.5 outline-none placeholder:text-foreground/40 focus-visible:ring-1 focus-visible:ring-foreground/20',
              variant === 'catalog'
                ? 'h-9 rounded-lg text-sm'
                : 'h-8 rounded-[6px] text-[13px]',
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-y-auto',
          variant === 'catalog' ? 'px-3 pb-3' : 'px-1.5 pb-1.5',
        )}
      >
        {filteredGroups.length === 0 ? (
          <div className="px-2 py-6 text-center text-[13px] text-foreground/50">
            {t('chat.modelPicker.noModels')}
          </div>
        ) : (
          filteredGroups.map((group, groupIndex) => (
            <section
              key={group.connection.slug}
              className={cn(
                variant === 'catalog'
                  ? 'overflow-hidden rounded-lg border border-border/60 bg-foreground/[0.02]'
                  : groupIndex > 0 &&
                      'mt-1 border-t border-border/60 pt-1',
                variant === 'catalog' && groupIndex > 0 && 'mt-2',
              )}
            >
              <button
                type="button"
                disabled={variant !== 'catalog'}
                aria-expanded={
                  variant === 'catalog'
                    ? !collapsedGroups.has(group.connection.slug)
                    : undefined
                }
                onClick={() => {
                  setCollapsedGroups((current) => {
                    const next = new Set(current)
                    if (next.has(group.connection.slug)) {
                      next.delete(group.connection.slug)
                    } else {
                      next.add(group.connection.slug)
                    }
                    return next
                  })
                }}
                className={cn(
                  'flex w-full min-w-0 items-center gap-2 text-left',
                  variant === 'catalog'
                    ? 'h-11 px-3 hover:bg-foreground/[0.05]'
                    : 'cursor-default px-2 pb-1 pt-1.5',
                )}
              >
                {group.sourceKind === 'cli' ? (
                  <SquareTerminal className="size-3.5 shrink-0" />
                ) : (
                  <ConnectionIcon connection={group.connection} size={14} />
                )}
                <span
                  className={cn(
                    'truncate font-medium',
                    variant === 'catalog'
                      ? 'text-sm text-foreground/80'
                      : 'text-[12px] text-foreground/60',
                  )}
                >
                  {group.providerLabel}
                </span>
                {group.connection.name !== group.providerLabel && (
                  <span className="truncate text-[11px] text-foreground/40">
                    {group.connection.name}
                  </span>
                )}
                {group.connection.isAuthenticated === false && (
                  <span className="truncate text-[11px] text-destructive/80">
                    {t('chat.modelPicker.needsCredentialsShort', {
                      defaultValue: 'No key',
                    })}
                  </span>
                )}
                <span className="ml-auto text-xs text-foreground/40">
                  {group.items.length}
                </span>
                {variant === 'catalog' && (
                  <ChevronDown
                    className={cn(
                      'size-3.5 text-foreground/40 transition-transform',
                      collapsedGroups.has(group.connection.slug) && '-rotate-90',
                    )}
                  />
                )}
              </button>

              {!collapsedGroups.has(group.connection.slug) &&
                group.items.map((item) => {
                  const selected =
                    currentConnection === item.connection.slug &&
                    currentModel === item.modelId
                  // Match Craft: unauthenticated connections are visible but not selectable.
                  // Selecting them previously looked like a dead click then failed on send.
                  const needsCredentials =
                    item.connection.isAuthenticated === false
                  const canSelect = selectable && !needsCredentials
                  const definition =
                    typeof item.model === 'string' ? undefined : item.model
                  const reasoningLevels =
                    getThinkingLevelsForModel(definition)
                  const inputModalities =
                    definition?.inputModalities ??
                    (definition?.supportsImages
                      ? (['text', 'image'] as const)
                      : (['text'] as const))
                  const orderedInputModalities = (
                    ['text', 'image', 'audio', 'video', 'pdf'] as const
                  ).filter((modality) => inputModalities.includes(modality))
                  const supportsReasoning =
                    definition?.supportsThinking === true ||
                    reasoningLevels.length > 0
                  return (
                    <div
                      key={`${item.connection.slug}:${item.modelId}`}
                      className={cn(
                        'group/model flex items-center transition-colors',
                        variant === 'catalog'
                          ? 'min-h-14 border-t border-border/50 px-1'
                          : 'min-h-8 rounded-[6px]',
                        selected
                          ? 'bg-foreground/5'
                          : canSelect && 'hover:bg-foreground/[0.05]',
                        needsCredentials && 'opacity-50',
                      )}
                    >
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            disabled={!canSelect}
                            title={
                              needsCredentials
                                ? t('chat.modelPicker.needsCredentials', {
                                    defaultValue:
                                      'No API key for this connection. Open AI settings to add one.',
                                  })
                                : undefined
                            }
                            onClick={() => {
                              if (needsCredentials) {
                                onManageModels?.()
                                return
                              }
                              if (canSelect) {
                                onSelect(item.connection.slug, item.modelId)
                              }
                            }}
                            className={cn(
                              'flex min-w-0 flex-1 items-center gap-2 text-left outline-none',
                              !canSelect && 'cursor-default',
                              variant === 'catalog'
                                ? 'px-2 py-2.5'
                                : 'px-2 py-1.5',
                            )}
                          >
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'block truncate text-foreground/80',
                                  variant === 'catalog'
                                    ? 'text-sm font-medium'
                                    : 'text-[13px]',
                                )}
                              >
                                {item.modelName}
                              </span>
                              {variant === 'catalog' && definition && (
                                <span className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-foreground/40">
                                  {definition.contextWindow > 0 && (
                                    <span>
                                      {formatTokenCount(definition.contextWindow)}
                                    </span>
                                  )}
                                  {reasoningLevels.length > 0 && (
                                    <span>
                                      {reasoningLevels
                                        .map((level) => t(level.nameKey))
                                        .join(' · ')}
                                    </span>
                                  )}
                                  {connectionSupportsFastMode(
                                    item.connection,
                                    item.modelId,
                                  ) && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Zap className="size-3" />
                                      {t('chat.modelPicker.fastMode')}
                                    </span>
                                  )}
                                </span>
                              )}
                            </span>
                            {selected && (
                              <Check className="size-3.5 shrink-0 text-foreground/60" />
                            )}
                          </button>
                        </TooltipTrigger>
                        {variant === 'compact' && definition && (
                          <TooltipContent
                            side="right"
                            align="start"
                            sideOffset={8}
                            className="w-[180px] p-3"
                          >
                            <div className="flex min-w-0 flex-col gap-2 text-xs">
                              {[
                                [
                                  t('chat.modelPicker.info.model'),
                                  item.modelName,
                                ],
                                [
                                  t('chat.modelPicker.info.provider'),
                                  group.providerLabel,
                                ],
                                [
                                  t('chat.modelPicker.info.input'),
                                  orderedInputModalities
                                    .map((modality) =>
                                      t(`chat.modelPicker.info.${modality}`),
                                    )
                                    .join(', '),
                                ],
                                [
                                  t('chat.modelPicker.info.reasoning'),
                                  supportsReasoning
                                    ? t(
                                        'chat.modelPicker.info.reasoningAllowed',
                                      )
                                    : t('chat.modelPicker.info.noReasoning'),
                                ],
                                [
                                  t('chat.context'),
                                  definition.contextWindow > 0
                                    ? new Intl.NumberFormat(
                                        i18n.resolvedLanguage,
                                      ).format(definition.contextWindow)
                                    : '—',
                                ],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="flex min-w-0 items-center gap-4"
                                >
                                  <span className="shrink-0 font-medium text-foreground/60">
                                    {label}
                                  </span>
                                  <span className="ml-auto min-w-0 truncate text-right">
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                      {renderItemAction && (
                        <div className="mr-1 shrink-0">
                          {renderItemAction(item)}
                        </div>
                      )}
                    </div>
                  )
                })}
            </section>
          ))
        )}
      </div>
      {onManageModels && (
        <div className="border-t border-border/60 p-1.5">
          <button
            type="button"
            onClick={onManageModels}
            className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left text-[13px] text-foreground/80 hover:bg-foreground/[0.05]"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>{t('chat.modelPicker.manageModels')}</span>
          </button>
        </div>
      )}
    </div>
  )
}

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Check, ChevronDown, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import type { ModelDiscovery } from './add-model-model'
import { modelIdForDisplay, resolveModelEntry } from './model-selection'


export interface ModelMultiSelectProps {
  discovery: ModelDiscovery
  /** Catalog list, offered only when discovery failed. */
  fallback: readonly string[]
  selected: readonly string[]
  onToggle: (modelId: string) => void
  onAddCustom: (modelId: string) => void
  onRemove: (modelId: string) => void
  onRetry: () => void
}

/**
 * 第三框: models.
 *
 * The options come from asking the provider, not from a table shipped with the
 * app — a hardcoded list is wrong the day a provider ships something new. So the
 * box has real states: it cannot be answered before the credential above it, it
 * can be loading, and it can fail. Each says so plainly instead of rendering an
 * empty dropdown that looks like the provider has no models.
 *
 * Search, selection, and custom ids share one input. A second search box or a
 * separate "other model" row would make the same string take two paths.
 */
export function ModelMultiSelect({
  discovery,
  fallback,
  selected,
  onToggle,
  onAddCustom,
  onRemove,
  onRetry,
}: ModelMultiSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listboxId = React.useId()

  const options = discovery.status === 'ready' ? discovery.models : fallback
  const answerable = discovery.status === 'ready' || discovery.status === 'error'
  const visibleOptions = options.filter((modelId) =>
    modelIdForDisplay(modelId)
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )
  const entryAction = resolveModelEntry(query, options, selected)

  const commitQuery = () => {
    if (!entryAction) return
    if (entryAction.kind === 'select') onToggle(entryAction.modelId)
    else onAddCustom(entryAction.modelId)
    setQuery('')
  }

  const chooseOption = (modelId: string) => {
    onToggle(modelId)
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const inputPlaceholder = () => {
    switch (discovery.status) {
      case 'awaiting-credential':
        return t('addModel.models.awaitingCredential')
      case 'loading':
        return t('addModel.models.loading')
      case 'error':
        return t('addModel.models.errorPlaceholder')
      default:
        return t('addModel.models.searchOrAdd')
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          if (!answerable) return
          setOpen(nextOpen)
          if (!nextOpen) setQuery('')
        }}
      >
        <PopoverAnchor asChild>
          <div
            className={cn(
              'flex min-h-9 w-full items-center gap-1 rounded-[8px] border border-input bg-transparent px-2 py-1 text-sm',
              'focus-within:border-ring focus-within:ring-1 focus-within:ring-ring',
              !answerable && 'cursor-not-allowed opacity-50',
            )}
          >
            <div
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
              aria-label={t('addModel.field.models')}
            >
              {selected.map((modelId) => (
                <span
                  key={modelId}
                  className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-[4px] bg-foreground/5 px-1.5 py-0.5 text-xs"
                >
                  <span className="max-w-56 truncate">
                    {modelIdForDisplay(modelId)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(modelId)}
                    aria-label={`${t('common.remove')}: ${modelIdForDisplay(modelId)}`}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={open}
                aria-controls={listboxId}
                aria-autocomplete="list"
                disabled={!answerable}
                value={query}
                onFocus={() => {
                  if (answerable) setOpen(true)
                }}
                onChange={(event) => {
                  setQuery(event.target.value)
                  if (answerable) setOpen(true)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    commitQuery()
                  } else if (event.key === 'Escape') {
                    setOpen(false)
                  }
                }}
                placeholder={selected.length === 0 ? inputPlaceholder() : t('addModel.models.searchOrAdd')}
                className="h-7 min-w-36 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
            </div>
            {discovery.status === 'loading'
              ? <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-foreground/50" />
              : (
                <button
                  type="button"
                  disabled={!answerable}
                  aria-label={t('addModel.field.models')}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setOpen((current) => !current)
                    requestAnimationFrame(() => inputRef.current?.focus())
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] text-foreground/50 hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed"
                >
                  <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
                </button>
              )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-1"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <div
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-60 overflow-y-auto"
          >
            {visibleOptions.length === 0 && !entryAction && (
              <div className="px-2 py-2 text-sm text-muted-foreground">
                {t('addModel.models.none')}
              </div>
            )}
            {visibleOptions.map((modelId) => {
              const isSelected = selected.includes(modelId)
              return (
                <button
                  key={modelId}
                  type="button"
                  role="option"
                  onClick={() => chooseOption(modelId)}
                  aria-pressed={isSelected}
                  aria-selected={isSelected}
                  className="flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-left text-sm hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {modelIdForDisplay(modelId)}
                  </span>
                  <Check className={cn('shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                </button>
              )
            })}
            {entryAction?.kind === 'custom' && (
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={commitQuery}
                className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-sm hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none"
              >
                <span className="text-muted-foreground">{t('addModel.add')}</span>
                <span className="min-w-0 truncate font-medium">{entryAction.modelId}</span>
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {discovery.status === 'error' && (
        <div className="flex items-start gap-1.5 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{discovery.message}</span>
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 underline underline-offset-2"
          >
            {t('addModel.models.retry')}
          </button>
        </div>
      )}
    </div>
  )
}

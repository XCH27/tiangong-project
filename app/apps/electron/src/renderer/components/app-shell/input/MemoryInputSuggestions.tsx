import * as React from 'react'
import { Brain, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { MemoryEntry } from '@craft-agent/shared/protocol'
import { cn } from '@/lib/utils'

interface MemoryInputSuggestionsProps {
  suggestions: MemoryEntry[]
  loading?: boolean
  onSelect: (entry: MemoryEntry) => void
  className?: string
}

export function MemoryInputSuggestions({
  suggestions,
  loading = false,
  onSelect,
  className,
}: MemoryInputSuggestionsProps) {
  const { t } = useTranslation()

  if (!loading && suggestions.length === 0) {
    return null
  }

  return (
    <div className={cn('border-t border-border/60 px-3 py-2', className)}>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {t('input.memorySuggestions')}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {loading && suggestions.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">{t('common.checking')}</span>
        ) : (
          suggestions.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border/70 bg-muted/30 px-2 py-1 text-left text-[11px] text-foreground hover:bg-muted"
              onMouseDown={(event) => {
                event.preventDefault()
                onSelect(entry)
              }}
            >
              {entry.source === 'memory_suggestion'
                ? <Brain className="h-3 w-3 shrink-0 text-muted-foreground" />
                : <Sparkles className="h-3 w-3 shrink-0 text-muted-foreground" />}
              <span className="truncate">{formatSuggestionLabel(entry)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function formatSuggestionLabel(entry: MemoryEntry): string {
  const text = entry.content.trim()
  if (text.length <= 72) return text
  return `${text.slice(0, 69)}…`
}

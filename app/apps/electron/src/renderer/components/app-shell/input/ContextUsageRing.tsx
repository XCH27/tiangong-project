import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { getContextDisplay, getContextDisplayLabels } from './context-display'

type Display = ReturnType<typeof getContextDisplay>
type Labels = ReturnType<typeof getContextDisplayLabels>

/** ZCode's context-details interaction on Craft's Session snapshot and primitives.
 * Unknown/stale occupancy is an empty ring, never a fabricated 0% or subscription quota.
 */
export function ContextUsageRing({ display, labels, compactHint, onCompact }: {
  display: Display
  labels: Labels
  compactHint?: string
  onCompact?: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const percent = display.isStale ? null : display.percent
  const radius = 6.5
  const circumference = 2 * Math.PI * radius
  const arcPercent = Math.max(0, Math.min(percent ?? 0, 100))
  const tone = percent !== null && percent >= 90 ? 'text-destructive'
    : percent !== null && percent >= 70 ? 'text-info' : 'text-muted-foreground'
  const usage = display.isStale ? t('chat.contextUsage.unknown') : labels.usage

  return <Popover open={open} onOpenChange={setOpen}>
    <Tooltip>
      <TooltipTrigger asChild>
        <PopoverTrigger asChild>
          <button type="button" aria-label={`${labels.window}: ${usage}`}
            className={cn('input-toolbar-btn inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] hover:bg-foreground/5 data-[state=open]:bg-foreground/5', tone)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="shrink-0">
              <circle cx="8" cy="8" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
              {percent !== null && <circle cx="8" cy="8" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeDasharray={circumference} strokeDashoffset={circumference * (1 - arcPercent / 100)} strokeLinecap="round" transform="rotate(-90 8 8)" />}
            </svg>
          </button>
        </PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent side="top">{labels.window}: {usage}</TooltipContent>
    </Tooltip>
    <PopoverContent side="top" align="end" className="w-72 space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{labels.window}</span>
        {percent !== null && <span className="tabular-nums text-muted-foreground">{display.isEstimate ? '≈' : ''}{percent}%</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10" aria-hidden="true">
        <div className={cn('h-full bg-current', tone)} style={{ width: `${arcPercent}%` }} />
      </div>
      <div className="text-xs text-muted-foreground">
        <div>{usage}</div>
        {(display.usedTokens === null || display.isStale) && labels.capacity && <div className="mt-1">{labels.window}: {labels.capacity}</div>}
        {labels.qualifier && <div className="mt-1">{labels.qualifier}</div>}
      </div>
      {compactHint && <Button variant="outline" size="sm" className="w-full" disabled={!onCompact}
        onClick={() => { setOpen(false); onCompact?.() }}>{compactHint}</Button>}
    </PopoverContent>
  </Popover>
}

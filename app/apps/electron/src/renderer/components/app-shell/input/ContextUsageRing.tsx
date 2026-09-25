import { Tooltip, TooltipContent, TooltipTrigger } from '@craft-agent/ui'
import { cn } from '@/lib/utils'
import type { getContextDisplay, getContextDisplayLabels } from './context-display'

type Display = ReturnType<typeof getContextDisplay>
type Labels = ReturnType<typeof getContextDisplayLabels>

/** Context occupancy from the Session snapshot, never subscription quota or total spend. */
export function ContextUsageRing({ display, labels, compactHint, onCompact }: {
  display: Display
  labels: Labels
  compactHint?: string
  onCompact?: () => void
}) {
  if (display.isStale || display.usedTokens === null || display.usedTokens <= 0 || display.percent === null) return null

  const size = 16
  const radius = 6.5
  const circumference = 2 * Math.PI * radius
  const arcPercent = Math.max(0, Math.min(display.percent, 100))
  const tone = display.percent >= 90 ? 'text-destructive' : display.percent >= 70 ? 'text-info' : 'text-muted-foreground'
  const content = <>
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false" className="shrink-0">
      <circle cx="8" cy="8" r={radius} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2.5" />
      <circle cx="8" cy="8" r={radius} fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - arcPercent / 100)} strokeLinecap="round"
        transform="rotate(-90 8 8)" />
    </svg>
    <span className="tabular-nums">{display.isEstimate ? '≈' : ''}{display.percent}%</span>
  </>
  const className = cn('inline-flex h-6 shrink-0 items-center gap-1 px-1.5 text-xs font-medium', tone,
    onCompact && 'rounded-[6px] hover:bg-foreground/5 focus-visible:ring-1 focus-visible:ring-ring')

  return <Tooltip>
    <TooltipTrigger asChild>
      {onCompact
        ? <button type="button" onClick={onCompact} className={className} aria-label={`${labels.window}: ${labels.usage}`}>{content}</button>
        : <span tabIndex={0} className={className} aria-label={`${labels.window}: ${labels.usage}`}>{content}</span>}
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[260px]">
      <div>{labels.window}: {labels.usage}</div>
      {labels.qualifier && <div className="text-foreground/60">{labels.qualifier}</div>}
      {compactHint && <div>{compactHint}</div>}
    </TooltipContent>
  </Tooltip>
}

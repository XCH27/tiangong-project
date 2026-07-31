import { useTranslation } from 'react-i18next'
import {
  activityHasIndicator,
  activityIsAnimated,
  activityTone,
  deriveSessionActivity,
  type SessionActivity,
} from '@craft-agent/shared/sessions'
import type { SessionMeta } from '@/atoms/sessions'
import { cn } from '@/lib/utils'

/**
 * Live activity, derived rather than filed.
 *
 * The status icon beside it reads `sessionStatus` — a Kanban label written only
 * by a context menu, a URL parameter or a board drag. Nothing sets it
 * automatically, so on its own the row answers "what did someone file this as"
 * and never "what is this doing". A session can be actively running while its
 * icon says `todo`.
 *
 * This does not replace that label; the two answer different questions and only
 * one of them is the machine's job to keep true (Decision H5). It sits on the
 * corner of the same control so a glance down the list shows what is happening
 * without a click.
 */
export function SessionActivityDot({ item }: { item: SessionMeta }) {
  const { t } = useTranslation()
  const activity = deriveSessionActivity({
    isProcessing: item.isProcessing,
    isAsyncOperationOngoing: item.isAsyncOperationOngoing,
    lastMessageRole: item.lastMessageRole,
    hasUnread: item.hasUnread,
  })

  // An idle session draws nothing. A column of identical grey dots is noise that
  // hides the two rows that matter.
  if (!activityHasIndicator(activity)) return null

  return (
    <span
      role="img"
      aria-label={t(`sessionActivity.${activity}`)}
      title={t(`sessionActivity.${activity}`)}
      className={cn(
        'pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full',
        'ring-2 ring-background',
        toneClass(activityTone(activity)),
        activityIsAnimated(activity) && 'animate-pulse',
      )}
    />
  )
}

/**
 * Tone, not a colour value, so themes own the palette. Nothing here is muted:
 * every state this renders describes something that happened or is happening,
 * and dimming those makes a working session look like an empty one.
 */
function toneClass(tone: ReturnType<typeof activityTone>): string {
  switch (tone) {
    case 'attention': return 'bg-amber-500'
    case 'danger': return 'bg-red-500'
    case 'active': return 'bg-blue-500'
    case 'success': return 'bg-emerald-500'
    case 'neutral': return 'bg-muted-foreground'
    default: return tone satisfies never
  }
}

export type { SessionActivity }

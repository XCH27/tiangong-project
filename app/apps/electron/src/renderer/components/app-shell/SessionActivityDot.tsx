import { useTranslation } from 'react-i18next'
import {
  activityHasIndicator,
  activityIsAnimated,
  activityTone,
  deriveSessionActivity,
  type SessionActivity,
} from '@craft-agent/shared/sessions/session-activity'
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
        // 8px dot in the corner of a status icon. `rounded-full` is the status
        // dot case in UI-SPEC §5; the background ring separates it from whatever
        // the icon underneath is doing.
        'pointer-events-none absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full',
        'ring-2 ring-background',
        toneClass(activityTone(activity)),
        // Motion is functional (§9). Only a running session pulses, and it stops
        // entirely under prefers-reduced-motion rather than degrading to a
        // faster or subtler animation — a person who asked for no motion is not
        // asking for less of it.
        activityIsAnimated(activity) && 'animate-pulse motion-reduce:animate-none',
      )}
    />
  )
}

/**
 * Tone → theme colour.
 *
 * The theme has exactly six base colours (UI-SPEC §1) and four of them are
 * reserved for real state: `accent` brand, `info` warning, `success` confirmed,
 * `destructive` failed. Every state this dot renders *is* real state, so each
 * maps onto a reserved colour and none needs a new one. Reaching for
 * `bg-amber-500` here — as this file previously did — adds a seventh colour that
 * no theme controls, so it stops responding to light/dark and to any theme the
 * user picks, while looking correct in exactly the one theme it was written in.
 */
function toneClass(tone: ReturnType<typeof activityTone>): string {
  switch (tone) {
    // Waiting on the human: the same colour Ask mode uses, because it is the
    // same fact — the machine has stopped and needs an answer.
    case 'attention': return 'bg-info'
    case 'danger': return 'bg-destructive'
    // Running is brand, not warning: it is the app doing its job.
    case 'active': return 'bg-accent'
    case 'success': return 'bg-success'
    case 'neutral': return 'bg-foreground/40'
    default: return tone satisfies never
  }
}

export type { SessionActivity }

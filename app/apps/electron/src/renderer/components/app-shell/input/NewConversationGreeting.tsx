import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Adapted from ZCode ConversationDraftEmptyState (Apache-2.0): time-bound greeting.
// Modified for Fleet: no brand artwork or measured display font; Craft type tokens.
const BOUNDARIES = [5, 9, 12, 14, 18, 23]
const PERIODS = ['earlyMorning', 'morning', 'noon', 'afternoon', 'evening', 'lateNight']

export function NewConversationGreeting() {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => new Date())
  const period = BOUNDARIES.findIndex((hour, index) => now.getHours() >= hour && now.getHours() < (BOUNDARIES[index + 1] ?? 24))
  const key = period < 0 ? 'lateNight' : PERIODS[period]
  useEffect(() => {
    const next = new Date(now)
    const nextHour = BOUNDARIES.find(hour => hour > now.getHours())
    if (nextHour === undefined) next.setDate(next.getDate() + 1)
    next.setHours(nextHour ?? 5, 0, 0, 0)
    const timer = setTimeout(() => setNow(new Date()), Math.max(1, next.getTime() - Date.now()))
    return () => clearTimeout(timer)
  }, [now])
  return <h1 className="mb-8 px-4 text-center text-lg font-medium text-foreground">{t(`chat.greeting.${key}`)}</h1>
}

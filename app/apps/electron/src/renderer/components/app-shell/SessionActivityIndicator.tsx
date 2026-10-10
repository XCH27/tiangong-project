import { useTranslation } from 'react-i18next'
import { AlertCircle, FileText, ShieldAlert } from 'lucide-react'
import { Spinner } from '@craft-agent/ui'
import type { SessionMeta } from '@/atoms/sessions'
import { getSessionActivity } from '@/utils/session'


export function SessionActivityIndicator({ item, hasPendingPrompt }: { item: SessionMeta; hasPendingPrompt?: boolean }) {
  const { t } = useTranslation()
  const activity = getSessionActivity(item, hasPendingPrompt)
  const label = activity ? t(`session.activity.${activity}`) : undefined
  return <span className="flex items-center justify-center" title={label} role={activity ? 'img' : undefined} aria-label={label} aria-hidden={!activity || undefined}>
    {activity === 'waiting' && <ShieldAlert className="h-3 w-3 text-info" />}
    {activity === 'running' && <Spinner className="text-[10px]" />}
    {activity === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
    {activity === 'planReady' && <FileText className="h-3 w-3 text-success" />}
    {activity === 'unread' && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
  </span>
}

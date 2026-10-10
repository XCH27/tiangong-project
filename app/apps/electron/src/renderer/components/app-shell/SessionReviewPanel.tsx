import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { MultiDiffPreviewOverlay, groupMessagesByTurn } from '@craft-agent/ui'
import { useSession } from '@/context/AppShellContext'
import { useTheme } from '@/hooks/useTheme'
import { useDiffViewerSettings } from '@/hooks/useDiffViewerSettings'
import { collectTurnReviewChanges } from '@/lib/file-changes'
import { Button } from '@/components/ui/button'
import { PanelHeaderCenterButton } from '@/components/ui/PanelHeaderCenterButton'
import type { RightSidebarPanel } from '../../../shared/types'
import { PanelHeader } from './PanelHeader'
import { RADIUS_INNER } from './panel-constants'

/** Cindy's turn-targeted review flow, projected from the one Craft Session timeline.
 * This is historical tool output, not a repository snapshot or an undo authority. */
export function SessionReviewPanel({ sessionId, target, onClose, onShowAll }: {
  sessionId: string
  target: Extract<RightSidebarPanel, { type: 'review' }>
  onClose: () => void
  onShowAll: () => void
}) {
  const { t } = useTranslation()
  const session = useSession(sessionId)
  const { isDark } = useTheme()
  const [settings, updateSettings] = useDiffViewerSettings()
  // Returning to a different conversation must not apply the old turn's selection.
  const turnId = target.sessionId === sessionId ? target.turnId : undefined
  const changeId = turnId ? target.changeId : undefined
  const changes = useMemo(() => collectTurnReviewChanges(groupMessagesByTurn(session?.messages ?? []), turnId), [session?.messages, turnId])
  return <aside aria-label={t('chat.review.title')} className="h-full w-[640px] max-w-[50vw] shrink-0 flex flex-col overflow-hidden bg-foreground-2 shadow-middle" style={{ borderRadius: RADIUS_INNER }}>
    {changes.length === 0 && <PanelHeader title={t('chat.review.title')} rightSidebarButton={
      <PanelHeaderCenterButton icon={<X className="h-4 w-4" />} onClick={onClose} tooltip={t('common.close')} />
    } />}
    <div className="shrink-0 flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
      <span className="flex-1">{t('chat.review.recordedChanges')}</span>
      {turnId && <Button variant="ghost" size="sm" onClick={onShowAll}>{t('chat.review.allChanges')}</Button>}
    </div>
    {changes.length > 0 ? <div className="min-h-0 flex-1">
      <MultiDiffPreviewOverlay key={`${sessionId}:${turnId ?? ''}:${changeId ?? ''}`} embedded isOpen onClose={onClose}
        changes={changes} consolidated={!changeId} focusedChangeId={changeId}
        theme={isDark ? 'dark' : 'light'} diffViewerSettings={settings} onDiffViewerSettingsChange={updateSettings} />
    </div> : <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">{t(session ? 'chat.review.empty' : 'common.loading')}</div>}
  </aside>
}

import type { TFunction } from 'i18next'

import type { PanelStackEntry } from '@/atoms/panel-stack'
import type { SessionMeta } from '@/atoms/sessions'
import { getSessionTitle } from '@/utils/session'
import { parseRouteToNavigationState } from '../../../shared/route-parser'

export function getContentPanelDragLabel(
  entry: PanelStackEntry,
  sessionMetaMap: Map<string, SessionMeta>,
  t: TFunction,
): string {
  const navState = parseRouteToNavigationState(entry.route)
  if (navState?.navigator === 'sessions' && navState.details?.sessionId) {
    const sessionId = navState.details.sessionId
    const meta = sessionMetaMap.get(sessionId)
    if (meta) return getSessionTitle(meta)
    return t('session.defaultTitle', 'New chat')
  }

  switch (entry.panelType) {
    case 'settings':
      return t('settings.title', 'Settings')
    case 'source':
      return t('sources.title', 'Sources')
    case 'skills':
      return t('skills.title', 'Skills')
    case 'files':
      return t('files.title', 'Files')
    default:
      return t('toolDock.reorder', 'Reorder')
  }
}

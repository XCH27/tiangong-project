import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Button } from '@/components/ui/button'
import type { TransportConnectionState } from '../../../shared/types'

export function shouldShowTransportConnectionBanner(state: TransportConnectionState | null): boolean {
  if (!state || state.mode === 'local') return false
  return state.status !== 'connected' && state.status !== 'idle'
}

export interface TransportBannerCopy {
  title: string
  description: string
  showRetry: boolean
  tone: 'warning' | 'error' | 'info'
}

export function getTransportBannerCopy(state: TransportConnectionState, t: TFunction): TransportBannerCopy {
  switch (state.status) {
    case 'connecting':
      return {
        title: t('transport.connecting'),
        description: t('transport.connectingDesc', { url: state.url }),
        showRetry: false,
        tone: 'info',
      }

    case 'reconnecting': {
      const retry = state.nextRetryInMs != null ? t('transport.retryIn', { ms: state.nextRetryInMs }) : t('transport.retrying')
      return {
        title: t('transport.reconnecting'),
        description: t('transport.reconnectingDesc', { reason: getFailureReason(state, t), retry, attempt: state.attempt }),
        showRetry: true,
        tone: 'warning',
      }
    }

    case 'failed':
      return {
        title: t('transport.failed'),
        description: getFailureReason(state, t),
        showRetry: true,
        tone: 'error',
      }

    case 'disconnected':
      return {
        title: t('transport.disconnected'),
        description: getFailureReason(state, t),
        showRetry: true,
        tone: 'warning',
      }

    default:
      return {
        title: t('transport.defaultStatus'),
        description: getFailureReason(state, t),
        showRetry: true,
        tone: 'info',
      }
  }
}

function getFailureReason(state: TransportConnectionState, t: TFunction): string {
  const err = state.lastError
  if (err) {
    if (err.kind === 'auth') return t('transport.authFailed')
    if (err.kind === 'protocol') return t('transport.protocolMismatch')
    if (err.kind === 'timeout') return t('transport.timeout', { url: state.url })
    if (err.kind === 'network') return t('transport.networkError', { url: state.url })
    return err.message
  }

  if (state.lastClose?.code != null) {
    const reason = state.lastClose.reason ? t('transport.wsClosedReason', { reason: state.lastClose.reason }) : ''
    return t('transport.wsClosedWithCode', { code: state.lastClose.code, reason })
  }

  return t('transport.waitingForConnection')
}

export function TransportConnectionBanner({
  state,
  onRetry,
}: {
  state: TransportConnectionState
  onRetry: () => void
}) {
  const { t } = useTranslation()
  const copy = getTransportBannerCopy(state, t)

  const toneClasses = copy.tone === 'error'
    ? 'border-destructive/30 bg-destructive/10 text-destructive'
    : copy.tone === 'warning'
      ? 'border-info/30 bg-info/10 text-info'
      : 'border-accent/30 bg-accent/10 text-accent'

  return (
    <div className={`shrink-0 border-b px-4 py-2 ${toneClasses}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{copy.title}</p>
          <p className="text-xs opacity-90 truncate">{copy.description}</p>
        </div>
        {copy.showRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="shrink-0 h-7">
            {t('common.retry')}
          </Button>
        )}
      </div>
    </div>
  )
}

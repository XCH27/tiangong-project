/**
 * One status line for a viewer surface.
 *
 * The phase is empty, loading, viewer, locked, or error. The host status is
 * wired, display-only, or Locked. This notice has no Allow action and does
 * not admit a write.
 */

import { useTranslation } from 'react-i18next'
import type { ViewerPhase, ViewerPresentation } from './admission-presentation'

export function AdmissionNotice({
  presentation,
  detailKey,
}: {
  presentation: ViewerPresentation
  detailKey?: string
}) {
  const { t } = useTranslation()
  const label = t(admissionLabelKey(presentation.phase))
  const text = presentation.reason ? `${label} · ${presentation.reason}` : label
  return (
    <p
      className="text-sm text-muted-foreground"
      data-admission={presentation.phase}
      data-host-status={presentation.status}
      data-admission-reason={presentation.reason}
    >
      <span>{text}</span>
      {detailKey ? <span className="mt-1 block text-xs">{t(detailKey)}</span> : null}
    </p>
  )
}

function admissionLabelKey(phase: ViewerPhase): string {
  switch (phase) {
    case 'empty':
      return 'admission.empty'
    case 'loading':
      return 'admission.loading'
    case 'viewer':
      return 'admission.viewer'
    case 'locked':
      return 'admission.locked'
    case 'error':
      return 'admission.error'
    default: {
      const unexpected: never = phase
      return unexpected
    }
  }
}

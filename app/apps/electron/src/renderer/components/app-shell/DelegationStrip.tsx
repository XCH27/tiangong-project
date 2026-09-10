/**
 * DelegationStrip — compact inline projection of child sessions under a parent
 * conversation (H11). Surfaces project sessionMetaMap only; they do not own
 * orchestration state.
 *
 * Renders null when the viewed session has no children. Clicking a child opens
 * that session via `onOpenSession` or the shared navigate() fallback.
 */

import { useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { useTranslation } from 'react-i18next'
import {
  toDelegationStripViewModel,
  type ChildSessionProjectionInput,
} from '@craft-agent/shared/agent/delegation-projection'
import type { DelegationSummary } from '@craft-agent/shared/agent/delegation-routing'
import { cn } from '@/lib/utils'
import { sessionMetaMapAtom } from '@/atoms/sessions'
import { navigate, routes } from '@/lib/navigate'
import { CHAT_LAYOUT } from '@/config/layout'

export interface DelegationStripProps {
  parentSessionId: string
  onOpenSession?: (sessionId: string) => void
  className?: string
}

export function DelegationStrip({
  parentSessionId,
  onOpenSession,
  className,
}: DelegationStripProps) {
  const { t } = useTranslation()
  const sessionMetaMap = useAtomValue(sessionMetaMapAtom)

  const viewModel = useMemo(() => {
    const children: ChildSessionProjectionInput[] = []
    for (const meta of sessionMetaMap.values()) {
      if (meta.parentSessionId !== parentSessionId) continue
      children.push({
        sessionId: meta.id,
        name: meta.name,
        parentSessionId: meta.parentSessionId,
        isProcessing: meta.isProcessing,
        sessionStatus: meta.sessionStatus,
        model: meta.model,
      })
    }
    return toDelegationStripViewModel(parentSessionId, children)
  }, [parentSessionId, sessionMetaMap])

  if (viewModel.total === 0) return null

  const openSession = (sessionId: string) => {
    if (onOpenSession) {
      onOpenSession(sessionId)
      return
    }
    // Fallback when ChatDisplay did not wire navigation (playground / tests).
    const meta = sessionMetaMap.get(sessionId)
    navigate(routes.view.sessionHome({
      id: sessionId,
      workingDirectory: meta?.workingDirectory,
      workspaceId: meta?.workspaceId,
    }))
  }

  return (
    <div
      role="region"
      aria-label={t('chat.delegationStripLabel')}
      className={cn(
        'shrink-0',
        CHAT_LAYOUT.maxWidth,
        'mx-auto w-full',
        CHAT_LAYOUT.containerPaddingX,
        'pt-2 pb-1',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-md border border-foreground/10 bg-foreground/[0.03]',
          'px-2.5 py-1.5',
        )}
      >
        <div className="truncate text-[11px] text-foreground/50">
          {viewModel.headline}
        </div>
        <ul className="mt-1 flex flex-wrap gap-1">
          {viewModel.items.map((item) => (
            <li key={item.sessionId}>
              <button
                type="button"
                onClick={() => openSession(item.sessionId)}
                title={item.label}
                aria-label={t('chat.delegationOpenSession', { name: item.label })}
                className={cn(
                  'inline-flex max-w-[12rem] items-center gap-1.5',
                  'rounded-[6px] px-1.5 py-0.5',
                  'text-xs text-foreground/60',
                  'hover:bg-foreground/5 hover:text-foreground/80',
                  'transition-colors duration-150',
                  'outline-none focus-visible:ring-1 focus-visible:ring-foreground/20',
                )}
              >
                <span
                  className={cn(
                    'h-1.5 w-1.5 shrink-0 rounded-full',
                    statusDotClass(item.status),
                    item.status === 'running' && 'animate-pulse motion-reduce:animate-none',
                  )}
                  aria-hidden
                />
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Reserved theme colours only — real state, not decoration (UI-SPEC §1). */
function statusDotClass(status: DelegationSummary['status']): string {
  switch (status) {
    case 'running':
      return 'bg-accent'
    case 'completed':
      return 'bg-success'
    case 'failed':
    case 'escalated':
      return 'bg-destructive'
    default:
      return 'bg-foreground/40'
  }
}

/**
 * SurfaceState — the non-empty required surface states.
 *
 * `12-PAGE-ARCHITECTURE.md` §4 requires every surface to ship loading, empty, error, denied,
 * offline and recovery states. Empty already had a home (`Empty` primitives, wrapped by
 * `EntityListEmptyScreen`); the other four did not, so each caller invented its own error UI.
 * This file gives them one home, composed from the same `Empty` primitives so the visual language
 * is shared rather than duplicated (`docs/UI-SPEC.md` §10).
 *
 * These components render a state; they never decide policy. The caller supplies the honest
 * description — what happened and what the user can do — because only the caller knows it.
 */

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Lock, CloudOff, History } from 'lucide-react'

import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './empty'
import { cn } from '@/lib/utils'

type SurfaceStateKind = 'error' | 'denied' | 'offline' | 'recovery'

const KIND_ICON: Record<SurfaceStateKind, React.ComponentType<{ className?: string }>> = {
  error: AlertTriangle,
  denied: Lock,
  offline: CloudOff,
  recovery: History,
}

/**
 * Semantic color is reserved for real state (`UI-SPEC.md` §1). `denied` and `offline` are
 * conditions rather than failures, so they stay on the neutral foreground; only `error` is
 * destructive.
 */
const KIND_TONE: Record<SurfaceStateKind, string> = {
  error: 'text-destructive',
  denied: 'text-muted-foreground',
  offline: 'text-muted-foreground',
  recovery: 'text-muted-foreground',
}

export interface SurfaceStateAction {
  label: string
  onClick: () => void
}

export interface SurfaceStateProps {
  kind: SurfaceStateKind
  /** Defaults to the kind's generic title. Prefer a specific one. */
  title?: string
  /**
   * What happened and what the user can do about it, in plain language.
   * Never pass a stack trace or a raw error object (`12-PAGE-ARCHITECTURE.md` §4).
   */
  description: string
  /** Primary recovery affordance. Omit when nothing can honestly be done here. */
  action?: SurfaceStateAction
  /** Secondary affordance, e.g. "Open settings" beside "Retry". */
  secondaryAction?: SurfaceStateAction
  className?: string
}

export function SurfaceState({
  kind,
  title,
  description,
  action,
  secondaryAction,
  className = 'flex-1',
}: SurfaceStateProps) {
  const { t } = useTranslation()
  const Icon = KIND_ICON[kind]

  return (
    <Empty className={className} data-state-kind={kind}>
      <EmptyHeader>
        <EmptyMedia variant="icon" className={KIND_TONE[kind]}>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title ?? t(`surfaceState.${kind}.title`)}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {(action || secondaryAction) && (
        <EmptyContent>
          {action && <SurfaceStateButton {...action} />}
          {secondaryAction && <SurfaceStateButton {...secondaryAction} />}
        </EmptyContent>
      )}
    </Empty>
  )
}

/** Matches the action button in `EntityListEmptyScreen` so both empty and non-empty states agree. */
function SurfaceStateButton({ label, onClick, className }: SurfaceStateAction & { className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px]',
        'bg-foreground/[0.02] shadow-minimal hover:bg-foreground/[0.05] transition-colors',
        className
      )}
    >
      {label}
    </button>
  )
}

export function ErrorState(props: Omit<SurfaceStateProps, 'kind'>) {
  return <SurfaceState kind="error" {...props} />
}

export function DeniedState(props: Omit<SurfaceStateProps, 'kind'>) {
  return <SurfaceState kind="denied" {...props} />
}

export function OfflineState(props: Omit<SurfaceStateProps, 'kind'>) {
  return <SurfaceState kind="offline" {...props} />
}

export function RecoveryState(props: Omit<SurfaceStateProps, 'kind'>) {
  return <SurfaceState kind="recovery" {...props} />
}

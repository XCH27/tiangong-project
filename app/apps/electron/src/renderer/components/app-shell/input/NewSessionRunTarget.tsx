/**
 * The shell-wired run-target chip.
 *
 * Kept apart from `ComposerLeadingChips` so the chips themselves stay presentational
 * and testable: this file is the only one that reaches into AppShellContext, which
 * transitively drags in the whole renderer (pdf preview included) and cannot be
 * imported from a unit test.
 */
import { useTranslation } from 'react-i18next'
import { RunTargetSelector } from './ComposerLeadingChips'
import { useRunTargets } from './use-run-targets'
import { useOptionalAppShellContext } from '@/context/AppShellContext'
import { navigate, routes } from '@/lib/navigate'

export interface NewSessionRunTargetProps {
  /** Only a session with no messages can still choose its machine. */
  isEmptySession: boolean
  /** Workspace the next conversation would be created in. */
  workspaceId?: string
  isExpanded?: boolean
  disabled?: boolean
}

/**
 * The composer's run-target chip, wired to the shell.
 *
 * Self-contained on purpose: the composer mounts it and nothing else, so the choice
 * of machine — targets, liveness probing, the switch — lives here rather than being
 * spread through an already oversized input component.
 */
export function NewSessionRunTarget({
  isEmptySession,
  workspaceId,
  isExpanded,
  disabled,
}: NewSessionRunTargetProps) {
  const { t } = useTranslation()
  const shell = useOptionalAppShellContext()
  const workspaces = shell?.workspaces ?? []
  // Probe only while the chip can actually be used; an in-flight session has no choice
  // to make and should not be polling other machines.
  const { targets } = useRunTargets(workspaces, t('runTarget.thisComputer'), {
    probe: isEmptySession,
  })
  const onSelectWorkspace = shell?.onSelectWorkspace

  if (!isEmptySession || !onSelectWorkspace) return null

  return (
    <RunTargetSelector
      targets={targets}
      activeWorkspaceId={workspaceId ?? null}
      onSelectWorkspace={(id) => void onSelectWorkspace(id)}
      onAddRemote={() => navigate(routes.view.settings('server'))}
      isExpanded={isExpanded}
      disabled={disabled}
    />
  )
}

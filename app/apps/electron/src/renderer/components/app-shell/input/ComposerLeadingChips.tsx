/**
 * The composer's leading context chips: which computer the conversation runs on, and
 * attach files. They live together because they are the same kind of control in the
 * same strip, and because FreeFormInput is over the file-size budget — a new concern
 * belongs in its own module rather than in that file.
 */
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Command as CommandPrimitive } from 'cmdk'
import { Check, Monitor, Paperclip } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { FreeFormInputContextBadge } from './FreeFormInputContextBadge'
import { targetActiveSessions } from './use-run-targets'
import type { RunTarget } from '@craft-agent/shared/remote'

// Same values as WorkingDirectorySelector / todo-filter-menu — this chip sits next to
// that one, so it uses that menu, not a second hand-rolled one.
const MENU_CONTAINER_STYLE =
  'min-w-[200px] max-w-[400px] overflow-hidden rounded-[8px] bg-background text-foreground shadow-modal-small p-0'
const MENU_LIST_STYLE = 'max-h-[200px] overflow-y-auto p-1 [&_[cmdk-list-sizer]]:space-y-px'
const MENU_ITEM_STYLE =
  'flex cursor-pointer select-none items-center gap-2 rounded-[6px] px-3 py-1.5 text-[13px] outline-none'

export interface RunTargetSelectorProps {
  targets: RunTarget[]
  /** Workspace the next conversation would be created in. */
  activeWorkspaceId: string | null
  /** Switching computer means switching to a Workspace that lives on it. */
  onSelectWorkspace: (workspaceId: string) => void
  /** Expanded chip on desktop, collapsed in the compact toolbar. */
  isExpanded?: boolean
  disabled?: boolean
}

/**
 * Which computer this conversation runs on.
 *
 * A conversation runs wherever its Workspace lives, so this does not introduce a
 * second place to create sessions: picking a computer selects one of that computer's
 * Workspaces, and the existing create flow does the rest. A remote computer that is
 * not answering is shown and not chosen — its sessions would never start.
 */
export function RunTargetSelector({
  targets,
  activeWorkspaceId,
  onSelectWorkspace,
  isExpanded,
  disabled,
}: RunTargetSelectorProps) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)

  const current = React.useMemo(
    () => targets.find((target) => target.workspaces.some((w) => w.id === activeWorkspaceId)) ?? targets[0],
    [targets, activeWorkspaceId],
  )

  // With nothing paired there is no choice to offer, so the chip stays out of the way.
  if (targets.length <= 1) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FreeFormInputContextBadge
          icon={<Monitor className="h-4 w-4" />}
          label={current?.name ?? t('runTarget.thisComputer')}
          isExpanded={isExpanded}
          hasSelection={current?.kind === 'remote'}
          showChevron
          isOpen={open}
          disabled={disabled}
          tooltip={t('runTarget.tooltip')}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className={MENU_CONTAINER_STYLE}>
        <CommandPrimitive>
          <CommandPrimitive.List className={MENU_LIST_STYLE}>
            {targets.map((target) => {
              const workspace = target.workspaces.find((w) => w.id === activeWorkspaceId)
                ?? target.workspaces[0]
              const isCurrent = target.key === current?.key
              const running = targetActiveSessions(target)
              const unreachable = target.kind === 'remote' && target.online === false
              const noWorkspace = !workspace
              const blocked = unreachable || noWorkspace
              return (
                <CommandPrimitive.Item
                  key={target.key}
                  value={`${target.name} ${target.key}`}
                  disabled={blocked}
                  onSelect={() => {
                    if (workspace) onSelectWorkspace(workspace.id)
                    setOpen(false)
                  }}
                  className={cn(
                    MENU_ITEM_STYLE,
                    'data-[selected=true]:bg-foreground/5',
                    blocked && 'opacity-50 data-[selected=true]:bg-transparent',
                  )}
                >
                  <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{target.name}</span>
                  {/* Say why it cannot be chosen, rather than only dimming it. */}
                  {unreachable && (
                    <span className="shrink-0 text-muted-foreground">{t('runTarget.unreachable')}</span>
                  )}
                  {!unreachable && noWorkspace && (
                    <span className="shrink-0 text-muted-foreground">{t('runTarget.noProject')}</span>
                  )}
                  {!blocked && running !== undefined && running > 0 && (
                    <span className="shrink-0 text-muted-foreground">
                      {t('runTarget.running', { count: running })}
                    </span>
                  )}
                  {isCurrent && <Check className="h-4 w-4 shrink-0" />}
                </CommandPrimitive.Item>
              )
            })}
          </CommandPrimitive.List>
        </CommandPrimitive>
      </PopoverContent>
    </Popover>
  )
}

export interface ComposerAttachChipProps {
  attachmentCount: number
  onClick: () => void
  /** Desktop shows the label while the session is still empty; compact never does. */
  isExpanded: boolean
  /** Compact and desktop use different short labels for the same action. */
  variant: 'compact' | 'desktop'
  disabled?: boolean
}

/** "Attach files" — the other leading chip, kept beside the run target it sits next to. */
export function ComposerAttachChip({
  attachmentCount,
  onClick,
  isExpanded,
  variant,
  disabled,
}: ComposerAttachChipProps) {
  const { t } = useTranslation()
  return (
    <FreeFormInputContextBadge
      icon={<Paperclip className="h-4 w-4" />}
      label={attachmentCount > 0
        ? t('chat.filesCount', { count: attachmentCount })
        : t(variant === 'compact' ? 'chat.attach' : 'chat.attachFiles')}
      isExpanded={isExpanded}
      hasSelection={attachmentCount > 0}
      showChevron={false}
      onClick={onClick}
      tooltip={t('chat.attachFilesTooltip')}
      disabled={disabled}
    />
  )
}

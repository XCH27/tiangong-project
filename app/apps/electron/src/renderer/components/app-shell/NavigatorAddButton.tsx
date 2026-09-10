/**
 * The navigator panel's "add one of these" button.
 *
 * Four near-identical blocks sat inline in AppShell — sources, skills,
 * automations, projects — differing only in which `EditPopover` config they
 * open and whether they open one at all. Same trigger, same icon, same slot.
 *
 * Collapsed to one component so that adding a fifth resource does not add a
 * fifth copy, and so AppShell gets smaller rather than larger when a control is
 * added to this header.
 */

import * as React from 'react'

import { HeaderIconButton } from '@/components/ui/HeaderIconButton'
import { Plus } from 'lucide-react'
import { EditPopover, getEditConfig, type EditContextKey } from '@/components/ui/EditPopover'

export function NavigatorAddButton(props: {
  tooltip: string
  /** Popover config to open. Omit with `onClick` for a plain button. */
  editContext?: EditContextKey
  workspaceRootPath?: string
  onClick?: () => void
  dataTutorial?: string
}) {
  const trigger = (
    <HeaderIconButton
      icon={<Plus className="h-4 w-4" />}
      tooltip={props.tooltip}
      data-tutorial={props.dataTutorial}
      onClick={props.editContext ? undefined : props.onClick}
    />
  )
  if (!props.editContext) return trigger
  return <EditPopover trigger={trigger} {...getEditConfig(props.editContext, props.workspaceRootPath ?? '')} />
}

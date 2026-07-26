/**
 * Playground registry entry for SurfaceState.
 *
 * `12-PAGE-ARCHITECTURE.md` §4 requires every surface to ship error / denied / offline / recovery
 * states, and `09-QUALITY.md` acceptance includes walking them. This entry makes all four
 * inspectable in isolation so a page slice can be reviewed without reproducing the real failure.
 */

import * as React from 'react'
import type { ComponentEntry } from './types'
import { SurfaceState } from '@/components/ui/surface-state'

type Kind = 'error' | 'denied' | 'offline' | 'recovery'

interface SurfaceStatePlaygroundProps {
  kind: Kind
  title: string
  description: string
  showAction: boolean
  showSecondaryAction: boolean
}

function SurfaceStatePlayground({
  kind,
  title,
  description,
  showAction,
  showSecondaryAction,
}: SurfaceStatePlaygroundProps) {
  return (
    <div className="flex h-full w-full min-h-[320px]">
      <SurfaceState
        kind={kind}
        title={title.trim() ? title : undefined}
        description={description}
        action={showAction ? { label: 'Retry', onClick: () => {} } : undefined}
        secondaryAction={showSecondaryAction ? { label: 'Open settings', onClick: () => {} } : undefined}
      />
    </div>
  )
}

export const surfaceStateComponents: ComponentEntry[] = [
  {
    id: 'surface-state',
    name: 'SurfaceState (error / denied / offline / recovery)',
    category: 'Feedback',
    description:
      'The four required non-empty surface states, composed from the Empty primitives. Descriptions must say what happened and what the user can do — never a stack trace.',
    component: SurfaceStatePlayground,
    layout: 'full',
    props: [
      {
        name: 'kind',
        description: 'Which required state to render',
        control: {
          type: 'select',
          options: [
            { label: 'error', value: 'error' },
            { label: 'denied', value: 'denied' },
            { label: 'offline', value: 'offline' },
            { label: 'recovery', value: 'recovery' },
          ],
        },
        defaultValue: 'error',
      },
      {
        name: 'title',
        description: 'Leave blank to use the localized default title for the kind',
        control: { type: 'string', placeholder: 'Defaults to the kind title' },
        defaultValue: '',
      },
      {
        name: 'description',
        description: 'What happened and what the user can do',
        control: { type: 'textarea', rows: 3 },
        defaultValue: 'The workspace could not be read. Check that the folder still exists, then try again.',
      },
      {
        name: 'showAction',
        description: 'Render the primary recovery affordance',
        control: { type: 'boolean' },
        defaultValue: true,
      },
      {
        name: 'showSecondaryAction',
        description: 'Render a secondary affordance beside the primary one',
        control: { type: 'boolean' },
        defaultValue: false,
      },
    ],
    variants: [
      {
        name: 'Error with retry',
        description: 'A failure the user can act on directly',
        props: {
          kind: 'error',
          title: '',
          description: 'The workspace could not be read. Check that the folder still exists, then try again.',
          showAction: true,
          showSecondaryAction: false,
        },
      },
      {
        name: 'Denied — permission truth',
        description: 'States the missing permission rather than showing a blank surface',
        props: {
          kind: 'denied',
          title: '',
          description: 'This project has not granted file access. Grant it in Project settings to see deliverables here.',
          showAction: false,
          showSecondaryAction: true,
        },
      },
      {
        name: 'Offline — honest service class',
        description: 'Names which service is unavailable and what still works locally (Decision P8)',
        props: {
          kind: 'offline',
          title: '',
          description: 'The remote project is not reachable. Local sessions and files are unaffected; reconnect to see remote work.',
          showAction: true,
          showSecondaryAction: false,
        },
      },
      {
        name: 'Recovery — only what is real',
        description: 'Offers only recovery that actually exists (Decision S5 — never imply undo)',
        props: {
          kind: 'recovery',
          title: '',
          description: 'The last run stopped before finishing. Its outputs were not written, so re-running is safe.',
          showAction: true,
          showSecondaryAction: false,
        },
      },
      {
        name: 'Error without an action',
        description: 'Nothing can honestly be done here, so no affordance is offered',
        props: {
          kind: 'error',
          title: 'Session could not be restored',
          description: 'This session’s history is unreadable. Its files are intact in the project folder.',
          showAction: false,
          showSecondaryAction: false,
        },
      },
    ],
  },
]

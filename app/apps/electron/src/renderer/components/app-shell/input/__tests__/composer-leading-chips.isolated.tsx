import { expect, test, mock } from 'bun:test'
import type * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildRunTargets } from '@craft-agent/shared/remote'

// `@craft-agent/ui` is a barrel that reaches the PDF preview and so pdfjs, which has
// no working default export under bun. Stub the two primitives the chip actually uses
// rather than loading the whole package for a markup assertion.
mock.module('@craft-agent/ui', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: () => null,
}))

mock.module('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, vars?: Record<string, unknown>) => (vars?.count !== undefined ? `${key}:${vars.count}` : key) }),
}))

const { RunTargetSelector, ComposerAttachChip } = await import('../ComposerLeadingChips')

function targets(options?: { online?: boolean; sessions?: number; noProject?: boolean }) {
  if (options?.noProject) {
    // A device that is paired but has no project yet: the run target exists with no
    // Workspace to create a conversation in.
    return [
      ...buildRunTargets([], { localName: 'This computer' }),
      {
        kind: 'remote' as const, deviceId: 'host-a', key: 'host-a',
        name: 'Studio Mac', url: 'ws://10.0.0.5:9100', workspaces: [], online: true,
      },
    ]
  }
  return buildRunTargets(
    [
      { id: 'l1', name: 'Local' },
      {
        id: 'r1', name: 'Alpha',
        remoteServer: { url: 'ws://10.0.0.5:9100', remoteWorkspaceId: 'ra', deviceId: 'host-a', deviceName: 'Studio Mac' },
      },
    ],
    {
      localName: 'This computer',
      online: options?.online === undefined ? {} : { 'host-a': options.online },
      activeSessions: options?.sessions === undefined ? {} : { ra: options.sessions },
    },
  )
}

test('no chip when this computer is the only option', () => {
  const html = renderToStaticMarkup(
    <RunTargetSelector
      targets={buildRunTargets([{ id: 'l1', name: 'Local' }], { localName: 'This computer' })}
      activeWorkspaceId="l1"
      onSelectWorkspace={() => {}}
    />,
  )
  expect(html).toBe('')
})

test('the chip names the computer the active Workspace lives on', () => {
  const remote = renderToStaticMarkup(
    <RunTargetSelector targets={targets()} activeWorkspaceId="r1" onSelectWorkspace={() => {}} isExpanded />,
  )
  expect(remote).toContain('Studio Mac')

  const local = renderToStaticMarkup(
    <RunTargetSelector targets={targets()} activeWorkspaceId="l1" onSelectWorkspace={() => {}} isExpanded />,
  )
  expect(local).toContain('This computer')
  expect(local).not.toContain('Studio Mac')
})

test('the attach chip counts files and uses the variant label', () => {
  expect(renderToStaticMarkup(
    <ComposerAttachChip variant="compact" attachmentCount={0} onClick={() => {}} isExpanded={false} />,
  )).toContain('chat.attach')

  const withFiles = renderToStaticMarkup(
    <ComposerAttachChip variant="desktop" attachmentCount={2} onClick={() => {}} isExpanded />,
  )
  expect(withFiles).toContain('chat.filesCount:2')
})

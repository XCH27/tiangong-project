import { describe, expect, it } from 'bun:test'

import {
  deriveExecutionTargets,
  filterWorkspacesForExecutionTarget,
  getExecutionTargetId,
  resolveExecutionWorkspaceById,
  resolveWorkspaceForExecutionTarget,
} from '../execution-context-options'

const workspaces = [
  { id: 'local-1', name: 'My Workspace', rootPath: '/Users/me/workspace' },
  { id: 'local-2', name: 'OmniVerse Vision_Codex', rootPath: '/Users/me/vision' },
  {
    id: 'remote-1',
    name: 'Remote API',
    rootPath: '/srv/api',
    remoteServer: {
      url: 'wss://fleet.example.test',
      token: 'secret',
      remoteWorkspaceId: 'api',
    },
  },
  {
    id: 'remote-2',
    name: 'Remote Web',
    rootPath: '/srv/web',
    remoteServer: {
      url: 'wss://fleet.example.test/',
      token: 'secret',
      remoteWorkspaceId: 'web',
    },
  },
]

describe('execution context projections', () => {
  it('keeps project folders out of the local/remote target selector', () => {
    expect(deriveExecutionTargets(workspaces)).toEqual([
      { id: 'local', kind: 'local' },
      {
        id: 'remote:wss://fleet.example.test',
        kind: 'remote',
        url: 'wss://fleet.example.test',
      },
    ])
  })

  it('keeps local available before any local folder has been opened', () => {
    expect(deriveExecutionTargets(workspaces.filter((workspace) => workspace.remoteServer))).toEqual([
      { id: 'local', kind: 'local' },
      {
        id: 'remote:wss://fleet.example.test',
        kind: 'remote',
        url: 'wss://fleet.example.test',
      },
    ])
  })

  it('shows only folders available on the selected execution target', () => {
    expect(
      filterWorkspacesForExecutionTarget(workspaces, 'local').map((workspace) => workspace.name),
    ).toEqual(['My Workspace', 'OmniVerse Vision_Codex'])

    expect(
      filterWorkspacesForExecutionTarget(
        workspaces,
        'remote:wss://fleet.example.test',
      ).map((workspace) => workspace.name),
    ).toEqual(['Remote API', 'Remote Web'])
  })

  it('maps the current workspace to its target and resolves a valid workspace after a target switch', () => {
    expect(getExecutionTargetId(workspaces[0])).toBe('local')
    expect(getExecutionTargetId(workspaces[2])).toBe('remote:wss://fleet.example.test')
    expect(resolveWorkspaceForExecutionTarget(workspaces, 'local', 'remote-1')?.id).toBe('local-1')
    expect(
      resolveWorkspaceForExecutionTarget(
        workspaces,
        'remote:wss://fleet.example.test',
        'remote-2',
      )?.id,
    ).toBe('remote-2')
  })

  it('accepts a newly created workspace before the refreshed workspace list arrives', () => {
    const created = {
      id: 'local-3',
      name: 'New Project',
      rootPath: '/Users/me/new-project',
    }

    expect(resolveExecutionWorkspaceById(workspaces, created.id, created)).toBe(created)
    expect(resolveExecutionWorkspaceById(workspaces, 'local-2', created)?.id).toBe('local-2')
  })
})

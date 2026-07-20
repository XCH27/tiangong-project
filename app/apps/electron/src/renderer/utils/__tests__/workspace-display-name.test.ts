import { describe, expect, it } from 'bun:test'
import { getWorkspaceDisplayName } from '../workspace-display-name'

const t = (key: string) => ({
  'settings.workspace.title': '工作区',
  'workspace.myRemoteWorkspace': '我的远程工作区',
  'workspace.myWorkspace': '我的工作区',
}[key] ?? key)

describe('getWorkspaceDisplayName', () => {
  it('localizes the built-in local workspace name without changing custom names', () => {
    expect(getWorkspaceDisplayName('My Workspace', t)).toBe('我的工作区')
    expect(getWorkspaceDisplayName('客户项目', t)).toBe('客户项目')
  })

  it('localizes the built-in remote workspace name and empty fallback', () => {
    expect(getWorkspaceDisplayName('My Remote Workspace', t)).toBe('我的远程工作区')
    expect(getWorkspaceDisplayName(undefined, t)).toBe('工作区')
  })
})

import { describe, expect, it } from 'bun:test'
import type { ComponentContribution } from '@craft-agent/shared/components'
import { getRightSidebarTool, listRightSidebarTools, registerRightSidebarTool } from '../registry'

const contribution = (over: Partial<ComponentContribution> = {}): ComponentContribution => ({
  id: 'component-demo', slot: 'right-workbench', label: 'settings.tools.title',
  entry: 'component:demo', order: 25, ...over,
})

describe('right-workbench host registry', () => {
  it('exposes stable built-in order and metadata', () => {
    expect(listRightSidebarTools().map(tool => tool.id)).toEqual(['files', 'browser', 'notes', 'history'])
    expect(getRightSidebarTool('notes')?.source).toBe('builtin')
  })

  it('supports reversible contribution registration without replacing built-ins', () => {
    const dispose = registerRightSidebarTool(contribution())
    expect(listRightSidebarTools().map(tool => tool.id)).toEqual(['files', 'browser', 'component-demo', 'notes', 'history'])
    expect(getRightSidebarTool('component-demo')?.source).toBe('component')
    dispose()
    expect(getRightSidebarTool('component-demo')).toBeUndefined()
    expect(listRightSidebarTools().map(tool => tool.id)).toEqual(['files', 'browser', 'notes', 'history'])
  })

  it('refuses a contribution addressed to another slot', () => {
    expect(() => registerRightSidebarTool(contribution({ slot: 'left-rail' })))
      .toThrow(/right-workbench/)
    expect(getRightSidebarTool('component-demo')).toBeUndefined()
  })

  it('refuses to shadow an existing id', () => {
    expect(() => registerRightSidebarTool(contribution({ id: 'notes' }))).toThrow(/already registered/)
    expect(getRightSidebarTool('notes')?.source).toBe('builtin')
  })

  it('sorts a contribution with no order last rather than dropping it', () => {
    const dispose = registerRightSidebarTool(contribution({ id: 'no-order', order: undefined }))
    expect(listRightSidebarTools().map(tool => tool.id).at(-1)).toBe('no-order')
    dispose()
  })

  it('resolves built-in icon names and tolerates one this host does not know', () => {
    expect(getRightSidebarTool('files')?.iconComponent).toBeDefined()
    const dispose = registerRightSidebarTool(contribution({ id: 'odd-icon', icon: 'not-a-known-icon' }))
    const tool = getRightSidebarTool('odd-icon')
    expect(tool).toBeDefined()
    expect(tool?.iconComponent).toBeUndefined()
    dispose()
  })

  it('keeps built-ins shaped as ComponentContribution so a Component is not a special case', () => {
    const files = getRightSidebarTool('files')
    expect(files?.slot).toBe('right-workbench')
    expect(files?.entry).toBe('builtin:files')
    expect(typeof files?.label).toBe('string')
  })
})

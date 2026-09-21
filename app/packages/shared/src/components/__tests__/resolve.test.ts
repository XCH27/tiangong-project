import { describe, expect, it } from 'bun:test'
import { resolveWorkspaceComponents, type ComponentManifest } from '../index.ts'

const manifest = (id: string, dependencies: ComponentManifest['dependencies'] = []): ComponentManifest => ({
  id, version: '1.0.0', publisher: 'fleet', license: 'Apache-2.0', contributions: [], dependencies,
})

describe('workspace component composition', () => {
  it('resolves global components and workspace overrides deterministically', () => {
    const result = resolveWorkspaceComponents([manifest('video'), manifest('research')], {
      globalEnabled: ['video'], workspaceEnabled: ['research'],
      overrides: { video: { settings: { exportFormat: 'mp4' } } },
    })
    expect(result.unavailable).toEqual([])
    expect(result.active.map(item => [item.manifest.id, item.scope])).toEqual([['video', 'global'], ['research', 'workspace']])
    expect(result.active[0]?.settings).toEqual({ exportFormat: 'mp4' })
  })

  it('does not impose a component-count limit and reports missing required dependencies', () => {
    const ids = Array.from({ length: 12 }, (_, index) => `component-${index}`)
    const result = resolveWorkspaceComponents(ids.map(id => manifest(id)), { globalEnabled: ids, workspaceEnabled: [], overrides: {} })
    expect(result.active).toHaveLength(12)
    const missing = resolveWorkspaceComponents([manifest('video', [{ id: 'renderer', version: '1.0.0' }])], {
      globalEnabled: ['video'], workspaceEnabled: [], overrides: {},
    })
    expect(missing.active).toEqual([])
    expect(missing.unavailable[0]?.reason).toContain('renderer')
  })

  it('keeps optional dependencies from blocking the basic component', () => {
    const result = resolveWorkspaceComponents([manifest('video', [{ id: 'transcription', version: '1.0.0', optional: true }])], {
      globalEnabled: [], workspaceEnabled: ['video'], overrides: {},
    })
    expect(result.active.map(item => item.manifest.id)).toEqual(['video'])
    expect(result.unavailable).toEqual([])
  })
})

describe('dependency version enforcement', () => {
  const at = (id: string, version: string, dependencies: ComponentManifest['dependencies'] = []): ComponentManifest => ({
    id, version, publisher: 'fleet', license: 'Apache-2.0', contributions: [], dependencies,
  })

  it('refuses a dependent whose required version is newer than what is installed', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'lib', version: '2.0.0' }]), at('lib', '1.0.0')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id)).toEqual([])
    expect(result.unavailable[0]?.reason).toContain('requires 2.0.0, found 1.0.0')
  })

  it('refuses across a major boundary even when the installed version is newer', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'lib', version: '1.0.0' }]), at('lib', '2.0.0')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id)).toEqual([])
  })

  it('admits a compatible newer minor or patch', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'lib', version: '1.2.0' }]), at('lib', '1.4.1')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id).sort()).toEqual(['app', 'lib'])
  })

  it('treats an unparseable version as incompatible rather than admitting it', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'lib', version: 'latest' }]), at('lib', '1.0.0')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id)).toEqual([])
  })
})

describe('optional dependencies are not activated by their dependent', () => {
  const at = (id: string, version: string, dependencies: ComponentManifest['dependencies'] = []): ComponentManifest => ({
    id, version, publisher: 'fleet', license: 'Apache-2.0', contributions: [], dependencies,
  })

  it('does not activate an installed optional dependency the user never enabled', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'extra', version: '1.0.0', optional: true }]), at('extra', '1.0.0')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id)).toEqual(['app'])
    expect(result.unavailable).toEqual([])
  })

  it('still activates an optional dependency the user did enable, with its own settings', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'extra', version: '1.0.0', optional: true }]), at('extra', '1.0.0')],
      { globalEnabled: ['app', 'extra'], workspaceEnabled: [], overrides: { extra: { settings: { level: 2 } } } },
    )
    expect(result.active.map(item => item.manifest.id).sort()).toEqual(['app', 'extra'])
    expect(result.active.find(item => item.manifest.id === 'extra')?.settings).toEqual({ level: 2 })
  })

  it('ignores an optional dependency whose installed version is incompatible', () => {
    const result = resolveWorkspaceComponents(
      [at('app', '1.0.0', [{ id: 'extra', version: '2.0.0', optional: true }]), at('extra', '1.0.0')],
      { globalEnabled: ['app'], workspaceEnabled: [], overrides: {} },
    )
    expect(result.active.map(item => item.manifest.id)).toEqual(['app'])
    expect(result.unavailable).toEqual([])
  })
})

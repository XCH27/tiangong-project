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

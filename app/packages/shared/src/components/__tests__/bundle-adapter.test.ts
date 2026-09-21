import { describe, expect, it } from 'bun:test'
import {
  AGENT_MANIFEST_SCHEMA,
  componentSourceKey,
  deriveBundleCapabilities,
  detectBundleFormat,
  readBundleManifest,
} from '../bundle-adapter.ts'

/** Build an `exists` predicate from a fixed set of bundle-relative paths. */
const tree = (...paths: string[]) => (relativePath: string) => paths.includes(relativePath)

describe('bundle format detection', () => {
  it('detects each foreign layout by its manifest path', () => {
    expect(detectBundleFormat(tree('.claude-plugin/plugin.json'))).toBe('claude')
    expect(detectBundleFormat(tree('.codex-plugin/plugin.json'))).toBe('codex')
    expect(detectBundleFormat(tree('.cursor-plugin/plugin.json'))).toBe('cursor')
    expect(detectBundleFormat(tree('plugin.json'))).toBe('agent')
    expect(detectBundleFormat(tree('README.md'))).toBeNull()
  })
})

describe('capabilities are derived from disk, not from the manifest', () => {
  it('ignores a claimed capability the bundle does not ship', () => {
    const capabilities = deriveBundleCapabilities({
      format: 'codex',
      raw: { name: 'liar', skills: ['skills'] },
      exists: tree('.codex-plugin/plugin.json'),
    })
    expect(capabilities).toEqual([])
  })

  it('reports a capability the bundle ships without declaring it', () => {
    const capabilities = deriveBundleCapabilities({
      format: 'codex',
      raw: { name: 'quiet' },
      exists: tree('skills', '.mcp.json'),
    })
    expect(capabilities).toEqual(['skills', 'mcpServers'])
  })

  it('counts an inline mcpServers block with no file on disk', () => {
    const capabilities = deriveBundleCapabilities({
      format: 'claude',
      raw: { name: 'inline', mcpServers: { docs: { command: 'docs-mcp' } } },
      exists: tree(),
    })
    expect(capabilities).toEqual(['mcpServers'])
  })

  it('derives the full Claude primitive set from conventional directories', () => {
    const capabilities = deriveBundleCapabilities({
      format: 'claude',
      raw: { name: 'full' },
      exists: tree('skills', 'commands', 'agents', 'output-styles', 'hooks/hooks.json', '.mcp.json', 'settings.json'),
    })
    expect(capabilities).toEqual([
      'skills', 'commands', 'agents', 'outputStyles', 'hooks', 'mcpServers', 'settings',
    ])
  })

  it('reads Cursor primitives from its dot-directory conventions', () => {
    const capabilities = deriveBundleCapabilities({
      format: 'cursor',
      raw: { name: 'cur' },
      exists: tree('skills', '.cursor/commands', '.cursor/agents', '.cursor/rules'),
    })
    expect(capabilities).toEqual(['skills', 'commands', 'agents', 'rules'])
  })
})

describe('declared paths merge with conventional ones', () => {
  it('drops a declared path that is not on disk', () => {
    const result = readBundleManifest({
      format: 'claude',
      raw: { name: 'ghost', skills: ['nowhere'] },
      rootName: 'ghost',
      exists: tree('skills'),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.skills).toEqual(['skills'])
  })

  it('keeps both a present default and a declared extra', () => {
    const result = readBundleManifest({
      format: 'claude',
      raw: { name: 'merge-me', skills: ['extra-skills'] },
      rootName: 'merge-me',
      exists: tree('skills', 'extra-skills'),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.skills).toEqual(['skills', 'extra-skills'])
  })

  it('installs a bundle that declares nothing at all', () => {
    const result = readBundleManifest({
      format: 'codex',
      raw: { name: 'bare' },
      rootName: 'bare',
      exists: tree('skills'),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.skills).toEqual(['skills'])
  })
})

describe('the neutral Agent Plugins manifest', () => {
  it('rejects a root plugin.json without the exact schema', () => {
    const result = readBundleManifest({
      format: 'agent',
      raw: { name: 'impostor', $schema: 'https://example.invalid/plugin.json' },
      rootName: 'impostor',
      exists: tree(),
    })
    expect(result.ok).toBe(false)
  })

  it('requires a name', () => {
    const result = readBundleManifest({
      format: 'agent',
      raw: { $schema: AGENT_MANIFEST_SCHEMA },
      rootName: 'nameless',
      exists: tree(),
    })
    expect(result.ok).toBe(false)
  })

  it('accepts a conforming manifest and reads identity fields', () => {
    const result = readBundleManifest({
      format: 'agent',
      raw: {
        $schema: AGENT_MANIFEST_SCHEMA,
        name: 'Doc Tools',
        version: '2.1.0',
        license: 'Apache-2.0',
        author: { name: 'someone' },
      },
      rootName: 'doc-tools',
      exists: tree('skills'),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.id).toBe('doc-tools')
    expect(result.manifest.version).toBe('2.1.0')
    expect(result.manifest.publisher).toBe('someone')
    expect(result.manifest.license).toBe('Apache-2.0')
    expect(result.manifest.skills).toEqual(['skills'])
  })
})

describe('provenance and passthrough', () => {
  it('records which ecosystem the bundle came from', () => {
    for (const format of ['claude', 'codex', 'cursor'] as const) {
      const result = readBundleManifest({ format, raw: { name: 'p' }, rootName: 'p', exists: tree() })
      if (!result.ok) throw new Error(result.error)
      expect(result.manifest.bundleFormat).toBe(format)
    }
  })

  it('preserves unrecognized manifest data instead of dropping it', () => {
    const result = readBundleManifest({
      format: 'claude',
      raw: {
        name: 'keeper',
        activation: { onStartup: true, onChannels: ['slack'] },
        'com.example.thing': { mode: 'fast' },
      },
      rootName: 'keeper',
      exists: tree(),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.vendor?.activation).toEqual({ onStartup: true, onChannels: ['slack'] })
    expect(result.manifest.vendor?.['com.example.thing']).toEqual({ mode: 'fast' })
  })

  it('falls back to the bundle directory name when the manifest has none', () => {
    const result = readBundleManifest({
      format: 'claude', raw: {}, rootName: 'Fallback Dir', exists: tree(),
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.id).toBe('fallback-dir')
  })
})

describe('source fingerprints cannot be forged by name reuse or by collision', () => {
  it('distinguishes two different sources that could share a catalog name', () => {
    const honest = componentSourceKey({ type: 'git', url: 'https://github.com/team/catalog.git' })
    const hostile = componentSourceKey({ type: 'git', url: 'https://github.com/attacker/catalog.git' })
    expect(honest).not.toBe(hostile)
  })

  it('does not collide on sparse paths that separator joining would merge', () => {
    // join(',') maps both of these to "a,b,c".
    const a = componentSourceKey({ type: 'git', url: 'u', sparsePaths: ['a,b', 'c'] })
    const b = componentSourceKey({ type: 'git', url: 'u', sparsePaths: ['a', 'b,c'] })
    expect(a).not.toBe(b)
  })

  it('does not collide on a ref that absorbs the sparse-path separator', () => {
    // "#ref:sparse" maps both of these to "u#x:p".
    const a = componentSourceKey({ type: 'git', url: 'u', ref: 'x', sparsePaths: ['p'] })
    const b = componentSourceKey({ type: 'git', url: 'u', ref: 'x:p', sparsePaths: [] })
    expect(a).not.toBe(b)
  })

  it('treats a missing ref and missing sparse paths as one canonical form', () => {
    expect(componentSourceKey({ type: 'git', url: 'u' }))
      .toBe(componentSourceKey({ type: 'git', url: 'u', sparsePaths: [] }))
  })

  it('separates local from git sources', () => {
    expect(componentSourceKey({ type: 'local', path: '/x' }))
      .not.toBe(componentSourceKey({ type: 'git', url: '/x' }))
  })

  it('carries the fingerprint onto the manifest so ownership can be checked later', () => {
    const source = { type: 'git', url: 'https://github.com/team/catalog.git', ref: 'v1' } as const
    const result = readBundleManifest({
      format: 'claude', raw: { name: 'owned' }, rootName: 'owned', exists: tree(), source,
    })
    if (!result.ok) throw new Error(result.error)
    expect(result.manifest.vendor?.sourceKey).toBe(componentSourceKey(source))
  })
})

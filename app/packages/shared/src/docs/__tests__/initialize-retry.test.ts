import { describe, expect, it } from 'bun:test'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const appRoot = resolve(import.meta.dir, '../../../../../')

describe('installed Craft documentation', () => {
  it('retries after the bundled assets root becomes available', () => {
    const profile = mkdtempSync(join(tmpdir(), 'craft-docs-retry-'))
    const docsModule = join(appRoot, 'packages/shared/src/docs/index.ts')
    const pathsModule = join(appRoot, 'packages/shared/src/utils/paths.ts')
    const assetsRoot = join(appRoot, 'apps/electron')
    const script = `
      const { initializeDocs } = await import(${JSON.stringify(docsModule)})
      const { setBundledAssetsRoot } = await import(${JSON.stringify(pathsModule)})
      initializeDocs()
      setBundledAssetsRoot(${JSON.stringify(assetsRoot)})
      initializeDocs()
    `

    try {
      const result = Bun.spawnSync([process.execPath, '-e', script], {
        cwd: profile,
        env: { ...process.env, CRAFT_CONFIG_DIR: profile },
      })
      expect(result.exitCode, result.stderr.toString()).toBe(0)
      expect(existsSync(join(profile, 'docs/craft/index.md'))).toBe(true)
      expect(existsSync(join(profile, 'docs/craft/source-guides/github.md'))).toBe(true)
    } finally {
      rmSync(profile, { recursive: true, force: true })
    }
  })
})

import { describe, expect, it } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf-8')
}

describe('distribution safety', () => {
  it('keeps every Docker COPY source resolvable from the build context', () => {
    const dockerfile = read('Dockerfile.server')
    const missing: string[] = []

    for (const line of dockerfile.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('COPY ')) continue
      const parts = trimmed.split(/\s+/).slice(1).filter((part) => !part.startsWith('--'))
      for (const source of parts.slice(0, -1)) {
        if (!existsSync(join(root, source))) missing.push(source)
      }
    }

    expect(missing).toEqual([])
  })

  it('does not let release sweep the working tree into a version commit', () => {
    const releaseScript = read('scripts/release.ts')
    expect(releaseScript).not.toContain('git add -A')
    expect(releaseScript).toContain('git status --porcelain=v1 --untracked-files=all')
    expect(releaseScript).toContain('git add -- ${packageFiles}')
    expect(releaseScript).toContain('fileURLToPath(import.meta.url)')
  })

  it('has no implicit upstream Craft binary install endpoint', () => {
    const shellInstaller = read('scripts/install-app.sh')
    const powershellInstaller = read('scripts/install-app.ps1')
    for (const installer of [shellInstaller, powershellInstaller]) {
      expect(installer).not.toContain('https://agents.craft.do/electron')
      expect(installer).toContain('FLEET_INSTALL_VERSIONS_URL')
    }
  })

  it('fails upload before a build while the Fleet uploader is absent', () => {
    expect(existsSync(join(root, 'scripts/upload.ts'))).toBe(false)
    const buildScript = read('scripts/build.ts')
    expect(buildScript).toContain("values.upload && !existsSync(join(rootDir, 'scripts', 'upload.ts'))")
  })

  it('makes the unimplemented configuration CLI fail explicitly', () => {
    const wrapper = read('apps/electron/resources/bin/craft-agent')
    const windowsWrapper = read('apps/electron/resources/bin/craft-agent.cmd')
    expect(wrapper).toContain('[ ! -f "$ENTRY" ]')
    expect(wrapper).toContain('exit 64')
    expect(windowsWrapper).toContain('if not exist "%CRAFT_COMMANDS_BIN%" goto :unavailable')
    expect(windowsWrapper).toContain('exit /b 64')
  })

  it('pins standalone app workflows to the package-manager Bun version', () => {
    const packageManager = JSON.parse(read('package.json')).packageManager as string
    const expectedVersion = packageManager.replace(/^bun@/, '')
    for (const workflow of [
      read('.github/workflows/validate.yml'),
      read('.github/workflows/validate-server.yml'),
    ]) {
      expect(workflow).toContain(`bun-version: "${expectedVersion}"`)
    }
  })
})

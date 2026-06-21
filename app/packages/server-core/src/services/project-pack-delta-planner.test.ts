import { describe, expect, it } from 'bun:test'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  discoverRelatedFiles,
  listGitChangedFiles,
  planProjectPackDelta,
} from './project-pack-delta-planner'

function initGitRepo(root: string): void {
  execFileSync('git', ['init'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'Test User'], { cwd: root, stdio: 'ignore' })
}

describe('project pack delta planner', () => {
  it('lists git changed files from diff, staged, and untracked', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pack-delta-'))
    initGitRepo(root)
    await writeFile(join(root, 'tracked.txt'), 'a\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: root, stdio: 'ignore' })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: root, stdio: 'ignore' })
    await writeFile(join(root, 'tracked.txt'), 'a\nb\n')
    await writeFile(join(root, 'new.txt'), 'new\n')

    const changed = listGitChangedFiles(root)
    expect(changed).toContain('tracked.txt')
    expect(changed).toContain('new.txt')

    await rm(root, { recursive: true, force: true })
  })

  it('discovers related imports from changed seeds', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pack-delta-related-'))
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'util.ts'), 'export const util = 1\n')
    await writeFile(join(root, 'src', 'index.ts'), "import { util } from './util'\nexport const main = util\n")

    const related = await discoverRelatedFiles(root, ['src/index.ts'])
    expect(related).toContain('src/util.ts')

    await rm(root, { recursive: true, force: true })
  })

  it('plans delta pack with git changes, related files, and exclusion reasons', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pack-delta-plan-'))
    initGitRepo(root)
    await mkdir(join(root, 'src'), { recursive: true })
    await writeFile(join(root, 'src', 'helper.ts'), 'export const helper = 1\n')
    await writeFile(join(root, 'src', 'index.ts'), "import { helper } from './helper'\nexport const x = helper\n")
    await writeFile(join(root, '.env'), 'SECRET=abc\n')
    await writeFile(join(root, 'logo.png'), Buffer.from([0, 1, 2, 3]))
    execFileSync('git', ['add', '.'], { cwd: root, stdio: 'ignore' })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: root, stdio: 'ignore' })
    await writeFile(join(root, 'src', 'index.ts'), "import { helper } from './helper'\nexport const x = helper + 1\n")
    await writeFile(join(root, '.env'), 'SECRET=changed\n')
    await writeFile(join(root, 'logo.png'), Buffer.from([0, 1, 2, 3, 4]))

    const plan = await planProjectPackDelta({ rootPath: root })
    expect(plan.mode).toBe('diff')
    expect(plan.gitChangedFiles).toContain('src/index.ts')
    expect(plan.relatedFiles).toContain('src/helper.ts')
    expect(plan.included.some((f) => f.relativePath === 'src/index.ts' && f.source === 'git_changed')).toBe(true)
    expect(plan.included.some((f) => f.relativePath === 'src/helper.ts' && f.source === 'related')).toBe(true)
    expect(plan.excluded.some((e) => e.reason === 'env_file')).toBe(true)
    expect(plan.excluded.some((e) => e.reason === 'binary')).toBe(true)
    expect(plan.estimatedTokens).toBeGreaterThan(0)
    expect(plan.tokenEstimateKind).toBe('estimate')

    await rm(root, { recursive: true, force: true })
  })

  it('filters changed files by mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pack-delta-mode-'))
    initGitRepo(root)
    await writeFile(join(root, 'tracked.txt'), 'a\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: root, stdio: 'ignore' })
    execFileSync('git', ['commit', '-m', 'init'], { cwd: root, stdio: 'ignore' })
    await writeFile(join(root, 'tracked.txt'), 'a\nb\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: root, stdio: 'ignore' })
    await writeFile(join(root, 'new.txt'), 'new\n')

    expect(listGitChangedFiles(root, 'staged')).toEqual(['tracked.txt'])
    expect(listGitChangedFiles(root, 'untracked')).toEqual(['new.txt'])

    await rm(root, { recursive: true, force: true })
  })
})

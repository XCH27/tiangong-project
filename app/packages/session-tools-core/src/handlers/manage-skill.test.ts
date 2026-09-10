import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { handleManageSkill } from './manage-skill.ts'
import type { SessionToolContext } from '../context.ts'

let workspaceRoot: string
let projectRoot: string

const SKILL = `---\nname: Compliance review\ndescription: reviews compliance\n---\n\nSteps.\n`

function ctx(withProject = true): SessionToolContext {
  return {
    workspacePath: workspaceRoot,
    ...(withProject ? { workingDirectory: projectRoot } : {}),
  } as unknown as SessionToolContext
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'manage-skill-ws-'))
  projectRoot = mkdtempSync(join(tmpdir(), 'manage-skill-proj-'))
})

afterEach(() => {
  rmSync(workspaceRoot, { recursive: true, force: true })
  rmSync(projectRoot, { recursive: true, force: true })
})

describe('manage_skill · write', () => {
  it('writes a skill into the workspace scope', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'compliance-review',
      scope: 'workspace',
      content: SKILL,
    })
    expect(result.isError).toBe(false)
    expect(readFileSync(join(workspaceRoot, 'skills/compliance-review/SKILL.md'), 'utf-8')).toBe(SKILL)
    const data = JSON.parse(result.content[0]?.text ?? '{}')
    expect(data.touchedSharedGlobal).toBe(false)
  })

  it('writes into the project scope under .agents/skills', async () => {
    await handleManageSkill(ctx(), { action: 'write', slug: 'pdf', scope: 'project', content: SKILL })
    expect(existsSync(join(projectRoot, '.agents/skills/pdf/SKILL.md'))).toBe(true)
  })

  it('refuses frontmatter without a description, because the loader would skip it silently', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'pdf',
      scope: 'workspace',
      content: '---\nname: Only a name\n---\n\nBody.\n',
    })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('description')
    expect(existsSync(join(workspaceRoot, 'skills/pdf'))).toBe(false)
  })

  it('refuses content with no frontmatter block at all', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'pdf',
      scope: 'workspace',
      content: '# Just a heading\n',
    })
    expect(result.isError).toBe(true)
    expect(existsSync(join(workspaceRoot, 'skills/pdf'))).toBe(false)
  })

  it('refuses an unclosed frontmatter block', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'pdf',
      scope: 'workspace',
      content: '---\nname: X\ndescription: Y\n\nBody without a closing fence.\n',
    })
    expect(result.isError).toBe(true)
  })

  it('refuses a slug that could escape the scope directory', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: '../escape',
      scope: 'workspace',
      content: SKILL,
    })
    expect(result.isError).toBe(true)
    expect(existsSync(join(workspaceRoot, 'skills'))).toBe(false)
  })

  it('refuses an unknown scope rather than picking one', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'pdf',
      scope: 'everywhere' as never,
      content: SKILL,
    })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('scope must be one of')
  })

  it('says the project scope is unavailable when no project is bound', async () => {
    const result = await handleManageSkill(ctx(false), {
      action: 'write',
      slug: 'pdf',
      scope: 'project',
      content: SKILL,
    })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('project folder')
  })

  it('never overwrites an existing skill', async () => {
    await handleManageSkill(ctx(), { action: 'write', slug: 'pdf', scope: 'workspace', content: SKILL })
    const second = await handleManageSkill(ctx(), {
      action: 'write',
      slug: 'pdf',
      scope: 'workspace',
      content: '---\nname: Other\ndescription: other\n---\n',
    })
    expect(second.isError).toBe(true)
    expect(readFileSync(join(workspaceRoot, 'skills/pdf/SKILL.md'), 'utf-8')).toBe(SKILL)
  })
})

describe('manage_skill · move', () => {
  function install(slug: string) {
    const dir = join(workspaceRoot, 'skills', slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'SKILL.md'), SKILL, 'utf-8')
  }

  it('moves a skill between scopes and reports where it landed', async () => {
    install('pdf')
    const result = await handleManageSkill(ctx(), {
      action: 'move',
      slug: 'pdf',
      fromScope: 'workspace',
      scope: 'project',
    })
    expect(result.isError).toBe(false)
    expect(existsSync(join(projectRoot, '.agents/skills/pdf/SKILL.md'))).toBe(true)
    expect(existsSync(join(workspaceRoot, 'skills/pdf'))).toBe(false)
    expect(JSON.parse(result.content[0]?.text ?? '{}').message).toContain('project')
  })

  it('requires both scopes', async () => {
    install('pdf')
    const result = await handleManageSkill(ctx(), { action: 'move', slug: 'pdf', scope: 'project' })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('fromScope')
  })

  it('reports a missing source rather than creating an empty target', async () => {
    const result = await handleManageSkill(ctx(), {
      action: 'move',
      slug: 'ghost',
      fromScope: 'workspace',
      scope: 'project',
    })
    expect(result.isError).toBe(true)
    expect(existsSync(join(projectRoot, '.agents/skills/ghost'))).toBe(false)
  })
})

describe('manage_skill · guards', () => {
  it('rejects an unknown action', async () => {
    const result = await handleManageSkill(ctx(), { action: 'delete' as never, slug: 'pdf' })
    expect(result.isError).toBe(true)
  })

  it('requires a slug', async () => {
    const result = await handleManageSkill(ctx(), { action: 'write', slug: '  ', scope: 'workspace', content: SKILL })
    expect(result.isError).toBe(true)
  })

  it('requires a workspace', async () => {
    const result = await handleManageSkill({} as SessionToolContext, {
      action: 'write',
      slug: 'pdf',
      scope: 'workspace',
      content: SKILL,
    })
    expect(result.isError).toBe(true)
  })
})

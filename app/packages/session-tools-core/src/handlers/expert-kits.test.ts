import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { handleListExpertKits, handleManageExpertKit } from './expert-kits.ts'
import { invalidateSkillsCache } from '@craft-agent/shared/skills'
import type { SessionToolContext } from '../context.ts'

let workspaceRoot: string

/** Minimal context: these handlers only read workingDirectory / workspacePath. */
function ctx(): SessionToolContext {
  return { workingDirectory: workspaceRoot, workspacePath: workspaceRoot } as unknown as SessionToolContext
}

function installSkill(slug: string, name = slug, description = `does ${slug}`) {
  const dir = join(workspaceRoot, 'skills', slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(
    join(dir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\nBody of ${slug}.\n`,
    'utf-8',
  )
}

function payload(result: { content: Array<{ text?: string }> }) {
  return JSON.parse(result.content[0]?.text ?? '{}')
}

beforeEach(() => {
  workspaceRoot = mkdtempSync(join(tmpdir(), 'expert-kit-tools-'))
  mkdirSync(join(workspaceRoot, 'skills'), { recursive: true })
  // loadAllSkills caches for 5 minutes; the running app invalidates on skill
  // file events (config watcher, SessionManager) and these tests must do the
  // same or they assert against a previous test's tree.
  invalidateSkillsCache()
})

afterEach(() => {
  rmSync(workspaceRoot, { recursive: true, force: true })
})

describe('list_expert_kits', () => {
  it('reports installed skills with the scope they apply at', async () => {
    installSkill('compliance-review', '合规审查')
    const result = await handleListExpertKits(ctx(), {})
    const data = payload(result)
    expect(result.isError).toBe(false)
    // Presence, not equality: loadAllSkills also reads the machine's global
    // ~/.agents/skills, which is not this test's to control.
    expect(data.availableSkills).toContainEqual(
      expect.objectContaining({ slug: 'compliance-review', name: '合规审查', scope: 'workspace' }),
    )
  })

  it('omits the available skills when the caller does not want them', async () => {
    installSkill('a')
    const data = payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false }))
    expect(data.availableSkills).toBeUndefined()
    expect(data.kits).toEqual([])
  })

  it('lists a created kit with its resolved skills', async () => {
    installSkill('draft-contract')
    await handleManageExpertKit(ctx(), { action: 'create', name: 'Legal', skills: ['draft-contract'] })
    const data = payload(await handleListExpertKits(ctx(), {}))
    expect(data.kits).toHaveLength(1)
    expect(data.kits[0]).toEqual(
      expect.objectContaining({ name: 'Legal', skills: ['draft-contract'], skillsNotInstalled: [] }),
    )
  })

  it('names a declared skill that stopped being installed', async () => {
    installSkill('draft-contract')
    await handleManageExpertKit(ctx(), { action: 'create', name: 'Legal', skills: ['draft-contract'] })
    rmSync(join(workspaceRoot, 'skills', 'draft-contract'), { recursive: true, force: true })
    invalidateSkillsCache()

    const data = payload(await handleListExpertKits(ctx(), {}))
    expect(data.kits[0].skills).toEqual([])
    // Reporting it is the point: a kit that silently shrinks reads as a
    // specialist that cannot do its job.
    expect(data.kits[0].skillsNotInstalled).toEqual(['draft-contract'])
  })

  it('does not list plain functional labels as kits', async () => {
    await handleManageExpertKit(ctx(), { action: 'create', name: 'Kit' })
    const { createLabel } = await import('@craft-agent/shared/labels/crud')
    createLabel(workspaceRoot, { name: 'just-a-tag' })

    const data = payload(await handleListExpertKits(ctx(), {}))
    expect(data.kits.map((k: { name: string }) => k.name)).toEqual(['Kit'])
  })
})

describe('manage_expert_kit', () => {
  it('creates a kit and persists it', async () => {
    installSkill('a')
    const result = await handleManageExpertKit(ctx(), {
      action: 'create',
      name: 'Analyst',
      systemPromptPreset: 'Be precise.',
      skills: ['a'],
    })
    expect(result.isError).toBe(false)
    const data = payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false }))
    expect(data.kits[0]).toEqual(
      expect.objectContaining({ name: 'Analyst', systemPromptPreset: 'Be precise.', skills: ['a'] }),
    )
  })

  it('refuses a skill that is not installed rather than writing a kit that shrinks', async () => {
    const result = await handleManageExpertKit(ctx(), {
      action: 'create',
      name: 'Legal',
      skills: ['not-installed'],
    })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('not-installed')
    expect(payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false })).kits).toEqual([])
  })

  it('replaces the skill list whole on update', async () => {
    installSkill('a')
    installSkill('b')
    const created = payload(
      await handleManageExpertKit(ctx(), { action: 'create', name: 'K', skills: ['a', 'b'] }),
    )
    await handleManageExpertKit(ctx(), { action: 'update', labelId: created.id, skills: ['b'] })
    const data = payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false }))
    expect(data.kits[0].skills).toEqual(['b'])
  })

  it('keeps the skills when an update only renames', async () => {
    installSkill('a')
    const created = payload(
      await handleManageExpertKit(ctx(), { action: 'create', name: 'K', skills: ['a'] }),
    )
    await handleManageExpertKit(ctx(), { action: 'update', labelId: created.id, name: 'Renamed' })
    const data = payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false }))
    expect(data.kits[0]).toEqual(expect.objectContaining({ name: 'Renamed', skills: ['a'] }))
  })

  it('records a permission mode as a request and says so', async () => {
    const created = payload(await handleManageExpertKit(ctx(), { action: 'create', name: 'K' }))
    const result = await handleManageExpertKit(ctx(), {
      action: 'update',
      labelId: created.id,
      requestedPermissionMode: 'allow-all',
    })
    const data = payload(result)
    expect(data.requestedPermissionMode).toBe('allow-all')
    // The tool must never let the model believe it just granted itself anything.
    expect(data.note).toContain('request')
  })

  it('rejects a permission mode outside the fixed set', async () => {
    const result = await handleManageExpertKit(ctx(), {
      action: 'create',
      name: 'K',
      requestedPermissionMode: 'root' as never,
    })
    expect(result.isError).toBe(true)
  })

  it('deletes a kit', async () => {
    const created = payload(await handleManageExpertKit(ctx(), { action: 'create', name: 'Gone' }))
    const result = await handleManageExpertKit(ctx(), { action: 'delete', labelId: created.id })
    expect(result.isError).toBe(false)
    expect(payload(await handleListExpertKits(ctx(), { includeAvailableSkills: false })).kits).toEqual([])
  })

  it('requires the ids and names each action actually needs', async () => {
    expect((await handleManageExpertKit(ctx(), { action: 'create' })).isError).toBe(true)
    expect((await handleManageExpertKit(ctx(), { action: 'update' })).isError).toBe(true)
    expect((await handleManageExpertKit(ctx(), { action: 'delete' })).isError).toBe(true)
    expect((await handleManageExpertKit(ctx(), { action: 'wat' as never })).isError).toBe(true)
  })

  it('reports a missing kit rather than creating one', async () => {
    const result = await handleManageExpertKit(ctx(), { action: 'update', labelId: 'nope', name: 'X' })
    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('nope')
  })
})

import { describe, expect, it, beforeEach, afterEach } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import {
  createAssistant,
  listAssistants,
  assistantWornBy,
} from '../storage.ts'
import { createSession } from '../../sessions/storage.ts'

let root: string

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'fleet-assistants-'))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe('assistant catalog', () => {
  it('creates a person-made identity and lists it', () => {
    const a = createAssistant(root, { name: 'Writer', systemPrompt: 'Be brief.' })
    expect(a.source).toBe('user')
    expect(listAssistants(root).map((x) => x.id)).toEqual([a.id])
  })

  it('reads the first identity from its real Session record', async () => {
    const a = createAssistant(root, { name: 'Writer' })
    const session = await createSession(root, { assistantId: a.id })
    expect(assistantWornBy(root, session.id)).toBe(a.id)
  })

  it('does not create imaginary Session bindings and rejects traversal', () => {
    expect(assistantWornBy(root, 'missing')).toBeNull()
    expect(() => assistantWornBy(root, '../existing')).toThrow()
  })

  it('uses persisted Session identity instead of a stale compatibility wearing map', async () => {
    const writer = createAssistant(root, { name: 'Writer' })
    const session = await createSession(root, { assistantId: writer.id })

    // Simulate an older map entry disagreeing with the Session header.
    const wearing = { schemaVersion: 1, bySession: {} as Record<string, string> }
    wearing.bySession[session.id] = 'stale'
    writeFileSync(join(root, 'assistants/wearing.json'), JSON.stringify(wearing))

    expect(assistantWornBy(root, session.id)).toBe(writer.id)

    const unassigned = await createSession(root)
    wearing.bySession[unassigned.id] = 'stale'
    writeFileSync(join(root, 'assistants/wearing.json'), JSON.stringify(wearing))
    expect(assistantWornBy(root, unassigned.id)).toBeNull()
  })

  it('refuses to overwrite a corrupt catalog as though it were empty', () => {
    createAssistant(root, { name: 'Writer' })
    const path = join(root, 'assistants/config.json')
    writeFileSync(path, '{invalid')
    expect(() => createAssistant(root, { name: 'New' })).toThrow()
    expect(readFileSync(path, 'utf8')).toBe('{invalid')
  })
})

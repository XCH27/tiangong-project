import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { atomicWriteFileSync, readJsonFileSync } from '../utils/files.ts'
import { getSessionFilePath } from '../sessions/storage.ts'
import { readSessionHeader } from '../sessions/jsonl.ts'
import { validateSessionId } from '../sessions/validation.ts'
import {
  createGeneratedAssistant,
  createUserAssistant,
  type Assistant,
  type AssistantSource,
} from './types.ts'
import { validateAssistant } from './validate.ts'

const DIR = 'assistants'
const CATALOG_FILE = 'assistants/config.json'

export type AssistantCatalog = {
  schemaVersion: 1
  assistants: Assistant[]
}

function catalogPath(root: string): string {
  return join(root, CATALOG_FILE)
}

function ensureDir(root: string): void {
  const dir = join(root, DIR)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export function emptyCatalog(): AssistantCatalog {
  return { schemaVersion: 1, assistants: [] }
}

export function loadCatalog(workspaceRootPath: string): AssistantCatalog {
  const path = catalogPath(workspaceRootPath)
  if (!existsSync(path)) return emptyCatalog()
  const raw = readJsonFileSync<AssistantCatalog>(path)
  if (!raw || raw.schemaVersion !== 1 || !Array.isArray(raw.assistants)) {
    throw new Error('Assistant catalog is invalid; repair assistants/config.json before saving')
  }
  const ids = new Set<string>()
  for (const assistant of raw.assistants) {
    const result = validateAssistant(assistant)
    if (!result.ok) throw new Error(`Invalid assistant catalog: ${result.reason}`)
    if (ids.has(assistant.id)) throw new Error(`Duplicate assistant id: ${assistant.id}`)
    ids.add(assistant.id)
  }
  return raw
}

export function saveCatalog(workspaceRootPath: string, catalog: AssistantCatalog): void {
  ensureDir(workspaceRootPath)
  atomicWriteFileSync(catalogPath(workspaceRootPath), JSON.stringify(catalog, null, 2))
}

export function listAssistants(workspaceRootPath: string): Assistant[] {
  return loadCatalog(workspaceRootPath).assistants
}

export function getAssistant(workspaceRootPath: string, id: string): Assistant | null {
  return listAssistants(workspaceRootPath).find((a) => a.id === id) ?? null
}

/** The Session header is the only wearer record; legacy wearing.json is never written. */
export function assistantWornBy(workspaceRootPath: string, sessionId: string): string | null {
  validateSessionId(sessionId)
  return readSessionHeader(getSessionFilePath(workspaceRootPath, sessionId))?.assistantId ?? null
}

function slugFromName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return slug.length > 0 ? slug : 'assistant'
}

export type CreateAssistantInput = {
  name: string
  description?: string
  systemPrompt?: string
  source?: Exclude<AssistantSource, 'builtin'>
}

export function createAssistant(workspaceRootPath: string, input: CreateAssistantInput): Assistant {
  const catalog = loadCatalog(workspaceRootPath)
  const existing = new Set(catalog.assistants.map((a) => a.id))
  let id = slugFromName(input.name)
  let n = 2
  while (existing.has(id)) {
    id = `${slugFromName(input.name)}-${n}`
    n++
  }
  const base =
    input.source === 'generated'
      ? createGeneratedAssistant({ id, name: input.name.trim() })
      : createUserAssistant({ id, name: input.name.trim() })
  if (input.description) base.description = input.description
  if (input.systemPrompt) base.systemPrompt = input.systemPrompt
  const check = validateAssistant(base)
  if (!check.ok) throw new Error(check.reason)
  catalog.assistants.push(base)
  saveCatalog(workspaceRootPath, catalog)
  return base
}

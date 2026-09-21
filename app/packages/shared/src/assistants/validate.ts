import {
  ASSISTANT_SCHEMA_VERSION,
  emptyLoadout,
  type Assistant,
  type AssistantCommand,
  type AssistantSource,
  type ListLoadout,
  type LoadoutMode,
  type ScalarLoadout,
} from './types.ts'

export type ValidateResult = { ok: true } | { ok: false; reason: string }

const SOURCES: readonly AssistantSource[] = ['builtin', 'user', 'generated']
const MODES: readonly LoadoutMode[] = ['inherit', 'fixed']
const MAX_ID = 64
const MAX_NAME = 80
const MAX_PROMPT = 32_000
const MAX_COMMANDS = 64
const MAX_LIST = 128

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isSlug(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0 && v.length <= MAX_ID && SLUG.test(v)
}

function validateScalar(input: unknown, field: string): ValidateResult {
  if (!isRecord(input)) return { ok: false, reason: `${field} is not an object` }
  if (!MODES.includes(input.mode as LoadoutMode)) {
    return { ok: false, reason: `${field}.mode must be inherit or fixed` }
  }
  if (input.mode === 'inherit') {
    if (input.value !== undefined) return { ok: false, reason: `${field}.value is only for fixed` }
    return { ok: true }
  }
  if (typeof input.value !== 'string' || input.value.length === 0 || input.value.length > 256) {
    return { ok: false, reason: `${field}.value must be a non-empty string when fixed` }
  }
  return { ok: true }
}

function validateList(input: unknown, field: string): ValidateResult {
  if (!isRecord(input)) return { ok: false, reason: `${field} is not an object` }
  if (!MODES.includes(input.mode as LoadoutMode)) {
    return { ok: false, reason: `${field}.mode must be inherit or fixed` }
  }
  if (!Array.isArray(input.values)) return { ok: false, reason: `${field}.values must be an array` }
  if (input.values.length > MAX_LIST) return { ok: false, reason: `${field}.values is too long` }
  for (const item of input.values) {
    if (typeof item !== 'string' || item.length === 0 || item.length > 128) {
      return { ok: false, reason: `${field}.values entries must be non-empty strings` }
    }
  }
  if (input.mode === 'inherit' && input.values.length > 0) {
    return { ok: false, reason: `${field}.values must be empty when inherit` }
  }
  return { ok: true }
}

function validateCommand(input: unknown, index: number): ValidateResult {
  if (!isRecord(input)) return { ok: false, reason: `commands[${index}] is not an object` }
  if (typeof input.name !== 'string' || !isSlug(input.name)) {
    return { ok: false, reason: `commands[${index}].name must be a slug` }
  }
  if (typeof input.prompt !== 'string' || input.prompt.length === 0 || input.prompt.length > MAX_PROMPT) {
    return { ok: false, reason: `commands[${index}].prompt must be a non-empty string` }
  }
  return { ok: true }
}

export function validateAssistant(input: unknown): ValidateResult {
  if (!isRecord(input)) return { ok: false, reason: 'assistant is not an object' }
  if (input.schemaVersion !== ASSISTANT_SCHEMA_VERSION) {
    return { ok: false, reason: `schemaVersion must be ${ASSISTANT_SCHEMA_VERSION}` }
  }
  if (!isSlug(input.id)) return { ok: false, reason: 'id must be a lowercase slug' }
  if (!SOURCES.includes(input.source as AssistantSource)) {
    return { ok: false, reason: 'source must be builtin, user or generated' }
  }
  if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.length > MAX_NAME) {
    return { ok: false, reason: 'name must be a non-empty string' }
  }
  if (input.description !== undefined) {
    if (typeof input.description !== 'string' || input.description.length > 500) {
      return { ok: false, reason: 'description must be a short string' }
    }
  }
  if (typeof input.systemPrompt !== 'string' || input.systemPrompt.length > MAX_PROMPT) {
    return { ok: false, reason: 'systemPrompt must be a string' }
  }
  if (!Array.isArray(input.commands) || input.commands.length > MAX_COMMANDS) {
    return { ok: false, reason: 'commands must be an array' }
  }
  const names = new Set<string>()
  for (let i = 0; i < input.commands.length; i++) {
    const r = validateCommand(input.commands[i], i)
    if (!r.ok) return r
    const name = (input.commands[i] as AssistantCommand).name
    if (names.has(name)) return { ok: false, reason: `duplicate command: ${name}` }
    names.add(name)
  }
  if (!isRecord(input.loadout)) return { ok: false, reason: 'loadout is not an object' }
  for (const field of ['model', 'permissionMode'] as const) {
    const r = validateScalar(input.loadout[field], `loadout.${field}`)
    if (!r.ok) return r
  }
  for (const field of ['skills', 'mcpServerIds', 'pluginIds'] as const) {
    const r = validateList(input.loadout[field], `loadout.${field}`)
    if (!r.ok) return r
  }
  return { ok: true }
}

/**
 * Untrusted input (a file, an agent payload) becomes a legal assistant or
 * names why it cannot. Nothing throws.
 */
export function coerceAssistant(raw: unknown): { assistant: Assistant | null; reason?: string } {
  if (!isRecord(raw)) return { assistant: null, reason: 'not an object' }
  let cloned: Assistant
  try {
    cloned = structuredClone(raw) as Assistant
  } catch {
    return { assistant: null, reason: 'not cloneable' }
  }
  const v = validateAssistant(cloned)
  if (!v.ok) return { assistant: null, reason: v.reason }
  return { assistant: cloned }
}

export function inheritList(): ListLoadout {
  return { mode: 'inherit', values: [] }
}

export { emptyLoadout }

import { describe, expect, it } from 'bun:test'
import { coerceAssistant, validateAssistant } from '../validate.ts'
import { createGeneratedAssistant, createUserAssistant } from '../types.ts'

describe('an assistant identity', () => {
  it('accepts a person-created identity with an empty loadout', () => {
    const assistant = createUserAssistant({ id: 'writer', name: 'Writer' })
    expect(assistant.source).toBe('user')
    expect(validateAssistant(assistant)).toEqual({ ok: true })
  })

  it('accepts an agent-created identity of the same shape', () => {
    const assistant = createGeneratedAssistant({ id: 'reviewer', name: 'Reviewer' })
    expect(assistant.source).toBe('generated')
    expect(validateAssistant(assistant)).toEqual({ ok: true })
  })

  it('refuses a path-traversal id', () => {
    const assistant = createUserAssistant({ id: 'writer', name: 'Writer' })
    assistant.id = '../etc'
    expect(validateAssistant(assistant)).toMatchObject({ ok: false, reason: expect.stringContaining('slug') })
  })

  it('refuses an empty name', () => {
    const assistant = createUserAssistant({ id: 'writer', name: '   ' })
    expect(validateAssistant(assistant).ok).toBe(false)
  })

  it('treats a fixed permission as a named request, and still requires a value', () => {
    const assistant = createUserAssistant({ id: 'writer', name: 'Writer' })
    assistant.loadout.permissionMode = { mode: 'fixed' }
    expect(validateAssistant(assistant).ok).toBe(false)
    assistant.loadout.permissionMode = { mode: 'fixed', value: 'ask' }
    expect(validateAssistant(assistant)).toEqual({ ok: true })
  })

  it('refuses inherit lists that smuggle values', () => {
    const assistant = createUserAssistant({ id: 'writer', name: 'Writer' })
    assistant.loadout.skills = { mode: 'inherit', values: ['ghost'] }
    expect(validateAssistant(assistant).ok).toBe(false)
  })

  it('accepts a full loadout the way AionUi assistants carry one', () => {
    const assistant = createGeneratedAssistant({ id: 'research', name: 'Research' })
    assistant.systemPrompt = 'Cite sources. Do not invent URLs.'
    assistant.commands = [{ name: 'brief', prompt: 'Summarise the open tabs.' }]
    assistant.loadout.model = { mode: 'fixed', value: 'grok-4' }
    assistant.loadout.permissionMode = { mode: 'fixed', value: 'ask' }
    assistant.loadout.skills = { mode: 'fixed', values: ['web-search'] }
    assistant.loadout.mcpServerIds = { mode: 'fixed', values: ['browser'] }
    assistant.loadout.pluginIds = { mode: 'fixed', values: ['canvas'] }
    expect(validateAssistant(assistant)).toEqual({ ok: true })
  })

  it('coerces garbage to null and names the reason, and never throws', () => {
    expect(coerceAssistant(null)).toMatchObject({ assistant: null })
    expect(coerceAssistant(42)).toMatchObject({ assistant: null })
    const circular: Record<string, unknown> = { schemaVersion: 1 }
    circular.self = circular
    expect(() => coerceAssistant(circular)).not.toThrow()
  })
})

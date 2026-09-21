/**
 * An assistant is an identity the person or the agent can create.
 *
 * The effect to match is AionUi's assistant (Apache-2.0): a named identity with
 * its own system prompt, commands, and a loadout of model, permission, skills,
 * MCP servers and plugins. The runtime rules to steal are Cindy's: a permission
 * on an assistant is a *request*, never a grant, and a skill is selected from
 * ones already installed — this file does not invent a second skill store.
 *
 * Who wears the record is not the record. See `wear.ts`: this conversation,
 * a delegate, or an optional CLI wrap. AionUi welds assistant to CLI; Fleet
 * does not.
 *
 * This is not a Craft label and not a Qoder “expert kit”. Those two mistakes
 * already happened. The record lives here so it cannot be stuffed into
 * `labels/config.json` again.
 */

export const ASSISTANT_SCHEMA_VERSION = 1 as const

export type AssistantSource = 'builtin' | 'user' | 'generated'

/**
 * `inherit` uses whatever the session already has.
 * `fixed` names the value this identity wants when a conversation starts.
 */
export type LoadoutMode = 'inherit' | 'fixed'

export type ScalarLoadout = {
  mode: LoadoutMode
  /** Present only when `mode` is `fixed`. */
  value?: string
}

export type ListLoadout = {
  mode: LoadoutMode
  values: string[]
}

export type AssistantCommand = {
  name: string
  prompt: string
}

/**
 * What this identity brings into a conversation.
 *
 * `permissionMode` is a request the existing permission path still has to
 * honour — writing `bypass` here does not grant bypass.
 */
export type AssistantLoadout = {
  model: ScalarLoadout
  permissionMode: ScalarLoadout
  skills: ListLoadout
  mcpServerIds: ListLoadout
  pluginIds: ListLoadout
}

export type Assistant = {
  schemaVersion: typeof ASSISTANT_SCHEMA_VERSION
  id: string
  source: AssistantSource
  name: string
  description?: string
  systemPrompt: string
  commands: AssistantCommand[]
  loadout: AssistantLoadout
}

export const INHERIT: ScalarLoadout = { mode: 'inherit' }
export const INHERIT_LIST: ListLoadout = { mode: 'inherit', values: [] }

export function emptyLoadout(): AssistantLoadout {
  return {
    model: { ...INHERIT },
    permissionMode: { ...INHERIT },
    skills: { mode: 'inherit', values: [] },
    mcpServerIds: { mode: 'inherit', values: [] },
    pluginIds: { mode: 'inherit', values: [] },
  }
}

/** A person-created identity with nothing selected yet. */
export function createUserAssistant(input: { id: string; name: string }): Assistant {
  return {
    schemaVersion: ASSISTANT_SCHEMA_VERSION,
    id: input.id,
    source: 'user',
    name: input.name,
    systemPrompt: '',
    commands: [],
    loadout: emptyLoadout(),
  }
}

/** An identity the agent assembled. Same record shape as a hand-built one. */
export function createGeneratedAssistant(input: { id: string; name: string }): Assistant {
  return {
    ...createUserAssistant(input),
    source: 'generated',
  }
}

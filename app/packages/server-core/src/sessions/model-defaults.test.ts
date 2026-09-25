import { describe, expect, it } from 'bun:test'
import type { LlmConnection } from '@craft-agent/shared/config'
import { assertSessionConnectionSelection, assertSessionModelSelection, assertWorkspaceModelSelection, inheritedWorkspaceModelOverride, reconcileWorkspaceModelOverride } from './model-defaults'

function connection(providerType: LlmConnection['providerType'], models: string[], defaultModel: string): LlmConnection {
  return {
    slug: providerType, name: providerType, providerType, authType: 'api_key',
    createdAt: 1, models, defaultModel,
  }
}

describe('workspace model override on connection change', () => {
  it('clears a Pi model that the new connection cannot run', () => {
    expect(reconcileWorkspaceModelOverride(
      'pi/old-model', connection('pi', ['pi/new-model'], 'pi/new-model'),
    )).toBeUndefined()
  })

  it('keeps a model present on both connections', () => {
    expect(reconcileWorkspaceModelOverride(
      'pi/shared-model', connection('pi', ['pi/shared-model'], 'pi/shared-model'),
    )).toBe('pi/shared-model')
  })

  it('clears a known cross-backend model without guessing about unknown Claude IDs', () => {
    expect(reconcileWorkspaceModelOverride(
      'pi/shared-model', connection('anthropic', ['claude-sonnet-4-6'], 'claude-sonnet-4-6'),
    )).toBeUndefined()
    expect(reconcileWorkspaceModelOverride(
      'claude-future-account-model', connection('anthropic', ['claude-sonnet-4-6'], 'claude-sonnet-4-6'),
    )).toBe('claude-future-account-model')
  })
})

describe('workspace model inheritance for a session', () => {
  const workspaceConnection = connection('pi', ['pi/workspace-model'], 'pi/workspace-model')
  const otherConnection = { ...workspaceConnection, slug: 'other' }

  it('uses a workspace model only for its effective connection', () => {
    expect(inheritedWorkspaceModelOverride('pi/workspace-model', workspaceConnection, workspaceConnection))
      .toBe('pi/workspace-model')
    expect(inheritedWorkspaceModelOverride('pi/workspace-model', otherConnection, workspaceConnection))
      .toBeUndefined()
  })
})

describe('session model selection', () => {
  it('rejects a stale Pi selection before persisting a different effective model', () => {
    expect(() => assertSessionModelSelection('pi/old-model', 'pi/new-model'))
      .toThrow('MODEL_UNAVAILABLE_FOR_CONNECTION')
  })

  it('accepts a supported choice, legacy alias, and an inherited default', () => {
    expect(() => assertSessionModelSelection('pi/new-model', 'pi/new-model')).not.toThrow()
    expect(() => assertSessionModelSelection('claude-opus-4-5-20251101', 'claude-opus-4-8')).not.toThrow()
    expect(() => assertSessionModelSelection(null, 'pi/new-model')).not.toThrow()
  })
})

describe('workspace model selection', () => {
  it('rejects an incompatible Pi model before the workspace setting is saved', () => {
    expect(() => assertWorkspaceModelSelection(
      'pi/old-model', connection('pi', ['pi/new-model'], 'pi/new-model'),
    )).toThrow('MODEL_UNAVAILABLE_FOR_CONNECTION')
    expect(() => assertWorkspaceModelSelection('pi/new-model', null))
      .toThrow('MODEL_UNAVAILABLE_FOR_CONNECTION')
  })

  it('keeps a model available to the selected connection', () => {
    expect(() => assertWorkspaceModelSelection(
      'pi/new-model', connection('pi', ['pi/new-model'], 'pi/new-model'),
    )).not.toThrow()
  })
})

describe('explicit Session source identity', () => {
  it('rejects a missing account or an inherited different account', () => {
    expect(() => assertSessionConnectionSelection('removed', null)).toThrow('CONNECTION_UNAVAILABLE')
    expect(() => assertSessionConnectionSelection('removed', { slug: 'default' })).toThrow('CONNECTION_UNAVAILABLE')
    expect(() => assertSessionConnectionSelection('selected', { slug: 'selected' })).not.toThrow()
    expect(() => assertSessionConnectionSelection(undefined, { slug: 'default' })).not.toThrow()
  })
})

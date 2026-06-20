import { describe, expect, it } from 'bun:test'
import { AgentRegistryService } from './agent-registry'

describe('AgentRegistryService', () => {
  it('creates a stable project agent actor per session', () => {
    const registry = new AgentRegistryService({ now: () => 100 })

    const first = registry.ensureProjectAgentForSession({
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      runtime: 'claude-max',
    })
    const second = registry.ensureProjectAgentForSession({
      sessionId: 'session-1',
      workspaceId: 'workspace-1',
      runtime: 'grok',
    })

    expect(first.agentId).toBe('project:session-1')
    expect(second.agentId).toBe(first.agentId)
    expect(second.runtime).toBe('grok')
    expect(second.role).toBe('leader')
    expect(registry.actorForSession('session-1')).toEqual({
      kind: 'agent',
      agentId: 'project:session-1',
      runtime: 'grok',
      role: 'leader',
      displayName: '项目 Agent',
    })
  })

  it('filters agents by workspace and session without storing conversations', () => {
    const registry = new AgentRegistryService({ now: () => 100 })
    registry.ensureManagerAgent({ workspaceId: 'workspace-1' })
    registry.ensureProjectAgentForSession({ sessionId: 's1', workspaceId: 'workspace-1' })
    registry.ensureProjectAgentForSession({ sessionId: 's2', workspaceId: 'workspace-2' })

    expect(registry.listAgents({ workspaceId: 'workspace-1' }).map((agent) => agent.agentId)).toEqual([
      'manager:workspace-1',
      'project:s1',
    ])
    expect(registry.listAgents({ sessionId: 's2' }).map((agent) => agent.agentId)).toEqual(['project:s2'])
  })
})

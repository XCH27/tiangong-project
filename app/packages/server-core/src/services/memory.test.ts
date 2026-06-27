import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { ManagerDecisionService } from './manager-decision-service'
import { MemoryStore } from './memory-store'
import { installMemoryHooks } from './memory'
import { SessionManager } from '../sessions/SessionManager'

describe('MemoryService Hook Tests', () => {
  let root: string
  let store: MemoryStore
  let origConfigDir: string | undefined

  beforeEach(() => {
    installMemoryHooks()
    root = mkdtempSync(join(tmpdir(), 'memory-service-'))
    origConfigDir = process.env.CRAFT_CONFIG_DIR
    process.env.CRAFT_CONFIG_DIR = join(root, 'config')
    store = new MemoryStore(root)
  })

  afterEach(() => {
    if (origConfigDir !== undefined) {
      process.env.CRAFT_CONFIG_DIR = origConfigDir
    } else {
      delete process.env.CRAFT_CONFIG_DIR
    }
    rmSync(root, { recursive: true, force: true })
  })

  it('decide hook: 决策依据注入来自记忆库', () => {
    // Add user memory that matches 'bun test'
    store.add({ partition: 'user', content: 'User prefers to run bun test' })

    const decisionService = new ManagerDecisionService(root)
    // Mock the settings to be enabled
    const origGetSettings = decisionService.getSettings
    decisionService.getSettings = () => ({
      enabled: true,
      autoL1: true,
      rules: [],
      model: { mode: 'workspace_default' }
    })

    const request = {
      kind: 'local_reversible' as const,
      action: 'run bun test',
      sessionId: 'session123'
    }
    const actor = { role: 'user' as const } as any

    const { result } = decisionService.decide(request, actor)
    expect(result.basis).toContain('依据记忆: User prefers to run bun test')

    decisionService.getSettings = origGetSettings
  })

  it('onProcessingStopped hook: 对话结束事实抽取并保存', async () => {
    // Set up a mock SessionManager and ManagedSession
    const mockSessions = new Map<string, any>()
    const mockSession = {
      id: 'session-extract',
      workspace: { id: 'ws123', rootPath: root },
      messageQueue: [],
      messages: [
        { role: 'user', content: 'Let us deploy using Docker next time.', timestamp: 1000 },
        { role: 'assistant', content: 'Okay, I will remember to use Docker.', timestamp: 2000 }
      ],
      agent: {
        queryLlm: mock(() => Promise.resolve({
          text: `[{"partition": "user", "content": "User prefers deploying using Docker"}]`
        }))
      }
    }
    mockSessions.set(mockSession.id, mockSession)

    // Create a mock instance of SessionManager or mock its sessions map
    const mockManager = Object.create(SessionManager.prototype) as any
    mockManager.sessions = mockSessions
    mockManager.activeViewingSession = new Map()
    mockManager.getBrowserPaneManagerForSession = () => null
    mockManager.getLastFinalAssistantMessageId = () => 'msg2'
    mockManager.isSessionBeingViewed = () => true
    mockManager.markSessionRead = () => Promise.resolve()
    mockManager.persistSession = () => {}
    mockManager.sendEvent = () => {}

    // Trigger the hook
    await (SessionManager.prototype as any).onProcessingStopped.call(mockManager, mockSession.id, 'complete')

    // Expect that the memory was extracted and added to MemoryStore
    const userMems = store.list({ partition: 'user' })
    expect(userMems.length).toBeGreaterThan(0)
    expect(userMems[0]?.content).toBe('User prefers deploying using Docker')
  })
})

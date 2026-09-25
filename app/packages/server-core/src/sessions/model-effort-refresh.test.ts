import { describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('saved Session effort after an account catalog refresh', () => {
  it('reconciles an idle Session and defers a running turn until it becomes idle', () => {
    // A fresh subprocess is required because CONFIG_DIR is fixed at module load.
    const configDir = mkdtempSync(join(tmpdir(), 'fleet-model-effort-'))
    try {
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({
        workspaces: [],
        activeWorkspaceId: null,
        defaultLlmConnection: 'deepseek-fixture',
        llmConnections: [{
          slug: 'deepseek-fixture', name: 'DeepSeek', providerType: 'pi',
          authType: 'api_key', piAuthProvider: 'deepseek',
          defaultModel: 'pi/deepseek-v4-pro',
          models: [{ id: 'pi/deepseek-v4-pro', name: 'DeepSeek V4 Pro', provider: 'pi',
            supportsThinking: true, reasoningEfforts: ['low', 'max'],
            defaultReasoningEffort: 'low' }],
        }],
      }))
      const sessionManagerUrl = new URL('./SessionManager.ts', import.meta.url).href
      const script = `
        const { SessionManager } = await import(${JSON.stringify(sessionManagerUrl)});
        const manager = new SessionManager();
        const managed = {
          id: 'fixture', workspace: { id: 'workspace', rootPath: process.env.CRAFT_CONFIG_DIR + '/workspace' },
          model: 'pi/deepseek-v4-pro', llmConnection: 'deepseek-fixture',
          thinkingLevel: 'medium', agent: null, messagesLoaded: true,
        };
        const events = [];
        let persisted = 0;
        manager.sessions.set(managed.id, managed);
        manager.persistSession = () => { persisted++; };
        manager.sendEvent = event => { events.push(event); };
        await manager.refreshConnectionRuntime('deepseek-fixture');
        if (managed.thinkingLevel !== 'low' || persisted !== 1 ||
            events[0]?.type !== 'session_model_changed' || events[0]?.thinkingLevel !== 'low') {
          throw new Error(JSON.stringify({ thinkingLevel: managed.thinkingLevel, persisted, events }));
        }
        let processing = true;
        let liveEffort;
        managed.agent = {
          isProcessing: () => processing,
          setThinkingLevel: level => { liveEffort = level; },
        };
        manager.tryRefreshAgentRuntime = async () => {};
        managed.thinkingLevel = 'medium';
        await manager.refreshConnectionRuntime('deepseek-fixture');
        if (managed.thinkingLevel !== 'medium' || liveEffort !== undefined || persisted !== 1) {
          throw new Error('A running turn was changed');
        }
        processing = false;
        await manager.refreshConnectionRuntime('deepseek-fixture');
        if (managed.thinkingLevel !== 'low' || liveEffort !== 'low' || persisted !== 2 ||
            events[1]?.thinkingLevel !== 'low') {
          throw new Error(JSON.stringify({ thinkingLevel: managed.thinkingLevel, liveEffort, persisted, events }));
        }
      `
      const result = Bun.spawnSync([process.execPath, '-e', script], {
        cwd: join(import.meta.dir, '../../../..'),
        env: { ...process.env, CRAFT_CONFIG_DIR: configDir },
      })
      expect(new TextDecoder().decode(result.stderr)).toBe('')
      expect(result.exitCode).toBe(0)
    } finally {
      rmSync(configDir, { recursive: true, force: true })
    }
  })
})

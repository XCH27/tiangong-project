import { describe, expect, it } from 'bun:test'
import { SessionManager, resolveInitialSessionThinkingLevel } from './SessionManager.ts'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { LlmConnection } from '@craft-agent/shared/config'

describe('session model and connection switch guard', () => {
  it('leaves a started session untouched when another connection is requested', async () => {
    const manager = new SessionManager()
    const session = {
      id: 'model-switch-locked',
      model: 'current-model',
      llmConnection: 'original-connection',
      connectionLocked: true,
      messages: [{ id: 'already-sent' }],
      workspace: { id: 'workspace', rootPath: '/tmp/fleet-model-switch-unconfigured' },
    }
    // The guard must reject before disk writes or live-agent updates.
    ;(manager as any).sessions.set(session.id, session)
    await expect(manager.updateSessionModel(session.id, 'workspace', 'other-model', 'other-connection'))
      .rejects.toThrow('Cannot change connection after session has started')
    expect(session.model).toBe('current-model')
    expect(session.llmConnection).toBe('original-connection')
  })
})

describe('new session model effort', () => {
  const connection = {
    models: [
      { id: 'pi/no-reasoning', supportsThinking: false },
      { id: 'pi/reasoning', supportsThinking: true, reasoningEfforts: ['low', 'high'] },
    ],
  } as LlmConnection

  it('reconciles an inherited default to the selected model', () => {
    expect(resolveInitialSessionThinkingLevel('medium', 'pi/no-reasoning', connection, false)).toBe('off')
    expect(resolveInitialSessionThinkingLevel('medium', 'pi/reasoning', connection, false)).toBe('low')
  })

  it('rejects an unsupported explicit choice and preserves a supported one', () => {
    expect(() => resolveInitialSessionThinkingLevel('medium', 'pi/reasoning', connection, true))
      .toThrow('not supported')
    expect(resolveInitialSessionThinkingLevel('high', 'pi/reasoning', connection, true)).toBe('high')
  })
})

describe('Pi account/model selection transaction', () => {
  it('rejects a running source switch; idle selection retires old credentials and preserves Pi history identity', () => {
    const configDir = mkdtempSync(join(tmpdir(), 'fleet-source-switch-'))
    try {
      writeFileSync(join(configDir, 'config.json'), JSON.stringify({
        workspaces: [], activeWorkspaceId: null, defaultLlmConnection: 'first',
        llmConnections: ['first', 'second'].map(slug => ({ slug, name: slug,
          providerType: 'pi_compat', authType: 'api_key', createdAt: 1,
          baseUrl: 'http://127.0.0.1:1234/v1', customEndpoint: {api: 'openai-completions'},
          defaultModel: 'pi/shared', models: ['pi/shared'] })),
      }))
      const script = `
        const {SessionManager,createManagedSession} = await import(${JSON.stringify(new URL('./SessionManager.ts', import.meta.url).href)});
        const manager = new SessionManager();
        const workspace = {id:'ws',rootPath:process.env.CRAFT_CONFIG_DIR+'/workspace'};
        const managed = createManagedSession({id:'switch',llmConnection:'first',model:'pi/shared',sdkSessionId:'retained-history'},workspace,{messagesLoaded:true});
        managed.messages = [{id:'sent',role:'user',content:'existing history',timestamp:1}];
        managed.connectionLocked = true;
        let disposed = 0; let mutatedOldAgent = 0; let release;
        const retiring = new Promise(resolve=>{release=resolve});
        managed.agent = {isProcessing:()=>false,disposeForRestart:async()=>{disposed++; await retiring},setModel:()=>{mutatedOldAgent++},setThinkingLevel:()=>{}};
        manager.sessions.set(managed.id,managed);
        manager.sendEvent=()=>{};
        manager.persistSession(managed); await manager.flushSession(managed.id);
        managed.isProcessing=true;
        let error;
        try {await manager.updateSessionModel('switch','ws','pi/shared','second')} catch(e) {error=e.message}
        if(error!=='CONNECTION_SWITCH_REQUIRES_IDLE'||managed.llmConnection!=='first'||disposed) throw new Error('running switch mutated state');
        managed.isProcessing=false;
        const selection = manager.updateSessionModel('switch','ws','pi/shared','second');
        let refreshFinished = false;
        const refresh = manager.tryRefreshAgentRuntime(managed,'concurrent send').then(()=>{refreshFinished=true});
        await new Promise(resolve=>setTimeout(resolve,10));
        if(refreshFinished) throw new Error('send raced credential retirement');
        release();
        await selection; await refresh;
        if(managed.llmConnection!=='second'||managed.model!=='pi/shared'||disposed!==1||mutatedOldAgent!==0||managed.agent!==null||managed.sdkSessionId!=='retained-history'||managed.messages.length!==1) {
          throw new Error(JSON.stringify({source:managed.llmConnection,model:managed.model,disposed,mutatedOldAgent,history:managed.sdkSessionId}));
        }
        const {loadSession} = await import('@craft-agent/shared/sessions');
        const saved = loadSession(workspace.rootPath,managed.id);
        if(saved.llmConnection!=='second'||saved.model!=='pi/shared'||saved.sdkSessionId!=='retained-history'||saved.messages[0].content!=='existing history'||saved.thinkingLevel!==managed.thinkingLevel) throw new Error('selection/history not persisted');
        await manager.updateSessionModel('switch','ws',null);
        if(loadSession(workspace.rootPath,managed.id).model!==undefined) throw new Error('cleared model survived on disk');
        managed.model='pi/removed-from-account';
        let removedError;
        try {await manager.getOrCreateAgent(managed)} catch(e) {removedError=e.message}
        if(removedError!=='MODEL_UNAVAILABLE_FOR_CONNECTION'||managed.agent!==null) throw new Error('removed model silently started fallback');
        managed.model='pi/shared'; managed.llmConnection='deleted-account';
        let deletedError;
        try {await manager.getOrCreateAgent(managed)} catch(e) {deletedError=e.message}
        if(deletedError!=='CONNECTION_UNAVAILABLE'||managed.agent!==null) throw new Error('deleted account silently started same-model fallback');
        managed.llmConnection='second';
        await manager.setSessionConnection('switch','first');
        if(managed.llmConnection!=='first'||loadSession(workspace.rootPath,managed.id).llmConnection!=='first') throw new Error('legacy connection selection bypassed unified persistence');
      `
      const result = Bun.spawnSync([process.execPath, '-e', script], {
        cwd: join(import.meta.dir, '../../../..'), env: {...process.env, CRAFT_CONFIG_DIR: configDir},
      })
      expect(new TextDecoder().decode(result.stderr)).toBe('')
      expect(result.exitCode).toBe(0)
    } finally { rmSync(configDir, {recursive:true,force:true}) }
  })
})

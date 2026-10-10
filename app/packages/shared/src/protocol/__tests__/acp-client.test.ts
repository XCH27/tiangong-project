import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import {
  ACP_CAPABILITIES,
  CLI_PEER_PRESETS,
  cliEffectInvocationId,
  CliExecutorHost,
  createMemoryLinePair,
  hiddenCliSurfaces,
  surfaceVisibility,
} from '../cli-executors'
import { HostTurnKernel } from '../turn-admission'
import { InternalActionId } from '../internal-action'
import { flagRequest, human, methodsOf, request, scriptPeer, waitFor } from './cli-jsonrpc-harness'
import type { JsonRpcRequest } from '../cli-executors/ndjson-rpc'

function permissionOptions() {
  return [
    { optionId: 'allow-once', name: 'Allow once', kind: 'allow_once' },
    { optionId: 'allow-always', name: 'Always', kind: 'allow_always' },
    { optionId: 'reject-once', name: 'Reject', kind: 'reject_once' },
  ]
}

describe('ACP executor', () => {
  test('capability declarations hide locked surfaces and do not claim a PTY', () => {
    const source = readFileSync(new URL('../cli-executors/acp-client.ts', import.meta.url), 'utf8')
    expect(source.includes('node-pty')).toBe(false)
    expect(source.includes('terminal: false')).toBe(true)
    expect(source.includes('.approve(')).toBe(false)
    expect(source.includes('permission authority')).toBe(true)
    expect(ACP_CAPABILITIES.status).toBe('display-only')
    expect(hiddenCliSurfaces(ACP_CAPABILITIES)).toEqual(['commandExecution', 'dynamicClientTool', 'pty'])
    expect(surfaceVisibility(ACP_CAPABILITIES.status)).toBe('label-only')
    expect(surfaceVisibility(ACP_CAPABILITIES.effects.fileDelete)).toBe('label-only')
    expect(CLI_PEER_PRESETS.map((preset) => preset.status)).toEqual([
      'display-only',
      'display-only',
      'display-only',
      'display-only',
    ])
  })

  test('an unapproved turn does not open ACP stdio', async () => {
    let opened = 0
    const cli = new CliExecutorHost({
      acp: () => {
        opened += 1
        return createMemoryLinePair().local
      },
    })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    host.admit(request(InternalActionId.FILE_DELETE, 'inv-closed', {
      executorId: 'acp',
      prompt: 'delete it',
    }))
    await expect(host.run('inv-closed')).resolves.toMatchObject({ status: 'approval_required' })
    expect(opened).toBe(0)
  })

  test('v1 load resume gates delete and execute, and refuses client file writes', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, true)
    const decisions: unknown[] = []
    const cli = new CliExecutorHost({ acp: () => pair.local })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    script.peer.onRequest((entry) => {
      if (entry.method === 'initialize') {
        script.peer.respond(entry.id, {
          protocolVersion: 1,
          agentCapabilities: { loadSession: true },
        })
        return
      }
      if (entry.method === 'session/load') {
        script.peer.respond(entry.id, {})
        return
      }
      if (entry.method === 'session/prompt') {
        void (async () => {
          const read = await script.peer.request('session/request_permission', {
            sessionId: 'sess_1',
            toolCall: { toolCallId: 'call_read', kind: 'read', locations: [{ path: 'note.txt' }] },
            options: permissionOptions(),
          })
          const execute = await script.peer.request('session/request_permission', {
            sessionId: 'sess_1',
            toolCall: { toolCallId: 'call_exec', kind: 'execute' },
            options: permissionOptions(),
          })
          const deletion = script.peer.request('session/request_permission', {
            sessionId: 'sess_1',
            toolCall: { toolCallId: 'call_delete', kind: 'delete', locations: [{ path: 'note.txt' }] },
            options: permissionOptions(),
          })
          const write = script.peer.request('fs/write_text_file', { path: 'note.txt', content: 'secret' }).then(
            () => 'accepted',
            (error: unknown) => error instanceof Error ? error.message : 'unknown',
          )
          decisions.push(read, execute, await deletion)
          decisions.push(await write)
          script.peer.notify('session/update', {
            sessionId: 'sess_1',
            update: { sessionUpdate: 'agent_message_chunk', content: { type: 'text', text: 'done' } },
          })
          script.peer.respond(entry.id, { stopReason: 'end_turn' })
        })()
      }
    })

    host.admit(flagRequest('inv-acp', {
      executorId: 'acp',
      prompt: 'review the note',
      cwd: '/workspace',
      resumeSessionId: 'sess_1',
    }))
    const running = host.run('inv-acp')
    const nested = cliEffectInvocationId('inv-acp', '3')
    await waitFor(() => host.snapshot().turns.some((turn) => (
      turn.request.invocation.invocationId === nested && turn.phase === 'awaiting_approval'
    )))
    expect(decisions).toEqual([])
    host.approve(nested, human)
    await expect(running).resolves.toMatchObject({
      status: 'completed',
      output: { sessionId: 'sess_1', text: 'done', protocolVersion: 1 },
    })
    expect(decisions[0]).toEqual({ outcome: { outcome: 'selected', optionId: 'allow-once' } })
    expect(decisions[1]).toEqual({ outcome: { outcome: 'selected', optionId: 'reject-once' } })
    expect(decisions[2]).toEqual({ outcome: { outcome: 'selected', optionId: 'allow-once' } })
    expect(decisions[3]).toBe('acp_client_method_locked')
    expect(methodsOf(script.requests)).toContain('session/load')
    expect(methodsOf(script.requests)).not.toContain('session/resume')
    expect(methodsOf(script.requests)).not.toContain('session/new')
    expect(script.requests.find((entry) => entry.method === 'initialize')?.params).toMatchObject({
      clientCapabilities: { terminal: false, fs: { writeTextFile: false } },
    })
    expect(host.snapshot().turns.filter((turn) => turn.request.invocation.actionId === InternalActionId.FILE_DELETE)).toHaveLength(1)
    expect(host.snapshot().turns.some((turn) => turn.phase === 'awaiting_approval')).toBe(false)
  })

  test('a human reject declines the ACP tool without allow_always', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, true)
    const cli = new CliExecutorHost({ acp: () => pair.local })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    let decision: unknown
    script.peer.onRequest((entry) => {
      if (entry.method === 'initialize') {
        script.peer.respond(entry.id, { protocolVersion: 1, agentCapabilities: { loadSession: false } })
      }
      if (entry.method === 'session/new') script.peer.respond(entry.id, { sessionId: 'sess_new' })
      if (entry.method === 'session/prompt') {
        void (async () => {
          decision = await script.peer.request('session/request_permission', {
            sessionId: 'sess_new',
            toolCall: { toolCallId: 'call_delete', kind: 'delete', locations: [{ path: 'note.txt' }] },
            options: permissionOptions(),
          })
          script.peer.respond(entry.id, { stopReason: 'end_turn' })
        })()
      }
    })
    host.admit(flagRequest('inv-reject', { executorId: 'acp', prompt: 'delete the note' }))
    const running = host.run('inv-reject')
    const nested = cliEffectInvocationId('inv-reject', '1')
    await waitFor(() => host.snapshot().turns.some((turn) => turn.request.invocation.invocationId === nested))
    host.reject(nested, human)
    await expect(running).resolves.toMatchObject({ status: 'completed' })
    expect(decision).toEqual({ outcome: { outcome: 'selected', optionId: 'reject-once' } })
  })

  test('resume stays Locked when the peer does not advertise it', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, true)
    const cli = new CliExecutorHost({ acp: () => pair.local })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    script.peer.onRequest((entry) => {
      if (entry.method === 'initialize') {
        script.peer.respond(entry.id, { protocolVersion: 1, agentCapabilities: { loadSession: false } })
      }
    })
    host.admit(flagRequest('inv-locked', {
      executorId: 'acp',
      prompt: 'continue',
      resumeSessionId: 'sess_missing',
    }))
    await expect(host.run('inv-locked')).resolves.toMatchObject({ status: 'failed', reason: 'executor_failed' })
    expect(methodsOf(script.requests)).toEqual(['initialize'])
    expect(methodsOf(script.requests)).not.toContain('session/prompt')
  })

  test('v2 resume waits for idle and cancel notifies session/cancel', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, true)
    const cli = new CliExecutorHost({ acp: () => pair.local })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    script.peer.onRequest((entry: JsonRpcRequest) => {
      if (entry.method === 'initialize') {
        script.peer.respond(entry.id, { protocolVersion: 2, agentCapabilities: {} })
      }
      if (entry.method === 'session/resume') script.peer.respond(entry.id, {})
      if (entry.method === 'session/prompt') script.peer.respond(entry.id, { messageId: 'msg_1' })
    })
    host.admit(flagRequest('inv-v2', {
      executorId: 'acp',
      prompt: 'continue',
      resumeSessionId: 'sess_v2',
    }))
    const running = host.run('inv-v2')
    await waitFor(() => methodsOf(script.requests).includes('session/prompt'))
    script.peer.notify('session/update', {
      sessionId: 'sess_v2',
      update: { sessionUpdate: 'state_update', state: 'idle', stopReason: 'end_turn' },
    })
    await expect(running).resolves.toMatchObject({
      status: 'completed',
      output: { sessionId: 'sess_v2', protocolVersion: 2 },
    })
    expect(methodsOf(script.requests)).toContain('session/resume')
    expect(methodsOf(script.requests)).not.toContain('session/load')

    const cancelPair = createMemoryLinePair()
    const cancelScript = scriptPeer(cancelPair.remote, true)
    const cancelCli = new CliExecutorHost({ acp: () => cancelPair.local })
    const cancelHost = new HostTurnKernel(undefined, { nativeEffects: cancelCli })
    cancelCli.attach(cancelHost)
    cancelScript.peer.onRequest((entry) => {
      if (entry.method === 'initialize') {
        cancelScript.peer.respond(entry.id, { protocolVersion: 1, agentCapabilities: {} })
      }
      if (entry.method === 'session/new') cancelScript.peer.respond(entry.id, { sessionId: 'sess_cancel' })
    })
    cancelHost.admit(flagRequest('inv-cancel', { executorId: 'acp', prompt: 'stop me' }))
    const cancelling = cancelHost.run('inv-cancel')
    await waitFor(() => methodsOf(cancelScript.requests).includes('session/prompt'))
    expect(cancelHost.stop('inv-cancel').reason).toBe('stop_requested')
    await expect(cancelling).resolves.toMatchObject({ status: 'interrupted' })
    expect(cancelScript.notifications.some((entry) => entry.method === 'session/cancel')).toBe(true)
  })
})

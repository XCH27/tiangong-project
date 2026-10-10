import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { PassThrough } from 'node:stream'
import {
  CODEX_APP_SERVER_CAPABILITIES,
  CLI_PEER_PRESETS,
  cliEffectInvocationId,
  CliExecutorHost,
  composeEffectSources,
  createMemoryLinePair,
  hiddenCliSurfaces,
  openStdioJsonRpc,
  stdioSpawnOptions,
  surfaceVisibility,
} from '../cli-executors'
import { NativeEffectRegistry } from '../native-effect-executor'
import { HostTurnKernel } from '../turn-admission'
import { InternalActionId } from '../internal-action'
import { agent, flagRequest, human, methodsOf, request, scriptPeer, waitFor } from './cli-jsonrpc-harness'

function readSource(name: string): string {
  return readFileSync(new URL(`../cli-executors/${name}`, import.meta.url), 'utf8')
}

describe('codex app-server executor', () => {
  test('the adapter stays on JSON-RPC pipes and does not grant permission', () => {
    const source = [
      readSource('codex-app-server.ts'),
      readSource('stdio-spawn.ts'),
      readSource('host.ts'),
    ].join('\n')
    expect(source.includes('node-pty')).toBe(false)
    expect(source.includes('shell: true')).toBe(false)
    expect(source.includes('.approve(')).toBe(false)
    expect(source.includes('.reject(')).toBe(false)
    expect(source.includes('permission authority')).toBe(true)
    expect(source.includes("stdio: ['pipe', 'pipe', 'pipe']")).toBe(true)
    expect(CODEX_APP_SERVER_CAPABILITIES.status).toBe('display-only')
    expect(hiddenCliSurfaces(CODEX_APP_SERVER_CAPABILITIES)).toEqual([
      'fileMove',
      'commandExecution',
      'dynamicClientTool',
      'pty',
    ])
    expect(surfaceVisibility(CODEX_APP_SERVER_CAPABILITIES.status)).toBe('label-only')
    expect(surfaceVisibility('Locked')).toBe('hide')
    const codex = CLI_PEER_PRESETS.find((preset) => preset.id === 'codex')
    expect(codex?.args).toEqual(['app-server', '--stdio'])
    expect(codex?.status).toBe('display-only')
  })

  test('spawn uses pipe stdio and forwards one JSON line', async () => {
    const stdout = new PassThrough()
    const writes: string[] = []
    let seen: { command: string; args: readonly string[]; shell: boolean; stdio: unknown } | undefined
    const stream = openStdioJsonRpc(
      { command: 'codex', args: ['app-server', '--stdio'] },
      (command, args, options) => {
        seen = { command, args, shell: options.shell, stdio: options.stdio }
        return {
          stdin: { write: (chunk: string) => { writes.push(chunk) } },
          stdout,
          on: () => undefined,
        }
      },
    )
    const lines: string[] = []
    stream.onLine((line) => lines.push(line))
    stdout.write('{"method":"thread/started"}\n')
    stream.send('{"method":"initialize"}')
    await waitFor(() => lines.length === 1 && writes.length === 1)
    expect(seen).toEqual({
      command: 'codex',
      args: ['app-server', '--stdio'],
      shell: false,
      stdio: stdioSpawnOptions().stdio,
    })
    expect(writes).toEqual(['{"method":"initialize"}\n'])
    expect(lines).toEqual(['{"method":"thread/started"}'])
  })

  test('an unapproved turn does not open the transport', async () => {
    let opened = 0
    const cli = new CliExecutorHost({
      'codex-app-server': () => {
        opened += 1
        return createMemoryLinePair().local
      },
    })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    host.admit(request(InternalActionId.FILE_DELETE, 'inv-closed', {
      executorId: 'codex-app-server',
      prompt: 'delete the note',
    }))
    await expect(host.run('inv-closed')).resolves.toMatchObject({ status: 'approval_required' })
    expect(opened).toBe(0)
  })

  test('admitted start, file approval, command decline, resume, and cancel stay behind the host', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, false)
    let opened = 0
    const cli = new CliExecutorHost({
      'codex-app-server': () => {
        opened += 1
        return pair.local
      },
    })
    const native = new NativeEffectRegistry()
    let nativeCalls = 0
    native.register(InternalActionId.SESSION_FLAG, async () => {
      nativeCalls += 1
      return { output: { flagged: true } }
    })
    const host = new HostTurnKernel(undefined, { nativeEffects: composeEffectSources(cli, native) })
    cli.attach(host)

    host.admit(flagRequest('inv-native', {}))
    await expect(host.run('inv-native')).resolves.toMatchObject({ status: 'completed', output: { flagged: true } })
    expect(opened).toBe(0)
    expect(nativeCalls).toBe(1)

    script.peer.onRequest((entry) => {
      if (entry.method === 'initialize') {
        script.peer.respond(entry.id, { userAgent: 'codex-test' })
        return
      }
      if (entry.method === 'thread/resume') {
        script.peer.respond(entry.id, { thread: { id: 'thr_9' } })
        return
      }
      if (entry.method === 'turn/start') {
        script.peer.respond(entry.id, { turn: { id: 'turn_9', status: 'inProgress' } })
        void (async () => {
          const command = await script.peer.request('item/commandExecution/requestApproval', {
            threadId: 'thr_9',
            turnId: 'turn_9',
            command: 'rm -rf /',
          })
          const edit = await script.peer.request('item/fileChange/requestApproval', {
            threadId: 'thr_9',
            turnId: 'turn_9',
            itemId: 'item_edit',
            changes: [{ path: 'note.txt', kind: 'update' }],
          })
          const deletion = script.peer.request('item/fileChange/requestApproval', {
            threadId: 'thr_9',
            turnId: 'turn_9',
            itemId: 'item_delete',
            changes: [{ path: 'note.txt', kind: 'delete' }],
          })
          script.peer.notify('item/agentMessage/delta', { delta: 'edited' })
          const deleteDecision = await deletion
          const permissions = await script.peer.request('item/permissions/requestApproval', {
            threadId: 'thr_9',
            turnId: 'turn_9',
            permissions: { fileSystem: { write: ['/workspace'] }, network: { enabled: true } },
          })
          const networkOnly = await script.peer.request('item/permissions/requestApproval', {
            threadId: 'thr_9',
            turnId: 'turn_9',
            permissions: { network: { enabled: true } },
          })
          script.peer.notify('turn/completed', {
            turnId: 'turn_9',
            turn: { id: 'turn_9', status: 'completed' },
            usage: { inputTokens: 3, outputTokens: 1 },
          })
          recorded.command = command
          recorded.edit = edit
          recorded.deletion = deleteDecision
          recorded.permissions = permissions
          recorded.networkOnly = networkOnly
        })()
      }
    })

    const recorded: { command?: unknown; edit?: unknown; deletion?: unknown; permissions?: unknown; networkOnly?: unknown } = {}
    host.admit(flagRequest('inv-codex', {
      executorId: 'codex-app-server',
      prompt: 'edit the note',
      cwd: '/workspace',
      resumeThreadId: 'thr_9',
    }))
    const running = host.run('inv-codex')
    const nested = cliEffectInvocationId('inv-codex', '3')
    await waitFor(() => host.snapshot().turns.some((turn) => (
      turn.request.invocation.invocationId === nested && turn.phase === 'awaiting_approval'
    )))
    expect(recorded.deletion).toBeUndefined()
    expect(host.snapshot().turns.some((turn) => turn.request.invocation.actionId === InternalActionId.FILE_DELETE)).toBe(true)
    host.approve(nested, human)
    await expect(running).resolves.toMatchObject({
      status: 'completed',
      output: { threadId: 'thr_9', turnId: 'turn_9', text: 'edited' },
    })
    expect(opened).toBe(1)
    expect(recorded.command).toEqual({ decision: 'decline' })
    expect(recorded.edit).toEqual({ decision: 'accept' })
    expect(recorded.deletion).toEqual({ decision: 'accept' })
    expect(recorded.permissions).toEqual({
      scope: 'turn',
      permissions: { fileSystem: { write: ['/workspace'] } },
    })
    expect(recorded.networkOnly).toEqual({ scope: 'turn', permissions: {} })
    expect(methodsOf(script.requests)).toContain('thread/resume')
    expect(methodsOf(script.requests)).not.toContain('thread/start')
    expect(script.notifications.some((entry) => entry.method === 'initialized')).toBe(true)
    expect(script.requests.find((entry) => entry.method === 'thread/resume')?.params).toMatchObject({
      threadId: 'thr_9',
      approvalPolicy: 'on-request',
      sandbox: 'workspaceWrite',
    })
    const editTurn = host.snapshot().turns.find((turn) => turn.request.invocation.actionId === InternalActionId.FILE_UPDATE)
    expect(editTurn?.phase).toBe('admitted')
    expect(host.events('session-1').some((event) => event.kind === 'action_invoked' && event.actionId === 'session.flag')).toBe(true)
  })

  test('stop sends turn/interrupt and does not complete the turn', async () => {
    const pair = createMemoryLinePair()
    const script = scriptPeer(pair.remote, false)
    const cli = new CliExecutorHost({ 'codex-app-server': () => pair.local })
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    script.peer.onRequest((entry) => {
      if (entry.method === 'initialize') script.peer.respond(entry.id, { userAgent: 'codex-test' })
      if (entry.method === 'thread/start') script.peer.respond(entry.id, { thread: { id: 'thr_stop' } })
      if (entry.method === 'turn/start') script.peer.respond(entry.id, { turn: { id: 'turn_stop', status: 'inProgress' } })
      if (entry.method === 'turn/interrupt') script.peer.respond(entry.id, {})
    })
    host.admit(flagRequest('inv-stop', { executorId: 'codex-app-server', prompt: 'keep going' }))
    const running = host.run('inv-stop')
    await waitFor(() => methodsOf(script.requests).includes('turn/start'))
    await new Promise((resolve) => {
      setTimeout(resolve, 30)
    })
    expect(host.stop('inv-stop').reason).toBe('stop_requested')
    await expect(running).resolves.toMatchObject({ status: 'interrupted' })
    expect(methodsOf(script.requests)).toContain('turn/interrupt')
  })

  test('a missing transport fails closed and does not pretend the turn completed', async () => {
    const cli = new CliExecutorHost({})
    const host = new HostTurnKernel(undefined, { nativeEffects: cli })
    cli.attach(host)
    host.admit(flagRequest('inv-none', { executorId: 'codex-app-server', prompt: 'hello' }))
    await expect(host.run('inv-none')).resolves.toMatchObject({ status: 'failed', reason: 'executor_failed' })
    expect(host.events('session-1').some((event) => event.kind === 'action_completed')).toBe(false)
  })
})

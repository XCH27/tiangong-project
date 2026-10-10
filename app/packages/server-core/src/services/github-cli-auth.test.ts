import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import type { ChildProcess } from 'node:child_process'
import { GitHubCliAuth } from './github-cli-auth'

const tokenKeys = ['GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN', 'GITHUB_ENTERPRISE_TOKEN']
let saved: Array<string | undefined>
beforeEach(() => { saved = tokenKeys.map(key => process.env[key]); tokenKeys.forEach(key => delete process.env[key]) })
afterEach(() => tokenKeys.forEach((key, i) => { if (saved[i] === undefined) delete process.env[key]; else process.env[key] = saved[i] }))

function fixture() {
  const process = new EventEmitter() as ChildProcess
  const stderr = new PassThrough()
  Object.defineProperty(process, 'stderr', { value: stderr })
  let kills = 0
  process.kill = () => { kills++; return true }
  let launches = 0
  return { auth: new GitHubCliAuth(() => { launches++; return process }), process, stderr, kills: () => kills, launches: () => launches }
}

describe('GitHub CLI authorization', () => {
  test('only exposes the public code, including split stderr chunks', async () => {
    const f = fixture()
    const start = await f.auth.command('window-a', { action: 'start' })
    f.stderr.write('Token: DO-NOT-EXPOSE\n! First copy your one-time co')
    f.stderr.write('de: ABCD-1234\nOpen this URL: https://untrusted.example/\n')
    expect(await f.auth.command('window-a', { action: 'poll', flowId: start.flowId! })).toEqual({ state: 'waiting', flowId: start.flowId, userCode: 'ABCD-1234' })
    f.process.emit('close', 0)
    expect(await f.auth.command('window-a', { action: 'poll', flowId: start.flowId! })).toEqual({ state: 'complete', flowId: start.flowId })
  })
  test('scopes polling and cancellation; repeated start reuses one process', async () => {
    const f = fixture()
    const start = await f.auth.command('window-a', { action: 'start' })
    expect(await f.auth.command('window-a', { action: 'start' })).toEqual(start)
    expect(await f.auth.command('window-b', { action: 'start' })).toEqual({ state: 'error' })
    expect(await f.auth.command('window-b', { action: 'cancel', flowId: start.flowId! })).toEqual({ state: 'error' })
    expect(f.kills()).toBe(0)
    expect(f.launches()).toBe(1)
    expect(await f.auth.command('window-a', { action: 'cancel', flowId: start.flowId! })).toEqual({ state: 'cancelled', flowId: start.flowId })
    f.process.emit('close', 0)
    expect((await f.auth.command('window-a', { action: 'poll', flowId: start.flowId! })).state).toBe('cancelled')
    expect(f.kills()).toBe(1)
  })
  test('a failed or missing executable does not leak process output', async () => {
    const f = fixture()
    const start = await f.auth.command('window-a', { action: 'start' })
    f.process.emit('error', new Error('sensitive-environment-value'))
    expect(await f.auth.command('window-a', { action: 'poll', flowId: start.flowId! })).toEqual({ state: 'error', flowId: start.flowId })
  })
  test('disconnect cancels only the initiating client and cannot become a late login success', async () => {
    const f = fixture()
    const start = await f.auth.command('window-a', { action: 'start' })
    f.auth.clientDisconnected('window-b')
    expect(f.kills()).toBe(0)
    f.auth.clientDisconnected('window-a')
    expect(f.kills()).toBe(1)
    f.process.emit('close', 0)
    expect(await f.auth.command('window-a', { action: 'poll', flowId: start.flowId! })).toEqual({ state: 'cancelled', flowId: start.flowId })
  })
  test('environment-owned tokens cannot be changed through account controls', async () => {
    const f = fixture()
    process.env.GH_TOKEN = 'fixture'
    expect(await f.auth.command('window-a', { action: 'start' })).toEqual({ state: 'error' })
    expect(await f.auth.command('window-a', { action: 'logout', host: 'github.com', login: 'fixture' })).toEqual({ state: 'error' })
    expect(f.launches()).toBe(0)
  })
})

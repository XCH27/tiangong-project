/**
 * Offline Pi 0.87.1 loop admission probe. No provider/CLI/account/network calls.
 * Run: bun scripts/probes/agent-kernel-contracts.ts
 * This tests the installed loop with a scripted model, not Fleet integration or model quality.
 */
import assert from 'node:assert/strict'

let networkAttempts = 0
globalThis.fetch = (() => { networkAttempts++; throw new Error('OFFLINE_NETWORK_BLOCKED') }) as typeof fetch
const packages = new URL('../../app/node_modules/@earendil-works/', import.meta.url)
const { Agent } = await import(new URL('pi-agent-core/dist/index.js', packages).href)
const { getModel } = await import(new URL('pi-ai/dist/compat.js', packages).href)
const { AssistantMessageEventStream } = await import(new URL('pi-ai/dist/utils/event-stream.js', packages).href)
const model = getModel('openai', 'gpt-6-astra')
assert.ok(model)
const version = (await Bun.file(new URL('pi-agent-core/package.json', packages)).json()).version
assert.equal(version, '0.87.1', 'Review this probe before changing the inspected kernel')
const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }
const text = (value: string) => ({ type: 'text', text: value })
const call = (id: string, args = { revision: 0 }) => ({ type: 'toolCall', id, name: 'edit_document', arguments: args })
const user = (value: string) => ({ role: 'user', content: value, timestamp: 0 })
const cases: string[] = []
function scripted(steps: any[], seen: any[] = []) {
  return (_model: any, context: any) => {
    seen.push(structuredClone(context.messages))
    assert.ok(steps.length, 'Unexpected extra generation')
    const content = steps.shift()
    const message = { role: 'assistant', content, api: model.api, provider: model.provider,
      model: model.id, usage, timestamp: 1,
      stopReason: content.some((b: any) => b.type === 'toolCall') ? 'toolUse' : 'stop' }
    const stream = new AssistantMessageEventStream()
    queueMicrotask(() => { stream.push({ type: 'done', reason: message.stopReason, message }); stream.end(message) })
    return stream
  }
}
function tool(execute: any) {
  return { name: 'edit_document', label: 'Edit document', description: 'Edit the same document as the human UI.',
    parameters: { type: 'object', properties: { revision: { type: 'integer' } }, required: ['revision'], additionalProperties: false },
    execute }
}
function agent(streamFn: any, tools: any[] = [], extra: any = {}) {
  return new Agent({ initialState: { model, tools, systemPrompt: 'Use only admitted project operations.' }, streamFn, ...extra })
}

// The kernel has a hook, but a host must supply its policy: without it the tool runs.
let effects = 0
const operation = tool(async () => { effects++; return { content: [text('saved')], details: { revision: effects } } })
const ungoverned = agent(scripted([[call('raw')], [text('done')]]), [operation])
await ungoverned.prompt('Edit')
assert.equal(effects, 1)
cases.push('bare Pi has no Fleet permission policy; host enforcement is mandatory')

effects = 0
const denied = agent(scripted([[call('denied')], [text('denied')]]), [operation], {
  beforeToolCall: async () => ({ block: true, reason: 'Project plugin is disabled' }),
})
await denied.prompt('Edit')
assert.equal(effects, 0)
assert.ok(denied.state.messages.some((m: any) => m.role === 'toolResult' && m.isError))
cases.push('pre-tool denial produces an error result and no effect')

// A stale model request cannot resurrect a tool absent from this project's inventory.
const excluded = agent(scripted([[call('foreign')], [text('unavailable')]]))
await excluded.prompt('Edit')
assert.equal(effects, 0)
assert.ok(excluded.state.messages.some((m: any) => m.role === 'toolResult' && m.isError))
cases.push('unregistered project tool is rejected')

// Approval cannot protect a stale write alone: the shared domain operation owns the revision check.
let revision = 0
const stale = agent(scripted([[call('stale')], [text('retry required')]]), [tool(async (_id: string, input: any) => {
  assert.equal(input.revision, revision, 'Human edit invalidated the proposed write')
  effects++
  return { content: [text('saved')], details: {} }
})], { beforeToolCall: async () => { revision++; return undefined } })
await stale.prompt('Edit')
assert.equal(effects, 0)
assert.ok(stale.state.messages.some((m: any) => m.role === 'toolResult' && m.isError))
cases.push('human edit is preserved by a domain revision check after approval')

let entered!: () => void
const executing = new Promise<void>(resolve => { entered = resolve })
const cancelled = agent(scripted([[call('cancel')], [text('unexpected')]]), [tool(async (_id: string, _input: any, signal: AbortSignal) => {
  entered()
  await new Promise<void>((_resolve, reject) => {
    if (signal.aborted) reject(new Error('Cancelled'))
    else signal.addEventListener('abort', () => reject(new Error('Cancelled')), { once: true })
  })
  effects++
  return { content: [text('saved')], details: {} }
})])
const cancelledEvents: string[] = []
cancelled.subscribe((event: any) => { cancelledEvents.push(event.type) })
const run = cancelled.prompt('Edit')
await executing
cancelled.abort()
await run
await cancelled.waitForIdle()
assert.equal(effects, 0)
assert.equal(cancelled.state.isStreaming, false)
assert.equal(cancelledEvents.at(-1), 'agent_end')
cases.push('cooperative cancellation settles the tool and run before idle')

const image = { type: 'image', data: 'iVBORw0KGgo=', mimeType: 'image/png' }
const mediaSeen: any[] = []
const media = agent(scripted([[call('media')], [text('done')]], mediaSeen), [tool(async () => {
  effects++
  return { content: [text('image artifact'), image], details: { artifactId: 'local-fixture', revision: 1 } }
})])
await media.prompt('Create an image')
assert.deepEqual(mediaSeen[1].find((m: any) => m.role === 'toolResult').content[1], image)
const persisted = structuredClone(media.state.messages)
const restoredSeen: any[] = []
const restored = agent(scripted([[text('continued')]], restoredSeen), [operation], {
  initialState: { model, messages: persisted, tools: [operation] },
})
await restored.prompt('Continue')
assert.equal(effects, 1, 'Restoring completed history must not execute old tools again')
assert.ok(restoredSeen[0].some((m: any) => m.role === 'toolResult' && m.toolCallId === 'media'))
assert.deepEqual(media.state.messages, persisted)
cases.push('image tool results survive replay; restored completed tools are not re-executed')

const ordered: string[] = []
const steering = agent(scripted([[text('first')], [text('second')], [text('third')]]))
let queued = false
steering.subscribe((event: any) => {
  if (event.type === 'message_end' && event.message.role === 'user') {
    const content = event.message.content
    ordered.push(typeof content === 'string' ? content : content.map((b: any) => b.text ?? '').join(''))
  }
  if (event.type === 'message_end' && event.message.role === 'assistant' && !queued) {
    queued = true
    steering.followUp(user('follow-up'))
    steering.steer(user('steering'))
  }
})
await steering.prompt('initial')
assert.deepEqual(ordered, ['initial', 'steering', 'follow-up'])
cases.push('steering precedes follow-up; adding a second host queue needs an explicit mapping')
assert.equal(networkAttempts, 0)
console.log(JSON.stringify({ version, cases, networkAttempts, scope: 'offline loop only; no Fleet migration or live harness parity' }, null, 2))

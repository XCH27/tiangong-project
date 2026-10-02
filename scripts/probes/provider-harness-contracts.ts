/**
 * Offline source-comparison probe, not a model-quality/cache-hit benchmark.
 * Run: bun scripts/probes/provider-harness-contracts.ts
 * Uses the installed Pi SDK with synthetic credentials/history. onPayload aborts
 * before inference; fetch is independently blocked. Never calls an official CLI.
 */
import assert from 'node:assert/strict'

let fetchAttempts = 0
let payloadCaptures = 0
globalThis.fetch = (() => {
  fetchAttempts += 1
  throw new Error('OFFLINE_NETWORK_BLOCKED')
}) as typeof fetch

const root = new URL('../../app/node_modules/@earendil-works/pi-ai/', import.meta.url)
const sdk = await Bun.file(new URL('package.json', root)).json()
const { getModel } = await import(new URL('dist/compat.js', root).href)
const { normalizeContext } = await import(new URL('dist/utils/transcript.js', root).href)
const STOP = 'OFFLINE_PAYLOAD_CAPTURED'
const googleSignature = Buffer.from('opaque-tool-signature').toString('base64')
const summary: string[] = []
const apiModules = new Map<string, any>()
const tools = [{
  name: 'read_file', description: 'Read an allowed project file.',
  parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'], additionalProperties: false },
}]
const usage = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }

function history(model: any) {
  const signature = model.api === 'openai-completions' ? 'reasoning_content'
    : model.api === 'openai-responses' ? JSON.stringify({ id: 'rs_fixture', type: 'reasoning',
      summary: [{ type: 'summary_text', text: 'Fixture reasoning.' }], encrypted_content: 'opaque-fixture' })
      : 'opaque-fixture-signature'
  return {
    systemPrompt: 'Use approved tools to examine project files.', tools,
    messages: [
      { role: 'user', content: 'Read fixture.txt.', timestamp: 0 },
      { role: 'assistant', provider: model.provider, api: model.api, model: model.id,
        content: [{ type: 'thinking', thinking: 'Fixture reasoning.', thinkingSignature: signature },
          { type: 'toolCall', id: 'call_fixture', name: 'read_file', arguments: { path: 'fixture.txt' }, thoughtSignature: googleSignature }],
        usage, stopReason: 'toolUse', timestamp: 1 },
      { role: 'toolResult', toolCallId: 'call_fixture', toolName: 'read_file',
        content: [{ type: 'text', text: 'Fixture file content.' }], isError: false, timestamp: 2 },
    ],
  }
}

async function capture(model: any, context = history(model), reasoning = 'high') {
  if (!apiModules.has(model.api)) {
    apiModules.set(model.api, await import(new URL(`dist/api/${model.api}.js`, root).href))
  }
  const before = JSON.stringify(context)
  let payload: any
  const result = await apiModules.get(model.api).streamSimple(model, normalizeContext(context), {
    apiKey: 'offline-fixture-key', env: {}, sessionId: 'fixture-session',
    reasoning, cacheRetention: 'short',
    onPayload(body: unknown) { payloadCaptures += 1; payload = structuredClone(body); throw new Error(STOP) },
  }).result()
  assert.ok(payload, `${model.provider}/${model.id}: request was not captured: ${result.errorMessage}`)
  assert.equal(result.stopReason, 'error')
  assert.ok(result.errorMessage?.includes(STOP), 'SDK must stop at capture, before inference')
  assert.equal(JSON.stringify(context), before, 'Serializing must not mutate durable history')
  assert.equal(fetchAttempts, 0, 'SDK reached network before the capture boundary')
  return payload
}

const deepseek = getModel('deepseek', 'deepseek-v4-pro')
const dsHigh = await capture(deepseek)
assert.equal(dsHigh.thinking.type, 'enabled')
assert.equal(dsHigh.reasoning_effort, 'high')
assert.equal(dsHigh.messages.find((m: any) => m.role === 'assistant').reasoning_content, 'Fixture reasoning.')
assert.equal((await capture(deepseek, history(deepseek), 'max')).reasoning_effort, 'max')
assert.equal((await capture(deepseek, history(deepseek), 'off')).thinking.type, 'disabled')
// An unsupported UI value can be silently clamped; the host must expose actual levels.
assert.equal((await capture(deepseek, history(deepseek), 'medium')).reasoning_effort, 'high')
summary.push('DeepSeek Chat: retained reasoning_content; high/max/off mapped; unsupported medium clamped to high')

const zai = getModel('zai', 'glm-5.3')
const glm = await capture(zai)
assert.equal(glm.thinking.type, 'enabled')
assert.equal(glm.thinking.clear_thinking, false)
assert.equal(glm.reasoning_effort, 'high')
assert.equal(glm.messages.find((m: any) => m.role === 'assistant').reasoning_content, 'Fixture reasoning.')
const glmOff = await capture(zai, history(zai), 'off')
assert.equal(glmOff.thinking.type, 'enabled')
assert.equal(glmOff.reasoning_effort, 'low')
summary.push('GLM Chat: clear_thinking=false and reasoning replay; unsupported off clamped to enabled/low')

const claude = getModel('anthropic', 'claude-opus-4-8')
const anthropic = await capture(claude)
assert.equal(anthropic.thinking.type, 'adaptive')
assert.equal(anthropic.output_config.effort, 'high')
assert.ok(anthropic.system.some((b: any) => b.cache_control?.type === 'ephemeral'))
assert.ok(anthropic.tools.some((t: any) => t.cache_control?.type === 'ephemeral'))
assert.ok(anthropic.messages.at(-1).content.some((b: any) => b.cache_control?.type === 'ephemeral'))
assert.ok(anthropic.messages.flatMap((m: any) => m.content).some((b: any) => b.signature === 'opaque-fixture-signature'))
const continued = history(claude)
continued.messages.push({ role: 'user', content: 'Now summarize the file.', timestamp: 3 })
const appended = await capture(claude, continued)
assert.deepEqual(appended.system, anthropic.system)
assert.deepEqual(appended.tools, anthropic.tools)
summary.push('Claude Messages: adaptive effort, cache markers, signature replay; appending a turn leaves system/tools stable')

const gpt = getModel('openai', 'gpt-6-astra')
const responses = await capture(gpt)
assert.equal(responses.prompt_cache_key, 'fixture-session')
assert.equal(responses.reasoning.effort, 'high')
assert.ok(responses.include.includes('reasoning.encrypted_content'))
assert.ok(responses.input.some((b: any) => b.type === 'reasoning' && b.encrypted_content === 'opaque-fixture'))
assert.equal(responses.store, false)
summary.push('OpenAI Responses: session cache key, encrypted reasoning replay and stateless request')

const gemini = getModel('google', 'gemini-3.1-pro-preview')
const google = await capture(gemini)
const functionCall = google.contents.flatMap((m: any) => m.parts).find((p: any) => p.functionCall)
assert.equal(functionCall.thoughtSignature, googleSignature)
const differentModel = history(gemini)
differentModel.messages[1].model = 'different-model-fixture'
const switched = await capture(gemini, differentModel)
assert.ok(!JSON.stringify(switched).includes(googleSignature), 'Must not replay another model signature')
summary.push('Gemini: function-call thought signature retained on same model, removed across model identity')

const kimi = getModel('kimi-coding', 'k3')
const moonshot = await capture(kimi)
assert.equal(kimi.api, 'anthropic-messages')
assert.equal(moonshot.thinking.type, 'adaptive')
assert.equal(moonshot.output_config.effort, 'high')
summary.push('Kimi Coding: Anthropic Messages route uses adaptive effort; not a test of Moonshot Chat thinking.keep')

console.log(JSON.stringify({ sdk: `${sdk.name}@${sdk.version}`, checks: summary, payloadCaptures,
  fetchAttempts, inferenceRequests: 0,
  limits: 'Synthetic request serialization only. No official CLI execution, server acceptance, cache-hit or task-quality claim.' }, null, 2))

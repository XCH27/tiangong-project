/** Full Pi SDK probe, not pi-agent-core or Pi durable. No real account/network calls.
 * node scripts/probes/pi-sdk-provider-boundary.mjs
 * bun scripts/probes/pi-sdk-provider-boundary.mjs --reference
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const reference = process.argv.includes('--reference');
const packages = new URL('../../app/node_modules/@earendil-works/', import.meta.url);
const referenceRoot = new URL('../../源码参考/software/pi-mono-latest/packages/', import.meta.url);
const sdk = reference ? new URL('coding-agent/src/index.ts', referenceRoot)
  : new URL('pi-coding-agent/dist/index.js', packages);
const ai = reference ? new URL('ai/src/index.ts', referenceRoot) : new URL('pi-ai/dist/index.js', packages);
const version = JSON.parse(await readFile(reference ? new URL('coding-agent/package.json', referenceRoot)
  : new URL('pi-coding-agent/package.json', packages))).version;
assert.equal(version, reference ? '0.99.1' : '0.87.1', 'Review SDK contracts before changing the test version');
let networkAttempts = 0;
const fetch = globalThis.fetch;
globalThis.fetch = () => { networkAttempts++; throw new Error('OFFLINE_NETWORK_BLOCKED'); };
const { createAgentSession, createExtensionRuntime, ModelRuntime, SessionManager, SettingsManager } =
  await import(sdk);
const { createAssistantMessageEventStream } = await import(ai);
const root = await mkdtemp(join(tmpdir(), 'fleet-pi-sdk-'));
const checks = [];
const observedGaps = [];
const calls = [];
const steps = new Map();
const zeroCost = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
const definition = { id: 'unlisted-model', name: 'Synthetic unlisted model', reasoning: false,
  input: ['text'], contextWindow: 8192, maxTokens: 1024, cost: zeroCost };
const text = value => ({ type: 'text', text: value });
const toolCall = (id, revision) => ({ type: 'toolCall', id, name: 'set_feature',
  arguments: { revision, enabled: true } });
let allowed = true;
let feature = { revision: 0, enabled: false };
let effects = 0;
let session;
try {
  const modelRuntime = await ModelRuntime.create({
    authPath: join(root, 'auth.json'), modelsPath: null, modelsStorePath: join(root, 'models-cache'),
    allowModelNetwork: false, refreshOnCreate: false,
  });
  const streamSimple = (model, context, options) => {
    assert.equal(options.apiKey, `synthetic-${model.provider}`);
    const content = steps.get(model.provider)?.shift();
    assert.ok(content, 'Unexpected extra provider request');
    calls.push({ provider: model.provider, tools: context.messages
      .filter(m => m.role === 'system').flatMap(m => m.tools?.map(t => t.name) ?? []) });
    const stream = createAssistantMessageEventStream();
    const message = { role: 'assistant', content, api: model.api, provider: model.provider,
      model: model.id, timestamp: Date.now(), stopReason: content.some(b => b.type === 'toolCall') ? 'toolUse' : 'stop',
      usage: { input: 10, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 12, cost: { ...zeroCost, total: 0 } } };
    queueMicrotask(() => {
      stream.push({ type: 'start', partial: { ...message, content: [], stopReason: 'pending' } });
      stream.push({ type: 'done', reason: message.stopReason, message });
    });
    return stream;
  };
  for (const provider of ['fleet-a', 'fleet-b']) {
    modelRuntime.registerProvider(provider, { baseUrl: 'https://fixture.invalid/v1',
      apiKey: `synthetic-${provider}`, api: 'fleet-custom-wire', models: [definition], streamSimple });
  }
  const a = modelRuntime.getModel('fleet-a', definition.id);
  const b = modelRuntime.getModel('fleet-b', definition.id);
  assert.ok(a && b);
  checks.push('two independently authenticated connections register a model and wire API absent from the built-in catalogue');

  const operation = async ({ revision, enabled }) => {
    assert.ok(allowed, 'Host permission denied');
    assert.equal(revision, feature.revision, 'Stale domain revision');
    feature = { revision: feature.revision + 1, enabled };
    await writeFile(join(root, 'feature.json'), JSON.stringify(feature));
    effects++;
    return { content: [text('saved')], details: { revision: feature.revision } };
  };
  const loader = {
    getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
    getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }),
    getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }),
    getSystemPrompt: () => 'Operate only the supplied feature tool.', getSystemPromptSource: () => undefined,
    getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [], extendResources() {}, async reload() {},
  };
  const open = async (manager, model) => (await createAgentSession({
    cwd: root, agentDir: join(root, 'agent'), modelRuntime, ...(model ? { model } : {}),
    sessionManager: manager, resourceLoader: loader,
    settingsManager: SettingsManager.inMemory({ compaction: { enabled: false }, retry: { enabled: false } }),
    tools: ['set_feature'], customTools: [{ name: 'set_feature', label: 'Set feature',
      description: 'Call the Host-owned domain operation.',
      parameters: { type: 'object', properties: { revision: { type: 'integer' }, enabled: { type: 'boolean' } },
        required: ['revision', 'enabled'], additionalProperties: false },
      execute: async (_id, input) => operation(input) }],
  })).session;

  session = await open(SessionManager.create(root, join(root, 'sessions')), a);
  assert.deepEqual(session.getActiveToolNames(), ['set_feature']);
  steps.set('fleet-a', [[toolCall('allowed', 0)], [text('complete')]]);
  await session.prompt('Enable the feature');
  assert.equal(effects, 1);
  assert.equal(JSON.parse(await readFile(join(root, 'feature.json'))).enabled, true);
  assert.ok(calls.every(call => call.provider === 'fleet-a'));
  checks.push('the full Pi AgentSession executes a Host-owned feature operation with an explicit tool allowlist');

  await operation({ revision: 1, enabled: false }); // Human uses the same domain operation.
  steps.set('fleet-a', [[toolCall('stale', 1)], [text('conflict')]]);
  await session.prompt('Apply an obsolete edit');
  assert.equal(effects, 2);
  assert.ok(session.messages.some(m => m.role === 'toolResult' && m.toolCallId === 'stale' && m.isError));
  allowed = false;
  steps.set('fleet-a', [[toolCall('denied', 2)], [text('denied')]]);
  await session.prompt('Try a denied operation');
  assert.equal(effects, 2);
  checks.push('Host denial and stale revision both prevent effects and remain explicit tool failures');

  await session.setModel(b);
  steps.set('fleet-b', [[text('second connection')]]);
  await session.prompt('Use the second connection');
  assert.equal(calls.at(-1).provider, 'fleet-b');
  const sessionFile = session.sessionManager.getSessionFile();
  assert.ok(sessionFile);
  session.dispose();
  session = await open(SessionManager.open(sessionFile));
  assert.equal(session.model.provider, 'fleet-b');
  assert.ok(session.messages.some(m => m.role === 'toolResult' && m.toolCallId === 'denied'));
  checks.push('idle connection switching and the private native session restore preserve provider identity and tool outcomes');
  // Counter-evidence, not an acceptance pass: SDK setModel publishes memory before its native write.
  const appendModelChange = session.sessionManager.appendModelChange.bind(session.sessionManager);
  session.sessionManager.appendModelChange = () => { throw new Error('synthetic model write failure'); };
  try {
    await assert.rejects(session.setModel(a), /synthetic model write failure/);
    assert.equal(session.model.provider, 'fleet-a');
    observedGaps.push('setModel rejects a failed native write but leaves the in-memory model changed; the Host must reconcile or discard that executor before another input');
  } finally {
    session.sessionManager.appendModelChange = appendModelChange;
  }
  assert.equal(networkAttempts, 0);
  console.log(JSON.stringify({ sdkVersion: version, checks, observedGaps, requests: calls.length, networkAttempts,
    limits: 'Scripted provider and fixture Host operation; no live authentication, model quality, Fleet UI or migration proof.' }, null, 2));
} finally {
  session?.dispose();
  globalThis.fetch = fetch;
  await rm(root, { recursive: true, force: true });
}

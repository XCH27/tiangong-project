/** Offline observations of the actual Pi durable candidate, not a Fleet implementation. */
import assert from 'node:assert/strict';
import { test } from 'node:test';

const packages = new URL('../../源码参考/software/pi-mono-latest/packages/', import.meta.url);
const { Harness, MemoryStorage, ConversationConfig, createRegistry } = await import(new URL('durable/dist/index.js', packages));
const { createModels, fauxProvider, fauxAssistantMessage, fauxToolCall, Type } = await import(new URL('ai/dist/index.js', packages));
const { BACKGROUND_CONTEXT: context } = await import(new URL('chord/dist/context/index.js', packages));
globalThis.fetch = () => { throw new Error('OFFLINE_NETWORK_BLOCKED'); };

const modelA = { provider: 'route-a', modelId: 'faux-1' };
const modelB = { provider: 'route-b', modelId: 'faux-1' };
const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};

async function setup() {
  const a = fauxProvider({ provider: modelA.provider });
  const b = fauxProvider({ provider: modelB.provider });
  const models = createModels();
  models.setProvider(a.provider);
  models.setProvider(b.provider);
  const entered = deferred();
  const release = deferred();
  const registry = createRegistry();
  registry.tools.add({
    name: 'wait_for_human_edit',
    description: 'Hold a tool while a person changes the selection.',
    parameters: Type.Object({}),
    async execute() {
      entered.resolve();
      await release.promise;
      return { content: [{ type: 'text', text: 'The human edit is complete.' }] };
    },
  });
  const harness = await Harness.open(new MemoryStorage(), { models, registry }, context);
  const root = await harness.root(context, { init: async (tx, id) => {
    (await tx.doc(ConversationConfig, id)).model = modelA;
  } });
  return { a, b, harness, root, entered, release };
}

test('raw setModel during a tool affects the next request of the SAME submitted turn', async () => {
  const s = await setup();
  try {
    s.a.setResponses([fauxAssistantMessage([fauxToolCall('wait_for_human_edit', {}, { id: 'call-a' })], { stopReason: 'toolUse' })]);
    s.b.setResponses([fauxAssistantMessage('Completed by B')]);
    s.harness.resume();
    const input = await s.root.submit({ type: 'input', content: 'Run on A' }, context);
    await s.entered.promise;
    await s.root.setModel(modelB, context);
    s.release.resolve();
    assert.equal((await input.wait(context)).status, 'done');
    assert.equal(s.a.state.callCount, 1);
    assert.equal(s.b.state.callCount, 1);
    // This is upstream behavior to guard at Fleet admission, not a desired UI guarantee.
    const page = await s.root.entries({}, 100, undefined, context);
    const providers = page.items.flatMap(entry => entry.model ?? [])
      .filter(message => message.role === 'assistant').map(message => message.provider);
    assert.deepEqual(new Set(providers), new Set(['route-a', 'route-b']));
  } finally {
    s.release.resolve();
    await s.harness.close(context);
  }
});

test('a paused queued submission does not capture the model selected when submitted', async () => {
  const s = await setup();
  try {
    const input = await s.root.submit({ type: 'input', content: 'Queued while A was selected' }, context);
    await s.root.setModel(modelB, context);
    s.b.setResponses([fauxAssistantMessage('Prepared later on B')]);
    s.harness.resume();
    assert.equal((await input.wait(context)).status, 'done');
    assert.equal(s.a.state.callCount, 0);
    assert.equal(s.b.state.callCount, 1);
  } finally { await s.harness.close(context); }
});

test('waiting for idle before changing the model preserves the first turn route', async () => {
  const s = await setup();
  try {
    s.a.setResponses([
      fauxAssistantMessage([fauxToolCall('wait_for_human_edit', {}, { id: 'call-a' })], { stopReason: 'toolUse' }),
      fauxAssistantMessage('Completed by A'),
    ]);
    s.harness.resume();
    const first = await s.root.submit({ type: 'input', content: 'Run on A' }, context);
    await s.entered.promise;
    s.release.resolve();
    assert.equal((await first.wait(context)).status, 'done');
    await s.root.waitForIdle(context);
    await s.root.setModel(modelB, context);
    s.b.setResponses([fauxAssistantMessage('Next turn by B')]);
    const next = await s.root.submit({ type: 'input', content: 'Continue on B' }, context);
    assert.equal((await next.wait(context)).status, 'done');
    assert.equal(s.a.state.callCount, 2);
    assert.equal(s.b.state.callCount, 1);
  } finally {
    s.release.resolve();
    await s.harness.close(context);
  }
});

/**
 * Offline source-candidate probe. Build the pinned reference's chord, pi-ai and pi-durable
 * workspaces first; this script never sends a model request or changes Fleet production state.
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const reference = new URL("../../源码参考/software/pi-mono-latest/packages/", import.meta.url);
const {
  createModels,
  fauxProvider,
  fauxAssistantMessage,
  fauxText,
  fauxToolCall,
  Type,
} = await import(new URL("ai/dist/index.js", reference));
const { BACKGROUND_CONTEXT: context } = await import(
  new URL("chord/dist/context/index.js", reference)
);
const { createFacetHost, defineFacet, defineService } = await import(
  new URL("chord/dist/index.js", reference)
);
const { Harness, createRegistry, defineDoc, defineTask, ConversationConfig, ToolTask, ToolResultEntry } =
  await import(new URL("durable/dist/index.js", reference));
const { openNodeSqliteStorage } = await import(
  new URL("durable/dist/storage/sqlite/node.js", reference)
);

let networkAttempts = 0;
globalThis.fetch = () => {
  networkAttempts++;
  throw new Error("OFFLINE_NETWORK_BLOCKED");
};

const ProjectRecord = defineDoc({
  kind: "fleet.probe.project-record",
  version: 1,
  scope: "session",
  initial: () => ({ revision: 0, text: "" }),
});
const ProjectGrant = defineDoc({
  kind: "fleet.probe.project-grant",
  version: 1,
  scope: "session",
  initial: () => ({ allowed: true }),
});
const MediaJob = defineDoc({
  kind: "fleet.probe.media-job",
  version: 1,
  scope: "session",
  initial: () => ({ status: "none", requestKey: null, artifactUri: null }),
});
const rootDir = await mkdtemp(join(tmpdir(), "fleet-kernel-proof-"));
const dbPath = join(rootDir, "project.sqlite");
let mutations = 0;
let mediaCalls = 0;
let interruptMediaOnce = true;
const mediaReceipts = new Map();

const GenerateMedia = defineTask({
  name: "fleet.probe.generate-media",
  version: 1,
  initial: () => ({ phase: "prepare" }),
  phases: {
    prepare: async (task, runtime, callContext) => {
      await runtime.commit(async (tx) => {
        if (!(await tx.doc(ProjectGrant)).allowed) {
          return { status: "failed", message: "project grant revoked" };
        }
        const key = `media-${task.id}`;
        const job = await tx.doc(MediaJob);
        job.status = "requested";
        job.requestKey = key;
        return { status: "running", checkpoint: { phase: "invoke", key } };
      }, callContext);
    },
    invoke: async (task, runtime, callContext) => {
      const key = task.state.checkpoint.key;
      let receipt = mediaReceipts.get(key);
      if (!receipt) {
        mediaCalls++;
        receipt = { uri: `artifact://fleet-probe/${key}.png` };
        mediaReceipts.set(key, receipt);
      }
      if (interruptMediaOnce) {
        interruptMediaOnce = false;
        await new Promise((_, reject) => {
          if (runtime.signal.aborted) reject(runtime.signal.reason);
          else runtime.signal.addEventListener("abort", () => reject(runtime.signal.reason), { once: true });
        });
      }
      await runtime.commit(async (tx) => {
        const job = await tx.doc(MediaJob);
        job.status = "completed";
        job.artifactUri = receipt.uri;
        return { status: "terminal", outcome: { status: "completed", result: receipt } };
      }, callContext);
    },
  },
  abort: async (_task, runtime, callContext) => {
    await runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), callContext);
  },
});

function editRecord(record, input, grant) {
  if (!grant.allowed) throw new Error("project grant revoked");
  if (record.revision !== input.revision) throw new Error("stale project revision");
  record.revision++;
  record.text = input.text;
  mutations++;
}

const registry = createRegistry();
registry.tasks.add(GenerateMedia);
registry.tools.add({
  name: "edit_project_record",
  description: "Change the shared Project record at its expected revision.",
  parameters: Type.Object({ revision: Type.Integer(), text: Type.String() }),
  async execute(args, api, callContext) {
    await api.commit(async (tx) => {
      const grant = await tx.doc(ProjectGrant);
      editRecord(await tx.doc(ProjectRecord), args, grant);
    }, callContext);
    return { content: [{ type: "text", text: "saved" }] };
  },
});
registry.hooks.add(ToolTask, {
  beforeTool: async (_call, api, callContext) => {
    const grant = await api.snapshot(ProjectGrant, callContext);
    return grant?.allowed ? undefined : { block: "project grant revoked" };
  },
});

const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);

async function open() {
  const harness = await Harness.open(await openNodeSqliteStorage(dbPath), { models, registry }, context);
  const root = await harness.root(context, {
    init: async (tx, id) => {
      (await tx.doc(ConversationConfig, id)).model = { provider: "faux", modelId: "faux-1" };
    },
  });
  harness.resume();
  return { harness, root };
}

async function read(harness) {
  return harness.snapshot(ProjectRecord, context);
}

async function ask(root, revision, text, callId, afterModelResponse) {
  const response = fauxAssistantMessage(
    [fauxToolCall("edit_project_record", { revision, text }, { id: callId })],
    { stopReason: "toolUse" },
  );
  faux.setResponses([
    async () => {
      await afterModelResponse?.();
      return response;
    },
    fauxAssistantMessage([fauxText("done")]),
  ]);
  const submission = await root.submit({ type: "input", content: "Update the record" }, context);
  assert.equal((await submission.wait(context)).status, "done");
  const page = await root.entries({}, 100, undefined, context);
  const result = page.items.find((entry) => ToolResultEntry.is(entry) && entry.model?.[0]?.toolCallId === callId);
  assert.ok(result, `missing result ${callId}`);
  return result.model[0];
}

try {
  let { harness, root } = await open();
  await root.commit(async (tx) => {
    const grant = await tx.doc(ProjectGrant);
    editRecord(await tx.doc(ProjectRecord), { revision: 0, text: "human" }, grant);
  }, context);
  assert.deepEqual(await read(harness), { revision: 1, text: "human" });

  const stale = await ask(root, 0, "agent stale", "stale");
  assert.equal(stale.isError, true);
  assert.deepEqual(await read(harness), { revision: 1, text: "human" });

  const revoked = await ask(root, 1, "agent denied", "revoked", async () => {
    await root.commit(async (tx) => {
      (await tx.doc(ProjectGrant)).allowed = false;
    }, context);
  });
  assert.equal(revoked.isError, true);
  assert.deepEqual(await read(harness), { revision: 1, text: "human" });

  await root.commit(async (tx) => {
    (await tx.doc(ProjectGrant)).allowed = true;
  }, context);
  const accepted = await ask(root, 1, "agent accepted", "accepted");
  assert.equal(accepted.isError, false);
  assert.deepEqual(await read(harness), { revision: 2, text: "agent accepted" });

  const mediaTaskId = await root.commit((tx) => tx.createTask(GenerateMedia, { prompt: "draw a chart" }), context);
  for (let attempt = 0; attempt < 100 && mediaCalls === 0; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert.equal(mediaCalls, 1);
  assert.deepEqual(await harness.snapshot(MediaJob, context), {
    status: "requested",
    requestKey: `media-${mediaTaskId}`,
    artifactUri: null,
  });
  await harness.close(context);

  ({ harness, root } = await open());
  assert.deepEqual(await read(harness), { revision: 2, text: "agent accepted" });
  assert.deepEqual(await harness.snapshot(ProjectGrant, context), { allowed: true });
  const mediaResult = await harness.waitForTask(mediaTaskId, context);
  assert.deepEqual(mediaResult.state.outcome, {
    status: "completed",
    result: { uri: `artifact://fleet-probe/media-${mediaTaskId}.png` },
  });
  assert.equal(mediaCalls, 1);
  assert.deepEqual(await harness.snapshot(MediaJob, context), {
    status: "completed",
    requestKey: `media-${mediaTaskId}`,
    artifactUri: `artifact://fleet-probe/media-${mediaTaskId}.png`,
  });

  const ProjectProjection = defineService("fleet.probe.project-projection");
  const projection = defineFacet({
    id: "fleet.probe.project-panel",
    setup(env) {
      env.provide(ProjectProjection, {
        read: () => harness.snapshot(ProjectRecord, context),
      });
    },
  });
  const facetHost = await createFacetHost({ facets: [projection] });
  assert.deepEqual(await facetHost.services.use(ProjectProjection).read(), {
    revision: 2,
    text: "agent accepted",
  });
  await facetHost.dispose();
  assert.throws(() => facetHost.services.use(ProjectProjection));
  assert.equal(mutations, 2);
  await harness.close(context);

  const otherFaux = fauxProvider();
  const otherModels = createModels();
  otherModels.setProvider(otherFaux.provider);
  const otherHarness = await Harness.open(
    await openNodeSqliteStorage(join(rootDir, "other-project.sqlite")),
    { models: otherModels, registry: createRegistry() },
    context,
  );
  const otherRoot = await otherHarness.root(context, {
    init: async (tx, id) => {
      (await tx.doc(ConversationConfig, id)).model = { provider: "faux", modelId: "faux-1" };
    },
  });
  otherHarness.resume();
  otherFaux.setResponses([
    fauxAssistantMessage(
      [fauxToolCall("edit_project_record", { revision: 0, text: "cross-project" }, { id: "missing" })],
      { stopReason: "toolUse" },
    ),
    fauxAssistantMessage([fauxText("done")]),
  ]);
  const otherSubmission = await otherRoot.submit({ type: "input", content: "Edit" }, context);
  assert.equal((await otherSubmission.wait(context)).status, "done");
  const otherEntries = await otherRoot.entries({}, 100, undefined, context);
  const missing = otherEntries.items.find(
    (entry) => ToolResultEntry.is(entry) && entry.model?.[0]?.toolCallId === "missing",
  );
  assert.equal(missing?.model?.[0]?.isError, true);
  assert.equal(await otherHarness.snapshot(ProjectRecord, context), undefined);
  await otherHarness.close(context);

  assert.equal(networkAttempts, 0);
  process.stdout.write("Fleet kernel candidate: shared edit, persisted revocation, media task recovery, facet disposal, project isolation and zero network attempts passed.\n");
} finally {
  await rm(rootDir, { recursive: true, force: true });
}

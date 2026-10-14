/** Inspect an installed native protocol without starting a thread, reading auth or running inference. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const directory = await mkdtemp(join(tmpdir(), 'fleet-native-schema-'));
try {
  const version = execFileSync('codex', ['--version'], { encoding: 'utf8' }).trim();
  execFileSync('codex', ['app-server', 'generate-json-schema', '--experimental', '--out', directory],
    { stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 });
  const schema = async name => JSON.parse(await readFile(join(directory, `${name}.json`), 'utf8'));
  const start = await schema('v2/ThreadStartParams');
  const turn = await schema('v2/TurnStartParams');
  const steer = await schema('v2/TurnSteerParams');
  const update = await schema('v2/ThreadSettingsUpdateParams');
  const tool = await schema('DynamicToolCallParams');
  const approval = await schema('CommandExecutionRequestApprovalParams');
  assert.ok(start.properties.dynamicTools);
  assert.ok(start.properties.modelProvider);
  assert.equal(turn.properties.modelProvider, undefined);
  assert.ok(steer.required.includes('expectedTurnId'));
  assert.equal(steer.properties.model, undefined);
  assert.match(update.properties.model.description, /subsequent turns/);
  assert.match(update.properties.approvalPolicy.description, /subsequent turns/);
  for (const identity of ['callId', 'threadId', 'turnId']) assert.ok(tool.required.includes(identity));
  for (const identity of ['threadId', 'turnId', 'itemId']) assert.ok(approval.required.includes(identity));
  process.stdout.write(`${version}: provider at thread scope; model/policy for subsequent turns; steering requires active-turn identity; tool/approval identities preserved.\n`);
} finally { await rm(directory, { recursive: true, force: true }); }

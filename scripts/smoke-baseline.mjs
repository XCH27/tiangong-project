#!/usr/bin/env node
/** Production backend smoke with synthetic data, an isolated profile and denied outbound APIs.
 * Run after installing app dependencies: bun scripts/smoke-baseline.mjs
 * This does not claim an OS firewall, renderer/packaged acceptance or provider subprocess coverage.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { connect } from 'node:net';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const evidence = mkdtempSync(join(tmpdir(), 'fleet-offline-smoke-'));
const profile = join(evidence, 'profile');
mkdirSync(profile);
const traffic = join(evidence, 'traffic.jsonl');
const guard = join(evidence, 'deny-network.ts');
const entry = join(evidence, 'entry.ts');
writeFileSync(traffic, '');
writeFileSync(guard, `
import { appendFileSync } from 'node:fs';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
const local = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
let selfTest = true;
function deny(host, transport) {
  if (local.has(host)) return;
  appendFileSync(${JSON.stringify(traffic)}, JSON.stringify({ host, transport, selfTest }) + '\\n');
  throw new Error('FLEET_SMOKE_OUTBOUND_DENIED');
}
const originalFetch = globalThis.fetch;
globalThis.fetch = function(input, options) {
  deny(new URL(typeof input === 'string' || input instanceof URL ? input : input.url).hostname, 'fetch');
  return originalFetch(input, options);
};
for (const [label, api] of [['http', http], ['https', https]]) {
  for (const method of ['request', 'get']) {
    const original = api[method];
    api[method] = function(input, ...args) {
      const host = typeof input === 'string' || input instanceof URL
        ? new URL(input).hostname : input.hostname || input.host || 'localhost';
      deny(host, label);
      return original.call(this, input, ...args);
    };
  }
}
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function(...args) {
  const first = Array.isArray(args[0]) ? args[0][0] : args[0];
  if (typeof first === 'object' && first !== null && !first.path) deny(first.host || 'localhost', 'socket');
  else if (typeof first === 'number') deny(typeof args[1] === 'string' ? args[1] : 'localhost', 'socket');
  return originalConnect.apply(this, args);
};
if (typeof Bun !== 'undefined') {
  const originalBunConnect = Bun.connect;
  Bun.connect = function(options) {
    if (!options.unix) deny(options.hostname || 'localhost', 'bun-socket');
    return originalBunConnect(options);
  };
}
for (const attempt of [() => fetch('https://smoke.invalid'), () => https.get('https://smoke.invalid'), () => net.connect({ host: 'smoke.invalid', port: 443 })]) {
  let rejected = false;
  try { await attempt(); } catch (error) { rejected = error.message === 'FLEET_SMOKE_OUTBOUND_DENIED'; }
  if (!rejected) throw new Error('Network guard self-test failed');
}
selfTest = false;
`);
writeFileSync(entry, `await import('./deny-network.ts');\nawait import(${JSON.stringify(join(root, 'app/packages/server/src/index.ts'))});\n`);

const token = randomUUID() + randomUUID();
const env = Object.fromEntries(['PATH', 'HOME', 'TMPDIR', 'LANG', 'USER', 'SHELL'].filter(key => process.env[key]).map(key => [key, process.env[key]]));
Object.assign(env, {
  CRAFT_CONFIG_DIR: profile, CRAFT_RPC_HOST: '127.0.0.1', CRAFT_RPC_PORT: '0',
  CRAFT_HEALTH_PORT: '0', CRAFT_SERVER_TOKEN: token,
  CRAFT_BUNDLED_ASSETS_ROOT: join(root, 'app/apps/electron'),
});
const child = spawn('bun', ['run', entry], {
  cwd: join(root, 'app'), env, stdio: ['ignore', 'pipe', 'pipe'],
});
let stdout = '', stderr = '', socket, address;
const exited = once(child, 'exit');
child.stdout.on('data', chunk => { stdout += chunk.toString(); });
child.stderr.on('data', chunk => { stderr += chunk.toString(); });
const checks = [];
const deadline = setTimeout(() => child.kill('SIGKILL'), 45_000);
const pending = new Map();
function rpc(channel, ...args) {
  const id = randomUUID();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`RPC timeout: ${channel}`)); }, 5_000);
    pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id, type: 'request', channel, args }));
  });
}
let failure;
try {
  const started = Date.now();
  while (!address && Date.now() - started < 15_000) {
    address = stdout.match(/^CRAFT_SERVER_URL=(.+)$/m)?.[1]?.trim();
    if (child.exitCode !== null) throw new Error('Backend exited before startup');
    if (!address) await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.ok(address, 'Backend startup timeout');
  socket = new WebSocket(address);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Handshake timeout')), 5_000);
    socket.addEventListener('open', () => socket.send(JSON.stringify({ id: randomUUID(), type: 'handshake', protocolVersion: '1.0', token })));
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WebSocket error')); });
    socket.addEventListener('message', ({ data }) => {
      const msg = JSON.parse(data);
      if (msg.type === 'handshake_ack') { clearTimeout(timer); resolve(); }
      else if (pending.has(msg.id)) {
        const request = pending.get(msg.id); pending.delete(msg.id);
        msg.error ? request.reject(new Error(msg.error.message)) : request.resolve(msg.result);
      } else if (msg.type === 'error') { clearTimeout(timer); reject(new Error(msg.error?.message || 'Handshake failed')); }
    });
  });
  assert.equal((await rpc('server:getHealth')).status, 'ok');
  checks.push('authenticated startup and health');
  const workspace = await rpc('server:createWorkspace', 'Offline baseline fixture');
  await rpc('window:switchWorkspace', workspace.id);
  const workspaceRoot = JSON.parse(readFileSync(join(profile, 'config.json'), 'utf8')).workspaces.find(item => item.id === workspace.id).rootPath;
  mkdirSync(join(workspaceRoot, 'folder-fixture'));
  writeFileSync(join(workspaceRoot, 'folder-fixture', 'nested-fixture.md'), 'Nested file');
  const fixtureFile = join(workspaceRoot, 'resource-fixture.md');
  writeFileSync(fixtureFile, 'Project resource fixture');
  const projectFiles = await rpc('fs:search', 'workspace_root', 'resource-fixture');
  assert.ok(projectFiles.some(file => file.path === fixtureFile));
  const directFiles = await rpc('fs:search', 'workspace_root', '', { recursive: false });
  assert.ok(directFiles.some(file => file.name === 'folder-fixture' && file.type === 'directory'));
  assert.ok(!directFiles.some(file => file.name === 'nested-fixture.md'));
  const nestedFiles = await rpc('fs:search', join(workspaceRoot, 'folder-fixture'), '', { recursive: false });
  assert.ok(nestedFiles.some(file => file.name === 'nested-fixture.md'));
  await assert.rejects(rpc('fs:search', fixtureFile, ''), /ENOTDIR|directory/i);
  const oldProject = await rpc('projects:create', workspace.id, { name: 'Previous resource record' });
  await rpc('projects:uploadAsset', workspace.id, oldProject.slug, { filename: 'retained.txt', base64: Buffer.from('preserved asset').toString('base64') });
  const assets = await rpc('projects:listAssets', workspace.id, oldProject.slug);
  assert.equal(assets.length, 1);
  assert.equal(await rpc('file:read', assets[0].absolutePath), 'preserved asset');
  assert.equal((await rpc('projects:getOne', workspace.id, oldProject.slug)).config.id, oldProject.id);
  checks.push('Project-root file lookup, surfaced read failure and preserved nested-record assets');
  const session = await rpc('sessions:create', workspace.id, { name: 'Offline conversation', workingDirectory: 'none', permissionMode: 'safe' });
  assert.equal(session.workingDirectory, '');
  const projectSession = await rpc('sessions:create', workspace.id, { workingDirectory: 'workspace_root', permissionMode: 'safe' });
  assert.equal(projectSession.workingDirectory, workspaceRoot);
  const command = body => rpc('sessions:command', session.id, body);
  await command({ type: 'rename', name: 'Local exported conversation' });
  await command({ type: 'flag' });
  await command({ type: 'archive' });
  await command({ type: 'unarchive' });
  const label = await rpc('labels:create', workspace.id, { name: 'Offline label' });
  await command({ type: 'setLabels', labels: [label.id] });
  const current = await rpc('sessions:getMessages', session.id);
  assert.equal(current.name, 'Local exported conversation');
  assert.equal(current.isFlagged, true);
  assert.ok(current.labels.includes(label.id));
  checks.push('Workspace, Session, labels, pin, archive and restore');
  const exported = await command({ type: 'exportMarkdown' });
  assert.equal(exported.success, true);
  assert.ok(exported.markdown.includes('# Local exported conversation'));
  const publication = await command({ type: 'shareToViewer' });
  assert.equal(publication.success, false);
  assert.match(publication.error, /unavailable|disabled|retired|local/i);
  checks.push('local Markdown export and denied hosted publication');
  assert.ok((await rpc('statuses:list', workspace.id)).length > 0);
  assert.ok(await rpc('permissions:getDefaults'));
  assert.ok(await rpc('workspaceSettings:get', workspace.id));
  assert.deepEqual(await rpc('tasks:list', workspace.id), []);
  await rpc('automations:get', workspace.id);
  checks.push('status, permission, settings, task and automation reads');
  const guide = readFileSync(join(profile, 'docs', 'index.md'), 'utf8');
  assert.ok(guide.includes('Fleet local documentation'));
  assert.ok(!guide.includes('thecraftagents.com'));
  checks.push('bundled help seeded in the selected profile');
  const records = readFileSync(traffic, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  assert.equal(records.filter(row => row.selfTest).length, 3);
  assert.deepEqual(records.filter(row => !row.selfTest), []);
  checks.push('outbound guards self-tested; no outbound attempts in exercised flows');
} catch (error) {
  failure = error;
} finally {
  socket?.close();
  for (const request of pending.values()) request.reject(new Error('Smoke ended'));
  child.kill('SIGTERM');
  const [code, signal] = await exited;
  clearTimeout(deadline);
  if (code !== 0 && !failure) failure = new Error(`Backend shutdown failed (${code}, ${signal})`);
  if (existsSync(join(profile, '.server.lock')) && !failure) failure = new Error('Server lock survived shutdown');
  if (address) {
    const port = Number(new URL(address).port);
    const listening = await new Promise(resolve => {
      const probe = connect({ host: '127.0.0.1', port });
      probe.once('connect', () => { probe.destroy(); resolve(true); });
      probe.once('error', () => resolve(false));
    });
    if (listening && !failure) failure = new Error('RPC listener survived shutdown');
  }
  const redact = value => value.replaceAll(token, '[REDACTED]').replace(/^CRAFT_SERVER_TOKEN=.*$/mg, 'CRAFT_SERVER_TOKEN=[REDACTED]');
  writeFileSync(join(evidence, 'stdout.log'), redact(stdout), { mode: 0o600 });
  writeFileSync(join(evidence, 'stderr.log'), redact(stderr), { mode: 0o600 });
  rmSync(profile, { recursive: true, force: true }); // Only the temporary directory created by this run.
  const result = { passed: !failure, entry: 'app/packages/server/src/index.ts', checks, profileRemoved: !existsSync(profile), evidence, error: failure?.message };
  writeFileSync(join(evidence, 'result.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
if (failure) process.exitCode = 1;

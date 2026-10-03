// Reproduce the optional native executor without replacing the user's CLI or credentials.
import { createHash } from 'node:crypto';
import { readFile, mkdir, copyFile, chmod, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const recipeRoot = join(root, 'patches/codex-host');
const recipe = JSON.parse(await readFile(join(recipeRoot, 'source.json'), 'utf8'));
const source = resolve(process.env.FLEET_CODEX_SOURCE_DIR ?? join(root, '.fleet/codex-host-source'));
const candidate = join(root, '.fleet/zcode');
const patch = join(recipeRoot, recipe.patch);
if (recipe.repository !== 'https://github.com/openai/codex.git' || !/^[a-f0-9]{40}$/.test(recipe.commit) ||
    createHash('sha256').update(await readFile(patch)).digest('hex') !== recipe.patchSha256) {
  throw new Error('The Codex source recipe or patch hash changed');
}
const run = (command, args, cwd = source, capture = false) => new Promise((resolveResult, reject) => {
  const child = spawn(command, args, { cwd, shell: false, windowsHide: true,
    stdio: ['ignore', capture ? 'pipe' : 'inherit', 'inherit'] });
  let text = '';
  if (capture) child.stdout.on('data', (bytes) => { text += bytes.toString(); });
  child.once('error', reject);
  child.once('close', (code) => code === 0 ? resolveResult(text.trim())
    : reject(new Error(`${command} failed (${code})`)));
});
if (!existsSync(join(candidate, '.git'))) throw new Error('The active candidate is unavailable');
if (!existsSync(source)) {
  await mkdir(dirname(source), { recursive: true });
  await run('git', ['clone', '--depth', '1', '--filter=blob:none', '--branch', recipe.tag, recipe.repository, source], root);
}
if (await run('git', ['rev-parse', 'HEAD'], source, true) !== recipe.commit) {
  throw new Error('Codex source is on another commit; preserve it and use a fresh build directory');
}
// Compare through a temporary index; no source reset, user index mutation or hidden reapplication.
const { mkdtemp, rm } = await import('node:fs/promises');
const { tmpdir } = await import('node:os');
const scratch = await mkdtemp(join(tmpdir(), 'fleet-codex-source-'));
const originalIndex = process.env.GIT_INDEX_FILE;
try {
  process.env.GIT_INDEX_FILE = join(scratch, 'index');
  await run('git', ['read-tree', recipe.commit]);
  await run('git', ['add', '-A']);
  const currentTree = await run('git', ['write-tree'], source, true);
  const baseTree = await run('git', ['rev-parse', `${recipe.commit}^{tree}`], source, true);
  if (currentTree === baseTree) {
    await run('git', ['apply', '--check', patch]);
    await run('git', ['apply', patch]);
    await run('git', ['add', '-A']);
  } else if (currentTree !== recipe.tree) {
    throw new Error('The Codex build directory has unrelated changes; use a fresh directory');
  }
  if (await run('git', ['write-tree'], source, true) !== recipe.tree) {
    throw new Error('The reconstructed Codex source does not match its recorded tree');
  }
} finally {
  if (originalIndex === undefined) delete process.env.GIT_INDEX_FILE;
  else process.env.GIT_INDEX_FILE = originalIndex;
  await rm(scratch, { recursive: true, force: true });
}
await run('cargo', ['build', '--locked', '-p', 'codex-cli', '--bin', 'codex'], join(source, 'codex-rs'));
const target = join(candidate, 'packages/desktop/bundled-agents', `${process.platform}-${process.arch}`, 'codex');
await mkdir(target, { recursive: true });
const name = process.platform === 'win32' ? 'codex.exe' : 'codex';
const binary = join(source, 'codex-rs/target/debug', name);
const staging = join(target, `${name}.tmp`);
await copyFile(binary, staging); await chmod(staging, 0o755); await rename(staging, join(target, name));
await copyFile(join(source, 'LICENSE'), join(target, 'LICENSE.codex.txt'));
await copyFile(join(recipeRoot, 'source.json'), join(target, 'SOURCE.json'));
console.log(`Scoped Codex staged for ${process.platform}-${process.arch}; restart the single review instance to load it.`);

#!/usr/bin/env node
// One persistent candidate review profile. Electron's original single-instance lock focuses repeats.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function reviewLaunch(projectRoot, environment = process.env, platform = process.platform) {
  const candidate = join(projectRoot, '.fleet/zcode');
  const profile = join(projectRoot, '.fleet/reviews/project-audit/desktop');
  const env = { ...environment };
  delete env.ELECTRON_RUN_AS_NODE;
  Object.assign(env, {
    ZCODE_DATA_BASE_DIR: join(profile, 'data'),
    ZCODE_DESKTOP_USER_DATA_DIR: join(profile, 'electron'),
    ZCODE_DESKTOP_HOME_DIR: join(profile, 'desktop-home'),
    ZCODE_STORAGE_DIR: join(profile, 'cli-storage'),
    ZCODE_HOME: join(profile, 'cli-home'),
    ZCODE_SESSION_DB: join(profile, 'sessions.sqlite'),
    ZCODE_DISABLE_FIXED_REMOTE_DEBUGGING_PORT: '1',
    ZCODE_DESKTOP_APPLICATION_NAME: 'Fleet 项目审查',
    ZCODE_BUILTIN_PROVIDER_CONFIG_FILE: join(candidate, 'config/provider/zcode-builtin.json'),
    ZCODE_PERSONAL_PROVIDER_CONFIG_FILE: join(profile, 'data/.zcode/v2/provider_config.json'),
  });
  const runtime = join(candidate, 'node_modules/electron/dist');
  const executable = platform === 'darwin' ? join(runtime, 'Electron.app/Contents/MacOS/Electron')
    : join(runtime, platform === 'win32' ? 'electron.exe' : 'electron');
  return { candidate, profile, env, executable, args: [join(candidate, 'packages/desktop'), '--force-renderer-accessibility'] };
}

function recordedInstance(projectRoot) {
  const records = ['project-audit/desktop/review.json', 'native-executor/review.json', 'attachment-preview/review.json', 'model-settings/review.json'];
  for (const record of records) {
    const path = join(projectRoot, '.fleet/reviews', record);
    if (!existsSync(path)) continue;
    const saved = JSON.parse(readFileSync(path, 'utf8'));
    if (!Number.isSafeInteger(saved.pid) || saved.pid <= 0) continue;
    try { process.kill(saved.pid, 0); } catch (error) { if (error.code === 'ESRCH') continue; throw error; }
    if (process.platform !== 'win32') {
      const name = spawnSync('ps', ['-p', String(saved.pid), '-o', 'comm='], { encoding: 'utf8' });
      if (!/Fleet|Electron/u.test(name.stdout)) continue; // A recycled PID cannot claim this review.
    }
    return { ...saved, record: path };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const existing = recordedInstance(root);
  if (existing) {
    console.log(`Review already running (PID ${existing.pid}); reuse that window. No new Electron started.`);
  } else if (process.argv.includes('--check')) {
    console.log('No recorded review instance is running.');
  } else {
    const launch = reviewLaunch(root);
    if (!existsSync(join(launch.candidate, 'packages/desktop/out/main/index.js')) || !existsSync(launch.executable))
      throw new Error('Build the candidate desktop before review; this launcher never replaces a running build.');
    mkdirSync(launch.profile, { recursive: true });
    const log = openSync(join(launch.profile, 'desktop.log'), 'a');
    const child = spawn(launch.executable, launch.args, { cwd: launch.candidate, env: launch.env, stdio: ['ignore', log, log], detached: true });
    await new Promise((ok, reject) => { child.once('spawn', ok); child.once('error', reject); });
    closeSync(log);
    writeFileSync(join(launch.profile, 'review.json'), JSON.stringify({ pid: child.pid, profile: launch.profile, executable: launch.executable }, null, 2) + '\n');
    child.unref();
    console.log(`Review started (PID ${child.pid}) using the retained project-review profile.`);
  }
}

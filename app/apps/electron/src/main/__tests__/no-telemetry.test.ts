import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('Fleet production entry points contain no telemetry runtime or build injection', () => {
  const root = resolve(import.meta.dir, '../../../../..');
  for (const path of [
    'apps/electron/src/main/index.ts',
    'apps/electron/src/preload/bootstrap.ts',
    'apps/electron/src/renderer/main.tsx',
    'apps/electron/src/renderer/event-processor/useEventProcessor.ts',
    'apps/electron/src/renderer/components/app-shell/input/InputErrorBoundary.tsx',
    'scripts/electron-build-main.ts', 'apps/electron/vite.config.ts', '.env.example',
  ]) {
    expect(readFileSync(resolve(root, path), 'utf8')).not.toMatch(/@sentry\/|Sentry\.|SENTRY_ELECTRON_INGEST_URL/);
  }
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter(name => name.startsWith('@sentry/'))).toEqual([]);
});

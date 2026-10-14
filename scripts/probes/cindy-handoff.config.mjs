/** Reuse the research checkout's installed Vitest; no Fleet production dependency. */
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const source = realpathSync(resolve(root, '源码参考/software/cindy'));
const shared = resolve(source, 'packages/maker-shared');
const exports = JSON.parse(readFileSync(resolve(shared, 'package.json'), 'utf8')).exports;
const alias = Object.entries(exports).filter(([, value]) => typeof value === 'string')
  .map(([key, value]) => ({ find: `@cindy/maker-shared${key.slice(1)}`, replacement: resolve(shared, value) }))
  .sort((a, b) => b.find.length - a.find.length);
alias.push({ find: 'vitest', replacement: realpathSync(resolve(root, '源码参考/software/pi-mono-latest/node_modules/vitest/dist/index.js')) });
export default {
  root,
  resolve: { alias },
  test: {
    include: [resolve(source, 'apps/desktop/src/main/maker-ipc/__tests__/agentHandoff.test.ts'),
      'scripts/probes/cindy-handoff-boundaries.test.ts'],
    environment: 'node', maxWorkers: 1, fileParallelism: false,
  },
};

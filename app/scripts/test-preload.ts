import { mock } from 'bun:test'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// The suite must not read the developer's real ~/.craft-agent. Several modules
// call loadConfigDefaults() at import or construction time, and it throws when
// config-defaults.json is absent — so the suite passed only on a machine that
// had already launched the app, and failed on CI and on any fresh checkout.
// Point CONFIG_DIR at a scratch directory and seed it with the same
// config-defaults.json the packaged app ships, so tests read production values.
const REPO_ROOT = join(import.meta.dir, '..')
const TEST_CONFIG_DIR = join(tmpdir(), 'craft-agent-test-config')
process.env.CRAFT_CONFIG_DIR = TEST_CONFIG_DIR
if (!existsSync(TEST_CONFIG_DIR)) mkdirSync(TEST_CONFIG_DIR, { recursive: true })
copyFileSync(
  join(REPO_ROOT, 'apps/electron/resources/config-defaults.json'),
  join(TEST_CONFIG_DIR, 'config-defaults.json'),
)

// Vite's `?url` worker import has no default export under bun's module
// resolution, and renderer tests never render PDFs — stub the worker URL so
// any test that transitively imports a PDF surface can load its module graph.
mock.module('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }))

// react-pdf pulls in pdfjs-dist, which touches DOMMatrix at module scope and
// cannot load outside a browser. No test renders PDFs — stub the surface.
mock.module('react-pdf', () => ({
  Document: () => null,
  Page: () => null,
  pdfjs: { GlobalWorkerOptions: {} },
}))

import { resolve } from 'node:path'

type AddedLine = {
  file: string
  line: number
  text: string
}

const appRoot = resolve(import.meta.dir, '..')
const rendererPath = 'apps/electron/src/renderer'

function git(args: string[]): string {
  const result = Bun.spawnSync(['git', ...args], {
    cwd: appRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  if (result.exitCode !== 0) {
    const error = new TextDecoder().decode(result.stderr).trim()
    throw new Error(error || `git ${args.join(' ')} failed`)
  }

  return new TextDecoder().decode(result.stdout)
}

function parseDiffAddedLines(diff: string): AddedLine[] {
  const added: AddedLine[] = []
  let file = ''
  let nextLine = 0

  for (const rawLine of diff.split('\n')) {
    if (rawLine.startsWith('+++ b/')) {
      file = rawLine.slice('+++ b/'.length)
      continue
    }

    const hunk = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      nextLine = Number(hunk[1])
      continue
    }

    if (!file || nextLine === 0) continue

    if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
      added.push({ file, line: nextLine, text: rawLine.slice(1) })
      nextLine += 1
      continue
    }

    if (!rawLine.startsWith('-')) nextLine += 1
  }

  return added
}

async function readUntrackedAddedLines(): Promise<AddedLine[]> {
  const files = git([
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    rendererPath,
  ])
    .split('\n')
    .filter((file) => /\.(?:css|ts|tsx)$/.test(file))

  const added: AddedLine[] = []
  for (const file of files) {
    const content = Bun.file(resolve(appRoot, file))
    if (!content.size) continue
    const lines = await content.text()
    added.push(
      ...lines.split('\n').map((text, index) => ({
        file,
        line: index + 1,
        text,
      })),
    )
  }

  return added
}

const addedLines = [
  ...parseDiffAddedLines(git([
    'diff',
    '--unified=0',
    '--no-color',
    'HEAD',
    '--',
    rendererPath,
  ])),
  ...await readUntrackedAddedLines(),
]

const allowedForegroundOpacities = new Set([
  '2', '3', '5', '10', '20', '30', '40', '50', '60', '70', '80', '90', '95',
  '0.02', '0.03', '0.05', '0.07',
])

const forbiddenPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /shadow-\[/, reason: 'use the shared elevation tokens' },
  { pattern: /rounded-(?:xl|2xl|3xl)/, reason: 'use the UI-SPEC radius ladder' },
  { pattern: /text-(?:xl|2xl|3xl)/, reason: 'use the UI-SPEC type scale' },
  {
    pattern: /rounded-\[(?:1[3-9]|[2-9][0-9])px\]/,
    reason: 'use the UI-SPEC radius ladder',
  },
  {
    pattern: /text-\[(?:1[6-9]|[2-9][0-9])(?:\.[0-9]+)?px\]/,
    reason: 'use the UI-SPEC type scale',
  },
  {
    pattern: /\bstrokeWidth\s*=/,
    reason: 'use the icon component default instead of a per-use stroke width',
  },
]

const violations: string[] = []

for (const added of addedLines) {
  for (const match of added.text.matchAll(/foreground\/(?:\[([0-9.]+)\]|([0-9]+))/g)) {
    const opacity = match[1] ?? match[2]
    if (!allowedForegroundOpacities.has(opacity)) {
      violations.push(
        `${added.file}:${added.line} foreground/${match[1] ? `[${opacity}]` : opacity} is outside the opacity ladder`,
      )
    }
  }

  for (const { pattern, reason } of forbiddenPatterns) {
    if (pattern.test(added.text)) {
      violations.push(`${added.file}:${added.line} ${reason}\n  ${added.text.trim()}`)
    }
  }
}

if (violations.length > 0) {
  console.error('UI contract violations found in added renderer lines:')
  console.error(violations.map((violation) => `- ${violation}`).join('\n'))
  console.error('\nUse the shared primitive/token, or record an owner-approved intentional delta.')
  process.exit(1)
}

console.log(`OK: ${addedLines.length} added renderer lines satisfy the incremental UI contract.`)

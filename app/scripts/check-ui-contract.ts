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
  /*
   * Raw Tailwind palette colours.
   *
   * UI-SPEC §1 gives the theme exactly six base colours and §11.1 forbids a
   * seventh, but until 2026-07-31 nothing enforced it — `bg-amber-500`,
   * `bg-emerald-500`, `bg-blue-500` and `text-amber-600` all shipped through a
   * green guard. They are worse than a wrong shade: a palette literal does not
   * participate in theming at all, so it looks correct in whichever theme it was
   * written in and wrong in every other, including the light/dark pair.
   *
   * Named a colour that a real state needs? Use the reserved one — `accent`
   * brand, `info` warning, `success` confirmed, `destructive` failed. Decoration
   * uses `foreground` at a §3 opacity.
   */
  {
    pattern:
      /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
    reason:
      'raw Tailwind palette colour — the theme has six base colours (UI-SPEC §1); use accent/info/success/destructive for state or foreground/N for decoration',
  },
  /*
   * `primary` is not a token in this theme. It is the shadcn default that every
   * model reaches for, and `bg-primary` renders as a fallback rather than
   * failing, so it survives review while responding to nothing.
   */
  {
    pattern: /\b(?:bg|text|border|ring)-primary(?:\/|\b)/,
    reason: 'there is no `primary` token in this theme — use `accent`',
  },
]

/**
 * The playground is a component sandbox, not a product surface.
 *
 * Its swatch demos render palette colours *as content* — a toast-variant row
 * whose whole job is to show what amber looks like. Failing those would push
 * whoever hits it toward disabling the rule rather than fixing a real surface,
 * which is how a guard stops being trusted. Product code has no such excuse.
 */
const exemptFromColorRules = (file: string) => file.includes('/renderer/playground/')

const colorRulePrefixes = ['raw Tailwind palette colour', 'there is no `primary` token']

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
    if (!pattern.test(added.text)) continue
    if (
      exemptFromColorRules(added.file)
      && colorRulePrefixes.some((prefix) => reason.startsWith(prefix))
    ) continue
    violations.push(`${added.file}:${added.line} ${reason}\n  ${added.text.trim()}`)
  }
}

if (violations.length > 0) {
  console.error('UI contract violations found in added renderer lines:')
  console.error(violations.map((violation) => `- ${violation}`).join('\n'))
  console.error('\nUse the shared primitive/token, or record an owner-approved intentional delta.')
  process.exit(1)
}

console.log(`OK: ${addedLines.length} added renderer lines satisfy the incremental UI contract.`)

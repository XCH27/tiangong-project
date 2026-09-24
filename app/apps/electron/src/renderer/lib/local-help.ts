import type { DocFeature } from '@craft-agent/shared/docs/doc-links'

/**
 * Help is opened through the same document overlay used by Craft for rendered
 * Markdown. The event keeps the menu and feature pages independent from the
 * settings navigator while still giving every entry one local document owner.
 */
export const LOCAL_HELP_EVENT = 'craft-agent-open-local-help'

const MINTLIFY_BLOCKS = new Set([
  'Card', 'CardGroup', 'Accordion', 'AccordionGroup', 'Note', 'Info', 'Warning',
  'Tip', 'Steps', 'Step', 'Tabs', 'Tab', 'CodeGroup', 'Frame',
  'Columns', 'Row', 'Col',
])

/** Display the captured Mintlify Markdown in Craft's existing document reader. */
export function formatLocalHelpMarkdown(
  content: string,
  imageUrl?: (filename: string) => string | undefined,
): string {
  const withImages = content.replace(
    /<img\b[^>]*data-path="images\/([^"]+)"[^>]*\/?\s*>/g,
    (tag, filename: string) => {
      const assetUrl = imageUrl?.(filename)
      const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? ''
      return assetUrl ? `![${alt}](${assetUrl})` : alt
    },
  )
  const output: string[] = []
  const frames: Array<{ tag: string, indent: number }> = []
  let inFence = false

  for (const line of withImages.split('\n')) {
    if (/^\s*import\s+/.test(line) && !inFence) continue
    const opening = !inFence && line.match(/^( *)<([A-Z][A-Za-z]+)([^>]*)>\s*$/)
    if (opening && MINTLIFY_BLOCKS.has(opening[2]!)) {
      const [, spaces, tag, attributes] = opening
      const title = attributes!.match(/\btitle="([^"]+)"/)?.[1]
      const href = attributes!.match(/\bhref="([^"]+)"/)?.[1]
      if (title) output.push('', `### ${href ? `[${title}](${href})` : title}`, '')
      else if (tag === 'Note' || tag === 'Info' || tag === 'Tip' || tag === 'Warning') output.push('', `**${tag}**`, '')
      frames.push({ tag: tag!, indent: spaces!.length })
      continue
    }
    const closing = !inFence && line.match(/^ *<\/([A-Z][A-Za-z]+)>\s*$/)
    if (closing && MINTLIFY_BLOCKS.has(closing[1]!)) {
      const match = frames.findLastIndex(frame => frame.tag === closing[1])
      if (match >= 0) frames.splice(match)
      output.push('')
      continue
    }

    const indent = frames.length ? frames[frames.length - 1]!.indent + 2 : 0
    const rendered = line.replace(new RegExp(`^ {0,${indent}}`), '')
    output.push(rendered)
    if (/^\s*(?:```|~~~)/.test(rendered)) inFence = !inFence
  }

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export type LocalHelpTarget = DocFeature | 'all' | string

export const LOCAL_HELP_DOCS: Record<string, string> = {
  all: 'craft/index.md',
  sources: 'craft/sources/overview.md',
  'sources-api': 'craft/sources/apis/overview.md',
  'sources-mcp': 'craft/sources/mcp-servers/overview.md',
  'sources-local': 'craft/sources/local-filesystems.md',
  skills: 'craft/skills/overview.md',
  statuses: 'craft/statuses/overview.md',
  permissions: 'craft/core-concepts/permissions.md',
  labels: 'craft/labels/overview.md',
  workspaces: 'craft/go-further/workspaces.md',
  themes: 'craft/customisation/themes.md',
  'app-settings': 'craft/reference/config/config-file.md',
  preferences: 'craft/reference/config/preferences.md',
  automations: 'craft/automations/overview.md',
  messaging: 'craft/messaging/overview.md',
  sharing: 'craft/go-further/sharing.md',
}

export function localHelpPath(target: LocalHelpTarget = 'all'): string {
  if (target in LOCAL_HELP_DOCS) return LOCAL_HELP_DOCS[target]
  return normalizeLocalDocPath(target)
}

/** Open a local packaged document in the shared Markdown overlay. */
export function openLocalHelp(target: LocalHelpTarget = 'all'): void {
  window.dispatchEvent(new CustomEvent(LOCAL_HELP_EVENT, {
    detail: { path: localHelpPath(target) },
  }))
}

/**
 * Convert links copied from the hosted Craft docs into packaged paths. The
 * Markdown reader uses this for both relative `/docs/...` links and absolute
 * links from older versions of the website, so a local install never needs a
 * network request to move through the documentation.
 */
export function localHelpPathFromUrl(url: string, fromPath?: string): string | null {
  if (url.startsWith('local:')) return localHelpPath(url.slice('local:'.length))
  if (url in LOCAL_HELP_DOCS) return localHelpPath(url)

  let parsed: URL
  try {
    const base = fromPath?.startsWith('craft/')
      ? `https://local-docs.invalid/docs/${fromPath.slice('craft/'.length)}`
      : 'https://local-docs.invalid/docs/'
    parsed = new URL(url, base)
  } catch {
    return null
  }

  // Only Craft's own hosted docs may be replaced by packaged articles. An
  // unrelated site can also have a /docs/ route and must still open normally.
  if (parsed.hostname !== 'local-docs.invalid'
    && parsed.hostname !== 'agents.craft.do'
    && parsed.hostname !== 'thecraftagents.com') return null

  const pathname = parsed.pathname
  if (!pathname.startsWith('/docs/')) return null
  const path = pathname.slice('/docs/'.length).replace(/^\/+|\/+$/g, '')
  if (!path) return 'craft/index.md'
  // The captured introduction still uses the former themes URL.
  if (path === 'go-further/themes') return 'craft/customisation/themes.md'
  return normalizeLocalDocPath(`craft/${path}`)
}

function normalizeLocalDocPath(path: string): string {
  const normalized = path.replace(/^\/+|\/+$/g, '').replace(/^docs\//, '')
  const withCraft = normalized.startsWith('craft/') ? normalized : `craft/${normalized}`
  return withCraft.endsWith('.md') ? withCraft : `${withCraft}.md`
}

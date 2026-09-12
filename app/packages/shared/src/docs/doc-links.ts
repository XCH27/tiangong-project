/**
 * Documentation links and summaries for contextual help throughout the UI.
 * Summaries provide quick context; "Learn more" opens the full docs.
 */

/**
 * These pages ship with the app. `getLocalDocPath` resolves a feature to the copy
 * under `~/.craft-agent/docs/guide/`, which `packages/shared/src/docs` syncs from
 * `apps/electron/resources/docs` at startup — so "Learn more" opens a file on this
 * machine rather than a Craft-operated site (P8), and the same text is what the
 * agent reads when it has to explain a surface.
 *
 * The hosted base is kept only as provenance for the mirror; nothing navigates to it.
 */
const DOC_UPSTREAM_BASE_URL = 'https://thecraftagents.com/docs'

/** Where the synced mirror lives, relative to the config directory. */
export const LOCAL_DOCS_SUBDIR = 'docs/guide'

export type DocFeature =
  | 'sources'
  | 'sources-api'
  | 'sources-mcp'
  | 'sources-local'
  | 'skills'
  | 'statuses'
  | 'permissions'
  | 'labels'
  | 'workspaces'
  | 'themes'
  | 'app-settings'
  | 'preferences'
  | 'automations'
  | 'messaging'

export interface DocInfo {
  /** Path relative to DOC_BASE_URL */
  path: string
  /** Display title for the help popover */
  title: string
  /** 1-2 sentence summary for quick context */
  summary: string
}

export const DOCS: Record<DocFeature, DocInfo> = {
  sources: {
    path: '/sources/overview',
    title: 'Sources',
    summary:
      'Connect external data like MCP servers, REST APIs, and local filesystems. Sources give your agent tools to access services like GitHub, Linear, or your Obsidian vault.',
  },
  'sources-api': {
    path: '/sources/apis/overview',
    title: 'APIs',
    summary:
      'Connect to any REST API with flexible authentication. Make HTTP requests to external services directly from your conversations.',
  },
  'sources-mcp': {
    path: '/sources/mcp-servers/overview',
    title: 'MCP Servers',
    summary:
      'Connect to Model Context Protocol servers for rich tool integrations. MCP servers provide structured access to services like GitHub, Linear, and Notion.',
  },
  'sources-local': {
    path: '/sources/local-filesystems',
    title: 'Local Folders',
    summary:
      'Give your agent access to local directories like Obsidian vaults, code repositories, or data folders on your machine.',
  },
  skills: {
    path: '/skills/overview',
    title: 'Skills',
    summary:
      'Reusable instruction sets that teach your agent specialized behaviors. Create a SKILL.md file and invoke it with @mention in your messages.',
  },
  statuses: {
    path: '/statuses/overview',
    title: 'Statuses',
    summary:
      'Organize conversations into workflow states like Todo, In Progress, and Done. Open statuses appear in your inbox; closed ones move to the archive.',
  },
  permissions: {
    path: '/core-concepts/permissions',
    title: 'Permissions',
    summary:
      'Control how much autonomy your agent has. Explore mode is read-only, Ask to Edit prompts before changes, and Execute mode runs without prompts.',
  },
  labels: {
    path: '/labels/overview',
    title: 'Labels',
    summary:
      'Tag sessions with colored labels for organization and filtering. Labels support hierarchical nesting, typed values, and auto-apply rules that extract data from messages using regex patterns.',
  },
  workspaces: {
    path: '/go-further/workspaces',
    title: 'Workspaces',
    summary:
      'Separate configurations for different contexts like personal projects or work. Each workspace has its own sources, skills, statuses, and session history.',
  },
  themes: {
    path: '/customisation/themes',
    title: 'Themes',
    summary:
      'Customize the visual appearance with a 6-color system. Override specific colors in theme.json or install preset themes for complete visual styles.',
  },
  'app-settings': {
    path: '/reference/config/config-file',
    title: 'App Settings',
    summary:
      'Configure global app settings like your default model, authentication method, and workspace list. Settings are stored in ~/.craft-agent/config.json.',
  },
  preferences: {
    path: '/reference/config/preferences',
    title: 'Preferences',
    summary:
      'Personal preferences like your name, timezone, and language that help the agent personalize responses. Stored in ~/.craft-agent/preferences.json.',
  },
  automations: {
    path: '/automations/overview',
    title: 'Automations',
    summary:
      'Automate actions when events occur — run commands on schedules, react to label changes, or trigger prompts. Configured in automations.json.',
  },
  messaging: {
    path: '/messaging/overview',
    title: 'Messaging',
    summary:
      'Connect a session to a chat platform — Telegram, WhatsApp, or Lark / Feishu — and reach your agent from anywhere. Pair workspace supergroups, route automations to forum topics, and send rich replies natively.',
  },
}

/**
 * Path of a feature's page inside the local mirror, relative to the config
 * directory — e.g. `docs/guide/sources/overview.md`.
 */
export function getLocalDocPath(feature: DocFeature): string {
  return `${LOCAL_DOCS_SUBDIR}${DOCS[feature].path}.md`
}

/**
 * The upstream page this mirror came from. Provenance only — surfaces open the
 * local copy; nothing in the product navigates to a Craft-operated site.
 */
export function getUpstreamDocUrl(feature: DocFeature): string {
  return `${DOC_UPSTREAM_BASE_URL}${DOCS[feature].path}`
}

/**
 * Get the doc info (title, summary, path) for a feature
 */
export function getDocInfo(feature: DocFeature): DocInfo {
  return DOCS[feature]
}

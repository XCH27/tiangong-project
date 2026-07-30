import type { ExpertSkill } from './skill-routing'

/**
 * The expert-kit gallery.
 *
 * A kit is only worth defining if it can be found, so the catalog needs a
 * browsing surface: categories, an installed/available split, a sort, and enough
 * on each card to decide without opening it.
 *
 * The card summary is the part that matters and the part that is easy to get
 * wrong. What a reader needs is *how much this does* and *how much attention it
 * costs*, and a kit page that only shows a description answers neither — which
 * is how someone installs eight kits and wonders why the agent got worse. So a
 * card carries the skill count, the connector count, and whether the kit routes
 * within itself, because an unrouted twenty-skill kit and a routed one behave
 * nothing alike.
 */

export interface KitCategory {
  id: string
  /** Stable key; the display name is a translation, not stored here. */
  labelKey: string
}

/**
 * Categories are role- and industry-shaped rather than capability-shaped.
 *
 * People look for "the thing for my job", not "the thing that reads files". A
 * capability taxonomy is more accurate and almost unusable for browsing.
 */
export const KIT_CATEGORIES: readonly KitCategory[] = [
  { id: 'engineering', labelKey: 'kits.category.engineering' },
  { id: 'design', labelKey: 'kits.category.design' },
  { id: 'product', labelKey: 'kits.category.product' },
  { id: 'data', labelKey: 'kits.category.data' },
  { id: 'ops', labelKey: 'kits.category.ops' },
  { id: 'marketing', labelKey: 'kits.category.marketing' },
  { id: 'sales', labelKey: 'kits.category.sales' },
  { id: 'finance', labelKey: 'kits.category.finance' },
  { id: 'legal', labelKey: 'kits.category.legal' },
  { id: 'hr', labelKey: 'kits.category.hr' },
  { id: 'admin', labelKey: 'kits.category.admin' },
  { id: 'research', labelKey: 'kits.category.research' },
]

export interface KitListing {
  id: string
  name: string
  /** Publisher handle. Local kits have none, which is itself information. */
  author?: string
  description: string
  version: string
  categories: readonly string[]
  skills: readonly ExpertSkill[]
  /** Connectors the kit expects. Counted separately: they need credentials. */
  connectors?: readonly string[]
  installed: boolean
  /** Adoption signal for the popular sort. Absent for local kits. */
  installCount?: number
  publishedAt?: number
}

// ── Card summary ────────────────────────────────────────────────────────────

export interface KitCardSummary {
  skillCount: number
  connectorCount: number
  /**
   * Whether the kit selects within itself.
   *
   * Surfaced on the card because it changes what installing costs. A kit that
   * routes loads two or three skills per turn whatever its size; one that does
   * not loads all of them, and a reader has no way to tell them apart from a
   * skill count alone.
   */
  routes: boolean
  /** Set when installing this would visibly cost attention. */
  warning?: 'loads-everything'
}

/**
 * A kit routes if any skill declares a trigger. With none, there is nothing to
 * select on and the whole catalog is the loadout.
 */
export function kitRoutes(skills: readonly ExpertSkill[]): boolean {
  return skills.some((skill) => skill.triggers.length > 0)
}

/** Above this an unrouted kit is worth warning about on the card, not after installing. */
export const UNROUTED_WARNING_THRESHOLD = 10

export function summarizeKitCard(listing: KitListing): KitCardSummary {
  const routes = kitRoutes(listing.skills)
  const skillCount = listing.skills.length
  return {
    skillCount,
    connectorCount: listing.connectors?.length ?? 0,
    routes,
    ...(!routes && skillCount > UNROUTED_WARNING_THRESHOLD
      ? { warning: 'loads-everything' as const }
      : {}),
  }
}

// ── Browsing ────────────────────────────────────────────────────────────────

export type KitSort = 'popular' | 'newest'

export interface KitBrowseQuery {
  /** Free text over name, author and description. */
  search?: string
  /** Omit for all categories. */
  categoryId?: string
  /** Installed-only view. */
  installedOnly?: boolean
  sort?: KitSort
}

function matches(listing: KitListing, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [listing.name, listing.author ?? '', listing.description]
    .some((field) => field.toLowerCase().includes(needle))
}

/**
 * Filter and order the gallery.
 *
 * Installed kits sort first within any order. Someone scanning the gallery is
 * usually looking for something they already have, and burying it under twenty
 * marketplace entries makes the installed tab the only usable view — which
 * defeats having one list.
 */
export function browseKits(
  listings: readonly KitListing[],
  query: KitBrowseQuery = {},
): readonly KitListing[] {
  const filtered = listings.filter((listing) => {
    if (query.installedOnly && !listing.installed) return false
    if (query.categoryId && !listing.categories.includes(query.categoryId)) return false
    return matches(listing, query.search ?? '')
  })

  const sort = query.sort ?? 'popular'
  return [...filtered].sort((a, b) => {
    if (a.installed !== b.installed) return a.installed ? -1 : 1
    if (sort === 'newest') return (b.publishedAt ?? 0) - (a.publishedAt ?? 0)
    // Unknown adoption sorts last rather than as zero-with-ties, so a local kit
    // does not silently outrank a marketplace one that simply has no count yet.
    return (b.installCount ?? -1) - (a.installCount ?? -1)
  })
}

export interface GalleryCounts {
  available: number
  installed: number
}

export function galleryCounts(listings: readonly KitListing[]): GalleryCounts {
  return {
    available: listings.length,
    installed: listings.filter((listing) => listing.installed).length,
  }
}

/**
 * Categories that actually have something in them.
 *
 * An empty category chip is a dead end the user has to click to discover, and a
 * twelve-chip row where four lead nowhere reads as a broken page.
 */
export function activeCategories(
  listings: readonly KitListing[],
): readonly KitCategory[] {
  const present = new Set(listings.flatMap((listing) => listing.categories))
  return KIT_CATEGORIES.filter((category) => present.has(category.id))
}

// ── Installing ──────────────────────────────────────────────────────────────

export type InstallRefusal =
  /** A kit with this id is already installed. */
  | 'already-installed'
  /** Its connectors are not configured, so its skills would fail on first use. */
  | 'missing-connectors'

export type InstallAdmission =
  | { admitted: true; warning?: 'loads-everything' }
  | { admitted: false; reason: InstallRefusal; detail?: readonly string[] }

/**
 * Whether installing will produce something that works.
 *
 * Missing connectors are refused rather than warned about: a kit whose skills
 * all fail on first use is worse than one that was never installed, because the
 * failure looks like the agent being bad at the job.
 *
 * An unrouted kit is admitted with a warning instead — it works, it just costs
 * more attention than its size suggests, and that is the user's call to make.
 */
export function admitInstall(input: {
  listing: KitListing
  installedIds: ReadonlySet<string>
  configuredConnectors: ReadonlySet<string>
}): InstallAdmission {
  if (input.installedIds.has(input.listing.id)) {
    return { admitted: false, reason: 'already-installed' }
  }

  const missing = (input.listing.connectors ?? [])
    .filter((connector) => !input.configuredConnectors.has(connector))
  if (missing.length > 0) {
    return { admitted: false, reason: 'missing-connectors', detail: missing }
  }

  const summary = summarizeKitCard(input.listing)
  return summary.warning
    ? { admitted: true, warning: summary.warning }
    : { admitted: true }
}

import { describe, expect, it } from 'bun:test'
import {
  UNROUTED_WARNING_THRESHOLD,
  activeCategories,
  admitInstall,
  browseKits,
  galleryCounts,
  kitRoutes,
  summarizeKitCard,
  type KitListing,
} from '../kit-gallery'
import type { ExpertSkill } from '../skill-routing'

const skills = (count: number, withTriggers: boolean): ExpertSkill[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `s${index}`, name: `S${index}`, body: '',
    triggers: withTriggers ? [`t${index}`] : [],
  }))

const listing = (patch: Partial<KitListing> & { id: string }): KitListing => ({
  name: patch.id, description: '', version: '1.0.0',
  categories: ['engineering'], skills: [], installed: false, ...patch,
})

describe('card summary', () => {
  it('detects routing from declared triggers', () => {
    expect(kitRoutes(skills(3, true))).toBe(true)
    expect(kitRoutes(skills(3, false))).toBe(false)
  })

  // A reader cannot tell a routed kit from an unrouted one by skill count alone,
  // and the two behave nothing alike.
  it('warns only when a large kit has no way to select within itself', () => {
    expect(summarizeKitCard(listing({
      id: 'big-routed',
      skills: skills(UNROUTED_WARNING_THRESHOLD + 5, true),
    })).warning).toBeUndefined()

    expect(summarizeKitCard(listing({
      id: 'big-flat',
      skills: skills(UNROUTED_WARNING_THRESHOLD + 5, false),
    })).warning).toBe('loads-everything')

    expect(summarizeKitCard(listing({ id: 'small', skills: skills(3, false) })).warning)
      .toBeUndefined()
  })

  it('counts connectors separately, since they need credentials', () => {
    expect(summarizeKitCard(listing({ id: 'k', connectors: ['github', 'jira'] })).connectorCount)
      .toBe(2)
  })
})

describe('browsing', () => {
  const catalog = [
    listing({ id: 'a', name: 'Alpha', installed: true, installCount: 5 }),
    listing({ id: 'b', name: 'Beta', installCount: 90, publishedAt: 10 }),
    listing({ id: 'c', name: 'Gamma', categories: ['design'], publishedAt: 99 }),
  ]

  // Burying an installed kit under twenty marketplace entries makes the
  // installed tab the only usable view, which defeats having one list.
  it('puts installed kits first in either order', () => {
    expect(browseKits(catalog, { sort: 'popular' })[0]?.id).toBe('a')
    expect(browseKits(catalog, { sort: 'newest' })[0]?.id).toBe('a')
  })

  it('orders the rest by adoption or recency', () => {
    expect(browseKits(catalog, { sort: 'popular' }).map((k) => k.id)).toEqual(['a', 'b', 'c'])
    expect(browseKits(catalog, { sort: 'newest' }).map((k) => k.id)).toEqual(['a', 'c', 'b'])
  })

  // Otherwise a local kit silently outranks a marketplace one that simply has
  // no count yet.
  it('sorts unknown adoption last rather than as zero', () => {
    const ranked = browseKits(
      [listing({ id: 'unknown' }), listing({ id: 'known', installCount: 0 })],
      { sort: 'popular' },
    )
    expect(ranked.map((k) => k.id)).toEqual(['known', 'unknown'])
  })

  it('filters by category, install state and search', () => {
    expect(browseKits(catalog, { categoryId: 'design' }).map((k) => k.id)).toEqual(['c'])
    expect(browseKits(catalog, { installedOnly: true }).map((k) => k.id)).toEqual(['a'])
    expect(browseKits(catalog, { search: 'gam' }).map((k) => k.id)).toEqual(['c'])
  })

  it('counts the two tabs', () => {
    expect(galleryCounts(catalog)).toEqual({ available: 3, installed: 1 })
  })

  // A twelve-chip row where four lead nowhere reads as a broken page.
  it('hides categories nothing is in', () => {
    expect(activeCategories(catalog).map((category) => category.id))
      .toEqual(['engineering', 'design'])
  })
})

describe('installing', () => {
  it('refuses a kit that is already installed', () => {
    expect(admitInstall({
      listing: listing({ id: 'a' }),
      installedIds: new Set(['a']),
      configuredConnectors: new Set(),
    })).toEqual({ admitted: false, reason: 'already-installed' })
  })

  // A kit whose skills all fail on first use is worse than one never installed,
  // because the failure looks like the agent being bad at the job.
  it('refuses when a required connector is not configured', () => {
    expect(admitInstall({
      listing: listing({ id: 'a', connectors: ['github', 'jira'] }),
      installedIds: new Set(),
      configuredConnectors: new Set(['github']),
    })).toEqual({ admitted: false, reason: 'missing-connectors', detail: ['jira'] })
  })

  // It works; it just costs more attention than its size suggests, and that is
  // the user's call.
  it('admits an unrouted kit with a warning rather than refusing it', () => {
    expect(admitInstall({
      listing: listing({ id: 'a', skills: skills(UNROUTED_WARNING_THRESHOLD + 1, false) }),
      installedIds: new Set(),
      configuredConnectors: new Set(),
    })).toEqual({ admitted: true, warning: 'loads-everything' })
  })

  it('admits a well-formed kit cleanly', () => {
    expect(admitInstall({
      listing: listing({ id: 'a', skills: skills(20, true), connectors: ['github'] }),
      installedIds: new Set(),
      configuredConnectors: new Set(['github']),
    })).toEqual({ admitted: true })
  })
})

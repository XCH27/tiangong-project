import { describe, expect, it } from 'bun:test'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Help must not depend on a Craft-operated site (P8). The same pages ship with the
 * app and are synced to `~/.craft-agent/docs/`, so a "Learn more", a menu item, or a
 * prompt handed to the agent has a local file to open — and works with no network.
 *
 * Checked at the source level because the failure mode is silent: a hosted link looks
 * fine in review and only breaks for a user who is offline or behind a firewall.
 */
describe('no surface sends the user or the agent to hosted docs', () => {
  const rendererRoot = resolve(import.meta.dir, '../../renderer')

  function walk(dir: string): string[] {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      if (entry === '__tests__' || entry === 'node_modules' || entry === 'playground') continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...walk(full))
      else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full)
    }
    return out
  }

  it('the renderer references no hosted documentation URL', () => {
    const offenders = walk(rendererRoot)
      .filter(file => /thecraftagents\.com\/docs|agents\.craft\.do\/docs/.test(readFileSync(file, 'utf8')))
      .map(file => file.slice(rendererRoot.length + 1))
    expect(offenders).toEqual([])
  })
})

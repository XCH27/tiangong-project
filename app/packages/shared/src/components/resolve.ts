import type { ComponentManifest, ComponentScope, ResolvedComponent, WorkspaceComposition } from './types.ts'

export interface ComponentResolution {
  active: ResolvedComponent[]
  unavailable: Array<{ id: string; reason: string }>
}

/** Resolve component composition without importing renderer or MCP code. */
export function resolveWorkspaceComponents(
  manifests: readonly ComponentManifest[],
  composition: WorkspaceComposition,
): ComponentResolution {
  const byId = new Map(manifests.map(manifest => [manifest.id, manifest]))
  const requested = new Map<string, { scope: ComponentScope; settings: Record<string, unknown> }>()
  for (const id of composition.globalEnabled) {
    requested.set(id, { scope: 'global', settings: composition.overrides[id]?.settings ?? {} })
  }
  for (const id of composition.workspaceEnabled) {
    requested.set(id, { scope: 'workspace', settings: composition.overrides[id]?.settings ?? {} })
  }

  const active: ResolvedComponent[] = []
  const unavailable: ComponentResolution['unavailable'] = []
  const visiting = new Set<string>()
  const resolved = new Set<string>()
  const failed = new Set<string>()

  const visit = (id: string, scope: ComponentScope, settings: Record<string, unknown>) => {
    if (resolved.has(id) || failed.has(id)) return
    if (visiting.has(id)) {
      unavailable.push({ id, reason: `dependency cycle detected at ${id}` })
      failed.add(id)
      return
    }
    const manifest = byId.get(id)
    if (!manifest) {
      unavailable.push({ id, reason: 'component manifest is unavailable' })
      failed.add(id)
      return
    }
    if (composition.overrides[id]?.enabled === false) {
      unavailable.push({ id, reason: 'disabled by workspace override' })
      failed.add(id)
      return
    }
    visiting.add(id)
    for (const dependency of manifest.dependencies ?? []) {
      if (!byId.has(dependency.id) && dependency.optional) continue
      if (!byId.has(dependency.id)) {
        unavailable.push({ id, reason: `required dependency unavailable: ${dependency.id}` })
        failed.add(id)
        visiting.delete(id)
        return
      }
      visit(dependency.id, scope, {})
      if (!dependency.optional && failed.has(dependency.id)) {
        unavailable.push({ id, reason: `required dependency unavailable: ${dependency.id}` })
        failed.add(id)
        visiting.delete(id)
        return
      }
    }
    visiting.delete(id)
    resolved.add(id)
    active.push({ manifest, scope, settings })
  }

  for (const [id, request] of requested) visit(id, request.scope, request.settings)
  return { active, unavailable }
}

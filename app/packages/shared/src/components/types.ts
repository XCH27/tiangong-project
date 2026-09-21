/** Data-only contracts for installable Components and Workspace compositions. */

export type ComponentScope = 'global' | 'workspace'

/**
 * Bundle layout a manifest was read from. `fleet` is a native manifest; the other four are
 * foreign bundles normalized by the adapter. Provenance survives install so a later
 * incompatibility is attributable to the ecosystem it came from (Decision P11).
 */
export type PluginBundleFormat = 'fleet' | 'agent' | 'claude' | 'codex' | 'cursor'

/** A catalog source. Ownership is keyed by this, never by a catalog's self-declared name. */
export type ComponentSource =
  | { type: 'local'; path: string }
  | { type: 'git'; url: string; ref?: string; sparsePaths?: string[] }
export type ComponentSlot = 'left-rail' | 'right-workbench'

export interface ComponentContribution {
  id: string
  slot: ComponentSlot
  label: string
  /** Stable renderer entry; loaded only when the panel opens. */
  entry: string
}

export interface ComponentDependency {
  id: string
  version: string
  optional?: boolean
}

export interface ComponentManifest {
  id: string
  version: string
  publisher: string
  license: string
  integrity?: string
  contributions: ComponentContribution[]
  dependencies?: ComponentDependency[]
  skills?: string[]
  mcpServers?: string[]
  knowledgeSources?: string[]
  nativeDataKinds?: string[]
  requestedPermissions?: string[]
  supportedPlatforms?: string[]
  /** Which bundle layout this was read from. Absent means a native Fleet manifest. */
  bundleFormat?: PluginBundleFormat
  /**
   * Unrecognized manifest data, preserved verbatim and never interpreted.
   * Foreign bundles carry planner metadata (`activation`) and vendor namespaces that Fleet has no
   * analogue for; dropping them loses data a foreign client needs after a round trip, and
   * inventing a mapping for a concept Fleet does not have is worse than passing it through.
   */
  vendor?: Record<string, unknown>
}

export interface ComponentOverride {
  enabled?: boolean
  settings?: Record<string, unknown>
}

export interface WorkspaceComposition {
  globalEnabled: string[]
  workspaceEnabled: string[]
  overrides: Record<string, ComponentOverride>
}

export interface ResolvedComponent {
  manifest: ComponentManifest
  scope: ComponentScope
  settings: Record<string, unknown>
}

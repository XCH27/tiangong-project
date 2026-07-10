/**
 * W0.1 text freeze — view contributions / layout projection (M16)
 * Source: docs/contracts/composable-workspace-contracts.md §8
 */

export type ViewContribution =
  | {
      kind: 'panel'
      contributionId: string
      defaultDock: 'left' | 'right' | 'bottom'
      routeSchemaRef: string
      lifecycle: 'view_only' | 'runtime_continues_when_hidden'
    }
  | {
      kind: 'surface'
      contributionId: string
      routeSchemaRef: string
      supportsSplit: boolean
    }
  | {
      kind: 'inspector'
      contributionId: string
      entityKinds: string[]
      routeSchemaRef: string
    }

export type LayoutSnapshot = {
  schemaVersion: 1
  layoutId: string
  revision: number
  /** Opaque graph of docks/instances — details filled at W2 host implementation */
  graph: Record<string, unknown>
  updatedAt: string
}

export const VIEW_CONTRACT_VERSION = 'w0.1-view-1' as const

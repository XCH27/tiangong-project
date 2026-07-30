/**
 * Dismissible-layer bridge — re-export only.
 *
 * SINGLE AUTHORITY (NON-NEGOTIABLES §2): the bridge lives in `@craft-agent/ui`
 * and is the one place that owns the layer registry. This module used to be a
 * byte-identical 43-line copy of it, which meant the renderer and the UI package
 * each compiled their own structurally-unrelated `DismissibleLayerRegistration`.
 * The two copies only appeared to cooperate because they share a `globalThis`
 * key at runtime — TypeScript could not relate them, so drift in either copy
 * would have broken Escape/dismiss ordering silently, with `tsc` green.
 *
 * Import from here or from `@craft-agent/ui` directly; both resolve to the same
 * module instance and the same types.
 */

export {
  setDismissibleLayerBridge,
  getDismissibleLayerBridge,
} from '@craft-agent/ui'

export type {
  DismissibleLayerType,
  DismissibleLayerRegistration,
  DismissibleLayerSnapshot,
  DismissibleLayerBridge,
} from '@craft-agent/ui'

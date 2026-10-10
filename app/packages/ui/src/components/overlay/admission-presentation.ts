/**
 * Viewer states for the Office preview and the MCP Apps list.
 *
 * The Office readers mounted in the shell are wired. Edit and save stay
 * Locked until a main-process admit exists. The MCP Apps pane is a read of
 * the loadout. It does not construct a host kernel and it does not admit a
 * focus. Sandboxed app view, live tool listing, and tool invocation stay
 * Locked. This module does not call HostTurnKernel.
 */

import { suiteForPath, type DocumentSuiteId } from '@craft-agent/shared/protocol/document-command'
import { listMcpAppsSurfaces } from '@craft-agent/shared/protocol/mcp-apps-pane'

export type ViewerPhase = 'empty' | 'loading' | 'viewer' | 'locked' | 'error'

export type ViewerCapabilityStatus = 'wired' | 'display-only' | 'Locked'

export interface ViewerPresentation {
  phase: ViewerPhase
  status: ViewerCapabilityStatus
  reason?: string
}

export const DOCUMENT_SAVE_LOCKED: ViewerPresentation = {
  phase: 'locked',
  status: 'Locked',
  reason: 'save_locked',
}

export interface DocumentViewerInput {
  filePath: string
  load: 'idle' | 'loading' | 'ready' | 'error'
  error?: string | null
  empty?: boolean
  expectedSuite?: DocumentSuiteId
}

export type McpAppsReadPhase = 'loading' | 'ok' | 'missing' | 'failed'

export interface McpAppsPaneInput {
  read: McpAppsReadPhase
  readReason?: string
  appCount: number
  workspace: boolean
}

export interface McpAppsPanePresentation extends ViewerPresentation {
  lockedSurfaces: ReadonlyArray<{ id: string; status: 'Locked' }>
}

export function presentDocumentViewer(input: DocumentViewerInput): ViewerPresentation {
  if (!input.filePath.trim()) return { phase: 'empty', status: 'display-only', reason: 'missing_path' }
  const suite = suiteForPath(input.filePath)
  if (!suite) return { phase: 'error', status: 'display-only', reason: 'unknown_suite' }
  if (suite.status === 'Locked') return { phase: 'locked', status: 'Locked', reason: 'suite_locked' }
  if (input.expectedSuite && suite.id !== input.expectedSuite) {
    return { phase: 'error', status: 'display-only', reason: 'suite_mismatch' }
  }

  switch (input.load) {
    case 'idle':
    case 'loading':
      return { phase: 'loading', status: 'wired' }
    case 'error':
      return { phase: 'error', status: 'display-only', reason: input.error ?? 'load_failed' }
    case 'ready':
      break
    default: {
      const unexpected: never = input.load
      return { phase: 'error', status: 'display-only', reason: `unknown_load:${String(unexpected)}` }
    }
  }

  if (input.empty) return { phase: 'empty', status: 'wired', reason: 'no_body' }
  return { phase: 'viewer', status: 'wired', reason: 'read_only' }
}

export function presentDocumentRow(input: { filePath: string; rowLocked: boolean }): ViewerPresentation {
  const suite = presentDocumentViewer({ filePath: input.filePath, load: 'ready' })
  if (suite.phase === 'locked' || suite.phase === 'error') return suite
  if (input.rowLocked) return { phase: 'locked', status: 'Locked', reason: 'formula_cell' }
  return { phase: 'viewer', status: 'wired', reason: 'read_only' }
}

export function presentMcpAppsPane(input: McpAppsPaneInput): McpAppsPanePresentation {
  const lockedSurfaces = lockedMcpSurfaces()
  if (!input.workspace && input.read !== 'loading') {
    return { phase: 'empty', status: 'display-only', reason: 'no_workspace', lockedSurfaces }
  }

  switch (input.read) {
    case 'loading':
      return { phase: 'loading', status: 'display-only', lockedSurfaces }
    case 'failed':
      return {
        phase: 'error',
        status: 'display-only',
        reason: input.readReason ?? 'loadout_read_failed',
        lockedSurfaces,
      }
    case 'ok':
    case 'missing':
      break
    default: {
      const unexpected: never = input.read
      return {
        phase: 'error',
        status: 'display-only',
        reason: `unknown_read:${String(unexpected)}`,
        lockedSurfaces,
      }
    }
  }

  if (input.appCount === 0) return { phase: 'empty', status: 'display-only', lockedSurfaces }
  return { phase: 'viewer', status: 'display-only', reason: 'read_projection', lockedSurfaces }
}

function lockedMcpSurfaces(): Array<{ id: string; status: 'Locked' }> {
  const locked: Array<{ id: string; status: 'Locked' }> = []
  for (const surface of listMcpAppsSurfaces()) {
    switch (surface.status) {
      case 'Locked':
        locked.push({ id: surface.id, status: 'Locked' })
        break
      case 'wired':
        break
      default: {
        const unexpected: never = surface
        return unexpected
      }
    }
  }
  return locked
}

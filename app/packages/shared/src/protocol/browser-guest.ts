/**
 * Built-in Chromium guest host.
 *
 * Page find, loading stop, and the native guest actions share one profile
 * and one owner check. A human control and an agent caller both use that
 * path. The DOM snapshot is the smallest governed capture: it admits
 * file.create on HostTurnKernel and writes only after admission. Screenshot
 * evidence and Chrome Store advertising stay Locked. This is not a plugin
 * marketplace and it does not open a second browser profile.
 */

import { readFileSync } from 'node:fs'
import type { ActorRef } from './actor'
import { containsCredentialMaterial } from './credential-boundary'
import { InternalActionId, type ActionInvocation } from './internal-action'
import { applyAtomicJsonEffect, NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome, type TurnPhase } from './turn-admission'

export const BUILTIN_BROWSER_PARTITION = 'persist:browser-pane'

export const BROWSER_GUEST_SURFACES = [
  { id: 'page_find', status: 'wired' },
  { id: 'loading_stop', status: 'wired' },
  { id: 'native_guest', status: 'wired' },
  { id: 'dom_snapshot', status: 'wired' },
  { id: 'screenshot_evidence', status: 'Locked' },
  { id: 'chrome_store', status: 'Locked' },
] as const

export type BrowserGuestSurface = (typeof BROWSER_GUEST_SURFACES)[number]

export type FindStopAction = 'clearSelection' | 'keepSelection' | 'activateSelection'

export interface PageFindResult {
  requestId: number
  activeMatchOrdinal: number
  matches: number
  finalUpdate: true
}

export interface GuestDomSnapshot {
  url: string
  title: string
  text: string
}

export interface ChromiumGuestPort {
  id: string
  partition: string
  ownerType: 'session' | 'manual'
  ownerSessionId: string | null
  isLoading: boolean
  findInPage(text: string): Promise<PageFindResult>
  stopFindInPage(action: FindStopAction): void
  stopLoading(): void
  navigate(url: string): Promise<void>
  goBack(): void
  goForward(): void
  reload(): void
  readDom(signal: AbortSignal): Promise<GuestDomSnapshot>
}

export type GuestAction =
  | { kind: 'find'; query: string }
  | { kind: 'stopFind'; action: FindStopAction }
  | { kind: 'stopLoading' }
  | { kind: 'navigate'; url: string }
  | { kind: 'goBack' }
  | { kind: 'goForward' }
  | { kind: 'reload' }
  | { kind: 'chromeStore' }
  | { kind: 'screenshotEvidence' }

export interface GuestCaller {
  kind: 'human_ui' | 'agent'
  sessionId: string
}

export type GuestActionResult =
  | { status: 'completed'; action: 'find'; find: PageFindResult }
  | { status: 'completed'; action: 'stopFind' | 'stopLoading' | 'navigate' | 'goBack' | 'goForward' | 'reload'; isLoading: boolean }
  | { status: 'failed'; reason: string }
  | { status: 'Locked'; surface: 'chrome_store' | 'screenshot_evidence'; reason: string }

export interface BrowserGuestShared {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
}

export interface GuestCaptureCall {
  guest: ChromiumGuestPort
  filePath: string
  sessionId: string
  invocationId: string
  actor: ActorRef
}

export interface GuestCaptureSuccess {
  status: 'completed'
  invocationId: string
  filePath: string
  snapshot: GuestDomSnapshot
}

export type GuestCaptureResult =
  | GuestCaptureSuccess
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; reason?: string }

interface BrowserGuestHostOptions {
  beforeRun?: (invocationId: string, kernel: HostTurnKernel) => void
}

const guestTables = new WeakMap<BrowserGuestShared, Map<string, ChromiumGuestPort>>()
const beforeRuns = new WeakMap<BrowserGuestShared, BrowserGuestHostOptions['beforeRun']>()

export function listBrowserGuestSurfaces(): readonly BrowserGuestSurface[] {
  return BROWSER_GUEST_SURFACES
}

export function createBrowserGuestHost(options: BrowserGuestHostOptions = {}): BrowserGuestShared {
  const effects = new NativeEffectRegistry()
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects })
  const shared = { kernel, effects }
  const guests = new Map<string, ChromiumGuestPort>()
  guestTables.set(shared, guests)
  effects.register(InternalActionId.FILE_CREATE, async (request) => {
    if (request.signal.aborted) throw abortError()
    const instanceId = typeof request.payload.instanceId === 'string' ? request.payload.instanceId : ''
    const filePath = typeof request.payload.filePath === 'string' ? request.payload.filePath : ''
    const guest = guests.get(instanceId)
    if (!guest || !filePath) throw new Error('guest_missing')
    const snapshot = await guest.readDom(request.signal)
    if (request.signal.aborted) throw abortError()
    if (containsCredentialMaterial(snapshot)) throw new Error('credential_material_rejected')
    const body = { kind: 'dom_snapshot', url: snapshot.url, title: snapshot.title, text: snapshot.text }
    const applied = await applyAtomicJsonEffect({
      filePath,
      next: body,
      signal: request.signal,
      commit: request.commit,
    })
    return {
      output: { filePath, actionId: InternalActionId.FILE_CREATE, kind: 'dom_snapshot' },
      undoHandle: {
        undoId: `undo-${request.sessionId}`,
        label: 'Restore previous DOM snapshot file',
        snapshot: applied.previous,
      },
    }
  })
  beforeRuns.set(shared, options.beforeRun)
  return shared
}

export function runGuestActionFromHuman(
  guest: ChromiumGuestPort,
  action: GuestAction,
  caller: GuestCaller,
): Promise<GuestActionResult> {
  return applyNativeGuestAction(guest, action, { ...caller, kind: 'human_ui' })
}

export function runGuestActionFromAgent(
  guest: ChromiumGuestPort,
  action: GuestAction,
  caller: GuestCaller,
): Promise<GuestActionResult> {
  return applyNativeGuestAction(guest, action, { ...caller, kind: 'agent' })
}

export async function applyNativeGuestAction(
  guest: ChromiumGuestPort,
  action: GuestAction,
  caller: GuestCaller,
): Promise<GuestActionResult> {
  switch (action.kind) {
    case 'chromeStore':
      return { status: 'Locked', surface: 'chrome_store', reason: 'extension_lifecycle_unproven' }
    case 'screenshotEvidence':
      return { status: 'Locked', surface: 'screenshot_evidence', reason: 'governed_screenshot_unfinished' }
    case 'find':
    case 'stopFind':
    case 'stopLoading':
    case 'navigate':
    case 'goBack':
    case 'goForward':
    case 'reload': {
      const denied = authorize(guest, caller)
      if (denied) return denied
      return dispatchGuestAction(guest, action)
    }
    default: {
      const unexpected: never = action
      return { status: 'failed', reason: `unknown_guest_action:${String(unexpected)}` }
    }
  }
}

export function captureDomFromHuman(shared: BrowserGuestShared, input: GuestCaptureCall): Promise<GuestCaptureResult> {
  return executeGuestCapture(shared, input, 'human_ui')
}

export function captureDomFromAgent(shared: BrowserGuestShared, input: GuestCaptureCall): Promise<GuestCaptureResult> {
  return executeGuestCapture(shared, input, 'agent')
}

export async function executeGuestCapture(
  shared: BrowserGuestShared,
  input: GuestCaptureCall,
  callerKind: 'human_ui' | 'agent',
): Promise<GuestCaptureResult> {
  if (!input.invocationId.trim() || !input.sessionId.trim()) return failed(input.invocationId, 'malformed_invocation')
  if (!isSafeCapturePath(input.filePath)) return failed(input.invocationId, 'unsafe_file_path')
  const denied = authorize(input.guest, { kind: callerKind, sessionId: input.sessionId })
  if (denied) return failed(input.invocationId, denied.reason)
  const guests = guestTables.get(shared)
  if (!guests) return failed(input.invocationId, 'guest_host_missing')
  guests.set(input.guest.id, input.guest)

  const invocation: ActionInvocation = {
    invocationId: input.invocationId,
    actionId: InternalActionId.FILE_CREATE,
    payload: {
      instanceId: input.guest.id,
      filePath: input.filePath,
      captureKind: 'dom_snapshot',
    },
    targets: [{ kind: 'file', id: input.filePath, label: 'dom_snapshot' }],
    callerKind,
    sessionId: input.sessionId,
    createdAt: '2026-10-09T00:00:00.000Z',
  }
  const admitted = shared.kernel.admit({ invocation, actor: input.actor })
  if (admitted.status !== 'admitted') return unwritten(admitted)
  beforeRuns.get(shared)?.(input.invocationId, shared.kernel)
  const stopped = shared.kernel.snapshot().turns.find((turn) => turn.request.invocation.invocationId === input.invocationId)
  if (stopped && stopped.phase !== 'admitted') return unwritten(outcomeFromPhase(input.invocationId, stopped.phase, stopped.reason))
  const written = await shared.kernel.run(input.invocationId)
  if (written.status !== 'completed') return unwritten(written)
  return completed(input.invocationId, input.filePath)
}

async function dispatchGuestAction(
  guest: ChromiumGuestPort,
  action: Exclude<GuestAction, { kind: 'chromeStore' } | { kind: 'screenshotEvidence' }>,
): Promise<GuestActionResult> {
  switch (action.kind) {
    case 'find': {
      const query = action.query.trim()
      if (!query) return { status: 'failed', reason: 'empty_query' }
      const find = await guest.findInPage(query)
      return { status: 'completed', action: 'find', find }
    }
    case 'stopFind':
      guest.stopFindInPage(action.action)
      return { status: 'completed', action: 'stopFind', isLoading: guest.isLoading }
    case 'stopLoading':
      guest.stopLoading()
      return { status: 'completed', action: 'stopLoading', isLoading: guest.isLoading }
    case 'navigate': {
      const url = action.url.trim()
      if (!url) return { status: 'failed', reason: 'empty_url' }
      await guest.navigate(url)
      return { status: 'completed', action: 'navigate', isLoading: guest.isLoading }
    }
    case 'goBack':
      guest.goBack()
      return { status: 'completed', action: 'goBack', isLoading: guest.isLoading }
    case 'goForward':
      guest.goForward()
      return { status: 'completed', action: 'goForward', isLoading: guest.isLoading }
    case 'reload':
      guest.reload()
      return { status: 'completed', action: 'reload', isLoading: guest.isLoading }
    default: {
      const unexpected: never = action
      return { status: 'failed', reason: `unknown_guest_action:${String(unexpected)}` }
    }
  }
}

function authorize(guest: ChromiumGuestPort, caller: GuestCaller): { status: 'failed'; reason: string } | null {
  if (guest.partition !== BUILTIN_BROWSER_PARTITION) return { status: 'failed', reason: 'profile_rejected' }
  if (caller.kind === 'human_ui') return null
  if (caller.kind === 'agent') {
    if (guest.ownerType === 'session' && guest.ownerSessionId === caller.sessionId) return null
    return { status: 'failed', reason: 'owner_mismatch' }
  }
  const unexpected: never = caller.kind
  return { status: 'failed', reason: `unknown_caller:${String(unexpected)}` }
}

function isSafeCapturePath(filePath: string): boolean {
  if (!filePath.trim()) return false
  return !filePath.split(/[\\/]/).includes('..')
}

function completed(invocationId: string, filePath: string): GuestCaptureResult {
  let snapshot: GuestDomSnapshot
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as { url?: unknown; title?: unknown; text?: unknown }
    snapshot = {
      url: typeof parsed.url === 'string' ? parsed.url : '',
      title: typeof parsed.title === 'string' ? parsed.title : '',
      text: typeof parsed.text === 'string' ? parsed.text : '',
    }
  } catch {
    return failed(invocationId, 'snapshot_unreadable')
  }
  return { status: 'completed', invocationId, filePath, snapshot }
}

function outcomeFromPhase(invocationId: string, phase: TurnPhase, reason?: string): TurnOutcome {
  switch (phase) {
    case 'admitted':
    case 'running':
      return { status: 'admitted', invocationId, reason }
    case 'awaiting_approval':
      return { status: 'approval_required', invocationId, reason }
    case 'completed':
      return { status: 'completed', invocationId }
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: phase, invocationId, reason }
    default: {
      const unexpected: never = phase
      return { status: 'failed', invocationId, reason: String(unexpected) }
    }
  }
}

function unwritten(outcome: TurnOutcome): GuestCaptureResult {
  switch (outcome.status) {
    case 'completed':
      return failed(outcome.invocationId, 'unexpected_completed_write')
    case 'admitted':
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: outcome.status, invocationId: outcome.invocationId, reason: outcome.reason }
    default: {
      const unexpected: never = outcome.status
      return failed(outcome.invocationId, String(unexpected))
    }
  }
}

function failed(invocationId: string, reason: string): GuestCaptureResult {
  return { status: 'failed', invocationId, reason }
}

function abortError(): Error {
  const error = new Error('aborted')
  error.name = 'AbortError'
  return error
}

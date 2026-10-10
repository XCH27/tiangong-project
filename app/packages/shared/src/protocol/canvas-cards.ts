/**
 * Spatial cards for an admitted DOCX, an XLSX workbook, a PPTX deck, and an
 * admitted AIGC artifact.
 *
 * A card is a CanvasNode on the existing canvas document. Place and delete
 * admit canvas.node_create and canvas.node_delete on HostTurnKernel. A DOCX
 * edit on the card calls the same document suite as the preview. An XLSX or
 * PPTX card projects the first sheet or the first slide. Open and focus
 * admit canvas.node_select and record the file the existing preview overlay
 * already opens. They do not write workbook or deck bytes. Hide and stop
 * change view state only. Delete removes the binding after approval.
 * The DOCX bytes, the workbook, the deck, and the job record stay with
 * their owners.
 *
 * @xyflow/react is not installed in this repo. Card positions are the
 * CanvasNode frame. The renderer spike stays Locked. A full spreadsheet
 * editor and a full slide editor stay Locked. This host is not a plugin
 * marketplace.
 */

import { readFileSync } from 'node:fs'
import type { ActorRef } from './actor'
import { type AigcArtifact, type AigcHost, isAigcMediaOperation } from './aigc-job'
import type { CanvasDocument, CanvasNode } from './canvas'
import {
  type CanvasCardBinding,
  type CanvasCardFrame,
  type CanvasCardView,
  bindingFromNode,
  nodeTypeForBinding,
  parseCanvasCardBinding,
  projectCanvasCard,
  visibleCanvasCards,
} from './canvas-card-view'
import {
  type DocumentPreviewCommand,
  type DocumentSuiteDeclaration,
  isSafeDocumentPath,
  suiteForPath,
} from './document-command'
import {
  type DocumentOpResult,
  type DocumentSuiteShared,
  applyDocumentFromAgent,
  applyDocumentFromHuman,
} from './document-suite'
import { DocxPackageError, readDocxParagraphs } from './docx-package'
import { InternalActionId, type ActionInvocation, type UndoHandle } from './internal-action'
import { PptxPackageError, readPptxSlide } from './pptx-package'
import type { SheetCell } from './xlsx-xml'
import { XlsxPackageError, readXlsxSheet } from './xlsx-package'
import { applyAtomicJsonEffect, type NativeEffectRequest, type NativeEffectResult, NativeEffectRegistry } from './native-effect-executor'
import { HostTurnKernel, MemoryTurnJournal, type TurnOutcome } from './turn-admission'
import { ZipStoreError } from './zip-store'

export interface CanvasCardHostOptions {
  workspaceId: string
  sessionId: string
  documentPath: string
  documents: DocumentSuiteShared
  aigc: AigcHost
  now?: () => string
  documentId?: string
}

export interface PlaceDocxCard {
  nodeId: string
  invocationId: string
  filePath: string
  actor: ActorRef
  frame?: CanvasCardFrame
}

export interface PlaceAigcCard {
  nodeId: string
  invocationId: string
  jobInvocationId: string
  actor: ActorRef
  frame?: CanvasCardFrame
}

export interface PlaceOfficeCard {
  nodeId: string
  invocationId: string
  filePath: string
  actor: ActorRef
  frame?: CanvasCardFrame
}

export interface OfficeCardCall {
  nodeId: string
  invocationId: string
  actor: ActorRef
  callerKind?: 'human_ui' | 'agent'
}

export interface OfficePreviewFocus {
  nodeId: string
  suite: 'xlsx' | 'pptx'
  filePath: string
}

export interface ApplyDocxOnCard {
  nodeId: string
  invocationId: string
  actor: ActorRef
  command: DocumentPreviewCommand
}

export interface DeleteCanvasCard {
  nodeId: string
  invocationId: string
  actor: ActorRef
}

export type CanvasMutationResult =
  | { status: 'completed'; nodeId: string; invocationId: string }
  | { status: 'Locked'; suite: 'xls' | 'ppt'; reason: 'suite_locked' }
  | {
    status: Exclude<TurnOutcome['status'], 'completed'>
    invocationId: string
    nodeId?: string
    reason?: string
  }

export interface CanvasViewResult {
  status: 'completed' | 'failed'
  nodeId: string
  reason?: 'unknown_node'
}

export type OfficePreviewResult =
  | { status: 'completed'; invocationId: string; nodeId: string; preview: OfficePreviewFocus | null; admitted: boolean }
  | { status: 'Locked'; suite: 'xls' | 'ppt'; reason: 'suite_locked' }
  | { status: Exclude<TurnOutcome['status'], 'completed'>; invocationId: string; nodeId?: string; reason?: string }
  | { status: 'failed'; invocationId: string; nodeId?: string; reason: string }

export interface CanvasCardHost {
  kernel: HostTurnKernel
  effects: NativeEffectRegistry
  placeDocx(input: PlaceDocxCard): Promise<CanvasMutationResult>
  placeXlsx(input: PlaceOfficeCard): Promise<CanvasMutationResult>
  placePptx(input: PlaceOfficeCard): Promise<CanvasMutationResult>
  placeAigc(input: PlaceAigcCard): Promise<CanvasMutationResult>
  applyDocxCommand(input: ApplyDocxOnCard): Promise<DocumentOpResult>
  openOffice(input: OfficeCardCall): Promise<OfficePreviewResult>
  focusOffice(input: OfficeCardCall): Promise<OfficePreviewResult>
  closeOffice(input: OfficeCardCall): Promise<OfficePreviewResult>
  officePreview(): OfficePreviewFocus | null
  hide(nodeId: string): CanvasViewResult
  show(nodeId: string): CanvasViewResult
  stop(nodeId: string): CanvasViewResult
  resume(nodeId: string): CanvasViewResult
  deleteCard(input: DeleteCanvasCard): Promise<CanvasMutationResult>
  readBoard(): CanvasCardView[]
  visibleBoard(): CanvasCardView[]
}

interface CardState {
  document: CanvasDocument
  nextSeq: number
  hidden: Set<string>
  suspended: Set<string>
  preview: OfficePreviewFocus | null
}

export function createCanvasCardHost(options: CanvasCardHostOptions): CanvasCardHost {
  if (!isSafeDocumentPath(options.documentPath)) throw new Error('unsafe_canvas_path')
  const now = options.now ?? (() => new Date().toISOString())
  const state = loadState(options, now())
  const effects = new NativeEffectRegistry()
  effects.register(InternalActionId.CANVAS_NODE_CREATE, (request) => commitCreate(state, options.documentPath, now, request))
  effects.register(InternalActionId.CANVAS_NODE_DELETE, (request) => commitDelete(state, options.documentPath, now, request))
  effects.register(InternalActionId.CANVAS_NODE_SELECT, (request) => commitSelect(state, request))
  const kernel = new HostTurnKernel(new MemoryTurnJournal(), { nativeEffects: effects, now })

  return {
    kernel,
    effects,
    placeDocx(input) {
      return placeDocx(kernel, state, options, now, input)
    },
    placeXlsx(input) {
      return placeOffice(kernel, state, options, now, 'xlsx', input)
    },
    placePptx(input) {
      return placeOffice(kernel, state, options, now, 'pptx', input)
    },
    placeAigc(input) {
      return placeAigc(kernel, state, options, now, input)
    },
    applyDocxCommand(input) {
      return applyDocxCommand(state, options, input)
    },
    openOffice(input) {
      return previewOffice(kernel, state, options, now, 'open', input)
    },
    focusOffice(input) {
      return previewOffice(kernel, state, options, now, 'focus', input)
    },
    closeOffice(input) {
      return previewOffice(kernel, state, options, now, 'close', input)
    },
    officePreview() {
      return state.preview
    },
    hide(nodeId) {
      return changeView(state, nodeId, () => { state.hidden.add(nodeId) })
    },
    show(nodeId) {
      return changeView(state, nodeId, () => { state.hidden.delete(nodeId) })
    },
    stop(nodeId) {
      return changeView(state, nodeId, () => { state.suspended.add(nodeId) })
    },
    resume(nodeId) {
      return changeView(state, nodeId, () => { state.suspended.delete(nodeId) })
    },
    deleteCard(input) {
      return deleteCard(kernel, state, options, now, input)
    },
    readBoard() {
      return readBoard(state, options)
    },
    visibleBoard() {
      return visibleCanvasCards(readBoard(state, options))
    },
  }
}

async function placeDocx(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  input: PlaceDocxCard,
): Promise<CanvasMutationResult> {
  const refused = refuseCard(input.nodeId, input.invocationId, input.actor, state)
  if (refused) return refused
  const suite = suiteForPath(input.filePath)
  if (!suite) return failed(input.invocationId, input.nodeId, 'unknown_suite')
  if (suite.status === 'Locked') return lockedCard(suite)
  if (suite.id !== 'docx') return failed(input.invocationId, input.nodeId, 'not_docx')
  if (!isSafeDocumentPath(input.filePath)) return failed(input.invocationId, input.nodeId, 'unsafe_file_path')
  const loaded = readParagraphs(input.filePath)
  if ('reason' in loaded) return failed(input.invocationId, input.nodeId, loaded.reason)
  const binding: CanvasCardBinding = { kind: 'docx', filePath: input.filePath }
  return admitCreate(kernel, options, now, input.actor, input.invocationId, input.nodeId, binding, input.frame, state)
}

async function placeOffice(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  kind: 'xlsx' | 'pptx',
  input: PlaceOfficeCard,
): Promise<CanvasMutationResult> {
  const refused = refuseCard(input.nodeId, input.invocationId, input.actor, state)
  if (refused) return refused
  const suite = suiteForPath(input.filePath)
  if (!suite) return failed(input.invocationId, input.nodeId, 'unknown_suite')
  if (suite.status === 'Locked') return lockedCard(suite)
  if (suite.id !== kind) return failed(input.invocationId, input.nodeId, kind === 'xlsx' ? 'not_xlsx' : 'not_pptx')
  if (!isSafeDocumentPath(input.filePath)) return failed(input.invocationId, input.nodeId, 'unsafe_file_path')
  const loaded = readOffice(kind, input.filePath)
  if ('reason' in loaded) return failed(input.invocationId, input.nodeId, loaded.reason)
  const binding: CanvasCardBinding = { kind, filePath: input.filePath }
  return admitCreate(kernel, options, now, input.actor, input.invocationId, input.nodeId, binding, input.frame, state)
}

async function placeAigc(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  input: PlaceAigcCard,
): Promise<CanvasMutationResult> {
  const refused = refuseCard(input.nodeId, input.invocationId, input.actor, state)
  if (refused) return refused
  const job = describeJob(options.aigc, input.jobInvocationId)
  if (!job) return failed(input.invocationId, input.nodeId, 'unknown_invocation')
  const binding: CanvasCardBinding = {
    kind: 'aigc_artifact',
    invocationId: input.jobInvocationId,
    mediaKind: job.mediaKind,
  }
  const frameKind = job.mediaKind === 'video' ? 'video' : 'image'
  return admitCreate(kernel, options, now, input.actor, input.invocationId, input.nodeId, binding, input.frame, state, frameKind)
}

async function admitCreate(
  kernel: HostTurnKernel,
  options: CanvasCardHostOptions,
  now: () => string,
  actor: ActorRef,
  invocationId: string,
  nodeId: string,
  binding: CanvasCardBinding,
  frame: CanvasCardFrame | undefined,
  state: CardState,
  frameKind: 'docx' | 'xlsx' | 'pptx' | 'image' | 'video' = frameKindFor(binding),
): Promise<CanvasMutationResult> {
  const invocation = canvasInvocation({
    invocationId,
    actionId: InternalActionId.CANVAS_NODE_CREATE,
    actor,
    sessionId: options.sessionId,
    nodeId,
    payload: {
      nodeId,
      binding,
      frame: frame ?? defaultFrame(frameKind, Object.keys(state.document.nodes).length),
    },
    now,
  })
  return runCanvas(kernel, invocation, actor)
}

async function previewOffice(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  op: 'open' | 'focus' | 'close',
  input: OfficeCardCall,
): Promise<OfficePreviewResult> {
  if (!input.invocationId.trim()) return previewFailed(input.invocationId || 'missing', input.nodeId, 'invalid_card')
  if (input.actor.kind === 'system') return previewFailed(input.invocationId, input.nodeId, 'actor_not_permitted')
  const callerKind = input.callerKind ?? (input.actor.kind === 'human' ? 'human_ui' : 'agent')
  if (op === 'close') {
    if (!state.preview) {
      return { status: 'completed', invocationId: input.invocationId, nodeId: input.nodeId, preview: null, admitted: false }
    }
    return admitSelect(kernel, state, options, now, input, callerKind, {
      surface: 'office_preview',
      op: 'close',
      nodeId: state.preview.nodeId,
    }, state.preview.nodeId)
  }
  const node = state.document.nodes[input.nodeId]
  const binding = node ? bindingFromNode(node) : null
  if (!binding || (binding.kind !== 'xlsx' && binding.kind !== 'pptx')) {
    return previewFailed(input.invocationId, input.nodeId, 'not_office_card')
  }
  const suite = suiteForPath(binding.filePath)
  if (!suite) return previewFailed(input.invocationId, input.nodeId, 'unknown_suite')
  if (suite.status === 'Locked') return lockedPreview(suite)
  if (suite.id !== binding.kind) return previewFailed(input.invocationId, input.nodeId, 'not_office_card')
  if (!isSafeDocumentPath(binding.filePath)) return previewFailed(input.invocationId, input.nodeId, 'unsafe_file_path')
  const loaded = readOffice(binding.kind, binding.filePath)
  if ('reason' in loaded) return previewFailed(input.invocationId, input.nodeId, loaded.reason)
  if (state.preview && state.preview.nodeId === input.nodeId && state.preview.filePath === binding.filePath && state.preview.suite === binding.kind) {
    return {
      status: 'completed',
      invocationId: input.invocationId,
      nodeId: input.nodeId,
      preview: state.preview,
      admitted: false,
    }
  }
  return admitSelect(kernel, state, options, now, input, callerKind, {
    surface: 'office_preview',
    op,
    nodeId: input.nodeId,
    suite: binding.kind,
    filePath: binding.filePath,
  }, input.nodeId)
}

async function admitSelect(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  input: OfficeCardCall,
  callerKind: 'human_ui' | 'agent',
  payload: Record<string, unknown>,
  nodeId: string,
): Promise<OfficePreviewResult> {
  const invocation = canvasInvocation({
    invocationId: input.invocationId,
    actionId: InternalActionId.CANVAS_NODE_SELECT,
    actor: input.actor,
    sessionId: options.sessionId,
    nodeId,
    payload,
    now,
    callerKind,
  })
  const admitted = kernel.admit({ invocation, actor: input.actor })
  if (admitted.status === 'completed') {
    return { status: 'completed', invocationId: admitted.invocationId, nodeId, preview: state.preview, admitted: false }
  }
  if (admitted.status !== 'admitted') return previewUnsettled(admitted, nodeId)
  const ran = await kernel.run(input.invocationId)
  if (ran.status !== 'completed') return previewUnsettled(ran, nodeId)
  return { status: 'completed', invocationId: ran.invocationId, nodeId, preview: state.preview, admitted: true }
}

async function deleteCard(
  kernel: HostTurnKernel,
  state: CardState,
  options: CanvasCardHostOptions,
  now: () => string,
  input: DeleteCanvasCard,
): Promise<CanvasMutationResult> {
  if (!state.document.nodes[input.nodeId]) return failed(input.invocationId, input.nodeId, 'unknown_node')
  if (input.actor.kind === 'system') return failed(input.invocationId, input.nodeId, 'actor_not_permitted')
  const invocation = canvasInvocation({
    invocationId: input.invocationId,
    actionId: InternalActionId.CANVAS_NODE_DELETE,
    actor: input.actor,
    sessionId: options.sessionId,
    nodeId: input.nodeId,
    payload: { nodeId: input.nodeId },
    now,
  })
  return runCanvas(kernel, invocation, input.actor)
}

async function applyDocxCommand(
  state: CardState,
  options: CanvasCardHostOptions,
  input: ApplyDocxOnCard,
): Promise<DocumentOpResult> {
  const node = state.document.nodes[input.nodeId]
  const binding = node ? bindingFromNode(node) : null
  if (!binding || binding.kind !== 'docx') {
    return { status: 'failed', invocationId: input.invocationId, reason: 'unknown_node' }
  }
  const apply = callerApply(input.actor)
  if (!apply) return { status: 'failed', invocationId: input.invocationId, reason: 'actor_not_permitted' }
  const call = {
    op: input.command.op,
    filePath: binding.filePath,
    sessionId: options.sessionId,
    invocationId: input.invocationId,
    actor: input.actor,
    paragraphIndex: input.command.paragraphIndex,
    text: input.command.text,
    cell: input.command.cell,
    value: input.command.value,
    valueType: input.command.valueType,
  }
  const first = await apply(options.documents, call)
  if (first.status !== 'failed' || first.reason !== 'not_open') return first
  const opened = await apply(options.documents, {
    ...call,
    op: 'open',
    paragraphIndex: undefined,
    text: undefined,
  })
  if (opened.status !== 'completed') return opened
  return apply(options.documents, call)
}

function callerApply(actor: ActorRef): typeof applyDocumentFromHuman | null {
  switch (actor.kind) {
    case 'human':
      return applyDocumentFromHuman
    case 'agent':
      return applyDocumentFromAgent
    case 'system':
      return null
    default: {
      const unexpected: never = actor.kind
      return unexpected
    }
  }
}

function readBoard(state: CardState, options: CanvasCardHostOptions): CanvasCardView[] {
  const views: CanvasCardView[] = []
  for (const node of Object.values(state.document.nodes)) {
    const binding = bindingFromNode(node)
    if (!binding) continue
    const view = projectCanvasCard({
      node,
      hidden: state.hidden.has(node.id),
      suspended: state.suspended.has(node.id),
      ...liveFields(binding, options),
    })
    if (view) views.push(view)
  }
  return views.sort((left, right) => left.frame.cy - right.frame.cy || left.frame.cx - right.frame.cx || left.nodeId.localeCompare(right.nodeId))
}

function liveFields(binding: CanvasCardBinding, options: CanvasCardHostOptions): {
  paragraphs?: string[]
  sheetName?: string
  cells?: SheetCell[]
  texts?: string[]
  phase?: string
  artifact?: CanvasCardProjectionArtifact
} {
  switch (binding.kind) {
    case 'docx': {
      const loaded = readParagraphs(binding.filePath)
      return { paragraphs: 'reason' in loaded ? [] : loaded.paragraphs }
    }
    case 'xlsx': {
      const loaded = readOffice('xlsx', binding.filePath)
      return 'reason' in loaded ? { sheetName: '', cells: [] } : { sheetName: loaded.sheetName, cells: loaded.cells }
    }
    case 'pptx': {
      const loaded = readOffice('pptx', binding.filePath)
      return 'reason' in loaded ? { texts: [] } : { texts: loaded.texts }
    }
    case 'aigc_artifact': {
      const job = describeJob(options.aigc, binding.invocationId)
      return {
        phase: job?.phase ?? 'unknown',
        artifact: job?.artifact ?? null,
      }
    }
    default: {
      const unexpected: never = binding
      return unexpected
    }
  }
}

type CanvasCardProjectionArtifact = {
  mediaKind: 'image' | 'video'
  mimeType: string
  path: string
  name: string
  previewSrc?: string
} | null

async function runCanvas(
  kernel: HostTurnKernel,
  invocation: ActionInvocation,
  actor: ActorRef,
): Promise<CanvasMutationResult> {
  const nodeId = invocation.targets[0]?.id ?? ''
  const admitted = kernel.admit({ invocation, actor })
  if (admitted.status !== 'admitted') return unsettled(admitted, nodeId)
  const ran = await kernel.run(invocation.invocationId)
  if (ran.status !== 'completed') return unsettled(ran, nodeId)
  return { status: 'completed', invocationId: ran.invocationId, nodeId }
}

async function commitCreate(
  state: CardState,
  documentPath: string,
  now: () => string,
  request: NativeEffectRequest,
): Promise<NativeEffectResult> {
  const nodeId = typeof request.payload.nodeId === 'string' ? request.payload.nodeId : ''
  const binding = parseCanvasCardBinding(request.payload.binding)
  const frame = parseFrame(request.payload.frame)
  if (!nodeId || !binding || !frame) throw new Error('invalid_card')
  if (state.document.nodes[nodeId]) throw new Error('duplicate_node')
  const previous = cloneDocument(state.document)
  const node: CanvasNode = {
    id: nodeId,
    type: nodeTypeForBinding(binding),
    cx: frame.cx,
    cy: frame.cy,
    width: frame.width,
    height: frame.height,
    data: { binding },
    contentType: 'live',
    seq: state.nextSeq,
  }
  const next: CanvasDocument = {
    ...state.document,
    nodes: { ...state.document.nodes, [nodeId]: node },
    updatedAt: now(),
  }
  await applyAtomicJsonEffect({
    filePath: documentPath,
    next,
    signal: request.signal,
    commit: request.commit,
  })
  state.document = next
  state.nextSeq += 1
  return {
    output: { nodeId },
    undoHandle: undoOf(request.sessionId, nodeId, previous),
  }
}

async function commitDelete(
  state: CardState,
  documentPath: string,
  now: () => string,
  request: NativeEffectRequest,
): Promise<NativeEffectResult> {
  const nodeId = typeof request.payload.nodeId === 'string' ? request.payload.nodeId : ''
  if (!nodeId || !state.document.nodes[nodeId]) throw new Error('unknown_node')
  const nodes = { ...state.document.nodes }
  delete nodes[nodeId]
  const edges = { ...state.document.edges }
  for (const [edgeId, edge] of Object.entries(edges)) {
    if (edge.sourceNodeId === nodeId || edge.targetNodeId === nodeId) delete edges[edgeId]
  }
  const next: CanvasDocument = {
    ...state.document,
    nodes,
    edges,
    updatedAt: now(),
  }
  await applyAtomicJsonEffect({
    filePath: documentPath,
    next,
    signal: request.signal,
    commit: request.commit,
  })
  state.document = next
  state.hidden.delete(nodeId)
  state.suspended.delete(nodeId)
  if (state.preview?.nodeId === nodeId) state.preview = null
  return { output: { nodeId } }
}

function changeView(state: CardState, nodeId: string, apply: () => void): CanvasViewResult {
  if (!state.document.nodes[nodeId]) return { status: 'failed', nodeId, reason: 'unknown_node' }
  apply()
  return { status: 'completed', nodeId }
}

function refuseCard(
  nodeId: string,
  invocationId: string,
  actor: ActorRef,
  state: CardState,
): CanvasMutationResult | null {
  if (!nodeId.trim() || !invocationId.trim()) return failed(invocationId || 'missing', nodeId, 'invalid_card')
  if (actor.kind === 'system') return failed(invocationId, nodeId, 'actor_not_permitted')
  if (state.document.nodes[nodeId]) return failed(invocationId, nodeId, 'duplicate_node')
  return null
}

function canvasInvocation(input: {
  invocationId: string
  actionId: InternalActionId
  actor: ActorRef
  sessionId: string
  nodeId: string
  payload: Record<string, unknown>
  now: () => string
  callerKind?: 'human_ui' | 'agent'
}): ActionInvocation {
  return {
    invocationId: input.invocationId,
    actionId: input.actionId,
    payload: input.payload,
    targets: [{ kind: 'canvas_node', id: input.nodeId }],
    callerKind: input.callerKind ?? (input.actor.kind === 'human' ? 'human_ui' : 'agent'),
    sessionId: input.sessionId,
    createdAt: input.now(),
  }
}

function describeJob(aigc: AigcHost, invocationId: string): {
  mediaKind: 'image' | 'video'
  phase: string
  artifact: AigcArtifact | null
} | null {
  const turn = aigc.kernel.snapshot().turns.find((item) => item.request.invocation.invocationId === invocationId)
  if (!turn) return null
  const artifact = asArtifact(turn.output)
  const operation = turn.request.invocation.payload.operation
  let mediaKind: 'image' | 'video' | null = artifact?.mediaKind ?? null
  if (!mediaKind && isAigcMediaOperation(operation)) {
    mediaKind = operation === 'video.generate' ? 'video' : 'image'
  }
  if (!mediaKind) return null
  return { mediaKind, phase: turn.phase, artifact }
}

function asArtifact(output: unknown): AigcArtifact | null {
  if (!output || typeof output !== 'object') return null
  const record = output as Partial<AigcArtifact>
  if (record.kind !== 'aigc_artifact') return null
  if (record.mediaKind !== 'image' && record.mediaKind !== 'video') return null
  if (typeof record.mimeType !== 'string' || typeof record.path !== 'string' || typeof record.name !== 'string') return null
  if (typeof record.providerJobId !== 'string' || typeof record.idempotencyKey !== 'string') return null
  if (typeof record.byteLength !== 'number') return null
  return {
    kind: 'aigc_artifact',
    mediaKind: record.mediaKind,
    mimeType: record.mimeType,
    name: record.name,
    path: record.path,
    byteLength: record.byteLength,
    providerJobId: record.providerJobId,
    idempotencyKey: record.idempotencyKey,
    ...(typeof record.previewSrc === 'string' ? { previewSrc: record.previewSrc } : {}),
  }
}

async function commitSelect(state: CardState, request: NativeEffectRequest): Promise<NativeEffectResult> {
  if (request.signal.aborted) throw abortError()
  if (request.payload.surface !== 'office_preview') throw new Error('office_preview_rejected')
  if (request.payload.op === 'close') {
    state.preview = null
    return { output: { surface: 'office_preview', op: 'close' } }
  }
  if (request.payload.op !== 'open' && request.payload.op !== 'focus') throw new Error('office_preview_rejected')
  const nodeId = typeof request.payload.nodeId === 'string' ? request.payload.nodeId : ''
  const filePath = typeof request.payload.filePath === 'string' ? request.payload.filePath : ''
  const suite = request.payload.suite
  const node = state.document.nodes[nodeId]
  const binding = node ? bindingFromNode(node) : null
  if (!binding || (binding.kind !== 'xlsx' && binding.kind !== 'pptx')) throw new Error('office_preview_rejected')
  if (binding.kind !== suite || binding.filePath !== filePath) throw new Error('office_preview_rejected')
  if (!isSafeDocumentPath(filePath)) throw new Error('office_preview_rejected')
  const loaded = readOffice(binding.kind, filePath)
  if ('reason' in loaded) throw new Error(loaded.reason)
  state.preview = { nodeId, suite: binding.kind, filePath }
  return { output: { surface: 'office_preview', op: request.payload.op, nodeId } }
}

function readOffice(
  kind: 'xlsx' | 'pptx',
  filePath: string,
): { sheetName: string; cells: SheetCell[]; texts: string[] } | { reason: string } {
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(readFileSync(filePath))
  } catch {
    return { reason: 'file_missing' }
  }
  try {
    if (kind === 'xlsx') {
      const sheet = readXlsxSheet(bytes)
      return { sheetName: sheet.sheetName, cells: sheet.cells, texts: [] }
    }
    return { sheetName: '', cells: [], texts: readPptxSlide(bytes).texts }
  } catch (error) {
    if (error instanceof XlsxPackageError || error instanceof PptxPackageError) return { reason: error.reason }
    throw error
  }
}

function readParagraphs(filePath: string): { paragraphs: string[] } | { reason: 'file_missing' | 'invalid_docx' } {
  let bytes: Uint8Array
  try {
    bytes = new Uint8Array(readFileSync(filePath))
  } catch {
    return { reason: 'file_missing' }
  }
  try {
    return { paragraphs: readDocxParagraphs(bytes) }
  } catch (error) {
    if (error instanceof DocxPackageError || error instanceof ZipStoreError) return { reason: 'invalid_docx' }
    throw error
  }
}

function loadState(options: CanvasCardHostOptions, timestamp: string): CardState {
  const document = readCanvasDocument(options, timestamp)
  let maxSeq = 0
  for (const node of Object.values(document.nodes)) {
    if (node.seq > maxSeq) maxSeq = node.seq
  }
  return {
    document,
    nextSeq: maxSeq + 1,
    hidden: new Set(),
    suspended: new Set(),
    preview: null,
  }
}

function readCanvasDocument(options: CanvasCardHostOptions, timestamp: string): CanvasDocument {
  try {
    const parsed = JSON.parse(readFileSync(options.documentPath, 'utf8')) as CanvasDocument
    if (!parsed || typeof parsed !== 'object' || !parsed.nodes || !parsed.viewport) {
      throw new Error('invalid_canvas_document')
    }
    return parsed
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_canvas_document') throw error
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        id: options.documentId ?? 'canvas-1',
        workspaceId: options.workspaceId,
        sessionId: options.sessionId,
        nodes: {},
        edges: {},
        viewport: { cx: 0, cy: 0, zoom: 1 },
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    }
    if (error instanceof SyntaxError) throw new Error('invalid_canvas_document')
    throw error
  }
}

function frameKindFor(binding: CanvasCardBinding): 'docx' | 'xlsx' | 'pptx' | 'image' | 'video' {
  switch (binding.kind) {
    case 'docx':
    case 'xlsx':
    case 'pptx':
      return binding.kind
    case 'aigc_artifact':
      return binding.mediaKind
    default: {
      const unexpected: never = binding
      return unexpected
    }
  }
}

function defaultFrame(kind: 'docx' | 'xlsx' | 'pptx' | 'image' | 'video', index: number): CanvasCardFrame {
  const size = kind === 'docx' || kind === 'xlsx'
    ? { width: 360, height: 280 }
    : kind === 'pptx' || kind === 'video'
      ? { width: 360, height: 240 }
      : { width: 320, height: 240 }
  return { cx: 32 + (index * 24), cy: 32 + (index * 24), width: size.width, height: size.height }
}

function parseFrame(value: unknown): CanvasCardFrame | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const cx = record.cx
  const cy = record.cy
  const width = record.width
  const height = record.height
  if (typeof cx !== 'number' || typeof cy !== 'number' || typeof width !== 'number' || typeof height !== 'number') return null
  if (![cx, cy, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null
  return { cx, cy, width, height }
}

function cloneDocument(document: CanvasDocument): CanvasDocument {
  return JSON.parse(JSON.stringify(document)) as CanvasDocument
}

function undoOf(sessionId: string, nodeId: string, snapshot: CanvasDocument): UndoHandle {
  return {
    undoId: `undo-${sessionId}-${nodeId}`,
    label: 'Restore canvas card binding',
    snapshot,
  }
}

function lockedCard(suite: Extract<DocumentSuiteDeclaration, { status: 'Locked' }>): CanvasMutationResult {
  switch (suite.id) {
    case 'xls':
    case 'ppt':
      return { status: 'Locked', suite: suite.id, reason: 'suite_locked' }
    default: {
      const unexpected: never = suite
      return unexpected
    }
  }
}

function lockedPreview(suite: Extract<DocumentSuiteDeclaration, { status: 'Locked' }>): OfficePreviewResult {
  switch (suite.id) {
    case 'xls':
    case 'ppt':
      return { status: 'Locked', suite: suite.id, reason: 'suite_locked' }
    default: {
      const unexpected: never = suite
      return unexpected
    }
  }
}

function previewUnsettled(outcome: TurnOutcome, nodeId: string): OfficePreviewResult {
  switch (outcome.status) {
    case 'completed':
      return { status: 'failed', invocationId: outcome.invocationId, nodeId, reason: 'unexpected_completed_select' }
    case 'admitted':
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: outcome.status, invocationId: outcome.invocationId, nodeId, reason: outcome.reason }
    default: {
      const unexpected: never = outcome.status
      return { status: 'failed', invocationId: outcome.invocationId, nodeId, reason: String(unexpected) }
    }
  }
}

function previewFailed(invocationId: string, nodeId: string, reason: string): OfficePreviewResult {
  return { status: 'failed', invocationId, nodeId, reason }
}

function abortError(): Error {
  const error = new Error('The operation was aborted')
  error.name = 'AbortError'
  return error
}

function unsettled(outcome: TurnOutcome, nodeId: string): CanvasMutationResult {
  switch (outcome.status) {
    case 'completed':
      return { status: 'completed', invocationId: outcome.invocationId, nodeId }
    case 'admitted':
    case 'approval_required':
    case 'denied':
    case 'failed':
    case 'interrupted':
    case 'reconciling':
      return { status: outcome.status, invocationId: outcome.invocationId, nodeId, reason: outcome.reason }
    default: {
      const unexpected: never = outcome.status
      return { status: 'failed', invocationId: outcome.invocationId, nodeId, reason: String(unexpected) }
    }
  }
}

function failed(invocationId: string, nodeId: string, reason: string): CanvasMutationResult {
  return { status: 'failed', invocationId, nodeId, reason }
}

export function openOfficeCardFromHuman(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.openOffice({ ...input, callerKind: 'human_ui' })
}

export function openOfficeCardFromAgent(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.openOffice({ ...input, callerKind: 'agent' })
}

export function focusOfficeCardFromHuman(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.focusOffice({ ...input, callerKind: 'human_ui' })
}

export function focusOfficeCardFromAgent(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.focusOffice({ ...input, callerKind: 'agent' })
}

export function closeOfficeCardFromHuman(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.closeOffice({ ...input, callerKind: 'human_ui' })
}

export function closeOfficeCardFromAgent(host: CanvasCardHost, input: OfficeCardCall): Promise<OfficePreviewResult> {
  return host.closeOffice({ ...input, callerKind: 'agent' })
}

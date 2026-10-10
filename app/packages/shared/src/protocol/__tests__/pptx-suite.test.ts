import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef } from '../actor'
import {
  applyDocumentFromAgent,
  applyDocumentFromHuman,
  createDocumentSuiteHost,
  type DocumentSuiteShared,
} from '../document-suite'
import { InternalActionId } from '../internal-action'
import { readPptxSlide } from '../pptx-package'
import { PPTX_MAX_SLIDES, PPTX_MAX_TEXT } from '../pptx-xml'
import { readZip, writeZip } from '../zip-store'

const human: ActorRef = { kind: 'human', id: 'user-1', displayName: 'Ada' }
const agent: ActorRef = { kind: 'agent', id: 'seat-1', displayName: 'Worker' }
const dirs: string[] = []

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('pptx document suite', () => {
  test('human create, agent text update, undo, save, and reopen share file.create and file.update', async () => {
    const filePath = join(tempDir(), 'talk.pptx')
    const shared = createDocumentSuiteHost()

    const created = await applyDocumentFromHuman(shared, call('create', filePath, 'create-1', human, {
      slides: [
        { title: 'Hello', body: 'Team' },
        { title: 'Keep', body: '' },
      ],
    }))
    expect(created).toMatchObject({
      status: 'completed',
      persisted: true,
      texts: ['Hello', 'Team'],
    })
    expect(decode(readZip(readFileSync(filePath)).get('ppt/slides/slide2.xml'))).toContain('>Keep<')

    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-1', agent, {
      paragraphIndex: 0,
      text: 'Ada & <team>',
    }))
    expect(updated).toMatchObject({
      status: 'completed',
      persisted: true,
      texts: ['Ada & <team>', 'Team'],
    })
    expect(readPptxSlide(readFileSync(filePath)).texts[0]).toBe('Ada & <team>')
    expect(decode(readZip(readFileSync(filePath)).get('ppt/slides/slide2.xml'))).toContain('>Keep<')

    const undone = await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-1'))
    expect(undone).toMatchObject({
      status: 'completed',
      persisted: true,
      texts: ['Hello', 'Team'],
    })

    const beforeSave = readFileSync(filePath)
    const saved = await applyDocumentFromAgent(shared, call('save', filePath, 'save-1', agent))
    expect(saved).toMatchObject({ status: 'completed', persisted: false, texts: ['Hello', 'Team'] })
    expect(readFileSync(filePath)).toEqual(beforeSave)

    const reopened = await applyDocumentFromHuman(shared, call('reopen', filePath, 'reopen-1'))
    expect(reopened).toMatchObject({
      status: 'completed',
      persisted: false,
      texts: ['Hello', 'Team'],
    })
    expect(await applyDocumentFromHuman(shared, call('undo', filePath, 'undo-empty'))).toMatchObject({
      status: 'failed',
      reason: 'nothing_to_undo',
    })
    expect(actionIds(shared)).toEqual([
      InternalActionId.FILE_CREATE,
      InternalActionId.FILE_UPDATE,
      InternalActionId.FILE_UPDATE,
    ])
    expect(shared.kernel.snapshot().turns.map((turn) => turn.request.invocation.callerKind)).toEqual([
      'human_ui',
      'agent',
      'human_ui',
    ])
  })

  test('a fixture deck keeps the second slide, notes, and animation timing', async () => {
    const filePath = join(tempDir(), 'talk.pptx')
    writeFileSync(filePath, fixtureDeck())
    const shared = createDocumentSuiteHost()
    const opened = await applyDocumentFromHuman(shared, call('open', filePath, 'open-fixture'))
    expect(opened).toMatchObject({
      status: 'completed',
      persisted: false,
      texts: ['Hello', 'Team & more'],
    })

    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-fixture', agent, {
      paragraphIndex: 1,
      text: 'Ada & <team>',
    }))
    expect(updated).toMatchObject({ texts: ['Hello', 'Ada & <team>'] })
    const parts = readZip(readFileSync(filePath))
    const slide1 = decode(parts.get('ppt/slides/slide1.xml'))
    expect(slide1).toContain('<a:pPr lvl="0"/>')
    expect(slide1).toContain('nodeType="tmRoot"')
    expect(slide1).toContain('Ada &amp; &lt;team&gt;')
    expect(decode(parts.get('ppt/slides/slide2.xml'))).toContain('>Keep<')
    expect(decode(parts.get('ppt/notesSlides/notesSlide1.xml'))).toContain('Speaker note')

    const swapped = loadFixture()
    const presentation = decode(swapped.get('ppt/presentation.xml'))
      .replace('r:id="rId1"', 'r:id="rId9"')
      .replace('r:id="rId2"', 'r:id="rId1"')
      .replace('r:id="rId9"', 'r:id="rId2"')
    swapped.set('ppt/presentation.xml', new TextEncoder().encode(presentation))
    const swappedPath = join(tempDir(), 'swapped.pptx')
    writeFileSync(swappedPath, writeZip(swapped))
    const swappedHost = createDocumentSuiteHost()
    const first = await applyDocumentFromHuman(swappedHost, call('open', swappedPath, 'open-swapped'))
    expect(first).toMatchObject({ texts: ['Keep'] })
  })

  test('a long text block round-trips and a field code does not change', async () => {
    const long = `Note ${'alpha '.repeat(80)}end`
    const filePath = join(tempDir(), 'long.pptx')
    const shared = createDocumentSuiteHost()
    await applyDocumentFromHuman(shared, call('create', filePath, 'create-long', human, {
      slides: [{ title: long, body: 'Body' }],
    }))
    const updated = await applyDocumentFromAgent(shared, call('update', filePath, 'update-long', agent, {
      paragraphIndex: 0,
      text: 'Short',
    }))
    expect(updated).toMatchObject({ texts: ['Short', 'Body'] })
    const undone = await applyDocumentFromAgent(shared, call('undo', filePath, 'undo-long', agent))
    expect(undone).toMatchObject({ texts: [long, 'Body'] })

    const fieldPath = join(tempDir(), 'field.pptx')
    const fieldParts = loadFixture()
    const slide1 = decode(fieldParts.get('ppt/slides/slide1.xml')).replace(
      '<a:t>Hello</a:t>',
      '<a:fld id="{00000000-0000-0000-0000-000000000000}" type="slidenum"><a:t>1</a:t></a:fld>',
    )
    fieldParts.set('ppt/slides/slide1.xml', new TextEncoder().encode(slide1))
    writeFileSync(fieldPath, writeZip(fieldParts))
    const before = readFileSync(fieldPath)
    const fieldHost = createDocumentSuiteHost()
    expect(await applyDocumentFromHuman(fieldHost, call('open', fieldPath, 'open-field'))).toMatchObject({
      status: 'failed',
      reason: 'unsupported_slide',
    })
    expect(readFileSync(fieldPath)).toEqual(before)
  })

  test('locked decks, traversal, credentials, and oversized packages do not write', async () => {
    const dir = tempDir()
    const shared = createDocumentSuiteHost()
    expect(await applyDocumentFromHuman(shared, call('create', join(dir, 'legacy.ppt'), 'legacy-1'))).toEqual({
      status: 'Locked',
      suite: 'ppt',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('open', join(dir, 'macro.pptm'), 'macro-name', agent))).toEqual({
      status: 'Locked',
      suite: 'ppt',
      reason: 'suite_locked',
    })
    expect(await applyDocumentFromAgent(shared, call('create', `${dir}/../escape.pptx`, 'escape-1', agent, {
      slides: [{ title: 'no', body: '' }],
    }))).toMatchObject({ status: 'failed', reason: 'unsafe_file_path' })

    const missing = join(dir, 'missing.pptx')
    expect(await applyDocumentFromHuman(shared, call('update', missing, 'missing-update', human, {
      paragraphIndex: 0,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'not_open' })
    expect(await applyDocumentFromHuman(shared, call('open', missing, 'missing-open'))).toMatchObject({
      status: 'failed',
      reason: 'file_missing',
    })

    const broken = join(dir, 'broken.pptx')
    writeFileSync(broken, 'not a package')
    expect(await applyDocumentFromAgent(shared, call('open', broken, 'broken-1', agent))).toMatchObject({
      status: 'failed',
      reason: 'invalid_pptx',
    })

    const filePath = join(dir, 'talk.pptx')
    await applyDocumentFromHuman(shared, call('create', filePath, 'create-guard', human, {
      slides: [{ title: 'Alpha', body: 'Beta' }],
    }))
    const before = readFileSync(filePath)
    expect(await applyDocumentFromAgent(shared, call('create', filePath, 'create-again', agent))).toMatchObject({
      status: 'failed',
      reason: 'file_exists',
    })
    expect(await applyDocumentFromAgent(shared, call('edit', filePath, 'edit-deck', agent, {
      paragraphIndex: 0,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'unsupported_suite_op' })
    expect(await applyDocumentFromHuman(shared, call('update', filePath, 'missing-text', human))).toMatchObject({
      status: 'failed',
      reason: 'missing_text',
    })
    expect(await applyDocumentFromHuman(shared, call('update', filePath, 'range-1', human, {
      paragraphIndex: 4,
      text: 'no',
    }))).toMatchObject({ status: 'failed', reason: 'paragraph_out_of_range' })
    expect(await applyDocumentFromAgent(shared, call('update', filePath, 'secret-text', agent, {
      paragraphIndex: 0,
      text: 'prefix sk-livesecret',
    }))).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(readFileSync(filePath)).toEqual(before)

    const secretDeck = join(dir, 'secret.pptx')
    expect(await applyDocumentFromAgent(shared, call('create', secretDeck, 'secret-create', agent, {
      slides: [{ title: 'sk-livesecret', body: '' }],
    }))).toMatchObject({ status: 'denied', reason: 'credential_material_rejected' })
    expect(existsSync(secretDeck)).toBe(false)

    const wide = join(dir, 'wide.pptx')
    expect(await applyDocumentFromHuman(shared, call('create', wide, 'wide-1', human, {
      slides: Array.from({ length: PPTX_MAX_SLIDES + 1 }, () => ({ title: 'x', body: '' })),
    }))).toMatchObject({ status: 'failed', reason: 'deck_too_large' })
    expect(existsSync(wide)).toBe(false)

    const huge = join(dir, 'huge.pptx')
    expect(await applyDocumentFromHuman(shared, call('create', huge, 'huge-1', human, {
      slides: [{ title: 'x'.repeat(PPTX_MAX_TEXT + 1), body: '' }],
    }))).toMatchObject({ status: 'failed', reason: 'deck_too_large' })
    expect(existsSync(huge)).toBe(false)

    const traversed = loadFixture()
    const rels = decode(traversed.get('ppt/_rels/presentation.xml.rels')).replace(
      'Target="slides/slide1.xml"',
      'Target="../secret.xml"',
    )
    traversed.set('ppt/_rels/presentation.xml.rels', new TextEncoder().encode(rels))
    const traversedPath = join(dir, 'traversed.pptx')
    writeFileSync(traversedPath, writeZip(traversed))
    const traversedBefore = readFileSync(traversedPath)
    expect(await applyDocumentFromHuman(shared, call('open', traversedPath, 'open-traverse'))).toMatchObject({
      status: 'failed',
      reason: 'invalid_pptx',
    })
    expect(readFileSync(traversedPath)).toEqual(traversedBefore)

    const packaged = loadFixture()
    packaged.set('ppt/vbaProject.bin', new Uint8Array([1, 2, 3]))
    const macroBook = join(dir, 'macros.pptx')
    writeFileSync(macroBook, writeZip(packaged))
    expect(await applyDocumentFromHuman(shared, call('open', macroBook, 'open-macro'))).toMatchObject({
      status: 'failed',
      reason: 'macro_deck',
    })

    const typed = loadFixture()
    const types = decode(typed.get('[Content_Types].xml')).replace(
      'presentationml.presentation.main+xml',
      'presentationml.presentation.macroEnabled.main+xml',
    )
    typed.set('[Content_Types].xml', new TextEncoder().encode(types))
    const typedPath = join(dir, 'typed.pptx')
    writeFileSync(typedPath, writeZip(typed))
    expect(await applyDocumentFromAgent(shared, call('open', typedPath, 'open-typed', agent))).toMatchObject({
      status: 'failed',
      reason: 'macro_deck',
    })
    expect(shared.kernel.snapshot().turns.filter((turn) => turn.phase === 'completed').map((turn) => turn.request.invocation.actionId)).toEqual([
      InternalActionId.FILE_CREATE,
    ])
  })
})

function fixtureDeck(): Uint8Array {
  return writeZip(loadFixture())
}

function loadFixture(): Map<string, Uint8Array> {
  const root = join(import.meta.dir, 'fixtures', 'pptx', 'talk')
  const parts = new Map<string, Uint8Array>()
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) walk(full, rel)
      else parts.set(rel, new Uint8Array(readFileSync(full)))
    }
  }
  walk(root, '')
  return parts
}

function decode(bytes: Uint8Array | undefined): string {
  return new TextDecoder().decode(bytes)
}

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'fleet-pptx-'))
  dirs.push(dir)
  return dir
}

function call(
  op: 'open' | 'create' | 'edit' | 'update' | 'undo' | 'save' | 'reopen',
  filePath: string,
  invocationId: string,
  actor: ActorRef = human,
  extra: {
    paragraphIndex?: number
    text?: string
    slides?: { title: string; body: string }[]
  } = {},
) {
  return {
    op,
    filePath,
    sessionId: 'session-1',
    invocationId,
    actor,
    ...extra,
  }
}

function actionIds(shared: DocumentSuiteShared): string[] {
  return shared.kernel.snapshot().turns.map((turn) => turn.request.invocation.actionId)
}

/**
 * First-slide text inside a PresentationML package.
 *
 * Craft's pptx tool creates a deck from title and body text and extracts
 * that text. This is that surface for the first slide, without python-pptx
 * and without a slide editor. A field code, a macro part, a path that leaves
 * the package, and a deck past 20 slides, 40 first-slide text blocks, or
 * 4000 characters in one block fail closed. Other slides, notes, and
 * animation timing stay in the package and are not edited.
 */

export const PPTX_MAX_SLIDES = 20
export const PPTX_MAX_PARAGRAPHS = 40
export const PPTX_MAX_TEXT = 4000
export const PPTX_MAX_PARTS = 200
export const PPTX_MAX_SLIDE_XML = 256 * 1024

export interface DeckSlideDraft {
  title: string
  body: string
}

export interface SlideProjection {
  texts: string[]
}

export type PptxFailure =
  | 'invalid_pptx'
  | 'unsupported_slide'
  | 'paragraph_out_of_range'
  | 'invalid_value'
  | 'deck_too_large'
  | 'macro_deck'

export class PptxXmlError extends Error {
  readonly reason: PptxFailure

  constructor(reason: PptxFailure) {
    super(reason)
    this.name = 'PptxXmlError'
    this.reason = reason
  }
}

interface XmlSpan {
  start: number
  end: number
  open: string
  inner: string
  selfClosing: boolean
}

const SLIDE_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide'

export function buildDeckFiles(input: { slides?: readonly DeckSlideDraft[] } = {}): Map<string, Uint8Array> {
  const slides = normalizeSlides(input.slides)
  const parts = new Map<string, Uint8Array>([
    ['[Content_Types].xml', text(contentTypes(slides.length))],
    ['_rels/.rels', text(PACKAGE_RELS)],
    ['ppt/presentation.xml', text(presentationXml(slides.length))],
    ['ppt/_rels/presentation.xml.rels', text(presentationRels(slides.length))],
    ['ppt/presProps.xml', text(PRES_PROPS)],
    ['ppt/viewProps.xml', text(VIEW_PROPS)],
    ['ppt/tableStyles.xml', text(TABLE_STYLES)],
    ['ppt/theme/theme1.xml', text(THEME)],
    ['ppt/slideMasters/slideMaster1.xml', text(SLIDE_MASTER)],
    ['ppt/slideMasters/_rels/slideMaster1.xml.rels', text(MASTER_RELS)],
    ['ppt/slideLayouts/slideLayout1.xml', text(SLIDE_LAYOUT)],
    ['ppt/slideLayouts/_rels/slideLayout1.xml.rels', text(LAYOUT_RELS)],
  ])
  slides.forEach((slide, index) => {
    const name = `ppt/slides/slide${index + 1}.xml`
    parts.set(name, text(slideXml(slide)))
    parts.set(`ppt/slides/_rels/slide${index + 1}.xml.rels`, text(SLIDE_RELS))
  })
  return parts
}

export function projectFirstSlide(files: ReadonlyMap<string, Uint8Array>): SlideProjection {
  assertPackage(files)
  const part = firstSlidePart(files)
  return { texts: textsOf(xmlPart(files, part)) }
}

export function updateFirstSlideText(
  files: ReadonlyMap<string, Uint8Array>,
  index: number,
  value: string,
): Map<string, Uint8Array> {
  assertPackage(files)
  assertText(value)
  const part = firstSlidePart(files)
  const xml = xmlPart(files, part)
  const nextXml = replaceSlideParagraph(xml, index, value)
  textsOf(nextXml)
  const next = new Map(files)
  next.set(part, text(nextXml))
  return next
}

function normalizeSlides(slides: readonly DeckSlideDraft[] | undefined): DeckSlideDraft[] {
  const source = !slides || slides.length === 0 ? [{ title: '', body: '' }] : slides
  if (source.length > PPTX_MAX_SLIDES) throw new PptxXmlError('deck_too_large')
  return source.map((slide) => {
    if (!slide || typeof slide.title !== 'string' || typeof slide.body !== 'string') {
      throw new PptxXmlError('invalid_value')
    }
    if (slide.title.includes('\n') || slide.title.includes('\r')) throw new PptxXmlError('invalid_value')
    assertText(slide.title)
    const lines = slide.body === '' ? [''] : slide.body.split('\n')
    if (lines.length + 1 > PPTX_MAX_PARAGRAPHS) throw new PptxXmlError('deck_too_large')
    for (const line of lines) assertText(line)
    return { title: slide.title, body: slide.body }
  })
}

function firstSlidePart(files: ReadonlyMap<string, Uint8Array>): string {
  const presentation = xmlPart(files, 'ppt/presentation.xml')
  const rels = xmlPart(files, 'ppt/_rels/presentation.xml.rels')
  const lists = findElements(presentation, 'p:sldIdLst')
  if (lists.length !== 1) throw new PptxXmlError('invalid_pptx')
  const list = lists[0]
  if (!list || list.selfClosing) throw new PptxXmlError('invalid_pptx')
  const ids = findElements(list.inner, 'p:sldId')
  if (ids.length === 0) throw new PptxXmlError('invalid_pptx')
  if (ids.length > PPTX_MAX_SLIDES) throw new PptxXmlError('deck_too_large')
  const first = ids[0]
  if (!first) throw new PptxXmlError('invalid_pptx')
  const relId = attr(first.open, 'r:id')
  if (!relId) throw new PptxXmlError('invalid_pptx')
  const relationships = findElements(rels, 'Relationship')
  const match = relationships.find((item) => attr(item.open, 'Id') === relId)
  if (!match) throw new PptxXmlError('invalid_pptx')
  if (attr(match.open, 'TargetMode') === 'External') throw new PptxXmlError('invalid_pptx')
  const type = attr(match.open, 'Type') ?? ''
  if (type !== SLIDE_REL) throw new PptxXmlError('invalid_pptx')
  const target = attr(match.open, 'Target')
  if (!target) throw new PptxXmlError('invalid_pptx')
  const part = resolveSlidePart(target)
  if (!files.has(part)) throw new PptxXmlError('invalid_pptx')
  return part
}

function resolveSlidePart(target: string): string {
  if (
    target.includes('..')
    || target.includes('\\')
    || target.includes('//')
    || target.startsWith('/')
    || target.includes(':')
  ) {
    throw new PptxXmlError('invalid_pptx')
  }
  const cleaned = target.replace(/^\.\//, '')
  if (!/^slides\/[^/]+\.xml$/.test(cleaned)) throw new PptxXmlError('invalid_pptx')
  return `ppt/${cleaned}`
}

function textsOf(xml: string): string[] {
  assertSlideXml(xml)
  const paragraphs = slideParagraphs(xml)
  if (paragraphs.length > PPTX_MAX_PARAGRAPHS) throw new PptxXmlError('deck_too_large')
  return paragraphs.map((span) => paragraphText(span))
}

function replaceSlideParagraph(xml: string, index: number, value: string): string {
  assertSlideXml(xml)
  const paragraphs = slideParagraphs(xml)
  const target = paragraphs[index]
  if (!target) throw new PptxXmlError('paragraph_out_of_range')
  if (target.inner.includes('<a:fld')) throw new PptxXmlError('unsupported_slide')
  const properties = paragraphProperties(target.inner)
  return `${xml.slice(0, target.start)}${openTagOf(target)}${properties}${runXml(value)}</a:p>${xml.slice(target.end)}`
}

function slideParagraphs(xml: string): XmlSpan[] {
  const found: XmlSpan[] = []
  for (const body of findElements(xml, 'p:txBody')) {
    if (body.selfClosing) continue
    const base = body.start + body.open.length
    found.push(...findElements(body.inner, 'a:p', base))
  }
  return found
}

function paragraphText(span: XmlSpan): string {
  if (span.inner.includes('<a:fld')) throw new PptxXmlError('unsupported_slide')
  const value = findElements(span.inner, 'a:t').map((item) => decodeXml(item.inner)).join('')
  if (value.length > PPTX_MAX_TEXT) throw new PptxXmlError('deck_too_large')
  return value
}

function assertSlideXml(xml: string): void {
  if (xml.includes('<!--') || xml.includes('<![CDATA[')) throw new PptxXmlError('unsupported_slide')
  if (xml.length > PPTX_MAX_SLIDE_XML) throw new PptxXmlError('deck_too_large')
}

function assertPackage(files: ReadonlyMap<string, Uint8Array>): void {
  if (files.size > PPTX_MAX_PARTS) throw new PptxXmlError('deck_too_large')
  if (files.has('EncryptionInfo') || files.has('EncryptedPackage')) throw new PptxXmlError('invalid_pptx')
  for (const name of files.keys()) {
    if (name.includes('..') || name.startsWith('/') || name.includes('\\')) throw new PptxXmlError('invalid_pptx')
    const lower = name.toLowerCase()
    if (lower.endsWith('vbaproject.bin') || lower.endsWith('.pptm')) throw new PptxXmlError('macro_deck')
  }
  const types = files.get('[Content_Types].xml')
  if (!types) return
  const xml = new TextDecoder().decode(types).toLowerCase()
  if (xml.includes('vbaproject') || xml.includes('macroenabled')) throw new PptxXmlError('macro_deck')
}

function assertText(value: string): void {
  if (value.length > PPTX_MAX_TEXT) throw new PptxXmlError('deck_too_large')
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new PptxXmlError('invalid_value')
}

function findElements(scope: string, tag: string, base = 0): XmlSpan[] {
  const needle = `<${tag}`
  const found: XmlSpan[] = []
  let cursor = 0
  while (cursor < scope.length) {
    const start = scope.indexOf(needle, cursor)
    if (start < 0) break
    const boundary = scope[start + needle.length]
    if (boundary !== '>' && boundary !== ' ' && boundary !== '/' && boundary !== '\t' && boundary !== '\n' && boundary !== '\r') {
      cursor = start + needle.length
      continue
    }
    const tagEnd = scope.indexOf('>', start)
    if (tagEnd < 0) throw new PptxXmlError('invalid_pptx')
    const open = scope.slice(start, tagEnd + 1)
    if (/\/\s*>$/.test(open)) {
      found.push({ start: base + start, end: base + tagEnd + 1, open, inner: '', selfClosing: true })
      cursor = tagEnd + 1
      continue
    }
    const close = `</${tag}>`
    const closeAt = scope.indexOf(close, tagEnd)
    if (closeAt < 0) throw new PptxXmlError('invalid_pptx')
    const end = closeAt + close.length
    found.push({
      start: base + start,
      end: base + end,
      open,
      inner: scope.slice(tagEnd + 1, closeAt),
      selfClosing: false,
    })
    cursor = end
  }
  return found
}

function attr(open: string, name: string): string | null {
  const pattern = new RegExp(`\\s${name}="([^"]*)"`)
  const match = pattern.exec(` ${open}`)
  return match?.[1] === undefined ? null : decodeXml(match[1])
}

function paragraphProperties(inner: string): string {
  return inner.match(/<a:pPr\b[\s\S]*?<\/a:pPr>/)?.[0]
    ?? inner.match(/<a:pPr\b[^>]*\/>/)?.[0]
    ?? ''
}

function openTagOf(span: XmlSpan): string {
  if (!span.selfClosing) return span.open
  const tagEnd = span.open.endsWith('/>') ? span.open.length - 2 : span.open.length - 1
  const attrs = span.open.slice('<a:p'.length, tagEnd).trim()
  return attrs ? `<a:p ${attrs}>` : '<a:p>'
}

function runXml(value: string): string {
  if (value === '') return '<a:endParaRPr/>'
  const preserve = value.startsWith(' ') || value.endsWith(' ') || value.includes('\n') ? ' xml:space="preserve"' : ''
  return `<a:r><a:t${preserve}>${encodeXml(value)}</a:t></a:r>`
}

function slideXml(slide: DeckSlideDraft): string {
  const lines = slide.body === '' ? [''] : slide.body.split('\n')
  const title = shapeXml(2, 'Title', [slide.title], 457200, 274638, 8229600, 1143000)
  const body = shapeXml(3, 'Body', lines, 457200, 1600200, 8229600, 3200400)
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">',
    '<p:cSld><p:spTree>',
    GROUP_SHAPE,
    title,
    body,
    '</p:spTree></p:cSld>',
    '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>',
    '</p:sld>',
  ].join('')
}

function shapeXml(id: number, name: string, paragraphs: readonly string[], x: number, y: number, cx: number, cy: number): string {
  const body = paragraphs.map((value) => `<a:p>${runXml(value)}</a:p>`).join('')
  return [
    '<p:sp>',
    `<p:nvSpPr><p:cNvPr id="${id}" name="${encodeAttr(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>`,
    `<p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>`,
    `<p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${body}</p:txBody>`,
    '</p:sp>',
  ].join('')
}

function contentTypes(slideCount: number): string {
  const slides = Array.from({ length: slideCount }, (_item, index) => {
    const name = `/ppt/slides/slide${index + 1}.xml`
    return `<Override PartName="${name}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/>
  <Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/>
  <Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/>
  ${slides}
</Types>`
}

function presentationXml(slideCount: number): string {
  const ids = Array.from({ length: slideCount }, (_item, index) => {
    return `<p:sldId id="${256 + index}" r:id="rId${5 + index}"/>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${ids}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
}

function presentationRels(slideCount: number): string {
  const slides = Array.from({ length: slideCount }, (_item, index) => {
    return `<Relationship Id="rId${5 + index}" Type="${SLIDE_REL}" Target="slides/slide${index + 1}.xml"/>`
  }).join('')
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps" Target="presProps.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps" Target="viewProps.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles" Target="tableStyles.xml"/>
  ${slides}
</Relationships>`
}

function encodeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function encodeAttr(value: string): string {
  return encodeXml(value).replace(/"/g, '&quot;')
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
}

function xmlPart(files: ReadonlyMap<string, Uint8Array>, name: string): string {
  const part = files.get(name)
  if (!part) throw new PptxXmlError('invalid_pptx')
  return new TextDecoder().decode(part)
}

function text(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

const GROUP_SHAPE = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`

const PACKAGE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`

const SLIDE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`

const MASTER_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`

const LAYOUT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`

const PRES_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentationPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`

const VIEW_PROPS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:viewPr xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"/>`

const TABLE_STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:tblStyleLst xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`

const SLIDE_MASTER = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>${GROUP_SHAPE}</p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`

const SLIDE_LAYOUT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title">
  <p:cSld name="Title"><p:spTree>${GROUP_SHAPE}</p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`

const THEME = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F4E79"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="5B9BD5"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
      <a:accent3><a:srgbClr val="A5A5A5"/></a:accent3>
      <a:accent4><a:srgbClr val="FFC000"/></a:accent4>
      <a:accent5><a:srgbClr val="4472C4"/></a:accent5>
      <a:accent6><a:srgbClr val="70AD47"/></a:accent6>
      <a:hlink><a:srgbClr val="0563C1"/></a:hlink>
      <a:folHlink><a:srgbClr val="954F72"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`

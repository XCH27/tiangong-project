/**
 * Paragraph text inside a WordprocessingML document.xml.
 *
 * Craft's docx-tool edits paragraph text. This is that same surface, without
 * python-docx and without a second layout engine. GenOffice and LobeHub are
 * not copyable sources here. LobeHub's license forbids copying its layout.
 */

export class DocxXmlError extends Error {
  readonly reason: 'paragraph_out_of_range'

  constructor(reason: 'paragraph_out_of_range') {
    super(reason)
    this.name = 'DocxXmlError'
    this.reason = reason
  }
}

interface ParagraphSpan {
  start: number
  end: number
  block: string
}

export function documentXmlFromParagraphs(paragraphs: readonly string[]): string {
  const body = paragraphs.map((text) => paragraphXml(text)).join('')
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">',
    `<w:body>${body}<w:sectPr/></w:body>`,
    '</w:document>',
  ].join('')
}

export function documentXmlParagraphs(xml: string): string[] {
  return findParagraphs(xml).map((span) => paragraphText(span.block))
}

export function replaceDocumentXmlParagraph(xml: string, index: number, text: string): string {
  const spans = findParagraphs(xml)
  const target = spans[index]
  if (!target) throw new DocxXmlError('paragraph_out_of_range')
  return xml.slice(0, target.start) + paragraphXml(text, openTagOf(target.block), paragraphProperties(target.block)) + xml.slice(target.end)
}

function findParagraphs(xml: string): ParagraphSpan[] {
  const found: ParagraphSpan[] = []
  let cursor = 0
  while (cursor < xml.length) {
    const start = xml.indexOf('<w:p', cursor)
    if (start < 0) break
    const boundary = xml[start + 4]
    if (boundary !== '>' && boundary !== ' ' && boundary !== '/' && boundary !== '\t' && boundary !== '\n' && boundary !== '\r') {
      cursor = start + 4
      continue
    }
    const tagEnd = xml.indexOf('>', start)
    if (tagEnd < 0) break
    if (xml[tagEnd - 1] === '/') {
      const end = tagEnd + 1
      found.push({ start, end, block: xml.slice(start, end) })
      cursor = end
      continue
    }
    const close = xml.indexOf('</w:p>', tagEnd)
    if (close < 0) break
    const end = close + '</w:p>'.length
    found.push({ start, end, block: xml.slice(start, end) })
    cursor = end
  }
  return found
}

function paragraphText(block: string): string {
  const parts: string[] = []
  const pattern = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g
  for (const match of block.matchAll(pattern)) {
    parts.push(decodeXml(match[1] ?? ''))
  }
  return parts.join('')
}

function paragraphProperties(block: string): string {
  return block.match(/<w:pPr\b[\s\S]*?<\/w:pPr>/)?.[0] ?? ''
}

function openTagOf(block: string): string {
  const tagEnd = block.indexOf('>')
  const head = block.slice(0, tagEnd + 1)
  if (!head.endsWith('/>')) return head
  const attrs = head.slice('<w:p'.length, -2).trim()
  return attrs ? `<w:p ${attrs}>` : '<w:p>'
}

function paragraphXml(text: string, openTag = '<w:p>', properties = ''): string {
  const preserve = text.startsWith(' ') || text.endsWith(' ') ? ' xml:space="preserve"' : ''
  return `${openTag}${properties}<w:r><w:t${preserve}>${encodeXml(text)}</w:t></w:r></w:p>`
}

function encodeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, digits: string) => String.fromCodePoint(Number(digits)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
}

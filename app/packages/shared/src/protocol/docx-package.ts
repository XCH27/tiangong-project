/**
 * One DOCX package: content types, relationships, and word/document.xml.
 * Paragraph edits keep the other parts. XLSX and PPTX are not packages here.
 */

import { DocxXmlError, documentXmlFromParagraphs, documentXmlParagraphs, replaceDocumentXmlParagraph } from './docx-xml'
import { readZip, writeZip, ZipStoreError } from './zip-store'

const DOCUMENT_PART = 'word/document.xml'

export class DocxPackageError extends Error {
  readonly reason: 'invalid_docx' | 'paragraph_out_of_range'

  constructor(reason: 'invalid_docx' | 'paragraph_out_of_range') {
    super(reason)
    this.name = 'DocxPackageError'
    this.reason = reason
  }
}

export function buildDocx(paragraphs: readonly string[]): Uint8Array {
  const parts = new Map<string, Uint8Array>([
    ['[Content_Types].xml', text(CONTENT_TYPES)],
    ['_rels/.rels', text(PACKAGE_RELS)],
    ['word/_rels/document.xml.rels', text(DOCUMENT_RELS)],
    [DOCUMENT_PART, text(documentXmlFromParagraphs(paragraphs))],
  ])
  return writeZip(parts)
}

export function readDocxParagraphs(bytes: Uint8Array): string[] {
  try {
    return documentXmlParagraphs(documentXml(bytes))
  } catch (error) {
    if (error instanceof DocxXmlError) throw new DocxPackageError('invalid_docx')
    throw error
  }
}

export function replaceDocxParagraph(bytes: Uint8Array, index: number, textValue: string): Uint8Array {
  const parts = packageParts(bytes)
  const xml = documentXml(bytes, parts)
  let nextXml: string
  try {
    nextXml = replaceDocumentXmlParagraph(xml, index, textValue)
  } catch (error) {
    if (error instanceof DocxXmlError) throw new DocxPackageError(error.reason)
    throw error
  }
  parts.set(DOCUMENT_PART, text(nextXml))
  return writeZip(parts)
}

function documentXml(bytes: Uint8Array, parts = packageParts(bytes)): string {
  const xml = parts.get(DOCUMENT_PART)
  if (!xml) throw new DocxPackageError('invalid_docx')
  return new TextDecoder().decode(xml)
}

function packageParts(bytes: Uint8Array): Map<string, Uint8Array> {
  try {
    return readZip(bytes)
  } catch (error) {
    if (error instanceof ZipStoreError) throw new DocxPackageError('invalid_docx')
    throw error
  }
}

function text(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

const PACKAGE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

const DOCUMENT_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`

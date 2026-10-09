/**
 * DOCX bytes to the paragraph list the preview overlay renders.
 * fflate reads the package in the renderer. The paragraph text comes from the
 * same document.xml operation the host uses before file.update.
 */

import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { documentXmlParagraphs, replaceDocumentXmlParagraph } from '@craft-agent/shared/protocol/docx-xml'

const DOCUMENT_PART = 'word/document.xml'

export function paragraphsFromDocxBytes(bytes: Uint8Array): string[] {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('invalid_docx')
  }
  const xml = files[DOCUMENT_PART]
  if (!xml) throw new Error('invalid_docx')
  return documentXmlParagraphs(strFromU8(xml))
}

export function replaceDocxParagraphBytes(bytes: Uint8Array, index: number, text: string): Uint8Array {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('invalid_docx')
  }
  const xml = files[DOCUMENT_PART]
  if (!xml) throw new Error('invalid_docx')
  files[DOCUMENT_PART] = strToU8(replaceDocumentXmlParagraph(strFromU8(xml), index, text))
  return zipSync(files)
}

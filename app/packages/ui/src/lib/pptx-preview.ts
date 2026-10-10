/**
 * PPTX bytes to the first-slide text the preview overlay renders.
 * fflate reads the package in the renderer. The text comes from the same
 * slide operation the host uses before file.create or file.update.
 */

import { unzipSync, zipSync } from 'fflate'
import { projectFirstSlide, updateFirstSlideText } from '@craft-agent/shared/protocol/pptx-xml'

export function textsFromPptxBytes(bytes: Uint8Array): string[] {
  try {
    return projectFirstSlide(unzipToMap(bytes)).texts
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'invalid_pptx')
  }
}

export function replacePptxTextBytes(bytes: Uint8Array, index: number, text: string): Uint8Array {
  let files: Map<string, Uint8Array>
  try {
    files = unzipToMap(bytes)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'invalid_pptx')
  }
  const next = updateFirstSlideText(files, index, text)
  const record: Record<string, Uint8Array> = {}
  for (const [name, data] of next) record[name] = data
  return zipSync(record)
}

function unzipToMap(bytes: Uint8Array): Map<string, Uint8Array> {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes)
  } catch {
    throw new Error('invalid_pptx')
  }
  return new Map(Object.entries(files))
}

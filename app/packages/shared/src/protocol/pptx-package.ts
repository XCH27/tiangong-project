/**
 * One PPTX package around the first slide's text.
 * Text edits keep the other parts. Legacy .ppt and macro-enabled .pptm are
 * not packages here.
 */

import { readZip, writeZip, ZipStoreError } from './zip-store'
import {
  buildDeckFiles,
  projectFirstSlide,
  updateFirstSlideText,
  PptxXmlError,
  type DeckSlideDraft,
  type PptxFailure,
  type SlideProjection,
} from './pptx-xml'

export class PptxPackageError extends Error {
  readonly reason: PptxFailure

  constructor(reason: PptxFailure) {
    super(reason)
    this.name = 'PptxPackageError'
    this.reason = reason
  }
}

export function buildPptx(input: { slides?: readonly DeckSlideDraft[] } = {}): Uint8Array {
  try {
    return writeZip(buildDeckFiles(input))
  } catch (error) {
    throw packageError(error)
  }
}

export function readPptxSlide(bytes: Uint8Array): SlideProjection {
  try {
    return projectFirstSlide(readPackage(bytes))
  } catch (error) {
    throw packageError(error)
  }
}

export function replacePptxText(bytes: Uint8Array, index: number, value: string): Uint8Array {
  try {
    return writeZip(updateFirstSlideText(readPackage(bytes), index, value))
  } catch (error) {
    throw packageError(error)
  }
}

function readPackage(bytes: Uint8Array): Map<string, Uint8Array> {
  try {
    return readZip(bytes)
  } catch (error) {
    if (error instanceof ZipStoreError) throw new PptxPackageError('invalid_pptx')
    throw error
  }
}

function packageError(error: unknown): Error {
  if (error instanceof PptxPackageError) return error
  if (error instanceof PptxXmlError) return new PptxPackageError(error.reason)
  if (error instanceof ZipStoreError) return new PptxPackageError('invalid_pptx')
  if (error instanceof Error) return error
  return new PptxPackageError('invalid_pptx')
}

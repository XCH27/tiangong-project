import { describe, expect, it } from 'bun:test'
import type { FileAttachment } from '@craft-agent/shared/protocol'
import type { StoredAttachment } from '@craft-agent/core/types'
import {
  evaluateCliRuntimeAttachmentPolicy,
  getCliRuntimeAttachmentRejectionMessageFromPolicy,
} from './cli-runtime-attachment-policy'

describe('cli runtime attachment policy', () => {
  it('accepts validated text attachments', () => {
    const live: FileAttachment[] = [{
      type: 'text',
      path: '/tmp/notes.md',
      name: 'notes.md',
      mimeType: 'text/markdown',
      text: '# Notes\nhello',
      size: 14,
    }]

    const decision = evaluateCliRuntimeAttachmentPolicy(live, undefined)
    expect(decision.allowed).toBe(true)
    if (decision.allowed) {
      expect(decision.attachments).toHaveLength(1)
      expect(decision.attachments[0]?.text).toContain('hello')
    }
  })

  it('rejects binary image attachments', () => {
    const live: FileAttachment[] = [{
      type: 'image',
      path: '/tmp/a.png',
      name: 'a.png',
      mimeType: 'image/png',
      base64: 'abc',
      size: 3,
    }]

    const decision = evaluateCliRuntimeAttachmentPolicy(live, undefined)
    expect(decision.allowed).toBe(false)
    if (!decision.allowed) {
      expect(decision.violations.some((v) => v.code === 'binary_type')).toBe(true)
      expect(decision.violations.some((v) => v.code === 'binary_payload')).toBe(true)
    }
  })

  it('rejects unsupported mime and oversize text', () => {
    const live: FileAttachment[] = [{
      type: 'text',
      path: '/tmp/a.bin',
      name: 'a.bin',
      mimeType: 'application/octet-stream',
      text: 'hello',
      size: 5,
    }]

    const oversize: FileAttachment[] = [{
      type: 'text',
      path: '/tmp/big.txt',
      name: 'big.txt',
      mimeType: 'text/plain',
      text: 'x'.repeat(300_000),
      size: 300_000,
    }]

    expect(evaluateCliRuntimeAttachmentPolicy(live, undefined).allowed).toBe(false)
    expect(evaluateCliRuntimeAttachmentPolicy(oversize, undefined, { maxBytes: 1024 }).allowed).toBe(false)
  })

  it('accepts stored text attachments via readStoredText loader', () => {
    const stored = [{
      id: '1',
      type: 'text',
      name: 'snippet.txt',
      mimeType: 'text/plain',
      size: 5,
      storedPath: '/tmp/snippet.txt',
    }] as StoredAttachment[]

    const decision = evaluateCliRuntimeAttachmentPolicy(undefined, stored, {
      readStoredText: () => 'hello',
    })
    expect(decision.allowed).toBe(true)
  })

  it('rejects stored non-text attachments', () => {
    const stored = [{
      id: '1',
      type: 'pdf',
      name: 'doc.pdf',
      mimeType: 'application/pdf',
      size: 100,
      storedPath: '/tmp/doc.pdf',
    }] as StoredAttachment[]

    expect(evaluateCliRuntimeAttachmentPolicy(undefined, stored).allowed).toBe(false)
  })

  it('returns actionable rejection message', () => {
    const live = [{ type: 'pdf', path: '/tmp/a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 1 }] as FileAttachment[]
    const message = getCliRuntimeAttachmentRejectionMessageFromPolicy(live, undefined)
    expect(message).toContain('CLI Runtime')
  })
})

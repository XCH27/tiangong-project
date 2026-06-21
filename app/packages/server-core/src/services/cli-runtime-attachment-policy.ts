/**
 * CLI Runtime text attachment policy — size/MIME validation; binary attachments rejected.
 */

import type { FileAttachment } from '@craft-agent/shared/protocol'
import type { StoredAttachment } from '@craft-agent/core/types'

export type CliRuntimeAttachmentDecision =
  | { allowed: true; attachments: CliRuntimeSanitizedTextAttachment[] }
  | { allowed: false; message: string; violations: CliRuntimeAttachmentViolation[] }

export interface CliRuntimeSanitizedTextAttachment {
  name: string
  mimeType: string
  size: number
  text: string
  source: 'live' | 'stored'
}

export interface CliRuntimeAttachmentViolation {
  name: string
  code:
    | 'binary_type'
    | 'unsupported_mime'
    | 'too_large'
    | 'empty'
    | 'missing_text'
    | 'binary_payload'
  message: string
}

export interface CliRuntimeAttachmentPolicyOptions {
  maxBytes?: number
  allowedMimeTypes?: string[]
  /** Optional loader for stored text attachments (storedPath on disk). */
  readStoredText?: (attachment: StoredAttachment) => string | null
}

const DEFAULT_MAX_BYTES = 256 * 1024

const TEXT_MIME_PREFIXES = ['text/']
const TEXT_MIME_EXACT = new Set([
  'application/json',
  'application/javascript',
  'application/typescript',
  'application/x-yaml',
  'application/yaml',
  'application/xml',
  'application/markdown',
  'application/x-sh',
])

const BINARY_ATTACHMENT_TYPES = new Set<FileAttachment['type']>([
  'image',
  'pdf',
  'office',
  'audio',
  'unknown',
])

function isAllowedMime(mimeType: string, allowedMimeTypes?: string[]): boolean {
  const normalized = mimeType.trim().toLowerCase()
  if (!normalized) return false
  if (allowedMimeTypes?.length) {
    return allowedMimeTypes.some((item) => normalized === item.toLowerCase())
  }
  if (TEXT_MIME_EXACT.has(normalized)) return true
  return TEXT_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}

function looksLikeBinaryPayload(attachment: FileAttachment | StoredAttachment): boolean {
  const live = attachment as FileAttachment
  if (live.base64 && !live.text) return true
  if (live.thumbnailBase64) return true
  return false
}

function normalizeLiveAttachment(attachment: FileAttachment): CliRuntimeSanitizedTextAttachment | CliRuntimeAttachmentViolation[] {
  const violations: CliRuntimeAttachmentViolation[] = []
  const name = attachment.name?.trim() || attachment.path || 'attachment'

  if (BINARY_ATTACHMENT_TYPES.has(attachment.type) && attachment.type !== 'text') {
    violations.push({
      name,
      code: 'binary_type',
      message: `CLI Runtime 不接受 ${attachment.type} 类型附件。`,
    })
  }

  if (looksLikeBinaryPayload(attachment)) {
    violations.push({
      name,
      code: 'binary_payload',
      message: 'CLI Runtime 不接受 base64/二进制载荷；仅允许纯文本内容。',
    })
  }

  if (!isAllowedMime(attachment.mimeType)) {
    violations.push({
      name,
      code: 'unsupported_mime',
      message: `MIME ${attachment.mimeType || 'unknown'} 不在 CLI Runtime 文本白名单内。`,
    })
  }

  const text = attachment.text?.trim() ?? ''
  if (!text) {
    violations.push({
      name,
      code: 'missing_text',
      message: '文本附件缺少可发送的 text 字段。',
    })
  }

  if (violations.length > 0) return violations

  return {
    name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    text,
    source: 'live',
  }
}

function normalizeStoredAttachment(
  attachment: StoredAttachment,
  readStoredText?: (attachment: StoredAttachment) => string | null,
): CliRuntimeSanitizedTextAttachment | CliRuntimeAttachmentViolation[] {
  const violations: CliRuntimeAttachmentViolation[] = []
  const name = attachment.name?.trim() || 'stored-attachment'
  const mimeType = attachment.mimeType?.trim().toLowerCase() || 'text/plain'

  if (attachment.type !== 'text') {
    violations.push({
      name,
      code: 'binary_type',
      message: `CLI Runtime 不接受 stored ${attachment.type} 附件。`,
    })
  }

  if (attachment.thumbnailBase64 || attachment.resizedBase64 || attachment.markdownPath) {
    violations.push({
      name,
      code: 'binary_payload',
      message: 'CLI Runtime 不接受缩略图/转换文档等二进制或间接载荷。',
    })
  }

  if (!isAllowedMime(mimeType)) {
    violations.push({
      name,
      code: 'unsupported_mime',
      message: `MIME ${mimeType} 不在 CLI Runtime 文本白名单内。`,
    })
  }

  const text = readStoredText?.(attachment)?.trim() ?? ''
  if (!text) {
    violations.push({
      name,
      code: 'missing_text',
      message: '存储文本附件缺少可读 text 内容（需通过 readStoredText 提供）。',
    })
  }

  if (violations.length > 0) return violations

  return {
    name,
    mimeType,
    size: Buffer.byteLength(text, 'utf-8'),
    text,
    source: 'stored',
  }
}

export function evaluateCliRuntimeAttachmentPolicy(
  liveAttachments: FileAttachment[] | undefined,
  storedAttachments: StoredAttachment[] | undefined,
  options: CliRuntimeAttachmentPolicyOptions = {},
): CliRuntimeAttachmentDecision {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES
  const allowed: CliRuntimeSanitizedTextAttachment[] = []
  const violations: CliRuntimeAttachmentViolation[] = []

  for (const attachment of liveAttachments ?? []) {
    const normalized = normalizeLiveAttachment(attachment)
    if (Array.isArray(normalized)) {
      violations.push(...normalized)
      continue
    }
    if (normalized.size <= 0 || !normalized.text) {
      violations.push({
        name: normalized.name,
        code: 'empty',
        message: '文本附件为空。',
      })
      continue
    }
    if (normalized.size > maxBytes) {
      violations.push({
        name: normalized.name,
        code: 'too_large',
        message: `文本附件超过 ${maxBytes} 字节上限。`,
      })
      continue
    }
    allowed.push(normalized)
  }

  for (const attachment of storedAttachments ?? []) {
    const normalized = normalizeStoredAttachment(attachment, options.readStoredText)
    if (Array.isArray(normalized)) {
      violations.push(...normalized)
      continue
    }
    if (normalized.size <= 0 || !normalized.text) {
      violations.push({
        name: normalized.name,
        code: 'empty',
        message: '文本附件为空。',
      })
      continue
    }
    if (normalized.size > maxBytes) {
      violations.push({
        name: normalized.name,
        code: 'too_large',
        message: `文本附件超过 ${maxBytes} 字节上限。`,
      })
      continue
    }
    allowed.push(normalized)
  }

  if (violations.length > 0) {
    return {
      allowed: false,
      message: 'CLI Runtime 仅接受通过大小/MIME 校验的纯文本附件；请移除二进制或未支持格式后重试。',
      violations,
    }
  }

  if (allowed.length === 0) {
    return { allowed: true, attachments: [] }
  }

  return { allowed: true, attachments: allowed }
}

export function getCliRuntimeAttachmentRejectionMessageFromPolicy(
  liveAttachments: FileAttachment[] | undefined,
  storedAttachments: StoredAttachment[] | undefined,
  options?: CliRuntimeAttachmentPolicyOptions,
): string | null {
  const decision = evaluateCliRuntimeAttachmentPolicy(liveAttachments, storedAttachments, options)
  if (decision.allowed) return null
  const first = decision.violations[0]?.message
  return first ? `${decision.message} ${first}` : decision.message
}

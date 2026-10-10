/**
 * Small ZIP reader and writer for an Office package.
 *
 * Stored and deflated entries are enough for a DOCX part bag. ZIP64 and data
 * descriptors are refused so a partial read cannot be saved back as the file.
 */

import { deflateRawSync, inflateRawSync } from 'node:zlib'

export class ZipStoreError extends Error {
  readonly reason: 'invalid_zip' | 'unsupported_zip'

  constructor(reason: 'invalid_zip' | 'unsupported_zip') {
    super(reason)
    this.name = 'ZipStoreError'
    this.reason = reason
  }
}

export function writeZip(entries: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const [name, data] of entries) {
    assertZipName(name)
    const nameBytes = new TextEncoder().encode(name)
    const compressed = deflateRawSync(data)
    const method = compressed.byteLength < data.byteLength ? 8 : 0
    const payload = method === 8 ? compressed : data
    const crc = crc32(data)
    const local = Buffer.alloc(30 + nameBytes.length)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(payload.byteLength, 18)
    local.writeUInt32LE(data.byteLength, 22)
    local.writeUInt16LE(nameBytes.length, 26)
    local.set(nameBytes, 30)
    const central = Buffer.alloc(46 + nameBytes.length)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt32LE(crc, 16)
    central.writeUInt32LE(payload.byteLength, 20)
    central.writeUInt32LE(data.byteLength, 24)
    central.writeUInt16LE(nameBytes.length, 28)
    central.writeUInt32LE(offset, 42)
    central.set(nameBytes, 46)
    locals.push(local, payload)
    centrals.push(central)
    offset += local.byteLength + payload.byteLength
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.byteLength, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.size, 8)
  end.writeUInt16LE(entries.size, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return concat([...locals, ...centrals, end])
}

export function readZip(bytes: Uint8Array): Map<string, Uint8Array> {
  if (bytes.byteLength < 22) throw new ZipStoreError('invalid_zip')
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const parts = new Map<string, Uint8Array>()
  let position = 0
  while (position + 4 <= bytes.byteLength) {
    const signature = view.getUint32(position, true)
    if (signature === 0x02014b50 || signature === 0x06054b50) break
    if (signature !== 0x04034b50) throw new ZipStoreError('invalid_zip')
    if (position + 30 > bytes.byteLength) throw new ZipStoreError('invalid_zip')
    const flags = view.getUint16(position + 6, true)
    const method = view.getUint16(position + 8, true)
    const compressedSize = view.getUint32(position + 18, true)
    const nameLength = view.getUint16(position + 26, true)
    const extraLength = view.getUint16(position + 28, true)
    if ((flags & 0x0008) !== 0) throw new ZipStoreError('unsupported_zip')
    const nameStart = position + 30
    const dataStart = nameStart + nameLength + extraLength
    const dataEnd = dataStart + compressedSize
    if (dataEnd > bytes.byteLength) throw new ZipStoreError('invalid_zip')
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength))
    assertZipName(name)
    const compressed = bytes.subarray(dataStart, dataEnd)
    let data: Uint8Array
    if (method === 0) data = Uint8Array.from(compressed)
    else if (method === 8) data = inflateRawSync(compressed)
    else throw new ZipStoreError('unsupported_zip')
    if (name && !name.endsWith('/')) parts.set(name, data)
    position = dataEnd
  }
  if (parts.size === 0) throw new ZipStoreError('invalid_zip')
  return parts
}

function assertZipName(name: string): void {
  const fileName = name.endsWith('/') ? name.slice(0, -1) : name
  if (fileName.length === 0 || fileName.startsWith('/') || fileName.includes('\\') || fileName.includes('\0')) {
    throw new ZipStoreError('invalid_zip')
  }
  if (fileName.split('/').some((segment) => segment.length === 0 || segment === '..')) {
    throw new ZipStoreError('invalid_zip')
  }
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.byteLength
  }
  return out
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (~crc) >>> 0
}

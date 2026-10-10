import { describe, expect, test } from 'bun:test'
import { readZip, writeZip, ZipStoreError } from '../zip-store'

describe('office zip names', () => {
  test('a part name that leaves the package is refused on write and on read', () => {
    const safe = new Map<string, Uint8Array>([
      ['word/document.xml', new TextEncoder().encode('<w:document/>')],
    ])
    const bytes = writeZip(safe)
    expect(readZip(bytes).has('word/document.xml')).toBe(true)

    const hostile = new Map(safe)
    hostile.set('../secret.xml', new TextEncoder().encode('no'))
    expect(() => writeZip(hostile)).toThrow(ZipStoreError)

    expect(() => readZip(storedZip('../secret.xml', new TextEncoder().encode('no')))).toThrow(ZipStoreError)
    expect(() => readZip(storedZip('word/../../secret.xml', new TextEncoder().encode('no')))).toThrow(ZipStoreError)
  })
})

function storedZip(name: string, data: Uint8Array): Uint8Array {
  const nameBytes = Buffer.from(name)
  const crc = crc32(data)
  const local = Buffer.alloc(30 + nameBytes.length)
  local.writeUInt32LE(0x04034b50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(0, 8)
  local.writeUInt32LE(crc, 14)
  local.writeUInt32LE(data.byteLength, 18)
  local.writeUInt32LE(data.byteLength, 22)
  local.writeUInt16LE(nameBytes.length, 26)
  local.set(nameBytes, 30)
  const central = Buffer.alloc(46 + nameBytes.length)
  central.writeUInt32LE(0x02014b50, 0)
  central.writeUInt16LE(20, 4)
  central.writeUInt16LE(20, 6)
  central.writeUInt32LE(crc, 16)
  central.writeUInt32LE(data.byteLength, 20)
  central.writeUInt32LE(data.byteLength, 24)
  central.writeUInt16LE(nameBytes.length, 28)
  central.writeUInt32LE(0, 42)
  central.set(nameBytes, 46)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(1, 8)
  end.writeUInt16LE(1, 10)
  end.writeUInt32LE(central.byteLength, 12)
  end.writeUInt32LE(local.byteLength + data.byteLength, 16)
  return Buffer.concat([local, data, central, end])
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

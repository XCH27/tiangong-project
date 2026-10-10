import { describe, expect, test } from 'bun:test'
import { unzipSync, zipSync } from 'fflate'
import { buildXlsx, readXlsxSheet } from '@craft-agent/shared/protocol'
import { cellsFromXlsxBytes, replaceXlsxCellBytes } from '../xlsx-preview'

describe('xlsx preview', () => {
  test('the overlay reader sees the same cells the host package writes', () => {
    const original = buildXlsx({ sheetName: 'Q1', rows: [['Alpha', '42'], ['Beta']] })
    expect(cellsFromXlsxBytes(original)).toEqual(readXlsxSheet(original))
    const edited = replaceXlsxCellBytes(original, { cell: 'A1', value: 'Human & <team>', valueType: 'string' })
    expect(cellsFromXlsxBytes(edited).cells).toEqual([
      { ref: 'A1', value: 'Human & <team>', valueType: 'string' },
      { ref: 'B1', value: '42', valueType: 'string' },
      { ref: 'A2', value: 'Beta', valueType: 'string' },
    ])
    const typed = replaceXlsxCellBytes(edited, { cell: 'B1', value: '42', valueType: 'number' })
    expect(readXlsxSheet(typed).cells.find((cell) => cell.ref === 'B1')).toEqual({
      ref: 'B1',
      value: '42',
      valueType: 'number',
    })
  })

  test('a formula cell stays in the package when another cell changes', () => {
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>total</t></is></c>
      <c r="B1"><f>1+1</f><v>2</v></c>
    </row>
  </sheetData>
</worksheet>`
    const original = buildXlsx()
    const files = new Map<string, Uint8Array>([['xl/worksheets/sheet1.xml', new TextEncoder().encode(sheet)]])
    const packed = replacePackageSheet(original, files)
    expect(cellsFromXlsxBytes(packed).cells).toEqual([
      { ref: 'A1', value: 'total', valueType: 'string' },
      { ref: 'B1', value: '2', valueType: 'formula' },
    ])
    const edited = replaceXlsxCellBytes(packed, { cell: 'A1', value: 'sum', valueType: 'string' })
    expect(readXlsxSheet(edited).cells[1]).toEqual({ ref: 'B1', value: '2', valueType: 'formula' })
    expect(() => replaceXlsxCellBytes(packed, { cell: 'B1', value: '9', valueType: 'number' })).toThrow('formula_cell')
  })
})

function replacePackageSheet(bytes: Uint8Array, replacements: ReadonlyMap<string, Uint8Array>): Uint8Array {
  const files = unzipSync(bytes)
  for (const [name, data] of replacements) files[name] = data
  return zipSync(files)
}

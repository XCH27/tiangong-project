/**
 * First-sheet cells inside a SpreadsheetML package.
 *
 * Craft's xlsx tool reads a sheet and writes one string, number, or bool.
 * This is that surface for the first worksheet, without openpyxl and without
 * a spreadsheet editor. A formula, a rich-text run, a macro part, a second
 * sheet name, and a grid past 200 rows or 26 columns fail closed.
 */

export const XLSX_MAX_ROWS = 200
export const XLSX_MAX_COLUMNS = 26

export const SHEET_VALUE_TYPES = ['string', 'number', 'bool'] as const
export type SheetValueType = (typeof SHEET_VALUE_TYPES)[number]

export type SheetCellType = SheetValueType | 'formula'

export interface SheetCell {
  ref: string
  value: string
  valueType: SheetCellType
}

export interface SheetProjection {
  sheetName: string
  cells: SheetCell[]
}

export interface XlsxCellEdit {
  cell: string
  value: string
  valueType: SheetValueType
  sheetName?: string
}

export type XlsxFailure =
  | 'invalid_xlsx'
  | 'unsupported_sheet'
  | 'formula_cell'
  | 'invalid_cell'
  | 'invalid_value'
  | 'sheet_too_large'
  | 'sheet_not_supported'
  | 'macro_workbook'

export class XlsxXmlError extends Error {
  readonly reason: XlsxFailure

  constructor(reason: XlsxFailure) {
    super(reason)
    this.name = 'XlsxXmlError'
    this.reason = reason
  }
}

interface XmlSpan {
  start: number
  end: number
  open: string
  inner: string
  selfClosing: boolean
}

interface CellPoint {
  column: number
  row: number
}

export function buildWorkbookFiles(input: { sheetName?: string; rows?: readonly (readonly string[])[] } = {}): Map<string, Uint8Array> {
  const sheetName = input.sheetName ?? 'Sheet1'
  assertSheetName(sheetName)
  const rows = input.rows ?? []
  assertRows(rows)
  const parts = new Map<string, Uint8Array>([
    ['[Content_Types].xml', text(CONTENT_TYPES)],
    ['_rels/.rels', text(PACKAGE_RELS)],
    ['xl/workbook.xml', text(workbookXml(sheetName))],
    ['xl/_rels/workbook.xml.rels', text(WORKBOOK_RELS)],
    ['xl/styles.xml', text(STYLES)],
    ['xl/worksheets/sheet1.xml', text(sheetXmlFromRows(rows))],
  ])
  return parts
}

export function projectWorkbook(files: ReadonlyMap<string, Uint8Array>): SheetProjection {
  assertPackage(files)
  const located = locateFirstSheet(files)
  const cells = readCells(xmlPart(files, located.part), files)
  assertBounds(cells)
  return { sheetName: located.name, cells: sortCells(cells) }
}

export function updateWorkbookCell(files: ReadonlyMap<string, Uint8Array>, edit: XlsxCellEdit): Map<string, Uint8Array> {
  assertPackage(files)
  const located = locateFirstSheet(files)
  if (edit.sheetName !== undefined && edit.sheetName !== located.name) throw new XlsxXmlError('sheet_not_supported')
  const parsed = parseCellRef(edit.cell)
  if (!parsed) throw new XlsxXmlError('invalid_cell')
  if (parsed.column > XLSX_MAX_COLUMNS || parsed.row > XLSX_MAX_ROWS) throw new XlsxXmlError('sheet_too_large')
  assertValue(edit.value, edit.valueType)
  const sheetXml = xmlPart(files, located.part)
  const nextXml = writeSheetCell(sheetXml, parsed, edit.value, edit.valueType)
  const next = new Map(files)
  next.set(located.part, text(nextXml))
  assertBounds(readCells(nextXml, next))
  return next
}

export function parseCellRef(ref: string): CellPoint | null {
  const match = /^([A-Z]+)([1-9][0-9]*)$/.exec(ref.trim().toUpperCase())
  if (!match) return null
  const column = columnIndex(match[1] ?? '')
  const row = Number(match[2])
  if (column < 1 || column > 16384 || row > 1048576) return null
  return { column, row }
}

export function cellRef(column: number, row: number): string {
  return `${columnLetters(column)}${row}`
}

function writeSheetCell(xml: string, parsed: CellPoint, value: string, valueType: SheetValueType): string {
  const ref = cellRef(parsed.column, parsed.row)
  const blocks = findElements(xml, 'sheetData')
  if (blocks.length !== 1) throw new XlsxXmlError('invalid_xlsx')
  const data = blocks[0]
  if (!data) throw new XlsxXmlError('invalid_xlsx')
  const cell = cellXml(ref, value, valueType)
  if (data.selfClosing) {
    return xml.slice(0, data.start) + `<sheetData><row r="${parsed.row}">${cell}</row></sheetData>` + xml.slice(data.end)
  }
  const rows = findElements(data.inner, 'row', data.start + data.open.length)
  for (const row of rows) {
    const rowNumber = attr(row.open, 'r')
    if (!rowNumber || !/^[1-9][0-9]*$/.test(rowNumber)) throw new XlsxXmlError('unsupported_sheet')
    const current = Number(rowNumber)
    if (current < parsed.row) continue
    if (current > parsed.row) {
      return xml.slice(0, row.start) + `<row r="${parsed.row}">${cell}</row>` + xml.slice(row.start)
    }
    return replaceInRow(xml, row, parsed.column, cell)
  }
  const closeAt = data.end - '</sheetData>'.length
  return xml.slice(0, closeAt) + `<row r="${parsed.row}">${cell}</row>` + xml.slice(closeAt)
}

function replaceInRow(xml: string, row: XmlSpan, column: number, cell: string): string {
  if (row.selfClosing) {
    const open = row.open.endsWith('/>') ? `${row.open.slice(0, -2)}>` : row.open
    return xml.slice(0, row.start) + `${open}${cell}</row>` + xml.slice(row.end)
  }
  const cells = findElements(row.inner, 'c', row.start + row.open.length)
  for (const existing of cells) {
    const refAttr = attr(existing.open, 'r')?.toUpperCase()
    const parsed = refAttr ? parseCellRef(refAttr) : null
    if (!parsed) throw new XlsxXmlError('unsupported_sheet')
    if (parsed.column < column) continue
    if (parsed.column > column) return xml.slice(0, existing.start) + cell + xml.slice(existing.start)
    if (findElements(existing.inner, 'f').length > 0) throw new XlsxXmlError('formula_cell')
    if (findElements(existing.inner, 'r').length > 0) throw new XlsxXmlError('unsupported_sheet')
    const kind = attr(existing.open, 't')
    if (kind && kind !== 'inlineStr' && kind !== 's' && kind !== 'b' && kind !== 'n') {
      throw new XlsxXmlError('unsupported_sheet')
    }
    return xml.slice(0, existing.start) + cell + xml.slice(existing.end)
  }
  const closeAt = row.end - '</row>'.length
  return xml.slice(0, closeAt) + cell + xml.slice(closeAt)
}

function readCells(sheetXml: string, files: ReadonlyMap<string, Uint8Array>): SheetCell[] {
  const blocks = findElements(sheetXml, 'sheetData')
  if (blocks.length !== 1) throw new XlsxXmlError('invalid_xlsx')
  const data = blocks[0]
  if (!data) throw new XlsxXmlError('invalid_xlsx')
  const cells: SheetCell[] = []
  const seen = new Set<string>()
  let shared: string[] | null = null
  for (const row of findElements(data.inner, 'row')) {
    const rowRef = attr(row.open, 'r')
    if (!rowRef || !/^[1-9][0-9]*$/.test(rowRef)) throw new XlsxXmlError('unsupported_sheet')
    for (const cell of findElements(row.inner, 'c')) {
      const read = readCell(cell, () => shared ?? (shared = readSharedStrings(files)))
      if (seen.has(read.ref)) throw new XlsxXmlError('unsupported_sheet')
      seen.add(read.ref)
      cells.push(read)
    }
  }
  return cells
}

function readCell(cell: XmlSpan, shared: () => string[]): SheetCell {
  const ref = attr(cell.open, 'r')?.toUpperCase()
  if (!ref || !parseCellRef(ref)) throw new XlsxXmlError('unsupported_sheet')
  if (findElements(cell.inner, 'f').length > 0) {
    return { ref, value: directText(cell.inner, 'v') ?? '', valueType: 'formula' }
  }
  const kind = attr(cell.open, 't') ?? 'n'
  switch (kind) {
    case 'inlineStr':
      if (findElements(cell.inner, 'r').length > 0) throw new XlsxXmlError('unsupported_sheet')
      return { ref, value: inlineText(cell.inner), valueType: 'string' }
    case 's': {
      const indexText = directText(cell.inner, 'v')
      if (!indexText || !/^\d+$/.test(indexText)) throw new XlsxXmlError('invalid_xlsx')
      const value = shared()[Number(indexText)]
      if (value === undefined) throw new XlsxXmlError('invalid_xlsx')
      return { ref, value, valueType: 'string' }
    }
    case 'b': {
      const raw = directText(cell.inner, 'v')
      if (raw !== '0' && raw !== '1') throw new XlsxXmlError('unsupported_sheet')
      return { ref, value: raw === '1' ? 'true' : 'false', valueType: 'bool' }
    }
    case 'n': {
      if (cell.selfClosing || cell.inner.trim() === '') return { ref, value: '', valueType: 'string' }
      const raw = directText(cell.inner, 'v')
      if (raw === null || !/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(raw)) {
        throw new XlsxXmlError('unsupported_sheet')
      }
      return { ref, value: raw, valueType: 'number' }
    }
    default:
      throw new XlsxXmlError('unsupported_sheet')
  }
}

function readSharedStrings(files: ReadonlyMap<string, Uint8Array>): string[] {
  const part = files.get('xl/sharedStrings.xml')
  if (!part) throw new XlsxXmlError('invalid_xlsx')
  const xml = decodeXmlPart(part)
  if (/<r[\s>/]/.test(xml) || xml.includes('<phoneticPr')) throw new XlsxXmlError('unsupported_sheet')
  return findElements(xml, 'si').map((item) => inlineText(item.inner))
}

function locateFirstSheet(files: ReadonlyMap<string, Uint8Array>): { name: string; part: string } {
  const workbook = xmlPart(files, 'xl/workbook.xml')
  const rels = xmlPart(files, 'xl/_rels/workbook.xml.rels')
  const sheets = findElements(workbook, 'sheet')
  const sheet = sheets[0]
  if (!sheet) throw new XlsxXmlError('invalid_xlsx')
  const name = attr(sheet.open, 'name')
  const relId = attr(sheet.open, 'r:id')
  if (!name || !relId) throw new XlsxXmlError('invalid_xlsx')
  const relationships = findElements(rels, 'Relationship')
  const match = relationships.find((item) => attr(item.open, 'Id') === relId)
  if (!match) throw new XlsxXmlError('invalid_xlsx')
  if (attr(match.open, 'TargetMode') === 'External') throw new XlsxXmlError('invalid_xlsx')
  const type = attr(match.open, 'Type') ?? ''
  if (!type.endsWith('/worksheet')) throw new XlsxXmlError('invalid_xlsx')
  const target = attr(match.open, 'Target')
  if (!target) throw new XlsxXmlError('invalid_xlsx')
  return { name, part: resolvePart(target) }
}

function assertPackage(files: ReadonlyMap<string, Uint8Array>): void {
  if (files.has('EncryptionInfo') || files.has('EncryptedPackage')) throw new XlsxXmlError('invalid_xlsx')
  for (const name of files.keys()) {
    if (name.toLowerCase().endsWith('vbaproject.bin')) throw new XlsxXmlError('macro_workbook')
  }
  const types = files.get('[Content_Types].xml')
  if (!types) return
  const xml = decodeXmlPart(types).toLowerCase()
  if (xml.includes('vbaproject') || xml.includes('macroenabled')) throw new XlsxXmlError('macro_workbook')
}

function assertBounds(cells: readonly SheetCell[]): void {
  for (const cell of cells) {
    const parsed = parseCellRef(cell.ref)
    if (!parsed) throw new XlsxXmlError('invalid_xlsx')
    if (parsed.column > XLSX_MAX_COLUMNS || parsed.row > XLSX_MAX_ROWS) throw new XlsxXmlError('sheet_too_large')
  }
}

function assertRows(rows: readonly (readonly string[])[]): void {
  if (rows.length > XLSX_MAX_ROWS) throw new XlsxXmlError('sheet_too_large')
  for (const row of rows) {
    if (!Array.isArray(row)) throw new XlsxXmlError('invalid_value')
    if (row.length > XLSX_MAX_COLUMNS) throw new XlsxXmlError('sheet_too_large')
    for (const value of row) {
      if (typeof value !== 'string') throw new XlsxXmlError('invalid_value')
    }
  }
}

function assertSheetName(name: string): void {
  if (!/^[^:\\/?*[\]]{1,31}$/.test(name)) throw new XlsxXmlError('invalid_value')
  if (name.startsWith("'") || name.endsWith("'")) throw new XlsxXmlError('invalid_value')
}

function assertValue(value: string, valueType: SheetValueType): void {
  switch (valueType) {
    case 'string':
      return
    case 'number':
      if (!/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value)) throw new XlsxXmlError('invalid_value')
      return
    case 'bool':
      if (value !== 'true' && value !== 'false') throw new XlsxXmlError('invalid_value')
      return
    default: {
      const unexpected: never = valueType
      throw new XlsxXmlError(unexpected)
    }
  }
}

function sortCells(cells: SheetCell[]): SheetCell[] {
  return [...cells].sort((left, right) => {
    const a = parseCellRef(left.ref)
    const b = parseCellRef(right.ref)
    if (!a || !b) return 0
    return a.row - b.row || a.column - b.column
  })
}

function sheetXmlFromRows(rows: readonly (readonly string[])[]): string {
  const body = rows.map((row, rowIndex) => {
    const cells = row.map((value, columnIndex) => cellXml(cellRef(columnIndex + 1, rowIndex + 1), value, 'string')).join('')
    if (!cells) return ''
    return `<row r="${rowIndex + 1}">${cells}</row>`
  }).join('')
  return worksheetXml(body)
}

function cellXml(ref: string, value: string, valueType: SheetValueType): string {
  switch (valueType) {
    case 'string': {
      const preserve = value.startsWith(' ') || value.endsWith(' ') || value.includes('\n') ? ' xml:space="preserve"' : ''
      return `<c r="${ref}" t="inlineStr"><is><t${preserve}>${encodeXml(value)}</t></is></c>`
    }
    case 'number':
      return `<c r="${ref}"><v>${value}</v></c>`
    case 'bool':
      return `<c r="${ref}" t="b"><v>${value === 'true' ? '1' : '0'}</v></c>`
    default: {
      const unexpected: never = valueType
      return unexpected
    }
  }
}

function findElements(scope: string, tag: string, base = 0): XmlSpan[] {
  const needle = `<${tag}`
  const found: XmlSpan[] = []
  let cursor = 0
  while (cursor < scope.length) {
    const start = scope.indexOf(needle, cursor)
    if (start < 0) break
    const boundary = scope[start + needle.length]
    if (boundary !== '>' && boundary !== ' ' && boundary !== '/' && boundary !== '\t' && boundary !== '\n' && boundary !== '\r') {
      cursor = start + needle.length
      continue
    }
    const tagEnd = scope.indexOf('>', start)
    if (tagEnd < 0) throw new XlsxXmlError('invalid_xlsx')
    const open = scope.slice(start, tagEnd + 1)
    if (/\/\s*>$/.test(open)) {
      found.push({ start: base + start, end: base + tagEnd + 1, open, inner: '', selfClosing: true })
      cursor = tagEnd + 1
      continue
    }
    const close = `</${tag}>`
    const closeAt = scope.indexOf(close, tagEnd)
    if (closeAt < 0) throw new XlsxXmlError('invalid_xlsx')
    const end = closeAt + close.length
    found.push({
      start: base + start,
      end: base + end,
      open,
      inner: scope.slice(tagEnd + 1, closeAt),
      selfClosing: false,
    })
    cursor = end
  }
  return found
}

function attr(open: string, name: string): string | null {
  const pattern = new RegExp(`\\s${name}="([^"]*)"`)
  const match = pattern.exec(` ${open}`)
  return match?.[1] === undefined ? null : decodeXml(match[1])
}

function inlineText(inner: string): string {
  return findElements(inner, 't').map((item) => decodeXml(item.inner)).join('')
}

function directText(inner: string, tag: string): string | null {
  const found = findElements(inner, tag)
  if (found.length === 0) return null
  return decodeXml(found.map((item) => item.inner).join(''))
}

function xmlPart(files: ReadonlyMap<string, Uint8Array>, name: string): string {
  const part = files.get(name)
  if (!part) throw new XlsxXmlError('invalid_xlsx')
  return decodeXmlPart(part)
}

function decodeXmlPart(bytes: Uint8Array): string {
  const xml = new TextDecoder().decode(bytes)
  if (xml.includes('<!--') || xml.includes('<![CDATA[')) throw new XlsxXmlError('unsupported_sheet')
  return xml
}

function resolvePart(target: string): string {
  if (target.includes('..') || target.includes('\\') || target.includes('//')) throw new XlsxXmlError('invalid_xlsx')
  const cleaned = target.replace(/^\//, '')
  if (cleaned.startsWith('xl/')) return cleaned
  return `xl/${cleaned}`
}

function columnIndex(letters: string): number {
  let value = 0
  for (const char of letters) value = (value * 26) + (char.charCodeAt(0) - 64)
  return value
}

function columnLetters(column: number): string {
  let value = column
  let letters = ''
  while (value > 0) {
    const index = (value - 1) % 26
    letters = String.fromCharCode(65 + index) + letters
    value = Math.floor((value - 1) / 26)
  }
  return letters
}

function encodeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, digits: string) => xmlScalar(digits, 10))
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex: string) => xmlScalar(hex, 16))
    .replace(/&amp;/g, '&')
}

function xmlScalar(raw: string, radix: 10 | 16): string {
  const value = radix === 10 ? Number(raw) : Number.parseInt(raw, 16)
  if (!Number.isSafeInteger(value) || value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
    throw new XlsxXmlError('invalid_xlsx')
  }
  return String.fromCodePoint(value)
}

function text(value: string): Uint8Array {
  return new TextEncoder().encode(value)
}

function workbookXml(sheetName: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<sheets><sheet name="${encodeAttr(sheetName)}" sheetId="1" r:id="rId1"/></sheets>`,
    '</workbook>',
  ].join('')
}

function worksheetXml(body: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<sheetData>${body}</sheetData>`,
    '</worksheet>',
  ].join('')
}

function encodeAttr(value: string): string {
  return encodeXml(value).replace(/"/g, '&quot;')
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

const PACKAGE_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

const WORKBOOK_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
</styleSheet>`

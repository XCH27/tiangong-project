/**
 * CLI Runtime catalog + 健康分类（docs/23/24）。
 * 覆盖：detected 映射、custom CRUD、设置页编辑边界、unsupported 中文错误、健康分级。
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DETECTED_RUNTIME_MAPPINGS,
  UNSUPPORTED_DETECTED_TOOLS,
  unsupportedDetectedMessage,
  canEditRuntimeCommand,
  canDeleteRuntime,
} from '@craft-agent/shared/protocol'
import { CliRuntimeCatalog } from './cli-runtime-catalog'
import { classifyHealthFromProbe, looksLikeJsonRpc } from './cli-runtime-health'

describe('CliRuntimeCatalog', () => {
  let root: string
  let catalog: CliRuntimeCatalog

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'cli-runtime-'))
    catalog = new CliRuntimeCatalog(root)
  })
  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('默认列出 detected 映射（Grok/Hermes/OpenCode/Gemini 候选）', () => {
    const ids = catalog.list().map(r => r.mappingId)
    expect(ids).toContain('grok')
    expect(ids).toContain('hermes')
    expect(ids).toContain('opencode')
    const gemini = catalog.list().find(r => r.mappingId === 'gemini')
    expect(gemini?.needsConfirmation).toBe(true)
    expect(catalog.list().every(r => r.attachments === 'none')).toBe(true) // 第一版硬拒绝附件
  })

  it('detected 映射数量与预设一致', () => {
    expect(catalog.list().filter(r => r.kind === 'detected').length).toBe(DETECTED_RUNTIME_MAPPINGS.length)
  })

  it('custom CRUD：增/改/启停/删，落盘后可重新加载', () => {
    const added = catalog.addCustom({ displayName: 'My ACP', command: 'my-acp', args: ['serve'] })
    expect(added.kind).toBe('custom')
    expect(catalog.get(added.id)?.command).toBe('my-acp')

    catalog.updateCustom(added.id, { command: 'my-acp-2', args: ['serve', '--stdio'] })
    expect(catalog.get(added.id)?.command).toBe('my-acp-2')

    catalog.setEnabled(added.id, false)
    expect(catalog.get(added.id)?.enabled).toBe(false)

    // 重新构造 catalog（从磁盘重载），custom 仍在
    const reloaded = new CliRuntimeCatalog(root)
    expect(reloaded.get(added.id)?.command).toBe('my-acp-2')

    reloaded.delete(added.id)
    expect(reloaded.get(added.id)).toBeNull()
  })

  it('编辑边界：detected 不可改 command（updateCustom 拒绝非 custom）', () => {
    const grok = catalog.list().find(r => r.mappingId === 'grok')!
    expect(canEditRuntimeCommand(grok.kind)).toBe(false)
    expect(() => catalog.updateCustom(grok.id, { command: 'evil' })).toThrow()
  })

  it('detected 可禁用、可删除（隐藏内置映射）；managed 边界由 helper 表达', () => {
    const grok = catalog.list().find(r => r.mappingId === 'grok')!
    expect(canDeleteRuntime(grok.kind)).toBe(true)
    catalog.setEnabled(grok.id, false)
    expect(catalog.get(grok.id)?.enabled).toBe(false)
    catalog.delete(grok.id)
    expect(catalog.list().find(r => r.mappingId === 'grok')).toBeUndefined()
    expect(canDeleteRuntime('managed')).toBe(false)
  })

  it('unsupported detected：返回中文可操作错误，不进 catalog', () => {
    const unsupportedIds = UNSUPPORTED_DETECTED_TOOLS.map(t => t.id)
    expect(unsupportedIds).toEqual(['codex', 'claude', 'qwen'])
    const msg = unsupportedDetectedMessage('Codex')
    expect(msg).toContain('Codex')
    expect(msg).toContain('Custom ACP')
    // catalog 里不应出现这些
    expect(catalog.list().some(r => r.mappingId && unsupportedIds.includes(r.mappingId))).toBe(false)
  })
})

describe('health 分类（纯函数）', () => {
  it('spawn ENOENT → fail_cli', () => {
    const r = classifyHealthFromProbe({ spawnError: { code: 'ENOENT', message: 'not found' }, gotJsonRpcResponse: false, exitedBeforeResponse: false })
    expect(r.health).toBe('fail_cli')
    expect(r.stage).toBe('spawn')
  })

  it('收到 JSON-RPC 响应 → available', () => {
    const r = classifyHealthFromProbe({ gotJsonRpcResponse: true, exitedBeforeResponse: false })
    expect(r.health).toBe('available')
    expect(r.stage).toBe('ok')
  })

  it('能启动但无 JSON-RPC（超时或早退）→ fail_acp', () => {
    expect(classifyHealthFromProbe({ gotJsonRpcResponse: false, exitedBeforeResponse: true }).health).toBe('fail_acp')
    expect(classifyHealthFromProbe({ gotJsonRpcResponse: false, exitedBeforeResponse: false }).health).toBe('fail_acp')
  })

  it('looksLikeJsonRpc 识别 JSON-RPC 响应行', () => {
    expect(looksLikeJsonRpc('{"jsonrpc":"2.0","id":1,"result":{}}')).toBe(true)
    expect(looksLikeJsonRpc('hello world')).toBe(false)
    expect(looksLikeJsonRpc('{"jsonrpc":"2.0"')).toBe(false) // 半行
  })
})

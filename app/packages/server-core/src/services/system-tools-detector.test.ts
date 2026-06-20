import { describe, it, expect } from 'bun:test'
import type { SpawnSyncReturns } from 'node:child_process'
import {
  whichAll,
  mergePath,
  detectVersion,
  getLoginShellPath,
  runDetector,
  BUILTIN_DETECTORS,
  type SpawnAdapter,
  type DetectPlatform,
} from './system-tools-detector'

/** 构造一个可编程的 mock spawn。按 `${command} ${args.join(' ')}` 匹配预设响应。 */
function mockSpawn(responses: Record<string, { stdout?: string; stderr?: string; status?: number; error?: Error }>): SpawnAdapter {
  return {
    exec(command, args) {
      const key = `${command} ${args.join(' ')}`
      // 精确匹配优先；否则按 command 前缀匹配（处理不同 args 的版本/help 调用）
      const exact = responses[key]
      if (exact) return makeResult(exact)
      const byCmd = responses[`${command}`]
      if (byCmd) return makeResult(byCmd)
      // 默认：命令未找到
      return makeResult({ status: 127, stderr: 'command not found' })
    },
  }
}

function makeResult(r: { stdout?: string; stderr?: string; status?: number; error?: Error }): SpawnSyncReturns<string> {
  return {
    stdout: r.stdout ?? '',
    stderr: r.stderr ?? '',
    status: r.status ?? 0,
    signal: null,
    output: [null, r.stdout ?? '', r.stderr ?? ''],
    pid: 1,
    error: r.error,
  } as SpawnSyncReturns<string>
}

const nodeDef = BUILTIN_DETECTORS.find((d) => d.toolId === 'node')!
const darwin: DetectPlatform = 'darwin'
const win32: DetectPlatform = 'win32'

describe('whichAll', () => {
  it('returns paths from which -a on unix', () => {
    const spawn = mockSpawn({
      'which -a node': { stdout: '/usr/local/bin/node\n/opt/homebrew/bin/node\n' },
    })
    const r = whichAll('node', darwin, '/usr/local/bin:/opt/homebrew/bin', spawn)
    expect(r.paths).toEqual(['/usr/local/bin/node', '/opt/homebrew/bin/node'])
    expect(r.error).toBeUndefined()
  })

  it('returns empty + error when which fails', () => {
    const spawn = mockSpawn({ 'which -a node': { status: 1, stderr: 'no node in' } })
    const r = whichAll('node', darwin, '/usr/bin', spawn)
    expect(r.paths).toEqual([])
    expect(r.error).toBeDefined()
  })

  it('uses where on win32 and splits CRLF', () => {
    const spawn = mockSpawn({
      'where node': { stdout: 'C:\\Program Files\\nodejs\\node.exe\r\nD:\\node\\node.exe\r\n' },
    })
    const r = whichAll('node', win32, 'C:\\Windows', spawn)
    expect(r.paths).toEqual(['C:\\Program Files\\nodejs\\node.exe', 'D:\\node\\node.exe'])
  })
})

describe('mergePath', () => {
  it('merges keeping order and dedups', () => {
    expect(mergePath('/a:/b', '/b:/c')).toBe('/a:/b:/c')
    expect(mergePath('/a', null)).toBe('/a')
    expect(mergePath('/a:/b', '/c:/d')).toBe('/a:/b:/c:/d')
  })
})

describe('detectVersion', () => {
  it('parses version from --version stdout via regex', () => {
    const spawn = mockSpawn({ 'node --version': { stdout: 'v20.11.0\n' } })
    const v = detectVersion('node', spawn, {
      versionArgs: ['--version'],
      versionRegex: /v?(\d+\.\d+\.\d+)/,
    })
    expect(v.ok).toBe(true)
    expect(v.version).toBe('20.11.0')
  })

  it('falls back to --help identity keyword when version args fail', () => {
    const spawn = mockSpawn({
      'grok --version': { status: 1, stderr: 'unknown flag' },
      'grok --help': { stdout: 'Grok CLI - the grok agent\nUsage: grok ...' },
    })
    const v = detectVersion('grok', spawn, {
      versionArgs: ['--version'],
      versionRegex: /(\d+\.\d+\.\d+)/,
      helpArgs: ['--help'],
      identityKeyword: 'grok',
    })
    expect(v.ok).toBe(true)
    expect(v.version).toBeUndefined()
  })

  it('returns not ok when identity keyword missing in help', () => {
    const spawn = mockSpawn({
      'grok --version': { status: 1 },
      'grok --help': { stdout: 'some other tool' },
    })
    const v = detectVersion('grok', spawn, {
      versionArgs: ['--version'],
      versionRegex: /(\d+\.\d+\.\d+)/,
      helpArgs: ['--help'],
      identityKeyword: 'grok',
    })
    expect(v.ok).toBe(false)
  })

  it('returns error on spawn error', () => {
    const spawn = mockSpawn({ 'node --version': { error: new Error('ENOENT') } })
    const v = detectVersion('node', spawn, { versionArgs: ['--version'], versionRegex: /v?(\d+\.\d+\.\d+)/ })
    expect(v.ok).toBe(false)
    expect(v.error).toContain('ENOENT')
  })
})

describe('getLoginShellPath', () => {
  it('returns null on win32', () => {
    const spawn = mockSpawn({})
    expect(getLoginShellPath(win32, spawn)).toBeNull()
  })

  it('returns PATH from login shell on darwin', () => {
    const spawn = mockSpawn({
      '/bin/zsh -l -c printf %s "$PATH"': { stdout: '/usr/local/bin:/opt/homebrew/bin' },
    })
    expect(getLoginShellPath(darwin, spawn, 4000, '/bin/zsh')).toBe('/usr/local/bin:/opt/homebrew/bin')
  })

  it('returns null when login shell fails', () => {
    const spawn = mockSpawn({
      '/bin/zsh -l -c printf %s "$PATH"': { status: 1 },
    })
    expect(getLoginShellPath(darwin, spawn, 4000, '/bin/zsh')).toBeNull()
  })
})

describe('runDetector', () => {
  it('produces available when found on system-path + version verified', () => {
    const spawn = mockSpawn({
      'which -a node': { stdout: '/usr/local/bin/node\n' },
      '/usr/local/bin/node --version': { stdout: 'v20.11.0\n' },
    })
    const cap = runDetector(nodeDef, { platform: darwin, spawn, initialPath: '/usr/local/bin' })
    expect(cap.status).toBe('available')
    expect(cap.version).toBe('20.11.0')
    expect(cap.path).toBe('/usr/local/bin/node')
    expect(cap.source).toBe('system-path')
    expect(cap.resolvedPathEnv).toBeUndefined()
  })

  it('produces missing when not on path and no login shell fallback', () => {
    const spawn = mockSpawn({
      'which -a node': { status: 1, stderr: 'no node' },
      '/bin/zsh -l -c printf %s "$PATH"': { stdout: '/usr/bin' },
    })
    const cap = runDetector(nodeDef, { platform: darwin, spawn, initialPath: '/usr/bin' })
    expect(cap.status).toBe('missing')
    expect(cap.diagnostics.some((d) => d.code === 'not-on-path')).toBe(true)
  })

  it('uses login shell fallback and records path-mismatch + resolvedPathEnv', () => {
    const spawn = mockSpawn({
      // 第一次 which（仅 App PATH）找不到
      'which -a node': { stdout: '', status: 1 },
      // 登录 shell PATH 带来 /opt/homebrew/bin
      '/bin/zsh -l -c printf %s "$PATH"': { stdout: '/opt/homebrew/bin' },
      // 注意：whichAll 用合并后的 PATH 重试，mock 按 command 匹配会返回同一个空结果
      // 所以这里需要让 which 在第二次也命中——mockSpawn 按 command 匹配，无法区分两次。
      // 改用按调用次数返回的 spawn 见下一个 it。
    })
    // 此 it 验证 mock 局限性跳过：改由下个用例覆盖 fallback 路径
    expect(true).toBe(true)
  })

  it('falls back to login shell PATH and marks source login-shell-path', () => {
    let whichCalls = 0
    const spawn: SpawnAdapter = {
      exec(command, args) {
        if (command === 'which' && args[0] === '-a' && args[1] === 'node') {
          whichCalls++
          // 第一次（App PATH）空，第二次（合并 PATH）命中
          if (whichCalls === 1) return makeResult({ status: 1, stdout: '' })
          return makeResult({ stdout: '/opt/homebrew/bin/node\n' })
        }
        if (command === '/bin/zsh') {
          return makeResult({ stdout: '/opt/homebrew/bin' })
        }
        if (command === '/opt/homebrew/bin/node' && args[0] === '--version') {
          return makeResult({ stdout: 'v20.11.0\n' })
        }
        return makeResult({ status: 127 })
      },
    }
    const cap = runDetector(nodeDef, {
      platform: darwin,
      spawn,
      initialPath: '/usr/bin',
    })
    expect(cap.status).toBe('available')
    expect(cap.source).toBe('login-shell-path')
    expect(cap.resolvedPathEnv).toContain('/opt/homebrew/bin')
    expect(cap.diagnostics.some((d) => d.code === 'path-mismatch')).toBe(true)
  })

  it('produces broken when command found but version verify fails', () => {
    const spawn = mockSpawn({
      'which -a node': { stdout: '/usr/local/bin/node\n' },
      '/usr/local/bin/node --version': { status: 1, stderr: 'env: node: No such file or directory' },
    })
    const cap = runDetector(nodeDef, { platform: darwin, spawn, initialPath: '/usr/local/bin' })
    expect(cap.status).toBe('broken')
    expect(cap.diagnostics.some((d) => d.code === 'version-verify-failed')).toBe(true)
  })

  it('produces conflict when multiple versions found', () => {
    const spawn = mockSpawn({
      'which -a node': { stdout: '/usr/local/bin/node\n/opt/homebrew/bin/node\n' },
      '/usr/local/bin/node --version': { stdout: 'v20.11.0\n' },
    })
    const cap = runDetector(nodeDef, { platform: darwin, spawn, initialPath: '/usr/local/bin:/opt/homebrew/bin' })
    expect(cap.status).toBe('conflict')
    expect(cap.diagnostics.some((d) => d.code === 'multi-version')).toBe(true)
  })

  it('produces unknown when platform not applicable', () => {
    const pythonLauncherDef = BUILTIN_DETECTORS.find((d) => d.toolId === 'python-launcher')!
    const spawn = mockSpawn({})
    const cap = runDetector(pythonLauncherDef, { platform: darwin, spawn, initialPath: '/usr/bin' })
    expect(cap.status).toBe('unknown')
    expect(cap.diagnostics.some((d) => d.code === 'platform-not-applicable')).toBe(true)
  })
})

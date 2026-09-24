/** Read-only Grok Build ACP admission probe. No prompt, tool call or account write. */
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

type RpcResponse = {
  id?: number
  result?: { protocolVersion?: number; authMethods?: Array<{ id: string }> }
  error?: { message?: string }
}

const agent = spawn('grok', ['--no-auto-update', 'agent', '--no-leader', 'stdio'], {
  stdio: ['pipe', 'pipe', 'pipe'],
})
const lines = createInterface({ input: agent.stdout })
let nextId = 1
let stderr = ''
agent.stderr.on('data', chunk => {
  // Diagnostics only; never print a CLI log that could contain account data.
  stderr = (stderr + String(chunk)).slice(-2_000)
})

function request(method: string, params: Record<string, unknown>): Promise<RpcResponse['result']> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup()
      reject(new Error(`${method} timed out`))
    }, 10_000)
    const onLine = (line: string) => {
      if (line.length > 1_000_000) return
      let response: RpcResponse
      try { response = JSON.parse(line) as RpcResponse } catch { return }
      if (response.id !== id) return
      cleanup()
      if (response.error) reject(new Error(response.error.message ?? `${method} failed`))
      else resolve(response.result)
    }
    const onExit = () => {
      cleanup()
      reject(new Error(`${method} ended before the ACP response`))
    }
    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }
    function cleanup() {
      clearTimeout(timer)
      lines.off('line', onLine)
      agent.off('exit', onExit)
      agent.off('error', onError)
    }
    lines.on('line', onLine)
    agent.once('exit', onExit)
    agent.once('error', onError)
    agent.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

try {
  const initialized = await request('initialize', {
    protocolVersion: 1,
    clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false },
  })
  if (initialized?.protocolVersion !== 1) throw new Error('Unsupported Grok ACP version')
  const methods = new Set(initialized.authMethods?.map(method => method.id))
  if (!methods.has('cached_token')) throw new Error('No cached subscription login; run grok login')
  await request('authenticate', { methodId: 'cached_token', _meta: { headless: true } })
  console.log('Grok ACP: protocol 1, cached account authentication available')
} catch (error) {
  const reason = error instanceof Error ? error.message : String(error)
  console.error(`Grok ACP unavailable: ${reason}`)
  if ((error as NodeJS.ErrnoException)?.code === 'ENOENT'
    || stderr.includes('command not found') || stderr.includes('No such file')) {
    console.error('Install Grok Build CLI before using this adapter')
  }
  process.exitCode = 1
} finally {
  lines.close()
  agent.kill()
}

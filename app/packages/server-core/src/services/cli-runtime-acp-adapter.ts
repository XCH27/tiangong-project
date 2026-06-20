import { CliRuntimeAcpStdioClient } from './cli-runtime-acp-client'
import type { CliRuntimeEffort, CliRuntimeLaunch } from './cli-runtime-types'

export interface CliRuntimeAcpSendOptions {
  modelId?: string
  effort?: CliRuntimeEffort
}

export class CliRuntimeAcpAdapter {
  private client: CliRuntimeAcpStdioClient | null = null
  private sessionId: string | null = null

  constructor(
    private readonly launch: CliRuntimeLaunch,
    private readonly opts: { timeoutMs?: number; cwd?: string } = {},
  ) {}

  async start(): Promise<void> {
    if (this.client) return
    const client = new CliRuntimeAcpStdioClient(this.launch, this.opts)
    await client.initialize()
    this.sessionId = await client.createSession(this.opts.cwd ?? process.cwd())
    this.client = client
  }

  async sendPrompt(text: string, options: CliRuntimeAcpSendOptions = {}): Promise<unknown> {
    await this.start()
    if (!this.client || !this.sessionId) {
      throw new Error('CLI Runtime ACP session is not ready')
    }

    return this.client.prompt(text, {
      sessionId: this.sessionId,
      modelId: options.modelId,
      effort: options.effort,
    })
  }

  dispose(): void {
    this.client?.dispose()
    this.client = null
    this.sessionId = null
  }
}

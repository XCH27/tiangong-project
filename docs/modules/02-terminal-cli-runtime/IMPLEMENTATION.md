# Terminal CLI Runtime Implementation Plan

## 18. App Server RPC Connection Design
CLI 终端（`craft-cli`，位于 `app/apps/cli`）在源码中定义了 `CliRpcClient`，通过自定义的 `MessageEnvelope` 进行 RPC 长连接通信：

```typescript
// 对接 apps/cli/src/client.ts (真实源码逻辑)
import { PROTOCOL_VERSION, type MessageEnvelope } from '@craft-agent/shared/protocol';

export class CliRpcClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, any>();

  constructor(private readonly url: string, private readonly token?: string) {}

  async connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => {
        const handshake: MessageEnvelope = {
          id: crypto.randomUUID(),
          type: 'handshake',
          protocolVersion: PROTOCOL_VERSION,
          token: this.token,
        };
        this.ws!.send(JSON.stringify(handshake));
      };

      this.ws.onmessage = (event) => {
        const envelope = JSON.parse(event.data);
        if (envelope.type === 'handshake_ack') {
          resolve(envelope.clientId);
        }
      };
    });
  }

  // 二开扩展：通过 sessions:sendMessage 管道发送消息
  async sendPrompt(sessionId: string, message: string): Promise<void> {
    await this.invoke('sessions:sendMessage', sessionId, message);
  }

  async invoke(channel: string, ...args: any[]): Promise<any> {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      this.pending.set(id, { resolve });
      this.ws!.send(JSON.stringify({ id, type: 'request', channel, args }));
    });
  }
}
```

/**
 * Newline-delimited byte stream for a CLI executor.
 *
 * The production opener uses pipe stdio. This module does not allocate a PTY.
 */

export interface LineStream {
  send(line: string): void
  onLine(listener: (line: string) => void): () => void
  close(): void
}

interface StreamEndpoint {
  listeners: Array<(line: string) => void>
}

export function createMemoryLinePair(): { local: LineStream; remote: LineStream } {
  let closed = false
  const local: StreamEndpoint = { listeners: [] }
  const remote: StreamEndpoint = { listeners: [] }

  const deliver = (endpoint: StreamEndpoint, line: string) => {
    queueMicrotask(() => {
      if (closed) return
      for (const listener of [...endpoint.listeners]) listener(line)
    })
  }

  const endpoint = (side: StreamEndpoint, peer: StreamEndpoint): LineStream => ({
    send(line: string) {
      if (closed) return
      deliver(peer, line)
    },
    onLine(listener: (line: string) => void) {
      side.listeners.push(listener)
      return () => {
        side.listeners = side.listeners.filter((item) => item !== listener)
      }
    },
    close() {
      closed = true
    },
  })

  return {
    local: endpoint(local, remote),
    remote: endpoint(remote, local),
  }
}

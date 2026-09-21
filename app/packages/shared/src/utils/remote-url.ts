/** Loopback and RFC1918/link-local/mDNS names that may use ws:// on a trusted LAN. */
export function isLoopbackHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
}

export function isPrivateLanHostname(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (isLoopbackHostname(host)) return true
  if (host.toLowerCase().endsWith('.local')) return true
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host)
  if (ipv4) {
    const a = Number(ipv4[1])
    const b = Number(ipv4[2])
    if (a === 10) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
    return false
  }
  const lower = host.toLowerCase()
  if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true
  return false
}

/**
 * Pairing may use ws:// on a private LAN. Public/WAN hosts must use wss://.
 */
export function assertAllowedRemoteWsUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid remote URL')
  }
  if (parsed.protocol === 'wss:') return
  if (parsed.protocol !== 'ws:') {
    throw new Error('Remote URL must be ws:// or wss://')
  }
  if (!isPrivateLanHostname(parsed.hostname)) {
    throw new Error(
      'Refusing unencrypted ws:// to a non-LAN address. Use wss:// (TLS) off the local network.',
    )
  }
}

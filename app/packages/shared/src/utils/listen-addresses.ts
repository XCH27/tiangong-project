/**
 * Rank this machine's interface addresses for a pairing link.
 * Not a VPN product: every non-internal address is a candidate; the client tries in order.
 */

export function isIpv4(address: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)
}

function ipv4Octets(address: string): [number, number, number, number] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])]
}

/** Lower is tried first. */
export function listenAddressRank(address: string): number {
  const v4 = ipv4Octets(address)
  if (v4) {
    const [a, b] = v4
    if (a === 127) return 90
    if (a === 10) return 50
    if (a === 192 && b === 168) return 50
    if (a === 172 && b >= 16 && b <= 31) return 50
    if (a === 169 && b === 254) return 80
    if (a === 100 && b >= 64 && b <= 127) return 20
    return 10
  }
  const host = address.toLowerCase()
  if (host === '::1') return 90
  if (host.startsWith('fe80:')) return 80
  if (host.startsWith('fc') || host.startsWith('fd')) return 25
  return 15
}

export function formatWsUrl(protocol: 'ws' | 'wss', address: string, port: number): string {
  const host = isIpv4(address) || address === 'localhost' ? address : `[${address}]`
  return `${protocol}://${host}:${port}`
}

export function rankListenAddresses(addresses: string[]): string[] {
  const unique = [...new Set(addresses.filter((item) => item && !item.startsWith('127.') && item !== '::1'))]
  return unique.sort((a, b) => listenAddressRank(a) - listenAddressRank(b) || a.localeCompare(b))
}

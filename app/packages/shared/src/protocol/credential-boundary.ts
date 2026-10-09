/**
 * Credential boundary for host snapshots and provider usage records.
 * Secret-shaped keys and token strings are rejected or removed before a
 * KernelSnapshot is returned or written. This is not a second credential store.
 */

const SECRET_KEY = /(api[-_]?key|access[-_]?token|refresh[-_]?token|id[-_]?token|(?:^|_)token$|secret|password|authorization|credential)/i
const SECRET_STRING = /bearer\s+\S+/i
const SECRET_SK = /\bsk-[a-z0-9]{8,}/i
const SECRET_JWT = /^eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/

export function isSecretKey(key: string): boolean {
  return SECRET_KEY.test(key)
}

export function isSecretString(value: string): boolean {
  return SECRET_STRING.test(value) || SECRET_SK.test(value) || SECRET_JWT.test(value)
}

export function containsCredentialMaterial(value: unknown, depth = 0): boolean {
  if (depth > 8 || value == null) return false
  if (typeof value === 'string') return isSecretString(value)
  if (Array.isArray(value)) return value.some((item) => containsCredentialMaterial(item, depth + 1))
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (isSecretKey(key) && typeof child === 'string' && child.length > 0) return true
      if (containsCredentialMaterial(child, depth + 1)) return true
    }
  }
  return false
}

function scrubInPlace(value: unknown, depth: number): void {
  if (depth > 8 || value == null || typeof value !== 'object') return
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const item = value[index]
      if (typeof item === 'string' && isSecretString(item)) value[index] = '[redacted]'
      else scrubInPlace(item, depth + 1)
    }
    return
  }
  const record = value as Record<string, unknown>
  for (const key of Object.keys(record)) {
    if (isSecretKey(key)) {
      delete record[key]
      continue
    }
    const child = record[key]
    if (typeof child === 'string' && isSecretString(child)) {
      record[key] = '[redacted]'
      continue
    }
    scrubInPlace(child, depth + 1)
  }
}

export function scrubCredentialMaterial<T>(value: T): T {
  const cloned = JSON.parse(JSON.stringify(value)) as T
  scrubInPlace(cloned, 0)
  return cloned
}

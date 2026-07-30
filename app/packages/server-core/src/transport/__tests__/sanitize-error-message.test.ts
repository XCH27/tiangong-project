import { describe, it, expect } from 'bun:test'
import { sanitizeErrorMessage } from '../server'

describe('sanitizeErrorMessage', () => {
  it('returns "File or directory not found" for ENOENT', () => {
    const err = new Error('ENOENT: no such file or directory, open \'/home/user/secret.txt\'')
    ;(err as NodeJS.ErrnoException).code = 'ENOENT'
    const result = sanitizeErrorMessage(err)
    expect(result).toBe('File or directory not found')
    // Must not leak the original path
    expect(result).not.toContain('/home/user')
    expect(result).not.toContain('secret.txt')
  })

  it('returns "Permission denied" for EACCES', () => {
    const err = new Error('EACCES: permission denied, open \'/etc/shadow\'')
    ;(err as NodeJS.ErrnoException).code = 'EACCES'
    const result = sanitizeErrorMessage(err)
    expect(result).toBe('Permission denied')
    expect(result).not.toContain('/etc/shadow')
  })

  it('returns "Permission denied" for EPERM', () => {
    const err = new Error('EPERM: operation not permitted')
    ;(err as NodeJS.ErrnoException).code = 'EPERM'
    expect(sanitizeErrorMessage(err)).toBe('Permission denied')
  })

  it('returns generic message for EISDIR', () => {
    const err = new Error('EISDIR: illegal operation on a directory')
    ;(err as NodeJS.ErrnoException).code = 'EISDIR'
    expect(sanitizeErrorMessage(err)).toBe('Expected a file but found a directory')
  })

  it('returns generic message for ENOTDIR', () => {
    const err = new Error('ENOTDIR: not a directory')
    ;(err as NodeJS.ErrnoException).code = 'ENOTDIR'
    expect(sanitizeErrorMessage(err)).toBe('Expected a directory but found a file')
  })

  it('returns generic message for ENOSPC', () => {
    const err = new Error('ENOSPC: no space left on device')
    ;(err as NodeJS.ErrnoException).code = 'ENOSPC'
    expect(sanitizeErrorMessage(err)).toBe('Insufficient disk space')
  })

  it('returns generic message for EROFS', () => {
    const err = new Error('EROFS: read-only file system')
    ;(err as NodeJS.ErrnoException).code = 'EROFS'
    expect(sanitizeErrorMessage(err)).toBe('Filesystem is read-only')
  })

  it('returns generic message for EBUSY', () => {
    const err = new Error('EBUSY: resource busy')
    ;(err as NodeJS.ErrnoException).code = 'EBUSY'
    expect(sanitizeErrorMessage(err)).toBe('Resource is busy')
  })

  it('returns generic message for EMFILE', () => {
    const err = new Error('EMFILE: too many open files')
    ;(err as NodeJS.ErrnoException).code = 'EMFILE'
    expect(sanitizeErrorMessage(err)).toBe('Too many open files')
  })

  it('returns generic message for ENAMETOOLONG', () => {
    const err = new Error('ENAMETOOLONG: name too long')
    ;(err as NodeJS.ErrnoException).code = 'ENAMETOOLONG'
    expect(sanitizeErrorMessage(err)).toBe('File name is too long')
  })

  it('returns "Filesystem error" for unrecognized E* codes', () => {
    const err = new Error('EUNKNOWN: something weird happened at /internal/path')
    ;(err as NodeJS.ErrnoException).code = 'EUNKNOWN'
    const result = sanitizeErrorMessage(err)
    expect(result).toBe('Filesystem error')
    expect(result).not.toContain('/internal/path')
  })

  it('passes through Error messages without a code', () => {
    const err = new Error('Something went wrong')
    expect(sanitizeErrorMessage(err)).toBe('Something went wrong')
  })

  it('stringifies non-Error values', () => {
    expect(sanitizeErrorMessage('plain string error')).toBe('plain string error')
    expect(sanitizeErrorMessage(42)).toBe('42')
    expect(sanitizeErrorMessage(null)).toBe('null')
    expect(sanitizeErrorMessage(undefined)).toBe('undefined')
  })
})

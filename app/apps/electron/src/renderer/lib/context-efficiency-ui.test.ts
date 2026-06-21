import { describe, expect, it } from 'bun:test'
import {
  deriveSectionPhase,
  validateBundleId,
  validatePasteOutput,
  validateRequiredText,
  validateWorkspacePath,
} from './context-efficiency-ui'

describe('context efficiency ui helpers', () => {
  it('derives section phases from async load state', () => {
    expect(deriveSectionPhase({ status: 'idle' })).toBe('empty')
    expect(deriveSectionPhase({ status: 'loading' })).toBe('loading')
    expect(deriveSectionPhase({ status: 'error', message: 'x' })).toBe('error')
    expect(deriveSectionPhase({ status: 'done', data: { count: 0 } }, { emptyWhen: (d) => d.count === 0 })).toBe(
      'empty',
    )
    expect(deriveSectionPhase({ status: 'done', data: { count: 2 } }, { emptyWhen: (d) => d.count === 0 })).toBe(
      'ready',
    )
  })

  it('validates required workspace and bundle inputs', () => {
    expect(validateRequiredText('  ', '字段')).toBe('字段 不能为空')
    expect(validateWorkspacePath('')).toMatch(/项目路径/)
    expect(validateWorkspacePath('/repo')).toBeNull()
    expect(validateBundleId('bundle-1')).toBeNull()
  })

  it('validates pasted review output length', () => {
    expect(validatePasteOutput('short')).toMatch(/过短/)
    expect(validatePasteOutput('long enough pasted review output')).toBeNull()
  })
})

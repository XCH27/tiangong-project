/**
 * 分级自动决策引擎证明（D12 / docs/17 §4）。
 * 关键不变量：L0 自动；未开启时 L1+ 升级；L3 永不自动（规则也不行）；L2 需规则；每个结果都有依据。
 */

import { describe, expect, it } from 'bun:test'
import {
  decideAuto,
  classifyAutoDecisionLevel,
  DEFAULT_AUTO_DECISION_SETTINGS,
  type AutoDecisionRequest,
  type AutoDecisionSettings,
} from '../manager-decision'

const req = (kind: AutoDecisionRequest['kind'], action = 'x'): AutoDecisionRequest => ({ kind, action, sessionId: 's1' })
const settings = (over: Partial<AutoDecisionSettings>): AutoDecisionSettings => ({ ...DEFAULT_AUTO_DECISION_SETTINGS, ...over })

describe('classifyAutoDecisionLevel', () => {
  it('类别 → 等级', () => {
    expect(classifyAutoDecisionLevel('readonly')).toBe('L0')
    expect(classifyAutoDecisionLevel('local_reversible')).toBe('L1')
    expect(classifyAutoDecisionLevel('write_execute_external')).toBe('L2')
    expect(classifyAutoDecisionLevel('irreversible_sensitive')).toBe('L3')
  })
})

describe('decideAuto', () => {
  it('L0 只读：即使未开启自动决策也自动放行', () => {
    const r = decideAuto(req('readonly'), DEFAULT_AUTO_DECISION_SETTINGS)
    expect(r.outcome).toBe('auto_allow')
    expect(r.level).toBe('L0')
    expect(r.basis.length).toBeGreaterThan(0)
  })

  it('未开启自动决策：L1/L2/L3 全部升级用户', () => {
    for (const kind of ['local_reversible', 'write_execute_external', 'irreversible_sensitive'] as const) {
      expect(decideAuto(req(kind), settings({ enabled: false })).outcome).toBe('escalate')
    }
  })

  it('L3 永不自动：即使开了自动决策、即使有匹配规则也升级，且 revocable=false', () => {
    const withRule = settings({
      enabled: true,
      rules: [{ id: 'r', matchKind: 'irreversible_sensitive', grants: 'allow', maxLevel: 'L2', reason: '试图授权 L3' }],
    })
    const r = decideAuto(req('irreversible_sensitive', 'git push'), withRule)
    expect(r.outcome).toBe('escalate')
    expect(r.revocable).toBe(false)
  })

  it('L1：开启 + autoL1 → 自动；autoL1 关 → 升级', () => {
    expect(decideAuto(req('local_reversible'), settings({ enabled: true, autoL1: true })).outcome).toBe('auto_allow')
    expect(decideAuto(req('local_reversible'), settings({ enabled: true, autoL1: false })).outcome).toBe('escalate')
  })

  it('L2：有 allow 规则 → 自动放行并记规则依据', () => {
    const s = settings({ enabled: true, rules: [{ id: 'build', matchKind: 'write_execute_external', actionPrefix: 'run test', grants: 'allow', maxLevel: 'L2', reason: '项目允许的测试命令' }] })
    const r = decideAuto(req('write_execute_external', 'run test: bun test'), s)
    expect(r.outcome).toBe('auto_allow')
    expect(r.ruleId).toBe('build')
    expect(r.basis).toContain('build')
  })

  it('L2：有 deny 规则 → 自动拒绝', () => {
    const s = settings({ enabled: true, rules: [{ id: 'noexternal', matchKind: 'write_execute_external', grants: 'deny', maxLevel: 'L2', reason: '禁止外发' }] })
    expect(decideAuto(req('write_execute_external', 'upload bundle'), s).outcome).toBe('auto_deny')
  })

  it('L2：无匹配规则 → 升级用户', () => {
    expect(decideAuto(req('write_execute_external', 'rm -rf build'), settings({ enabled: true })).outcome).toBe('escalate')
  })

  it('L2：actionPrefix 不匹配则规则不生效', () => {
    const s = settings({ enabled: true, rules: [{ id: 'build', actionPrefix: 'run test', grants: 'allow', maxLevel: 'L2', reason: 'x' }] })
    expect(decideAuto(req('write_execute_external', 'git push'), s).outcome).toBe('escalate')
  })

  it('每个结果都带非空 basis（可回放/可解释）', () => {
    for (const kind of ['readonly', 'local_reversible', 'write_execute_external', 'irreversible_sensitive'] as const) {
      expect(decideAuto(req(kind), settings({ enabled: true })).basis.length).toBeGreaterThan(0)
    }
  })
})

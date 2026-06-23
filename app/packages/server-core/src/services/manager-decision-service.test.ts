/**
 * ManagerDecisionService：设置持久化 + decide 集成 + 记录→事件载荷（docs/17 §4）。
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ActorRef, AutoDecisionSettings } from '@craft-agent/shared/protocol'
import { ManagerDecisionService, permissionAutoOutcome } from './manager-decision-service'

const MANAGER: ActorRef = { kind: 'agent', agentId: 'manager:global', role: 'manager', displayName: '管理 Agent' }

describe('ManagerDecisionService', () => {
  let root: string
  let service: ManagerDecisionService

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'manager-decision-'))
    service = new ManagerDecisionService(root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('默认设置：未开启自动决策', () => {
    expect(service.getSettings().enabled).toBe(false)
  })

  it('设置落盘并可重载', () => {
    service.updateSettings({ enabled: true, rules: [{ id: 'build', matchKind: 'write_execute_external', grants: 'allow', maxLevel: 'L2', reason: 'ok' }] })
    const reloaded = new ManagerDecisionService(root)
    expect(reloaded.getSettings().enabled).toBe(true)
    expect(reloaded.getSettings().rules[0]?.id).toBe('build')
  })

  it('decide：默认（未开启）→ L2 升级；记录可转事件载荷', () => {
    const { result, record } = service.decide({ kind: 'write_execute_external', action: 'run build', sessionId: 's1' }, MANAGER)
    expect(result.outcome).toBe('escalate')
    const payload = ManagerDecisionService.toEventPayload(record)
    expect(payload.type).toBe('manager_auto_decision')
    expect(payload.sessionId).toBe('s1')
    expect(payload.outcome).toBe('escalate')
    expect(payload.basis.length).toBeGreaterThan(0)
  })

  it('decide：开启 + 规则 → L2 自动放行', () => {
    service.updateSettings({ enabled: true, rules: [{ id: 'test', matchKind: 'write_execute_external', actionPrefix: 'run test', grants: 'allow', maxLevel: 'L2', reason: '允许测试' }] })
    const { result } = service.decide({ kind: 'write_execute_external', action: 'run test: bun test', sessionId: 's1' }, MANAGER)
    expect(result.outcome).toBe('auto_allow')
    expect(result.ruleId).toBe('test')
  })

  it('decide：L3 永不自动（即便开启）', () => {
    service.updateSettings({ enabled: true })
    expect(service.decide({ kind: 'irreversible_sensitive', action: 'git push', sessionId: 's1' }, MANAGER).result.outcome).toBe('escalate')
  })
})

describe('permissionAutoOutcome（权限请求拦截，docs/17 §4）', () => {
  const base: AutoDecisionSettings = { enabled: false, autoL1: true, rules: [], model: { mode: 'workspace_default' } }
  const withRule = (over: Partial<AutoDecisionSettings>): AutoDecisionSettings => ({ ...base, ...over })

  it('team: 动作 → prompt（交回 TeamCoordinator 分级）', () => {
    expect(permissionAutoOutcome('team:assignTeamTask', withRule({ enabled: true }))).toBe('prompt')
  })

  it('未开启 → prompt（行为不变，不绕过 permission）', () => {
    expect(permissionAutoOutcome('write_file:/x', base)).toBe('prompt')
  })

  it('开启 + allow 规则匹配 → allow', () => {
    const settings = withRule({ enabled: true, rules: [{ id: 'fmt', actionPrefix: 'write_file:', grants: 'allow', maxLevel: 'L2', reason: '允许格式化写入' }] })
    expect(permissionAutoOutcome('write_file:/src/a.ts', settings)).toBe('allow')
  })

  it('开启 + deny 规则匹配 → deny', () => {
    const settings = withRule({ enabled: true, rules: [{ id: 'noenv', actionPrefix: 'write_file:.env', grants: 'deny', maxLevel: 'L2', reason: '禁止写 .env' }] })
    expect(permissionAutoOutcome('write_file:.env', settings)).toBe('deny')
  })

  it('开启但无规则匹配 → prompt（默认安全）', () => {
    expect(permissionAutoOutcome('run_command:rm', withRule({ enabled: true }))).toBe('prompt')
  })
})

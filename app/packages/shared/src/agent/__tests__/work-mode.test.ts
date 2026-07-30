import { describe, expect, it } from 'bun:test'
import {
  deriveLegacyWorkModeState,
  formatWorkModeInstruction,
  parseWorkModeRequest,
  projectPermissionMode,
  resolveAutomaticWorkMode,
  resolveInitialWorkModeState,
  resolvePlanApprovalTransition,
  shouldApplyAutomaticWorkMode,
} from '../work-mode.ts'

describe('work mode authority adapter', () => {
  it('keeps execution approval separate from the visible work phase', () => {
    expect(projectPermissionMode('explore', 'allow-all')).toBe('safe')
    expect(projectPermissionMode('plan', 'allow-all')).toBe('safe')
    expect(projectPermissionMode('execute', 'ask')).toBe('ask')
    expect(projectPermissionMode('execute', 'allow-all')).toBe('allow-all')
  })

  it('never promotes plan approval to bypass permissions', () => {
    expect(resolvePlanApprovalTransition({
      workMode: 'plan',
      workModeSelection: 'auto',
      executionPermissionMode: 'ask',
      permissionMode: 'safe',
    })).toEqual({
      workMode: 'execute',
      workModeSelection: 'auto',
      executionPermissionMode: 'ask',
      permissionMode: 'ask',
    })
  })

  it('preserves an explicitly selected bypass posture on plan approval', () => {
    expect(resolvePlanApprovalTransition({
      workMode: 'plan',
      workModeSelection: 'manual',
      executionPermissionMode: 'allow-all',
      permissionMode: 'safe',
    }).permissionMode).toBe('allow-all')
  })

  it('migrates legacy permission modes without changing their effective behavior', () => {
    expect(deriveLegacyWorkModeState('safe')).toEqual({
      workMode: 'explore',
      workModeSelection: 'manual',
      executionPermissionMode: 'ask',
      permissionMode: 'safe',
    })
    expect(deriveLegacyWorkModeState('ask').workMode).toBe('execute')
    expect(deriveLegacyWorkModeState('allow-all').executionPermissionMode).toBe('allow-all')
  })

  it('keeps legacy workspace defaults manual during an upgrade', () => {
    expect(resolveInitialWorkModeState({
      workspaceDefaults: { permissionMode: 'safe' },
      fallbackPermissionMode: 'ask',
    })).toEqual({
      workMode: 'explore',
      workModeSelection: 'manual',
      executionPermissionMode: 'ask',
      permissionMode: 'safe',
    })
  })

  it('enables Auto with agent-default Execute phase when workspace opts in', () => {
    expect(resolveInitialWorkModeState({
      workspaceDefaults: {
        defaultWorkMode: 'auto',
        executionPermissionMode: 'ask',
        permissionMode: 'safe',
      },
      fallbackPermissionMode: 'ask',
    })).toEqual({
      workMode: 'execute',
      workModeSelection: 'auto',
      executionPermissionMode: 'ask',
      permissionMode: 'ask',
    })
  })

  it('gives the model phase guidance without changing the user message', () => {
    expect(formatWorkModeInstruction('plan')).toContain('SubmitPlan')
    expect(formatWorkModeInstruction('explore')).toContain('Do not modify')
    expect(formatWorkModeInstruction('execute')).toContain('permission')
    expect(formatWorkModeInstruction('execute')).toContain('OpenCode build')
    expect(formatWorkModeInstruction('execute')).toContain('EnterPlan')
  })

  it('parses new work-mode links without treating Execute as bypass', () => {
    expect(parseWorkModeRequest('auto')).toEqual({ workModeSelection: 'auto' })
    expect(parseWorkModeRequest('plan')).toEqual({ workModeSelection: 'manual', workMode: 'plan' })
    expect(parseWorkModeRequest('execute')).toEqual({ workModeSelection: 'manual', workMode: 'execute' })
    expect(parseWorkModeRequest('allow-all')).toEqual({
      workModeSelection: 'manual',
      workMode: 'execute',
      executionPermissionMode: 'allow-all',
    })
  })
})

describe('automatic work mode routing', () => {
  it('routes read-only questions and diagnosis to Explore', () => {
    expect(resolveAutomaticWorkMode('解释一下这段代码为什么会报错').workMode).toBe('explore')
    expect(resolveAutomaticWorkMode('Review this implementation and report the risks').workMode).toBe('explore')
  })

  it('keeps audit-of-changes requests in Explore (not Plan/Execute)', () => {
    expect(resolveAutomaticWorkMode('仔细审查整个项目所有的前后端修改').workMode).toBe('explore')
    expect(resolveAutomaticWorkMode('审查代码修改').workMode).toBe('explore')
    expect(resolveAutomaticWorkMode('Review all frontend and backend changes across the project').workMode).toBe('explore')
    expect(resolveAutomaticWorkMode('检查这次 PR 的改动有没有风险').workMode).toBe('explore')
  })

  it('keeps broad or plan-worded work in Execute (Plan is opt-in like Cursor/Codex)', () => {
    // Daily Agent: search + edit even for large refactors. Plan only via /plan, UI, or EnterPlan.
    expect(resolveAutomaticWorkMode('先制定计划，全面重构权限系统和会话持久化').workMode).toBe('execute')
    expect(resolveAutomaticWorkMode('Design and migrate the architecture across frontend, backend, and storage').workMode).toBe('execute')
    expect(resolveAutomaticWorkMode('全面改造前后端的权限系统').workMode).toBe('execute')
  })

  it('routes mutation requests to Execute (Agent default)', () => {
    expect(resolveAutomaticWorkMode('修复这个按钮的 aria-label 并补测试').workMode).toBe('execute')
    expect(resolveAutomaticWorkMode('Rename this field and update its unit test').workMode).toBe('execute')
    expect(resolveAutomaticWorkMode('修改这个按钮的文案').workMode).toBe('execute')
  })

  it('honours an explicit mode prefix over heuristic routing', () => {
    expect(resolveAutomaticWorkMode('/plan 修复一个拼写错误').workMode).toBe('plan')
    expect(resolveAutomaticWorkMode('/execute 分析这段代码').workMode).toBe('execute')
    expect(resolveAutomaticWorkMode('/explore 删除这个文件').workMode).toBe('explore')
  })

  it('sticks to the current phase on ambiguous follow-ups (agent-default fallback is Execute)', () => {
    expect(resolveAutomaticWorkMode('好的', { currentWorkMode: 'execute' })).toEqual({
      workMode: 'execute',
      reason: 'sticky',
    })
    expect(resolveAutomaticWorkMode('继续', { currentWorkMode: 'plan' })).toEqual({
      workMode: 'plan',
      reason: 'sticky',
    })
    expect(resolveAutomaticWorkMode('ok go').reason).toBe('fallback')
    expect(resolveAutomaticWorkMode('ok go').workMode).toBe('execute')
  })

  it('skips apply when sticky keeps the same mode', () => {
    expect(shouldApplyAutomaticWorkMode('execute', {
      workMode: 'execute',
      reason: 'sticky',
    })).toBe(false)
    expect(shouldApplyAutomaticWorkMode('explore', {
      workMode: 'execute',
      reason: 'bounded-change',
    })).toBe(true)
  })
})

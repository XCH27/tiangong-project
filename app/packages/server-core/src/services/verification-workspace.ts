/**
 * Fusion Verification — 工作区本机检查（typecheck / plan 元数据提示）
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseActionPlan } from './plan-fusion-executor.ts'
import type { VerificationSignal } from './verification-runner.ts'

const TYPECHECK_TIMEOUT_MS = 45_000

export function runWorkspaceTypecheck(workspaceRoot: string): VerificationSignal {
  const roots = [join(workspaceRoot, 'app'), workspaceRoot]
  for (const root of roots) {
    const pkgPath = join(root, 'package.json')
    if (!existsSync(pkgPath)) continue
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> }
      const script = pkg.scripts?.typecheck
        ? 'typecheck'
        : pkg.scripts?.['typecheck:all']
          ? 'typecheck:all'
          : null
      if (!script) continue
      execFileSync('bun', ['run', script], {
        cwd: root,
        encoding: 'utf-8',
        timeout: TYPECHECK_TIMEOUT_MS,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
      return {
        kind: 'lint',
        source: `bun run ${script}`,
        passed: true,
        detail: 'typecheck passed',
        evidence: 'actual',
      }
    } catch (err) {
      const stderr = err instanceof Error && 'stderr' in err
        ? String((err as { stderr?: Buffer }).stderr ?? err.message)
        : err instanceof Error ? err.message : String(err)
      return {
        kind: 'lint',
        source: 'typecheck',
        passed: false,
        detail: stderr.slice(0, 500),
        evidence: 'actual',
      }
    }
  }
  return {
    kind: 'lint',
    source: 'workspace',
    passed: true,
    detail: 'no typecheck script found',
    evidence: 'unknown',
  }
}

export function runPlanTestHint(actionPlan: unknown): VerificationSignal | null {
  const steps = parseActionPlan(actionPlan)
  if (steps.length === 0) return null
  const text = JSON.stringify(steps).toLowerCase()
  if (!/test|jest|vitest|pytest|spec/.test(text)) return null
  return {
    kind: 'test',
    source: 'plan-metadata',
    passed: true,
    detail: 'plan references tests; full test run deferred to agent tools',
    evidence: 'estimated',
  }
}

export function runPlanRenderHint(actionPlan: unknown): VerificationSignal | null {
  const steps = parseActionPlan(actionPlan)
  if (steps.length === 0) return null
  const text = JSON.stringify(steps).toLowerCase()
  if (!/render|preview|screenshot|export/.test(text)) return null
  return {
    kind: 'render',
    source: 'plan-metadata',
    passed: true,
    detail: 'plan references render/export; visual verification deferred',
    evidence: 'estimated',
  }
}

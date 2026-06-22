import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { listStatuses } from '@craft-agent/shared/statuses'
import {
  DEFAULT_TEAM_MANAGER_CONTEXT_POLICY,
  TEAM_STATUS_SEMANTICS,
  type ManagerContextInjectionTarget,
  type TeamRulesLoadResult,
  type TeamRulesV1,
  type TeamRulesValidationResult,
} from '@craft-agent/shared/protocol'

const TEAM_RULES_RELATIVE_PATH = '.fleet/team.rules.json'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function collectDuplicates(values: string[]): string[] {
  const seen = new Set<string>()
  const duplicates = new Set<string>()
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value)
    seen.add(value)
  }
  return [...duplicates]
}

const MANAGER_CONTEXT_INJECTION_TARGETS = new Set<ManagerContextInjectionTarget>(['off', 'leaderOnly', 'allMembers'])
const CROSS_PROJECT_INJECTION_TARGETS = new Set<ManagerContextInjectionTarget>(['off', 'leaderOnly'])

export function validateTeamRules(
  value: unknown,
  validStatusIds?: ReadonlySet<string>,
): TeamRulesValidationResult {
  const errors: string[] = []
  if (!isPlainObject(value)) return { valid: false, errors: ['规则必须是 JSON 对象'] }

  if (value.version !== 1) errors.push('version 必须为 1')
  if (!isNonEmptyString(value.teamId)) errors.push('teamId 不能为空')
  if (!isNonEmptyString(value.teamConversationSessionId)) errors.push('teamConversationSessionId 不能为空')
  if (value.managerProjectionSessionId !== undefined && !isNonEmptyString(value.managerProjectionSessionId)) {
    errors.push('managerProjectionSessionId 必须是非空字符串')
  }
  if (value.leaderSessionId !== null && !isNonEmptyString(value.leaderSessionId)) {
    errors.push('leaderSessionId 必须是非空字符串或 null')
  }

  const members = Array.isArray(value.memberSessionIds)
    ? value.memberSessionIds.filter(isNonEmptyString)
    : []
  if (!Array.isArray(value.memberSessionIds) || members.length !== value.memberSessionIds.length) {
    errors.push('memberSessionIds 必须是非空字符串数组')
  }
  const duplicateMembers = collectDuplicates(members)
  if (duplicateMembers.length > 0) errors.push(`memberSessionIds 存在重复项: ${duplicateMembers.join(', ')}`)
  if (isNonEmptyString(value.leaderSessionId) && !members.includes(value.leaderSessionId)) {
    errors.push('leaderSessionId 必须同时存在于 memberSessionIds')
  }

  const tags = Array.isArray(value.identityTags) ? value.identityTags : []
  const tagIds: string[] = []
  if (!Array.isArray(value.identityTags)) {
    errors.push('identityTags 必须是数组')
  } else {
    tags.forEach((tag, index) => {
      if (!isPlainObject(tag)) {
        errors.push(`identityTags[${index}] 必须是对象`)
        return
      }
      if (!isNonEmptyString(tag.id)) errors.push(`identityTags[${index}].id 不能为空`)
      else tagIds.push(tag.id)
      if (!isNonEmptyString(tag.displayName)) errors.push(`identityTags[${index}].displayName 不能为空`)
      if (tag.systemPromptPreset !== undefined && typeof tag.systemPromptPreset !== 'string') {
        errors.push(`identityTags[${index}].systemPromptPreset 必须是字符串`)
      }
      if (tag.color !== undefined && typeof tag.color !== 'string') {
        errors.push(`identityTags[${index}].color 必须是字符串`)
      }
    })
  }
  const duplicateTags = collectDuplicates(tagIds)
  if (duplicateTags.length > 0) errors.push(`identityTags 存在重复 id: ${duplicateTags.join(', ')}`)

  if (!isPlainObject(value.identityAssignments)) {
    errors.push('identityAssignments 必须是对象')
  } else {
    for (const [sessionId, assignments] of Object.entries(value.identityAssignments)) {
      if (!members.includes(sessionId)) errors.push(`identityAssignments 引用了非成员会话: ${sessionId}`)
      if (!Array.isArray(assignments) || assignments.some(item => !isNonEmptyString(item))) {
        errors.push(`identityAssignments.${sessionId} 必须是标签 id 数组`)
        continue
      }
      for (const tagId of assignments) {
        if (!tagIds.includes(tagId)) errors.push(`identityAssignments.${sessionId} 引用了未知标签: ${tagId}`)
      }
    }
  }

  if (!isPlainObject(value.statusMap)) {
    errors.push('statusMap 必须是对象')
  } else {
    for (const semantic of TEAM_STATUS_SEMANTICS) {
      const statusId = value.statusMap[semantic]
      if (!isNonEmptyString(statusId)) errors.push(`statusMap.${semantic} 不能为空`)
      else if (validStatusIds && !validStatusIds.has(statusId)) {
        errors.push(`statusMap.${semantic} 引用了不存在的状态: ${statusId}`)
      }
    }
  }

  if (!isPlainObject(value.routing)) {
    errors.push('routing 必须是对象')
  } else {
    if (value.routing.mentionPrefix !== '@') errors.push("routing.mentionPrefix 必须为 '@'")
    if (value.routing.commandPrefix !== '/') errors.push("routing.commandPrefix 必须为 '/'")
    if (value.routing.defaultVisibility !== 'broadcast' && value.routing.defaultVisibility !== 'private') {
      errors.push("routing.defaultVisibility 必须为 'broadcast' 或 'private'")
    }
  }

  if (!isPlainObject(value.taskPolicy)) {
    errors.push('taskPolicy 必须是对象')
  } else {
    for (const key of ['requireTaskIdForAssignment', 'requireRunIdForReport', 'queueLatestStructuredReport'] as const) {
      if (typeof value.taskPolicy[key] !== 'boolean') errors.push(`taskPolicy.${key} 必须是布尔值`)
    }
  }

  if (!isPlainObject(value.managerContextPolicy)) {
    errors.push('managerContextPolicy 必须是对象')
  } else {
    if (!MANAGER_CONTEXT_INJECTION_TARGETS.has(value.managerContextPolicy.userPreferenceInjection as ManagerContextInjectionTarget)) {
      errors.push("managerContextPolicy.userPreferenceInjection 必须为 'off'、'leaderOnly' 或 'allMembers'")
    }
    if (!CROSS_PROJECT_INJECTION_TARGETS.has(value.managerContextPolicy.crossProjectRecordInjection as ManagerContextInjectionTarget)) {
      errors.push("managerContextPolicy.crossProjectRecordInjection 必须为 'off' 或 'leaderOnly'")
    }
    if (typeof value.managerContextPolicy.deepMemberContextRequiresPermission !== 'boolean') {
      errors.push('managerContextPolicy.deepMemberContextRequiresPermission 必须是布尔值')
    }
  }

  if (!Array.isArray(value.norms) || value.norms.some(item => typeof item !== 'string')) {
    errors.push('norms 必须是字符串数组')
  }

  return { valid: errors.length === 0, errors }
}

function withTeamRulesDefaults(candidate: unknown): unknown {
  if (!isPlainObject(candidate)) return candidate
  return {
    managerContextPolicy: { ...DEFAULT_TEAM_MANAGER_CONTEXT_POLICY },
    ...candidate,
  }
}

export class TeamRulesService {
  private lastValid: TeamRulesV1 | null = null
  readonly path: string
  readonly lastValidPath: string

  constructor(private readonly workspaceRoot: string) {
    this.path = join(workspaceRoot, TEAM_RULES_RELATIVE_PATH)
    this.lastValidPath = join(workspaceRoot, '.fleet/team.rules.last-valid.json')
  }

  validate(value: unknown): TeamRulesValidationResult {
    const statusIds = new Set(listStatuses(this.workspaceRoot).map(status => status.id))
    return validateTeamRules(value, statusIds)
  }

  load(): TeamRulesLoadResult {
    if (!existsSync(this.path)) return { rules: null, source: 'missing', path: this.path }

    try {
      const candidate: unknown = withTeamRulesDefaults(JSON.parse(readFileSync(this.path, 'utf8')))
      const result = this.validate(candidate)
      if (!result.valid) throw new Error(result.errors.join('; '))
      this.lastValid = candidate as TeamRulesV1
      this.writeAtomic(this.lastValidPath, this.lastValid)
      return { rules: this.lastValid, source: 'disk', path: this.path }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const fallback = this.lastValid ?? this.loadPersistedFallback()
      return {
        rules: fallback,
        source: fallback ? 'last-valid' : 'invalid',
        path: this.path,
        error: message,
      }
    }
  }

  /** Called only after the caller has passed craft permission and timeline handling. */
  save(rules: TeamRulesV1): TeamRulesV1 {
    const result = this.validate(rules)
    if (!result.valid) throw new Error(`团队规则无效: ${result.errors.join('; ')}`)

    this.writeAtomic(this.path, rules)
    this.writeAtomic(this.lastValidPath, rules)
    this.lastValid = structuredClone(rules)
    return this.lastValid
  }

  private loadPersistedFallback(): TeamRulesV1 | null {
    if (!existsSync(this.lastValidPath)) return null
    try {
      const candidate: unknown = withTeamRulesDefaults(JSON.parse(readFileSync(this.lastValidPath, 'utf8')))
      const result = this.validate(candidate)
      if (!result.valid) return null
      this.lastValid = candidate as TeamRulesV1
      return this.lastValid
    } catch {
      return null
    }
  }

  private writeAtomic(path: string, rules: TeamRulesV1): void {
    mkdirSync(dirname(path), { recursive: true })
    const tempPath = `${path}.${process.pid}.tmp`
    try {
      writeFileSync(tempPath, `${JSON.stringify(rules, null, 2)}\n`, 'utf8')
      renameSync(tempPath, path)
    } catch (error) {
      if (existsSync(tempPath)) unlinkSync(tempPath)
      throw error
    }
  }
}

import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SettingsSection, SettingsCard, SettingsRow } from '@/components/settings'
import type { DetailsPageMeta } from '@/lib/navigation-registry'
import type {
  AgentLifecycleDescriptor,
  MemoryRecord,
  MemoryPartition,
  DecisionEvaluateResult,
  DecisionRuleDescriptor,
} from '../../../shared/types'
import {
  ALL_PARTITIONS,
  DECISION_LEVELS,
  createEmptyDecisionRuleForm,
  decisionRuleFormToUpsert,
  formatAgentLabel,
  formatDecisionRuleSummary,
  needsConfirmForDelete,
  needsConfirmForRuleDelete,
  parseValueInput,
  validateDecisionRuleForm,
  type DecisionRuleFormState,
} from './memory-decision-helpers'

export const meta: DetailsPageMeta = {
  navigator: 'settings',
  slug: 'memoryDecision',
}

export default function MemoryDecisionSettingsPage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<AgentLifecycleDescriptor[]>([])
  const [memories, setMemories] = useState<MemoryRecord[]>([])
  const [rules, setRules] = useState<DecisionRuleDescriptor[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [evalInput, setEvalInput] = useState<{ action: string; scope: 'local' | 'external'; risk: 'read-only' | 'reversible' | 'irreversible' | 'sensitive' }>({
    action: '',
    scope: 'local',
    risk: 'read-only',
  })
  const [evalResult, setEvalResult] = useState<DecisionEvaluateResult | null>(null)
  const [ruleForm, setRuleForm] = useState<DecisionRuleFormState>(() => createEmptyDecisionRuleForm())
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const loadAgents = useCallback(async () => {
    try {
      const res = await window.electronAPI.listAgentLifecycle()
      setAgents(res.agents)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const loadMemories = useCallback(async () => {
    try {
      const res = await window.electronAPI.listMemory({ limit: 50 })
      setMemories(res.records)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  const loadRules = useCallback(async () => {
    try {
      const res = await window.electronAPI.listDecisionRules()
      setRules(res.rules)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }, [])

  useEffect(() => {
    void loadAgents()
    void loadMemories()
    void loadRules()
  }, [loadAgents, loadMemories, loadRules])

  const searchMemories = async () => {
    if (!searchKeyword.trim()) return loadMemories()
    try {
      const res = await window.electronAPI.searchMemory({
        keyword: searchKeyword,
        projectId: filterProject || undefined,
        limit: 50,
      })
      setMemories(res.records)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const deleteMemory = async (id: string, risk?: string) => {
    if (needsConfirmForDelete(risk) && !confirm(`Confirm delete ${risk} risk memory?`)) return
    try {
      await window.electronAPI.deleteMemory({ id, confirmed: needsConfirmForDelete(risk) })
      await loadMemories()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const evaluate = async () => {
    if (!evalInput.action) return
    setLoading(true)
    setError('')
    try {
      const res = await window.electronAPI.evaluateDecision(evalInput)
      setEvalResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const [addForm, setAddForm] = useState({
    partition: 'user' as MemoryPartition,
    projectId: '',
    key: '',
    value: '',
    risk: 'low' as 'low' | 'medium' | 'high',
  })

  const addMemory = async () => {
    if (!addForm.partition) return
    setLoading(true)
    setError('')
    try {
      await window.electronAPI.addMemory({
        partition: addForm.partition,
        projectId: addForm.projectId || undefined,
        key: addForm.key || undefined,
        value: parseValueInput(addForm.value),
        risk: addForm.risk,
      })
      await loadMemories()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const startNewRule = () => {
    setEditingRuleId(null)
    setRuleForm(createEmptyDecisionRuleForm())
  }

  const editRule = (rule: DecisionRuleDescriptor) => {
    setEditingRuleId(rule.id)
    setRuleForm({
      id: rule.id,
      action: rule.action,
      target: rule.target ?? '',
      scope: rule.scope ?? 'local',
      level: rule.level,
      allow: rule.allow,
      reason: rule.reason,
    })
  }

  const saveRule = async () => {
    const validationError = validateDecisionRuleForm(ruleForm)
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      await window.electronAPI.upsertDecisionRule(decisionRuleFormToUpsert(ruleForm))
      await loadRules()
      if (!editingRuleId) startNewRule()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  const deleteRule = async (rule: DecisionRuleDescriptor) => {
    if (!needsConfirmForRuleDelete(rule.id)) return
    if (!confirm(`Delete decision rule "${rule.id}" (${rule.action})?`)) return
    setLoading(true)
    setError('')
    try {
      await window.electronAPI.deleteDecisionRule({ id: rule.id })
      if (editingRuleId === rule.id) startNewRule()
      await loadRules()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <PanelHeader title={t('settings.memoryDecision.title')} />
      <ScrollArea className="flex-1">
        <div className="px-5 py-7 max-w-3xl mx-auto space-y-6">
          <SettingsSection title="Agent Lifecycle">
            <SettingsCard>
              <Button onClick={loadAgents}>Refresh Agents</Button>
              {agents.length === 0 && <SettingsRow label="No agents">—</SettingsRow>}
              {agents.map((a) => (
                <SettingsRow key={a.agentId} label={formatAgentLabel(a)}>
                  —
                </SettingsRow>
              ))}
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="Memory (7 partitions)">
            <SettingsCard>
              <div className="flex gap-2 mb-2">
                <Input placeholder="Search" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
                <Input placeholder="projectId" value={filterProject} onChange={(e) => setFilterProject(e.target.value)} />
                <Button onClick={searchMemories}>Search</Button>
                <Button onClick={loadMemories}>List</Button>
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                <select value={addForm.partition} onChange={(e) => setAddForm({ ...addForm, partition: e.target.value as MemoryPartition })}>
                  {ALL_PARTITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Input placeholder="projectId" value={addForm.projectId} onChange={(e) => setAddForm({ ...addForm, projectId: e.target.value })} className="w-28" />
                <Input placeholder="key" value={addForm.key} onChange={(e) => setAddForm({ ...addForm, key: e.target.value })} className="w-28" />
                <Input placeholder="value" value={addForm.value} onChange={(e) => setAddForm({ ...addForm, value: e.target.value })} className="w-40" />
                <select value={addForm.risk} onChange={(e) => setAddForm({ ...addForm, risk: e.target.value as 'low' | 'medium' | 'high' })}>
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <Button onClick={addMemory} disabled={loading}>
                  Add
                </Button>
              </div>
              {memories.length === 0 && <SettingsRow label="No memory">—</SettingsRow>}
              {memories.map((m) => (
                <SettingsRow key={m.id} label={`${m.partition}:${m.key || m.id}`}>
                  <span className="text-xs text-muted-foreground mr-2">{m.risk || 'low'}</span>
                  <Button variant="destructive" size="sm" onClick={() => deleteMemory(m.id, m.risk)}>
                    Delete
                  </Button>
                </SettingsRow>
              ))}
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="Decision Rules">
            <SettingsCard>
              <div className="flex gap-2 mb-3">
                <Button variant="outline" onClick={loadRules} disabled={loading}>
                  Refresh Rules
                </Button>
                <Button variant="outline" onClick={startNewRule}>
                  New Rule
                </Button>
              </div>

              {rules.length === 0 && <SettingsRow label="No rules">—</SettingsRow>}
              {rules.map((rule) => (
                <SettingsRow key={rule.id} label={formatDecisionRuleSummary(rule)}>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => editRule(rule)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteRule(rule)}>
                      Delete
                    </Button>
                  </div>
                </SettingsRow>
              ))}

              <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
                <div className="text-xs font-medium text-muted-foreground">{editingRuleId ? `Edit rule · ${editingRuleId}` : 'New rule'}</div>
                <Input placeholder="id" value={ruleForm.id} onChange={(e) => setRuleForm({ ...ruleForm, id: e.target.value })} disabled={!!editingRuleId} />
                <Input placeholder="action" value={ruleForm.action} onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })} />
                <Input placeholder="target (optional)" value={ruleForm.target} onChange={(e) => setRuleForm({ ...ruleForm, target: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  <select value={ruleForm.scope} onChange={(e) => setRuleForm({ ...ruleForm, scope: e.target.value as 'local' | 'external' })}>
                    <option value="local">local</option>
                    <option value="external">external</option>
                  </select>
                  <select value={ruleForm.level} onChange={(e) => setRuleForm({ ...ruleForm, level: e.target.value as DecisionRuleFormState['level'] })}>
                    {DECISION_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  <select value={ruleForm.allow ? 'allow' : 'deny'} onChange={(e) => setRuleForm({ ...ruleForm, allow: e.target.value === 'allow' })}>
                    <option value="allow">allow</option>
                    <option value="deny">deny</option>
                  </select>
                </div>
                <Input placeholder="reason (optional)" value={ruleForm.reason} onChange={(e) => setRuleForm({ ...ruleForm, reason: e.target.value })} />
                <Button onClick={saveRule} disabled={loading}>
                  {editingRuleId ? 'Save Changes' : 'Create Rule'}
                </Button>
              </div>
            </SettingsCard>
          </SettingsSection>

          <SettingsSection title="Decision Evaluate">
            <SettingsCard>
              <div className="space-y-2">
                <Input placeholder="action" value={evalInput.action} onChange={(e) => setEvalInput({ ...evalInput, action: e.target.value })} />
                <select value={evalInput.scope} onChange={(e) => setEvalInput({ ...evalInput, scope: e.target.value as 'local' | 'external' })}>
                  <option value="local">local</option>
                  <option value="external">external</option>
                </select>
                <select value={evalInput.risk} onChange={(e) => setEvalInput({ ...evalInput, risk: e.target.value as typeof evalInput.risk })}>
                  <option value="read-only">read-only</option>
                  <option value="reversible">reversible</option>
                  <option value="irreversible">irreversible</option>
                  <option value="sensitive">sensitive</option>
                </select>
                <Button onClick={evaluate} disabled={loading}>
                  Evaluate
                </Button>
              </div>
              {evalResult && (
                <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto">{JSON.stringify(evalResult, null, 2)}</pre>
              )}
              {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
            </SettingsCard>
          </SettingsSection>
        </div>
      </ScrollArea>
    </div>
  )
}

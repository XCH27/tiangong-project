/**
 * Secret scan for ProjectPack v1 — 自研规则，不复制 repomix/secretlint 源码。
 */

import type { SecretFinding, SecretSeverity } from '@craft-agent/shared/protocol'

interface SecretRule {
  id: string
  severity: SecretSeverity
  message: string
  /** 行级检测 */
  test: (line: string) => RegExpMatchArray | null
}

const RULES: SecretRule[] = [
  {
    id: 'aws-access-key',
    severity: 'high',
    message: 'Possible AWS access key (AKIA…)',
    test: (line) => line.match(/\b(AKIA[0-9A-Z]{16})\b/),
  },
  {
    id: 'github-pat',
    severity: 'high',
    message: 'Possible GitHub personal access token',
    test: (line) => line.match(/\b(ghp_[A-Za-z0-9]{20,})\b/) || line.match(/\b(github_pat_[A-Za-z0-9_]{20,})\b/),
  },
  {
    id: 'openai-key',
    severity: 'high',
    message: 'Possible OpenAI API key',
    test: (line) => line.match(/\b(sk-[A-Za-z0-9]{20,})\b/),
  },
  {
    id: 'anthropic-key',
    severity: 'high',
    message: 'Possible Anthropic API key',
    test: (line) => line.match(/\b(sk-ant-[A-Za-z0-9\-_]{20,})\b/),
  },
  {
    id: 'private-key',
    severity: 'high',
    message: 'PEM private key block',
    test: (line) => line.match(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/),
  },
  {
    id: 'jwt',
    severity: 'medium',
    message: 'Possible JWT token',
    test: (line) => line.match(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/),
  },
  {
    id: 'env-secret',
    severity: 'medium',
    message: 'Environment variable assignment that may contain a secret',
    test: (line) => {
      const m = line.match(/^\s*([A-Z0-9_]*(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY)[A-Z0-9_]*)\s*=\s*(.+)$/i)
      if (!m) return null
      const value = m[3]?.trim() ?? ''
      if (!value || value === '""' || value === "''" || /^(changeme|placeholder|xxx+|your[-_]key)$/i.test(value)) {
        return null
      }
      return m
    },
  },
  {
    id: 'generic-api-key',
    severity: 'low',
    message: 'Generic api_key / apikey assignment',
    test: (line) => line.match(/\b(api[_-]?key|apikey)\s*[:=]\s*['"]?[A-Za-z0-9_\-]{16,}/i),
  },
]

function redactSnippet(line: string, match: RegExpMatchArray): string {
  const raw = match[0] ?? line.trim()
  if (raw.length <= 8) return '***'
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`
}

export function scanTextForSecrets(relativePath: string, text: string): SecretFinding[] {
  const findings: SecretFinding[] = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    for (const rule of RULES) {
      const match = rule.test(line)
      if (!match) continue
      findings.push({
        relativePath,
        line: i + 1,
        ruleId: rule.id,
        severity: rule.severity,
        message: rule.message,
        snippet: redactSnippet(line, match),
      })
    }
  }
  return findings
}

export function scanFilesForSecrets(
  files: Array<{ relativePath: string; content: string }>,
): SecretFinding[] {
  const all: SecretFinding[] = []
  for (const file of files) {
    all.push(...scanTextForSecrets(file.relativePath, file.content))
  }
  return all
}

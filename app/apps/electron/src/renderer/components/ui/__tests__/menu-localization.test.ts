import { describe, it, expect, mock, beforeAll } from 'bun:test'

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}))
mock.module('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({ default: '' }))
mock.module('pdfjs-dist', () => ({ GlobalWorkerOptions: { workerSrc: '' }, getDocument: () => ({}) }))

let getSlashCommandDescriptionForDisplay: (description: string) => string
let getSkillDescriptionForDisplay: (description: string) => string

beforeAll(async () => {
  const slash = await import('../slash-command-menu')
  const skill = await import('../skill-mention-menu')
  getSlashCommandDescriptionForDisplay = slash.getSlashCommandDescriptionForDisplay
  getSkillDescriptionForDisplay = skill.getSkillDescriptionForDisplay
})

describe('menu localized descriptions', () => {
  it('shows curated Chinese copy for built-in slash command descriptions', () => {
    expect(getSlashCommandDescriptionForDisplay('Summarize conversation context to free up token budget')).toBe('压缩上下文')
  })

  it('uses the Skill metadata description as the display source without mutating it', () => {
    const original = 'Helps with git commits'

    expect(getSkillDescriptionForDisplay(original)).toBe(original)
    expect(original).toBe('Helps with git commits')
  })
})

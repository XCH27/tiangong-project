import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// packages/ui has no RTL/jsdom harness (see accept-plan-chevron-group.test.ts).
// Compact/touch Copy reachability is a render-contract: Copy stays on the existing
// ResponseCard footer, Markdown/Branch stay inside the desktop-only block, and
// compact Copy is not hover-gated.
const turnCardSrc = readFileSync(join(__dirname, '../TurnCard.tsx'), 'utf8')
const actionsMenuSrc = readFileSync(join(__dirname, '../TurnCardActionsMenu.tsx'), 'utf8')

function sliceAfterComment(src: string, comment: string): string {
  const start = src.indexOf(comment)
  expect(start).toBeGreaterThan(-1)
  return src.slice(start)
}

function completedResponseFooterActions(compactMode: boolean) {
  return {
    copy: true,
    markdown: !compactMode,
    branch: !compactMode,
  } as const
}

describe('compact/touch assistant Copy reachability', () => {
  it('keeps Copy available in compact mode and hides Markdown/Branch', () => {
    expect(completedResponseFooterActions(true)).toEqual({
      copy: true,
      markdown: false,
      branch: false,
    })
    expect(completedResponseFooterActions(false)).toEqual({
      copy: true,
      markdown: true,
      branch: true,
    })

    expect(turnCardSrc).not.toContain('Hides Copy / Markdown / Branch')

    const compactFooter = sliceAfterComment(
      turnCardSrc,
      'Compact footer — Copy stays reachable without hover',
    )
    const compactBlockEnd = compactFooter.indexOf('DocumentFormattedMarkdownOverlay')
    expect(compactBlockEnd).toBeGreaterThan(-1)
    const compactFooterSrc = compactFooter.slice(0, compactBlockEnd)

    expect(compactFooterSrc).toContain('{compactMode && (')
    expect(compactFooterSrc).toContain('handleCopy')
    expect(compactFooterSrc).toContain('t("common.copy")')
    expect(compactFooterSrc).toContain('data-touch-reveal="true"')
    expect(compactFooterSrc).not.toContain('opacity-0')
    expect(compactFooterSrc).not.toContain('group-hover')
    expect(compactFooterSrc).not.toContain('onPopOut')
    expect(compactFooterSrc).not.toContain('<span>Markdown</span>')
    expect(compactFooterSrc).not.toContain('BranchDropdown')
    expect(compactFooterSrc).not.toContain('onBranch')
  })

  it('keeps Markdown and Branch inside the desktop-only footer', () => {
    const desktopFooter = sliceAfterComment(
      turnCardSrc,
      'Desktop footer with actions (Copy / Markdown / Accept Plan / Branch).',
    )
    const compactStart = desktopFooter.indexOf('Compact footer — Copy stays reachable without hover')
    expect(compactStart).toBeGreaterThan(-1)
    const desktopFooterSrc = desktopFooter.slice(0, compactStart)

    expect(desktopFooterSrc).toContain('{!compactMode && (')
    expect(desktopFooterSrc).toContain('onPopOut')
    expect(desktopFooterSrc).toContain('<span>Markdown</span>')
    expect(desktopFooterSrc).toContain('{onBranch && <BranchDropdown onBranch={onBranch} />}')
  })

  it('does not add Copy/Markdown/Branch to TurnCardActionsMenu', () => {
    expect(actionsMenuSrc).not.toContain('common.copy')
    expect(actionsMenuSrc).not.toContain('handleCopy')
    expect(actionsMenuSrc).not.toContain('GitBranch')
    expect(actionsMenuSrc).not.toContain('Markdown')
    expect(actionsMenuSrc).not.toContain('onBranch')
    expect(actionsMenuSrc).not.toContain('onPopOut')
  })
})

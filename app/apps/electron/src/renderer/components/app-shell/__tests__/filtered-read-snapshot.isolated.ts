import { describe, expect, mock, test } from 'bun:test'

// The pure dispatch helper shares the existing filter component's module. Do
// not load PDF workers or render UI in this isolated logic test.
mock.module('@craft-agent/ui', () => ({ Spinner: () => null, Tooltip: () => null, TooltipTrigger: () => null, TooltipContent: () => null }))
mock.module('@/context/ThemeContext', () => ({ useTheme: () => ({ isDark: false }) }))
const { applyFilteredReadSnapshot } = await import('../CompactSessionListFilter')

describe('filtered conversation read snapshot', () => {
  test('uses only the click-time IDs even if the view changes while validating', async () => {
    const ids = ['filtered-a', 'filtered-b']
    const marked: string[] = []
    let resolve!: (id: string) => void
    const validation = new Promise<string>(done => { resolve = done })
    const pending = applyFilteredReadSnapshot(ids, 'workspace-a', () => true, () => validation, id => marked.push(id))
    ids.splice(0, ids.length, 'later-unrelated')
    resolve('workspace-a')
    await pending
    expect(marked).toEqual(['filtered-a', 'filtered-b'])
  })

  test('a native Workspace mismatch refuses the entire old snapshot', async () => {
    const marked: string[] = []
    await applyFilteredReadSnapshot(['old-host-session'], 'workspace-a', () => true,
      async () => 'workspace-b', id => marked.push(id))
    expect(marked).toEqual([])
  })

  test('a Host change or switch attempt during validation refuses dispatch', async () => {
    let scopeCurrent = true
    const marked: string[] = []
    await applyFilteredReadSnapshot(['old-host-session'], 'workspace-a', () => scopeCurrent,
      async () => { scopeCurrent = false; return 'workspace-a' }, id => marked.push(id))
    expect(marked).toEqual([])
  })

  test('stops the remaining IDs if an existing callback changes context', async () => {
    let scopeCurrent = true
    const marked: string[] = []
    await applyFilteredReadSnapshot(['a', 'b'], 'workspace-a', () => scopeCurrent,
      async () => 'workspace-a', id => { marked.push(id); scopeCurrent = false })
    expect(marked).toEqual(['a'])
  })

  test('an unavailable native Workspace check never broadens the operation', async () => {
    const marked: string[] = []
    await applyFilteredReadSnapshot(['a'], 'workspace-a', () => true,
      async () => { throw new Error('unavailable') }, id => marked.push(id))
    expect(marked).toEqual([])
  })
})

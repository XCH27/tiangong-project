import { describe, expect, it } from 'bun:test'
import de from '../locales/de.json'
import en from '../locales/en.json'
import es from '../locales/es.json'
import hu from '../locales/hu.json'
import ja from '../locales/ja.json'
import pl from '../locales/pl.json'
import zhHans from '../locales/zh-Hans.json'

const locales = { de, en, es, hu, ja, pl, 'zh-Hans': zhHans }

describe('remote workspace service independence', () => {
  it('does not present Craft-operated servers as the remote workspace provider', () => {
    for (const messages of Object.values(locales)) {
      expect(messages['workspace.connectRemote']).not.toMatch(/Craft/i)
      expect(messages['workspace.connectRemoteDesc']).not.toMatch(/Craft/i)
    }
  })

  it('still says the remote machine is one the user runs', () => {
    // P8 is about the claim, not the sentence. The title is now the shared
    // vocabulary for this capability ("remote connection" — the same thing other
    // products call it), so the self-hosted point lives in the description, and
    // this asserts the point rather than pinning a string a copy edit may
    // legitimately change.
    expect(zhHans['workspace.connectRemoteDesc']).toMatch(/你自己运行|自托管|你托管/)
    expect(en['workspace.connectRemoteDesc']).toMatch(/you run yourself|self-hosted|you host/i)
  })
})

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

  it('makes the self-hosted direct connection explicit in Simplified Chinese', () => {
    expect(zhHans['workspace.connectRemote']).toBe('连接自托管服务')
    expect(zhHans['workspace.connectRemoteDesc']).toBe('直连由你托管的远程工作区服务。')
  })
})

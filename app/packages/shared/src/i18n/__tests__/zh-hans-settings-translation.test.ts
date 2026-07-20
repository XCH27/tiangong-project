import { describe, expect, it } from 'bun:test'
import zhHans from '../locales/zh-Hans.json'

describe('Simplified Chinese settings translations', () => {
  it('keeps settings headings, actions, and explanations fully localized', () => {
    expect(zhHans['settings.messaging.title']).toBe('消息平台')
    expect(zhHans['settings.messaging.lark.apiType']).toBe('开放平台 API')
    expect(zhHans['settings.messaging.whatsapp.apiType']).toBe('非官方网页接口')
    expect(zhHans['settings.input.sendMessageWith']).toBe('发送快捷键')
    expect(zhHans['settings.input.enterKeyDesc']).toBe('按 Shift+Enter 换行')
  })

  it('preserves proper names and literal key labels', () => {
    expect(zhHans['settings.messaging.telegram.title']).toBe('Telegram')
    expect(zhHans['settings.messaging.whatsapp.title']).toBe('WhatsApp')
    expect(zhHans['settings.input.enterKey']).toBe('Enter')
  })
})

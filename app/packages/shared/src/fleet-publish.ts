/**
 * Fleet 发布与自动更新源（B6）。
 *
 * 打包 Fleet 发行版时设置环境变量 `FLEET_ELECTRON_UPDATE_URL`（generic provider 根 URL，无尾斜杠）。
 * 未设置时回退 craft 官方源，便于对照基座与本地开发；**给用户推 Fleet 版必须显式配置自有 URL**。
 *
 * @example
 * FLEET_ELECTRON_UPDATE_URL=https://updates.example.com/fleet/electron/latest bun run electron:dist:mac:fleet
 */

const DEFAULT_CRAFT_ELECTRON_UPDATE_URL = 'https://agents.craft.do/electron/latest'

/** 读取当前应写入 electron-builder `publish.url` 的更新源。 */
export function getFleetElectronUpdateUrl(): string {
  const fromEnv = process.env.FLEET_ELECTRON_UPDATE_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  return DEFAULT_CRAFT_ELECTRON_UPDATE_URL
}

/** craft 官方更新源（对照/回退）。 */
export { DEFAULT_CRAFT_ELECTRON_UPDATE_URL }

/** 是否已配置 Fleet 自有更新源（非 craft 默认）。 */
export function isFleetOwnedUpdateUrl(url: string = getFleetElectronUpdateUrl()): boolean {
  return url !== DEFAULT_CRAFT_ELECTRON_UPDATE_URL
}

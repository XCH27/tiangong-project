# Packaging App Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop shipping with the default Electron app icon by adding Fleet-owned icon assets and wiring them into electron-builder for macOS, Windows, and Linux.

**Architecture:** Store build-time icon resources under `app/resources/`, point electron-builder platform icon fields at those files, and add a package contract test so the configuration cannot regress.

**Tech Stack:** electron-builder, ImageMagick, macOS `iconutil`, Vitest.

---

## 参考实现对照

- `源码参考/craft-agents-oss/apps/electron/electron-builder.yml`：采用 `directories.buildResources: resources`，并为 `mac.icon`、`dmg.icon`、`win.icon`、`linux.icon` 分别配置平台图标。本切片采用同样的资源目录与 builder 显式图标配置。
- `源码参考/craft-agents-oss/apps/electron/resources/*`：采用 `icon.icns`、`icon.ico`、`icon.png` 多格式资源。本切片生成 Fleet 自有图标，不复用 Craft 品牌资源。
- `源码参考/Kun/electron-builder.config.cjs`：采用 mac 使用圆角 png、Windows 使用多尺寸 `.ico` 的边界说明。本切片为 mac 生成 `.icns`、Windows 生成多尺寸 `.ico`，并保留源 SVG 方便后续迭代。

未采用原因：Craft 的 Liquid Glass `Assets.car` afterPack hook 和 Kun 的签名/自动更新/entitlements 配置属于发布链路扩展，不是当前警告的根因；本切片只解决 icon 缺失，不处理签名证书。

## Scope

This slice adds icon assets and builder config only. It does not implement macOS signing, notarization, auto-update, DMG custom background, tray icons, or runtime window icons.

## File Structure

- Add `app/resources/icon.svg`
- Add generated `app/resources/icon.png`
- Add generated `app/resources/icon.icns`
- Add generated `app/resources/icon.ico`
- Modify `app/package.json`: set `directories.buildResources`, `mac.icon`, `dmg.icon`, `win.icon`, and `linux.icon`.
- Modify `app/tests/unit/package-contract.test.ts`: assert icon resources and package config exist.

---

## Tasks

## Execution Status

Completed on 2026-06-15:

- Added Fleet-owned icon source `resources/icon.svg`.
- Generated `resources/icon.png`, `resources/icon.icns`, and `resources/icon.ico`.
- Configured electron-builder `directories.buildResources`, `mac.icon`, `dmg.icon`, `win.icon`, and `linux.icon`.
- Added package contract coverage for icon config and resource files.

Red verification:

```bash
cd app
npm test -- tests/unit/package-contract.test.ts
```

Result: failed because `directories.buildResources` and platform icon config were missing.

Targeted verification:

```bash
cd app
npm test -- tests/unit/package-contract.test.ts
npm run build
npm run pack
```

Result: exit 0; package contract reported 1 file and 3 tests passing; build passed; pack produced `release/mac-arm64/Fleet.app`. The previous `default Electron icon is used` warning is gone. Packaging still warns that macOS signing is skipped because no Developer ID certificate is configured.

Full verification:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=local npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Result: exit 0; typecheck passed; lint passed; `npm test` reported 27 test files and 74 tests passing; protocol tests reported 2 files and 4 tests passing; build passed; default MCP smoke reported 5 passed and 1 skipped; local fallback smoke reported 5 passed and 1 skipped; `npm run pack` produced `release/mac-arm64/Fleet.app`; `npm audit` reported 0 total vulnerabilities across 698 dependencies; real Ollama smoke reported 1 passed. The previous `default Electron icon is used` warning is gone. Packaging still warns that macOS signing is skipped because no Developer ID certificate is configured.

### Task 1: Contract

- [x] **Step 1: Write failing package contract test**

Update `package-contract.test.ts` to require build resources and icon files.

- [x] **Step 2: Run red**

Run:

```bash
cd app
npm test -- tests/unit/package-contract.test.ts
```

Expected: FAIL because icon files and package config do not exist.

### Task 2: Assets and Builder Config

- [x] **Step 1: Generate Fleet icon assets**

Create a small Fleet-owned source SVG and generate png/icns/ico from it.

- [x] **Step 2: Wire electron-builder**

Point platform icon config at `resources/icon.*`.

### Task 3: Verification

- [x] **Step 1: Target verification**

Run:

```bash
cd app
npm test -- tests/unit/package-contract.test.ts
npm run build
npm run pack
```

Expected: PASS and `npm run pack` no longer reports “default Electron icon is used”.

- [x] **Step 2: Full verification**

Run:

```bash
cd app
npm run typecheck && npm run lint && npm test && npm run test:protocol && npm run build && npm run smoke && FLEET_TOOL_BACKEND=local npm run smoke && npm run pack && npm audit --json && FLEET_REAL_OLLAMA=1 FLEET_REAL_OLLAMA_MODEL='gemma4:12b' npx playwright test tests/smoke/ollama-real.spec.ts --workers=1
```

Expected: PASS.

## Self-Review

- The app uses Fleet-owned resources, not reference-project brand assets.
- Pack output should no longer warn about the default Electron icon.
- Signing warning may remain until Developer ID credentials exist.

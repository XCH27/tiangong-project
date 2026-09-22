# Deployment — building and packaging

How Fleet is built and packaged for Windows, macOS and Linux, and what must change before a build
is handed to anyone. Everything below is read from the current `app/` (Craft v0.13.4).

## Status

**No packaged build may be distributed yet.** The inherited updater replaces the installed app with
upstream Craft on its own (see *Updates*). Development mode (`bun run electron:dev`) never updates
and is safe to run.

## Build commands

Run from `app/`:

| Command | Output |
|---|---|
| `bun run electron:dev` | Development app with hot reload. No packaging, no updater |
| `bun run electron:build` | Compiled main, preload, renderer, resources and assets in `apps/electron/dist` |
| `bun run electron:start` | `electron:build`, then launch the compiled app unpackaged |
| `bun run electron:dist:mac` | macOS packages via electron-builder |
| `bun run electron:dist:win` | Windows installer via electron-builder |
| `bun run electron:dist:linux` | Linux package via electron-builder |

Platform build scripts that wrap the same steps with prerequisite checks live in
`app/apps/electron/scripts/`: `build-dmg.sh`, `build-win.ps1`, `build-linux.sh`. `copy-assets.ts` and
`afterPack.cjs` are part of the chain.

**Scripts upstream does not ship.** The OSS `package.json` declares `build`, `release`,
`check-version`, `fresh-start`, `oss:sync`, `sync-secrets`, `electron:dev:menu` and others whose
scripts are absent from the published tree. They fail with "No such file". Use the `electron:*`
commands above; a Fleet release pipeline is still to be written.

## Targets

From `app/apps/electron/electron-builder.yml`:

| Platform | Target | Architectures | Gap for Fleet |
|---|---|---|---|
| macOS | `dmg`, `zip` | arm64, x64 | Signing and notarization are commented out; unsigned builds are blocked by Gatekeeper on other machines |
| Windows | `nsis` | x64 only | No arm64; no code signing configured |
| Linux | `AppImage` | x64 only | No arm64, no `deb`/`rpm` |

Electron **39.2.7**. `asar: false`. Platform binaries (ripgrep and others) are filtered per platform
under `resources/bin/`.

A build must be produced and launched **on each platform** to count. A macOS run certifies macOS
only; Windows and Linux support are not advertised until each has its own build-and-launch evidence
(minimum OS versions, architectures and, for Linux, the display environments tested).

## Identity still belongs to Craft

Changing these is part of the R2 branding slice, with a licence and trademark check:

| Field | Current value |
|---|---|
| `appId` | `com.lukilabs.craft-agent` |
| `productName` | `Craft Agents` |
| `copyright` | `Copyright © 2026 Craft Docs Ltd.` |
| Linux `maintainer` | `Craft Docs Ltd. <support@craft.do>` |
| macOS `NSLocalNetworkUsageDescription` | "Craft Agents uses your local network…" |
| Artifact names | `Craft-Agents-${arch}.${ext}` |

Changing `appId` changes the user-data directory and keychain scope; plan a migration for anyone who
already ran a build.

## Updates

What the packaged app does today:

1. On launch, `app/apps/electron/src/main/index.ts` calls `checkForUpdatesOnLaunch()` when
   `app.isPackaged` is true.
2. `app/apps/electron/src/main/auto-update.ts` sets `autoUpdater.autoDownload = true` and
   `autoUpdater.autoInstallOnAppQuit = true`.
3. The feed is `publish: { provider: generic, url: https://thecraftagents.com/electron/latest }` in
   `electron-builder.yml`; `app/packages/shared/src/version/manifest.ts` reads the same host.
4. Dismissing an update only skips the notification (`auto-update.ts:502`). The download continues,
   and the next quit installs it. If installation fails, the dialog says "Craft Agents will restart
   now."

Result: a Fleet build silently becomes upstream Craft. The correction belongs to
[R2](specs/R2-independence.md): no Craft feed, no automatic download or install without a
user-controlled Fleet channel, and dismissal that actually stops the download. Verify it with
disposable lifecycle fixtures — never by downloading or installing an upstream binary.

## Before a first distributable build

- [ ] Updater corrected (above)
- [ ] Craft-operated services resolved per R2: hosted Pages publication, Sentry ingest, hosted help
      in the Agent prompt, OAuth relays
- [ ] Identity fields changed, with user-data migration
- [ ] macOS signing and notarization; Windows code signing
- [ ] Build and launch evidence on each target platform
- [ ] Release pipeline that does not depend on the scripts upstream withholds

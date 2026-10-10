# Packaging requirements

`docs/engineering.md` is not in this checkout. These requirements are taken from the packaging scripts that are present:

- `app/scripts/build/common.ts` pins Bun `bun-v1.3.9` and uv `0.10.6`, names the upload artifacts, and defines `uploadToS3`.
- `app/scripts/build/darwin.ts` packages a DMG and expects `Craft-Agents-${arch}.zip` for the updater archive. Signing uses `APPLE_SIGNING_IDENTITY`. Notarization uses `APPLE_ID`, `APPLE_TEAM_ID`, and `APPLE_APP_SPECIFIC_PASSWORD`.
- `app/scripts/build/linux.ts` packages an AppImage and renames it to `Craft-Agents-${arch}.AppImage`.
- `app/scripts/build/win32.ts` packages the NSIS installer `Craft-Agents-x64.exe`.
- `app/apps/electron/electron-builder.yml` sets `electronVersion` `39.2.7`, the artifact names, and the retained Craft generic provider URL `https://agents.craft.do/electron/latest`.
- `app/apps/electron/scripts/build-dmg.sh`, `build-linux.sh`, and `build-win.ps1` are the platform entry points. Unsigned local scripts remain `electron:dist:dev:mac`, `electron:dist:dev:win`, and `electron:dist:dev:linux` in `app/package.json`.

## What this slice wires

Before `electron-builder` runs, `assertRepoReleaseIndependence` must pass. The shell entry points call `app/scripts/verify-release-independence.ts`. `packageDarwin`, `packageLinux`, and `packageWindows` call the same check.

The check reads every workspace `package.json` under `app/package.json`, `app/packages/*/package.json`, and `app/apps/*/package.json`. A package that is not in the admitted list fails. An admitted package with no `license` field fails. The rendered text must match `app/THIRD-PARTY-NOTICES.txt`. No partial notices file is emitted when the check fails.

The update-feed dry run reads `app/scripts/build/fixtures/update-feed.dry-run.json`. Artifact URLs are relative file names. The checker does not fetch. `bun run verify:release` from `app/` is the local command.

The packaging dry run is `bun run verify:packaging-dry-run` from `app/`. It is the same gate plus version metadata and artifact layout. It reads `app/scripts/build/fixtures/packaging-dry-run.json` and the tiny files under `app/scripts/build/fixtures/packaging-dry-run/`. Those files are not installers. Each channel uses the artifact names the packaging scripts already write:

- macOS keeps the DMG from `getArtifactName` and the ZIP `packageDarwin` expects for electron-updater. The manifest name is `latest-mac.yml`, the file `scripts/install-app.sh` already requests.
- Windows keeps `Craft-Agents-x64.exe` and the generic-provider manifest `latest.yml`.
- Linux keeps the renamed `Craft-Agents-${arch}.AppImage` from `packageLinux`, not the intermediate `x86_64` name electron-builder emits before that rename. The manifest name is `latest-linux.yml`.

Every admitted workspace `package.json` version must equal the feed version. The manifest text is the local electron-updater YAML shape: relative `url`, `sha512`, and `size`. `publish` must be `never`. `identityDiscovery` must be false, which is the unsigned `CSC_IDENTITY_AUTO_DISCOVERY=false` path already used by `electron:dist:dev:mac`. The dry run does not invoke electron-builder and does not download Electron.

## What stays Locked

A signed Fleet release is not produced here. A feed with `disposition` `production` or `signed`, `signed: true`, or an `http` or `https` artifact URL is `Locked` (`signed_production_feed`). The same lock applies when the packaging document uses an electron-builder publish policy of `always`, `onTag`, or `onTagOrDraft`, when signing-identity discovery is on, or when a manifest contains an absolute update URL. `uploadToS3` and `--latest` remain the Craft upload path. This check does not call them and does not set a Fleet feed URL. The Craft auto-updater in `app/apps/electron/src/main/auto-update.ts` is unchanged.

| Slice | Status |
|---|---|
| Third-party notices for admitted dependencies | `wired` |
| Update-feed dry run | `wired` |
| Unsigned packaging dry run: version metadata and artifact layout | `wired` |
| Signed production feed, a signed Fleet release, and live auto-update | `Locked` |

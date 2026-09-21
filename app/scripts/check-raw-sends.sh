#!/bin/bash
# Lint guard: detect raw webContents.send() outside typed wrappers.
#
# Approved locations:
#   - window-manager.ts: legacy handshake fallback in pushToWindow()
#   - browser-pane-manager.ts: toolbar scope (separate preload context, not in BroadcastEventMap)
#   - menu.ts: sendToRenderer (typed with MenuBroadcastChannel)
#   - remote-ssh/index.ts: dedicated legacy IPC channel (module is not registered in the RPC host)

set -euo pipefail

if command -v rg >/dev/null 2>&1; then
  VIOLATIONS=$(rg 'webContents\.send\(' apps/electron/src/main/ \
    --glob '!**/window-manager.ts' \
    --glob '!**/browser-pane-manager.ts' \
    --glob '!**/menu.ts' \
    --glob '!**/remote-ssh/index.ts' \
    -l 2>/dev/null || true)
else
  VIOLATIONS=$(grep -R -l -E 'webContents\.send\(' apps/electron/src/main/ \
    --include='*.ts' --include='*.tsx' \
    --exclude='window-manager.ts' --exclude='browser-pane-manager.ts' --exclude='menu.ts' --exclude='remote-ssh/index.ts' \
    2>/dev/null || true)
fi

if [ -n "${VIOLATIONS:-}" ]; then
  echo "ERROR: Raw webContents.send() found outside approved wrappers:"
  echo "$VIOLATIONS"
  echo ""
  echo "Use RpcServer.push()/pushTyped() and explicit PushTarget routing instead."
  exit 1
fi

echo "OK: No raw webContents.send() outside approved wrappers."

# Workbench and panel host module

Design state: `breadth`; development order: R18 closure. The owner-directed early modular host is
`wired but not visually checked`; persistent tab/layout restore and broader docking remain `not implemented`. One host
coordinates projected task context, browser, read-only review, bounded project commands, and the
`display-only` Canvas entry without duplicating their authorities. Acceptance: `WB-001` opens two
native surfaces; `WB-002` preserves module state while switching without moving domain state;
`WB-003` routes startup/read/command errors to the owning module.

## Reality and activation sequence

The Craft shell at `app/apps/electron/src/renderer/components/app-shell/` remains the only layout
authority. The current slice adds `RightWorkbench` there, uses the existing BrowserPane manager for
embedded browsing, and registers Git/command projections in the real
`packages/server-core/src/handlers/rpc/system.ts` core RPC path. Run `bun run typecheck:electron`
from `app/` for the renderer boundary and the targeted workbench/core-handler tests for backend
registration. R18 closure still requires persistent tab/layout restoration, narrow/restart
acceptance, a persistent PTY if justified, and any writable review workflow.

# Workbench and panel host module

Design state: `breadth`; development order: R18 closure. Craft baseline status `wired but not visually checked`; Fleet extensions
status `not implemented`. One host coordinates chat, canvas, browser, editors, jobs and inspectors without
duplicating their authorities. Acceptance: `WB-001` opens two native surfaces; `WB-002` preserves
layout without moving domain state; `WB-003` routes unsaved/error states to the owning surface.

## Reality and activation sequence

The Craft shell exists at `app/apps/electron/src/renderer/components/app-shell/`; no Fleet docking
authority is proven. Run `bun run typecheck:electron` from `app/` for the baseline. Activation is:
exercise two existing surfaces, persist/restore layout without domain writes, and prove unsaved,
error, narrow and restart states before promoting the Fleet extension.
